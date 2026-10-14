-- Each private transition is narrowly scoped to the verified actor and locked parent rows.
-- Clients receive no INSERT/UPDATE grants on applications, engagements, submissions or events.
create function private.validate_pipeline(v jsonb) returns void language plpgsql stable security invoker set search_path='' as $$
declare m jsonb;
begin
 if jsonb_typeof(v) is distinct from 'array' or jsonb_array_length(v)>20 then raise exception 'VALIDATION_FAILED: pipeline';end if;
 for m in select value from jsonb_array_elements(v) loop
   if jsonb_typeof(m)<>'object' or not(m ?& array['catalogSlug','version']) or exists(select 1 from jsonb_object_keys(m) k where k not in ('catalogSlug','customName','version','termsUrl','entitlementDeclaration'))
     or jsonb_typeof(m->'version') is distinct from 'string' or length(m->>'version') not between 1 and 80
     or (m->>'catalogSlug' is null and (jsonb_typeof(m->'customName') is distinct from 'string' or length(m->>'customName') not between 1 and 80))
     or (m->>'catalogSlug' is not null and not exists(select 1 from public.catalog_terms where kind='model' and slug=m->>'catalogSlug' and active))
     or (m ? 'termsUrl' and (jsonb_typeof(m->'termsUrl') is distinct from 'string' or m->>'termsUrl' !~ '^https://' or length(m->>'termsUrl')>2000))
     or (m ? 'entitlementDeclaration' and (jsonb_typeof(m->'entitlementDeclaration') is distinct from 'string' or length(m->>'entitlementDeclaration') not between 1 and 2000))
   then raise exception 'VALIDATION_FAILED: model reference';end if;
 end loop;
