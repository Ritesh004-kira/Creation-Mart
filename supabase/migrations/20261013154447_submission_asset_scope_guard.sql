create or replace function private.submit_delivery(p_id uuid,p_input jsonb,p_key uuid) returns jsonb language plpgsql security definer set search_path='' as $$
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
 if exists(select 1 from unnest(ids) as requested(asset_id) where not exists(select 1 from public.assets a where a.id=requested.asset_id and a.owner_id=actor and a.engagement_id=e.id and a.purpose='submission' and a.state='ready' and a.object_deleted_at is null and a.sha256 is not null)) then raise exception 'NOT_FOUND: submitted files';end if;
 perform 1 from public.assets where id=any(ids) for update;
 if jsonb_array_length(p_input->'outputMapping')<>jsonb_array_length(e.brief_snapshot->'outputs')
   or (select count(distinct x->>'outputId') from jsonb_array_elements(p_input->'outputMapping') x)<>jsonb_array_length(p_input->'outputMapping') then raise exception 'VALIDATION_FAILED: output mapping';end if;
 for o in select value from jsonb_array_elements(e.brief_snapshot->'outputs') loop
   select value into mapping from jsonb_array_elements(p_input->'outputMapping') where value->>'outputId'=o->>'id';
   if mapping is null then raise exception 'VALIDATION_FAILED: output missing';end if;
   perform private.assert_keys(mapping,array['outputId','assetIds']);
   if jsonb_typeof(mapping->'assetIds') is distinct from 'array' or jsonb_array_length(mapping->'assetIds')<>(o->>'quantity')::integer then raise exception 'VALIDATION_FAILED: quantity';end if;
   if cardinality(array(select jsonb_array_elements_text(mapping->'assetIds')::uuid))<>(select count(distinct x) from jsonb_array_elements_text(mapping->'assetIds') x) or not(array(select jsonb_array_elements_text(mapping->'assetIds')::uuid) <@ ids) then raise exception 'VALIDATION_FAILED: distinct mapped assets';end if;
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
