create or replace function private.accept_engagement(p_id uuid,p_input jsonb,p_key uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();e public.engagements;s public.submissions;cached jsonb;payload jsonb:=jsonb_build_object('id',p_id,'input',p_input);req jsonb;receipt jsonb;n integer;
begin
 if actor is null or private.actor_role() is distinct from 'brand' then raise exception 'FORBIDDEN' using errcode='42501';end if;
 perform private.assert_keys(p_input,array['expectedVersion','submissionId','checks','rightsResolutionNote']);
 if octet_length(p_input::text)>32000 or jsonb_typeof(p_input->'submissionId') is distinct from 'string' or p_input->>'submissionId' !~ '^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$' then raise exception 'VALIDATION_FAILED: latest submission reference';end if;

 if jsonb_typeof(p_input->'expectedVersion') is distinct from 'number' or jsonb_typeof(p_input->'checks') is distinct from 'array' or jsonb_array_length(p_input->'checks')>100
   or jsonb_typeof(p_input->'rightsResolutionNote') is distinct from 'string' or length(p_input->>'rightsResolutionNote')>2000 then raise exception 'VALIDATION_FAILED: brand review';end if;
 cached:=private.begin_action('engagement_accept',p_key,payload);if cached is not null then return cached;end if;
 select * into e from public.engagements where id=p_id and brand_id=actor for update;if not found then raise exception 'NOT_FOUND';end if;
 if e.version<>(p_input->>'expectedVersion')::integer then raise exception 'VERSION_CONFLICT';end if;
 if e.state<>'submitted' then raise exception 'INVALID_TRANSITION';end if;
 select * into s from public.submissions where engagement_id=e.id order by sequence desc limit 1 for update;
 if s.id<>(p_input->>'submissionId')::uuid then raise exception 'VERSION_CONFLICT: latest submission';end if;
 if exists(select 1 from unnest(s.asset_ids) as requested(asset_id) where not exists(select 1 from public.assets a where a.id=requested.asset_id and a.owner_id=e.creator_id and a.engagement_id=e.id and a.purpose='submission' and a.state='ready' and a.object_deleted_at is null and a.sha256 is not null)) then raise exception 'NOT_FOUND: delivery files outside accepted scope';end if;
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

create or replace function private.request_revision(p_id uuid,p_input jsonb,p_key uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();e public.engagements;s public.submissions;cached jsonb;payload jsonb:=jsonb_build_object('id',p_id,'input',p_input);
begin
 if actor is null or private.actor_role() is distinct from 'brand' then raise exception 'FORBIDDEN' using errcode='42501';end if;
 perform private.assert_keys(p_input,array['expectedVersion','submissionId','notes','requirementIds']);
 if octet_length(p_input::text)>32000 or jsonb_typeof(p_input->'submissionId') is distinct from 'string' or p_input->>'submissionId' !~ '^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$' then raise exception 'VALIDATION_FAILED: latest submission reference';end if;

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