end; $$;
create function private.create_application(p_brief uuid,p_input jsonb,p_key uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();b public.briefs;a public.applications;cached jsonb;payload jsonb:=jsonb_build_object('brief',p_brief,'input',p_input);
begin
 if actor is null or private.actor_role() is distinct from 'creator' then raise exception 'FORBIDDEN' using errcode='42501';end if;
 perform private.assert_keys(p_input,array['briefRevision','quoteMinor','currency','deliveryDays','note','pipeline','rightsOffer']);
 if octet_length(p_input::text)>32000 or jsonb_typeof(p_input->'briefRevision') is distinct from 'number' or jsonb_typeof(p_input->'quoteMinor') is distinct from 'number'
   or jsonb_typeof(p_input->'deliveryDays') is distinct from 'number' or (p_input->>'quoteMinor')::numeric not between 1 and 1000000000 or (p_input->>'quoteMinor')::numeric<>trunc((p_input->>'quoteMinor')::numeric)
   or (p_input->>'deliveryDays')::numeric not between 1 and 90 or (p_input->>'deliveryDays')::numeric<>trunc((p_input->>'deliveryDays')::numeric)
   or jsonb_typeof(p_input->'note') is distinct from 'string' or length(trim(p_input->>'note')) not between 10 and 2000 or coalesce(p_input->>'currency','') !~ '^[A-Z]{3}$'
 then raise exception 'VALIDATION_FAILED: application';end if;
 perform private.validate_pipeline(p_input->'pipeline');perform private.validate_rights_offer(p_input->'rightsOffer');
 cached:=private.begin_action('application_create',p_key,payload);if cached is not null then return cached;end if;
 select * into b from public.briefs where id=p_brief and state='published' for update;if not found then raise exception 'NOT_FOUND';end if;
 if b.published_revision<>(p_input->>'briefRevision')::integer then raise exception 'VERSION_CONFLICT: brief revision';end if;
 if not exists(select 1 from public.creator_profiles where user_id=actor and published) then raise exception 'PUBLICATION_INCOMPLETE: creator profile';end if;
 select * into a from public.applications where brief_id=p_brief and creator_id=actor for update;
 if found and (a.state='selected' or a.state='submitted' and a.brief_revision=b.published_revision) then raise exception 'INVALID_TRANSITION: withdraw before reapplying';end if;
 insert into public.applications(brief_id,creator_id,brief_revision,quote_minor,currency,delivery_days,note,pipeline,rights_offer)
 values(p_brief,actor,b.published_revision,(p_input->>'quoteMinor')::bigint,p_input->>'currency',(p_input->>'deliveryDays')::integer,p_input->>'note',p_input->'pipeline',p_input->'rightsOffer')
 on conflict(brief_id,creator_id) do update set brief_revision=excluded.brief_revision,quote_minor=excluded.quote_minor,currency=excluded.currency,delivery_days=excluded.delivery_days,note=excluded.note,pipeline=excluded.pipeline,rights_offer=excluded.rights_offer,state='submitted',version=public.applications.version+1,updated_at=now()
 returning * into a;
 insert into public.workflow_events(brief_id,actor_id,event_type,new_state,entity_version,details) values(b.id,actor,'application_submitted','submitted',a.version,jsonb_build_object('applicationId',a.id,'briefRevision',a.brief_revision));
 cached:=to_jsonb(a);perform private.end_action('application_create',p_key,payload,cached);return cached;
end; $$;
create function private.withdraw_application(p_id uuid,p_expected_version integer,p_key uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.applications;b public.briefs;cached jsonb;payload jsonb:=jsonb_build_object('id',p_id,'version',p_expected_version);
begin
 if auth.uid() is null or private.actor_role() is distinct from 'creator' then raise exception 'FORBIDDEN' using errcode='42501';end if;
 cached:=private.begin_action('application_withdraw',p_key,payload);if cached is not null then return cached;end if;
 select * into a from public.applications where id=p_id and creator_id=auth.uid();if not found then raise exception 'NOT_FOUND';end if;
 select * into b from public.briefs where id=a.brief_id for update;
 select * into a from public.applications where id=p_id and creator_id=auth.uid() for update;
 if p_expected_version is null or a.version<>p_expected_version then raise exception 'VERSION_CONFLICT';end if;
 if a.state<>'submitted' then raise exception 'INVALID_TRANSITION';end if;
 update public.applications set state='withdrawn',version=version+1,updated_at=now() where id=p_id returning * into a;
 insert into public.workflow_events(brief_id,actor_id,event_type,old_state,new_state,entity_version,details) values(b.id,auth.uid(),'application_withdrawn','submitted','withdrawn',a.version,jsonb_build_object('applicationId',a.id));
 cached:=to_jsonb(a);perform private.end_action('application_withdraw',p_key,payload,cached);return cached;
end; $$;
create function private.guard_engagement_snapshot() returns trigger language plpgsql security definer set search_path='' as $$
declare a public.applications;b public.briefs;
begin
 if tg_op='INSERT' then
   select * into a from public.applications where id=new.application_id;select * into b from public.briefs where id=a.brief_id;
   if not found or a.state<>'submitted' or b.state<>'published' or a.brief_revision<>b.published_revision then raise exception 'INVALID_TRANSITION';end if;
   new.brief_id:=b.id;new.brand_id:=b.brand_id;new.creator_id:=a.creator_id;new.brief_snapshot:=b.payload;new.requirements_snapshot:=b.requirements;
   new.offer_snapshot:=a.rights_offer;new.pipeline_snapshot:=a.pipeline;new.selection_receipt:=public.evaluate_rights(b.payload->'rightsRequest',a.rights_offer,a.pipeline,null);
   new.state:='active';new.version:=1;new.revision_count:=0;new.selected_at:=now();new.accepted_at:=null;
 else
   if new.id<>old.id or new.brief_id<>old.brief_id or new.application_id<>old.application_id or new.brand_id<>old.brand_id or new.creator_id<>old.creator_id
     or new.brief_snapshot is distinct from old.brief_snapshot or new.requirements_snapshot is distinct from old.requirements_snapshot or new.offer_snapshot is distinct from old.offer_snapshot or new.pipeline_snapshot is distinct from old.pipeline_snapshot
     or new.selection_receipt is distinct from old.selection_receipt or new.review_ack is distinct from old.review_ack or new.selected_at<>old.selected_at
   then raise exception 'PROTECTED_FIELD';end if;
   if not((old.state='active' and new.state='submitted') or (old.state='submitted' and new.state in ('revision_requested','accepted')) or (old.state='revision_requested' and new.state='submitted')) then raise exception 'INVALID_TRANSITION';end if;
   new.version:=old.version+1;if new.state='accepted' then new.accepted_at:=now();end if;
 end if;return new;
end; $$;
create trigger engagement_snapshot_guard before insert or update on public.engagements for each row execute function private.guard_engagement_snapshot();
create function private.select_application(p_id uuid,p_expected_application_version integer,p_expected_brief_revision integer,p_review_ack text,p_key uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();a public.applications;b public.briefs;c public.creator_profiles;e public.engagements;receipt jsonb;cached jsonb;payload jsonb:=jsonb_build_object('id',p_id,'applicationVersion',p_expected_application_version,'briefRevision',p_expected_brief_revision,'ack',p_review_ack);
begin
 if actor is null or private.actor_role() is distinct from 'brand' then raise exception 'FORBIDDEN' using errcode='42501';end if;
 cached:=private.begin_action('application_select',p_key,payload);if cached is not null then return cached;end if;
 select * into a from public.applications where id=p_id;if not found then raise exception 'NOT_FOUND';end if;
 -- Lock the brief before any application row, so competing selectors cannot deadlock on rejected competitors.
 select * into b from public.briefs where id=a.brief_id and brand_id=actor for update;if not found then raise exception 'NOT_FOUND';end if;
 select * into a from public.applications where id=p_id for update;
 if p_expected_application_version is null or p_expected_brief_revision is null or a.version<>p_expected_application_version or a.brief_revision<>p_expected_brief_revision or b.published_revision<>p_expected_brief_revision then raise exception 'VERSION_CONFLICT';end if;
 if b.state<>'published' or a.state<>'submitted' or exists(select 1 from public.engagements where brief_id=b.id) then raise exception 'INVALID_TRANSITION';end if;
 select * into c from public.creator_profiles where user_id=a.creator_id;
 if not private.creator_supports_brief(c,b.payload) or a.currency<>b.payload->>'currency' or a.quote_minor not between (b.payload->>'budgetMinMinor')::bigint and (b.payload->>'budgetMaxMinor')::bigint or now()+make_interval(days=>a.delivery_days)>(b.payload->>'dueAt')::timestamptz then raise exception 'VALIDATION_FAILED: quote, capability or schedule';end if;
 if exists(select 1 from jsonb_array_elements_text(b.payload->'requiredModels') m where not exists(select 1 from jsonb_array_elements(a.pipeline) ref where ref->>'catalogSlug'=m)) then raise exception 'VALIDATION_FAILED: proposed models';end if;
 receipt:=public.evaluate_rights(b.payload->'rightsRequest',a.rights_offer,a.pipeline,null);
 if receipt->>'overall'='blocked' then raise exception 'RIGHTS_BLOCKED';end if;
 if receipt->>'overall'='needs_review' and length(trim(coalesce(p_review_ack,'')))<10 then raise exception 'RIGHTS_REVIEW_REQUIRED';end if;
 if length(coalesce(p_review_ack,''))>2000 then raise exception 'VALIDATION_FAILED';end if;
 insert into public.engagements(brief_id,application_id,brand_id,creator_id,brief_snapshot,requirements_snapshot,offer_snapshot,pipeline_snapshot,selection_receipt,review_ack)
 values(b.id,a.id,b.brand_id,a.creator_id,b.payload,b.requirements,a.rights_offer,a.pipeline,receipt,p_review_ack) returning * into e;
 update public.applications set state=case when id=a.id then 'selected' else 'rejected' end,version=version+1,updated_at=now() where brief_id=b.id and state='submitted';
 update public.briefs set state='engaged',version=version+1,updated_at=now() where id=b.id;
 insert into public.workflow_events(brief_id,engagement_id,actor_id,event_type,old_state,new_state,entity_version,details)
 values(b.id,e.id,actor,'application_selected','published','active',e.version,jsonb_build_object('applicationId',a.id,'rightsResult',receipt->>'overall'));
 cached:=jsonb_build_object('id',e.id,'state',e.state,'version',e.version);perform private.end_action('application_select',p_key,payload,cached);return cached;
end; $$;
revoke all on function private.validate_pipeline(jsonb),private.create_application(uuid,jsonb,uuid),private.withdraw_application(uuid,integer,uuid),private.guard_engagement_snapshot(),private.select_application(uuid,integer,integer,text,uuid) from public,anon;
grant execute on function private.validate_pipeline(jsonb),private.create_application(uuid,jsonb,uuid),private.withdraw_application(uuid,integer,uuid),private.select_application(uuid,integer,integer,text,uuid) to authenticated;
create function public.create_application(p_brief uuid,p_input jsonb,p_key uuid) returns jsonb language sql security invoker set search_path='' as $$select private.create_application(p_brief,p_input,p_key)$$;
create function public.withdraw_application(p_id uuid,p_expected_version integer,p_key uuid) returns jsonb language sql security invoker set search_path='' as $$select private.withdraw_application(p_id,p_expected_version,p_key)$$;
create function public.select_application(p_id uuid,p_expected_application_version integer,p_expected_brief_revision integer,p_review_ack text,p_key uuid) returns jsonb language sql security invoker set search_path='' as $$select private.select_application(p_id,p_expected_application_version,p_expected_brief_revision,p_review_ack,p_key)$$;
revoke all on function public.create_application(uuid,jsonb,uuid),public.withdraw_application(uuid,integer,uuid),public.select_application(uuid,integer,integer,text,uuid) from public,anon;
grant execute on function public.create_application(uuid,jsonb,uuid),public.withdraw_application(uuid,integer,uuid),public.select_application(uuid,integer,integer,text,uuid) to authenticated;

create function private.validate_final_rights(v jsonb,creator uuid) returns void language plpgsql stable security invoker set search_path='' as $$
declare input jsonb;
begin
 perform private.assert_keys(v,array['schemaVersion','offer','modelRefs','inputs','limitations','declaredAt']);
 if v->>'schemaVersion' is distinct from '1' or jsonb_typeof(v->'schemaVersion') is distinct from 'number' or jsonb_typeof(v->'inputs') is distinct from 'array' or jsonb_array_length(v->'inputs')>20
   or jsonb_typeof(v->'limitations') is distinct from 'array' or jsonb_array_length(v->'limitations')>20 or jsonb_typeof(v->'declaredAt') is distinct from 'string' then raise exception 'VALIDATION_FAILED: final declaration';end if;
 perform (v->>'declaredAt')::timestamptz;perform private.validate_rights_offer(v->'offer');perform private.validate_pipeline(v->'modelRefs');
 if exists(select 1 from jsonb_array_elements(v->'limitations') x where jsonb_typeof(x)<>'string' or length(x#>>'{}') not between 1 and 2000) then raise exception 'VALIDATION_FAILED';end if;
 for input in select value from jsonb_array_elements(v->'inputs') loop
   if jsonb_typeof(input)<>'object' or not(input ?& array['description','source','commercialPermission','release']) or exists(select 1 from jsonb_object_keys(input) k where k not in ('description','source','commercialPermission','release','evidenceAssetId'))
     or jsonb_typeof(input->'description') is distinct from 'string' or length(input->>'description') not between 1 and 2000
     or coalesce(input->>'source','') not in ('brand_provided','creator_original','third_party','generated')
     or jsonb_typeof(input->'commercialPermission') not in ('boolean','null') or coalesce(input->>'release','') not in ('not_applicable','declared_obtained','unknown')
   then raise exception 'VALIDATION_FAILED: final input';end if;
   if input ? 'evidenceAssetId' and not exists(select 1 from public.assets where id=(input->>'evidenceAssetId')::uuid and owner_id=creator and state='ready' and purpose='evidence' and object_deleted_at is null) then raise exception 'NOT_FOUND: release evidence';end if;
 end loop;
end; $$;
create function private.guard_submission_immutable() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.id<>old.id or new.engagement_id<>old.engagement_id or new.creator_id<>old.creator_id or new.sequence<>old.sequence or new.asset_ids is distinct from old.asset_ids
   or new.output_mapping is distinct from old.output_mapping or new.creator_checklist is distinct from old.creator_checklist or new.final_rights is distinct from old.final_rights
   or new.automatic_checks is distinct from old.automatic_checks or new.rights_receipt is distinct from old.rights_receipt or new.submitted_at<>old.submitted_at
 then raise exception 'PROTECTED_FIELD: delivered version immutable';end if;return new;
end; $$;
create trigger submission_immutable before update on public.submissions for each row execute function private.guard_submission_immutable();
create function private.submit_delivery(p_id uuid,p_input jsonb,p_key uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();e public.engagements;s public.submissions;cached jsonb;payload jsonb:=jsonb_build_object('id',p_id,'input',p_input);
 ids uuid[];mapped uuid[]:='{}';mapping jsonb;o jsonb;asset public.assets;checks jsonb:='[]';receipt jsonb;req jsonb;n integer;
begin
 if actor is null or private.actor_role() is distinct from 'creator' then raise exception 'FORBIDDEN' using errcode='42501';end if;
 perform private.assert_keys(p_input,array['expectedVersion','assetIds','outputMapping','creatorChecklist','finalRights']);
 if octet_length(p_input::text)>32000 or jsonb_typeof(p_input->'expectedVersion') is distinct from 'number' or jsonb_typeof(p_input->'assetIds') is distinct from 'array'
   or jsonb_array_length(p_input->'assetIds') not between 1 and 30 or jsonb_typeof(p_input->'outputMapping') is distinct from 'array' or jsonb_array_length(p_input->'outputMapping')>10
   or jsonb_typeof(p_input->'creatorChecklist') is distinct from 'array' or jsonb_array_length(p_input->'creatorChecklist')>100 then raise exception 'VALIDATION_FAILED: submission';end if;
 cached:=private.begin_action('submission_create',p_key,payload);if cached is not null then return cached;end if;
 select * into e from public.engagements where id=p_id and creator_id=actor for update;if not found then raise exception 'NOT_FOUND';end if;
 if e.version<>(p_input->>'expectedVersion')::integer then raise exception 'VERSION_CONFLICT';end if;
 if e.state not in ('active','revision_requested') then raise exception 'INVALID_TRANSITION';end if;
 ids:=array(select jsonb_array_elements_text(p_input->'assetIds')::uuid);
 if cardinality(ids)<>(select count(distinct x) from unnest(ids) x) then raise exception 'VALIDATION_FAILED: distinct assets';end if;
 if exists(select 1 from unnest(ids) id where not exists(select 1 from public.assets a where a.id=id and a.owner_id=actor and a.engagement_id=e.id and a.purpose='submission' and a.state='ready' and a.object_deleted_at is null and a.sha256 is not null)) then raise exception 'NOT_FOUND: submitted files';end if;
 perform 1 from public.assets where id=any(ids) for update;
 if jsonb_array_length(p_input->'outputMapping')<>jsonb_array_length(e.brief_snapshot->'outputs')
   or (select count(distinct x->>'outputId') from jsonb_array_elements(p_input->'outputMapping') x)<>jsonb_array_length(p_input->'outputMapping') then raise exception 'VALIDATION_FAILED: output mapping';end if;
 for o in select value from jsonb_array_elements(e.brief_snapshot->'outputs') loop
   select value into mapping from jsonb_array_elements(p_input->'outputMapping') where value->>'outputId'=o->>'id';
   if mapping is null then raise exception 'VALIDATION_FAILED: output missing';end if;
   perform private.assert_keys(mapping,array['outputId','assetIds']);
   if jsonb_typeof(mapping->'assetIds') is distinct from 'array' or jsonb_array_length(mapping->'assetIds')<>(o->>'quantity')::integer then raise exception 'VALIDATION_FAILED: quantity';end if;
   checks:=checks||jsonb_build_array(jsonb_build_object('requirementId',(o->>'id')||':quantity','passed',true,'method','distinct_ready_files'));
   for asset in select * from public.assets where id=any(array(select jsonb_array_elements_text(mapping->'assetIds')::uuid)) loop
     if not(asset.id=any(ids)) or asset.format<>o->>'format' or asset.actual_bytes>(o->>'maxBytes')::bigint or asset.kind<>o->>'kind' then raise exception 'VALIDATION_FAILED: file format or scope';end if;
     if o->>'kind'='image' and (asset.width_px is distinct from (o->>'widthPx')::integer or asset.height_px is distinct from (o->>'heightPx')::integer) then raise exception 'VALIDATION_FAILED: actual image dimensions';end if;
     mapped:=array_append(mapped,asset.id);
   end loop;
   checks:=checks||jsonb_build_array(jsonb_build_object('requirementId',(o->>'id')||':format','passed',true,'method','finalized_format_and_bytes'));
   if o->>'kind'='image' then checks:=checks||jsonb_build_array(jsonb_build_object('requirementId',(o->>'id')||':dimensions','passed',true,'method','parsed_image_dimensions'));end if;
 end loop;
 if cardinality(mapped)<>cardinality(ids) or cardinality(mapped)<>(select count(distinct x) from unnest(mapped) x) or not(mapped @> ids and ids @> mapped) then raise exception 'VALIDATION_FAILED: every distinct file must map once';end if;
 for req in select value from jsonb_array_elements(e.requirements_snapshot) loop
   select count(*) into n from jsonb_array_elements(p_input->'creatorChecklist') c where c->>'requirementId'=req->>'id' and c->'confirmed'='true'::jsonb;
   if n<>1 then raise exception 'VALIDATION_FAILED: creator confirmation';end if;
 end loop;
 if exists(select 1 from jsonb_array_elements(p_input->'creatorChecklist') c where not exists(select 1 from jsonb_array_elements(e.requirements_snapshot) r where r->>'id'=c->>'requirementId')) then raise exception 'VALIDATION_FAILED: unknown check';end if;
 perform private.validate_final_rights(p_input->'finalRights',actor);
 if exists(select 1 from jsonb_array_elements_text(e.brief_snapshot->'requiredModels') m where not exists(select 1 from jsonb_array_elements(p_input->'finalRights'->'modelRefs') ref where ref->>'catalogSlug'=m)) then raise exception 'VALIDATION_FAILED: final models';end if;
 receipt:=public.evaluate_rights(e.brief_snapshot->'rightsRequest',p_input->'finalRights'->'offer',p_input->'finalRights'->'modelRefs',p_input->'finalRights');
 insert into public.submissions(engagement_id,creator_id,sequence,asset_ids,output_mapping,creator_checklist,final_rights,automatic_checks,rights_receipt)
 values(e.id,actor,coalesce((select max(sequence)+1 from public.submissions where engagement_id=e.id),1),ids,p_input->'outputMapping',p_input->'creatorChecklist',p_input->'finalRights',checks,receipt) returning * into s;
 update public.engagements set state='submitted' where id=e.id returning * into e;
 insert into public.workflow_events(brief_id,engagement_id,actor_id,event_type,old_state,new_state,entity_version,details)
 values(e.brief_id,e.id,actor,'delivery_submitted',case when s.sequence=1 then 'active' else 'revision_requested' end,'submitted',e.version,jsonb_build_object('submissionId',s.id,'sequence',s.sequence,'rightsResult',receipt->>'overall'));
 cached:=jsonb_build_object('id',s.id,'sequence',s.sequence,'engagementVersion',e.version,'rightsReceipt',receipt);perform private.end_action('submission_create',p_key,payload,cached);return cached;
end; $$;
create function private.request_revision(p_id uuid,p_input jsonb,p_key uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();e public.engagements;s public.submissions;cached jsonb;payload jsonb:=jsonb_build_object('id',p_id,'input',p_input);
begin
 if actor is null or private.actor_role() is distinct from 'brand' then raise exception 'FORBIDDEN' using errcode='42501';end if;
 perform private.assert_keys(p_input,array['expectedVersion','submissionId','notes','requirementIds']);
 if jsonb_typeof(p_input->'expectedVersion') is distinct from 'number' or jsonb_typeof(p_input->'notes') is distinct from 'string' or length(trim(p_input->>'notes')) not between 10 and 2000
   or jsonb_typeof(p_input->'requirementIds') is distinct from 'array' or jsonb_array_length(p_input->'requirementIds') not between 1 and 100 then raise exception 'VALIDATION_FAILED: revision feedback';end if;
 cached:=private.begin_action('revision_request',p_key,payload);if cached is not null then return cached;end if;
 select * into e from public.engagements where id=p_id and brand_id=actor for update;if not found then raise exception 'NOT_FOUND';end if;
 if e.version<>(p_input->>'expectedVersion')::integer then raise exception 'VERSION_CONFLICT';end if;
 if e.state<>'submitted' or e.revision_count>=(e.brief_snapshot->>'revisionRounds')::integer then raise exception 'INVALID_TRANSITION: revision allowance';end if;
 select * into s from public.submissions where engagement_id=e.id order by sequence desc limit 1 for update;
 if s.id<>(p_input->>'submissionId')::uuid then raise exception 'VERSION_CONFLICT: latest submission';end if;
 if exists(select 1 from jsonb_array_elements_text(p_input->'requirementIds') id where not exists(select 1 from jsonb_array_elements(e.requirements_snapshot) r where r->>'id'=id)) then raise exception 'VALIDATION_FAILED: requirement references';end if;
 update public.submissions set feedback=jsonb_build_object('requirementIds',p_input->'requirementIds','notes',p_input->>'notes','actorId',actor,'requestedAt',now()) where id=s.id;
 update public.engagements set state='revision_requested',revision_count=revision_count+1 where id=e.id returning * into e;
 insert into public.workflow_events(brief_id,engagement_id,actor_id,event_type,old_state,new_state,entity_version,details) values(e.brief_id,e.id,actor,'revision_requested','submitted','revision_requested',e.version,jsonb_build_object('submissionId',s.id,'requirementIds',p_input->'requirementIds'));
 cached:=jsonb_build_object('id',e.id,'state',e.state,'version',e.version);perform private.end_action('revision_request',p_key,payload,cached);return cached;
end; $$;
create function private.accept_engagement(p_id uuid,p_input jsonb,p_key uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();e public.engagements;s public.submissions;cached jsonb;payload jsonb:=jsonb_build_object('id',p_id,'input',p_input);req jsonb;receipt jsonb;n integer;
begin
 if actor is null or private.actor_role() is distinct from 'brand' then raise exception 'FORBIDDEN' using errcode='42501';end if;
 perform private.assert_keys(p_input,array['expectedVersion','submissionId','checks','rightsResolutionNote']);
 if jsonb_typeof(p_input->'expectedVersion') is distinct from 'number' or jsonb_typeof(p_input->'checks') is distinct from 'array' or jsonb_array_length(p_input->'checks')>100
   or jsonb_typeof(p_input->'rightsResolutionNote') is distinct from 'string' or length(p_input->>'rightsResolutionNote')>2000 then raise exception 'VALIDATION_FAILED: brand review';end if;
 cached:=private.begin_action('engagement_accept',p_key,payload);if cached is not null then return cached;end if;
 select * into e from public.engagements where id=p_id and brand_id=actor for update;if not found then raise exception 'NOT_FOUND';end if;
 if e.version<>(p_input->>'expectedVersion')::integer then raise exception 'VERSION_CONFLICT';end if;
 if e.state<>'submitted' then raise exception 'INVALID_TRANSITION';end if;
 select * into s from public.submissions where engagement_id=e.id order by sequence desc limit 1 for update;
 if s.id<>(p_input->>'submissionId')::uuid then raise exception 'VERSION_CONFLICT: latest submission';end if;
 if exists(select 1 from jsonb_array_elements(p_input->'checks') c where not exists(select 1 from jsonb_array_elements(e.requirements_snapshot) r where r->>'id'=c->>'requirementId')) then raise exception 'VALIDATION_FAILED: unknown review check';end if;
 for req in select value from jsonb_array_elements(e.requirements_snapshot) loop
   if req->>'mode'='file_check' then select count(*) into n from jsonb_array_elements(s.automatic_checks) c where c->>'requirementId'=req->>'id' and c->'passed'='true'::jsonb;
   else select count(*) into n from jsonb_array_elements(p_input->'checks') c where c->>'requirementId'=req->>'id' and c->'passed'='true'::jsonb;end if;
   if n<>1 then raise exception 'VALIDATION_FAILED: mandatory delivery check';end if;
 end loop;
 receipt:=public.evaluate_rights(e.brief_snapshot->'rightsRequest',s.final_rights->'offer',s.final_rights->'modelRefs',s.final_rights);
 if receipt->>'overall'='blocked' then raise exception 'RIGHTS_BLOCKED';end if;
 if receipt->>'overall'<>'compatible_declared' then raise exception 'RIGHTS_REVIEW_REQUIRED: unresolved final declarations';end if;
 update public.submissions set brand_review=jsonb_build_object('checks',p_input->'checks','rightsResolutionNote',p_input->>'rightsResolutionNote','actorId',actor,'reviewedAt',now(),'finalReceipt',receipt) where id=s.id;
 update public.engagements set state='accepted' where id=e.id returning * into e;
 update public.briefs set state='completed',version=version+1,updated_at=now() where id=e.brief_id;
 insert into public.workflow_events(brief_id,engagement_id,actor_id,event_type,old_state,new_state,entity_version,details) values(e.brief_id,e.id,actor,'delivery_accepted','submitted','accepted',e.version,jsonb_build_object('submissionId',s.id,'sequence',s.sequence,'rightsResult',receipt->>'overall'));
 cached:=jsonb_build_object('id',e.id,'state',e.state,'version',e.version,'acceptedSubmissionId',s.id);perform private.end_action('engagement_accept',p_key,payload,cached);return cached;
end; $$;
revoke all on function private.validate_final_rights(jsonb,uuid),private.guard_submission_immutable(),private.submit_delivery(uuid,jsonb,uuid),private.request_revision(uuid,jsonb,uuid),private.accept_engagement(uuid,jsonb,uuid) from public,anon;
grant execute on function private.validate_final_rights(jsonb,uuid),private.submit_delivery(uuid,jsonb,uuid),private.request_revision(uuid,jsonb,uuid),private.accept_engagement(uuid,jsonb,uuid) to authenticated;
create function public.submit_delivery(p_id uuid,p_input jsonb,p_key uuid) returns jsonb language sql security invoker set search_path='' as $$select private.submit_delivery(p_id,p_input,p_key)$$;
create function public.request_revision(p_id uuid,p_input jsonb,p_key uuid) returns jsonb language sql security invoker set search_path='' as $$select private.request_revision(p_id,p_input,p_key)$$;
create function public.accept_engagement(p_id uuid,p_input jsonb,p_key uuid) returns jsonb language sql security invoker set search_path='' as $$select private.accept_engagement(p_id,p_input,p_key)$$;
revoke all on function public.submit_delivery(uuid,jsonb,uuid),public.request_revision(uuid,jsonb,uuid),public.accept_engagement(uuid,jsonb,uuid) from public,anon;
grant execute on function public.submit_delivery(uuid,jsonb,uuid),public.request_revision(uuid,jsonb,uuid),public.accept_engagement(uuid,jsonb,uuid) to authenticated;
create or replace function private.guard_brief() returns trigger language plpgsql security invoker set search_path='' as $$
declare op text:=current_setting('creation_mart.operation',true);
begin
 if current_user in ('postgres','service_role') then return new;end if;
 if auth.uid() is null or new.brand_id<>auth.uid() or private.actor_role() is distinct from 'brand' then raise exception 'FORBIDDEN' using errcode='42501';end if;
 if tg_op='INSERT' then
   if op is distinct from 'brief_create' or new.state<>'draft' or new.version<>1 or new.revision<>1 or new.published_revision is not null then raise exception 'PROTECTED_FIELD' using errcode='42501';end if;
 else
   if new.id<>old.id or new.brand_id<>old.brand_id or new.created_at<>old.created_at or coalesce(current_setting('creation_mart.expected_brief_version',true),'')<>old.version::text then raise exception 'VERSION_CONFLICT';end if;
   if old.state in ('engaged','completed','archived') then raise exception 'INVALID_TRANSITION: scope frozen';end if;
   if old.state='published' and op='brief_revision' and new.state='draft' then new.revision:=old.revision+1;
   elsif new.revision<>old.revision then raise exception 'PROTECTED_FIELD' using errcode='42501';end if;
   if new.state<>old.state and not((op='brief_publish' and new.state='published' and old.state='draft') or (op='brief_revision' and old.state='published' and new.state='draft')) then raise exception 'INVALID_TRANSITION';end if;
   if old.state='published' and op is distinct from 'brief_revision' then raise exception 'INVALID_TRANSITION: start a revision';end if;
   new.version:=old.version+1;new.updated_at:=now();
 end if;
 perform private.validate_brief(new.payload,new.state='published');
 new.safe_payload:=new.payload-'referenceLinks';
 if new.state='published' then new.requirements:=private.compile_requirements(new.payload);new.published_revision:=new.revision;
 else new.requirements:='[]';end if;
 return new;
end; $$;
