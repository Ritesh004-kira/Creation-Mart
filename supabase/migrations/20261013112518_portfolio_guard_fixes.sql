create or replace function private.reserve_asset(p_purpose text,p_kind text,p_format text,p_parent uuid,p_declared_bytes bigint,p_duration numeric,p_key uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();role text:=private.actor_role();asset_uuid uuid:=gen_random_uuid();cap bigint;bucket_name text;parent_ok boolean;payload jsonb;cached jsonb;a public.assets;allocated bigint;pending integer;active integer;
begin
 if actor is null then raise exception 'NOT_AUTHENTICATED' using errcode='42501';end if;
 if p_purpose is null or p_kind is null or p_format is null or p_parent is null or p_declared_bytes is null or p_declared_bytes<1 then raise exception 'VALIDATION_FAILED';end if;
 if p_purpose not in ('portfolio_preview','portfolio_source','evidence','brief_reference','submission') or p_kind not in ('image','video','audio','text') then raise exception 'UNSUPPORTED_MEDIA';end if;
 if p_purpose='evidence' and p_kind not in ('image','text') then raise exception 'UNSUPPORTED_MEDIA';end if;
 if not(p_format=any(case p_kind when 'image' then array['png','jpeg','webp'] when 'video' then array['mp4'] when 'audio' then array['wav','mp3'] when 'text' then case when p_purpose='evidence' then array['txt','json'] else array['txt'] end end)) then raise exception 'UNSUPPORTED_MEDIA';end if;
 if p_duration is not null and (p_kind not in ('video','audio') or p_duration not between 1 and (case when p_kind='video' then 60 else 120 end)) then raise exception 'VALIDATION_FAILED: duration';end if;
 cap:=case when p_purpose in ('portfolio_preview','evidence') then 2000000 when p_kind='image' then 8000000 when p_kind='video' then 25000000 when p_kind='audio' then 10000000 else 256000 end;
 if p_kind='text' then cap:=least(cap,case when p_format='json' then 2000000 else 256000 end);end if;
 if p_declared_bytes>cap then raise exception 'UPLOAD_TOO_LARGE';end if;
 if p_purpose in ('portfolio_preview','portfolio_source','evidence') then
   if role is distinct from 'creator' then raise exception 'FORBIDDEN' using errcode='42501';end if;
   parent_ok:=exists(select 1 from public.portfolio_items where id=p_parent and creator_id=actor);
 elsif p_purpose='brief_reference' then
   if role is distinct from 'brand' or to_regclass('public.briefs') is null then raise exception 'NOT_FOUND';end if;
   execute 'select exists(select 1 from public.briefs where id=$1 and brand_id=$2 and state in (''draft'',''published''))' into parent_ok using p_parent,actor;
 else
   if role is distinct from 'creator' or to_regclass('public.engagements') is null then raise exception 'NOT_FOUND';end if;
   execute 'select exists(select 1 from public.engagements where id=$1 and creator_id=$2 and state in (''active'',''revision_requested''))' into parent_ok using p_parent,actor;
 end if;
 if not parent_ok then raise exception 'NOT_FOUND';end if;
 payload:=jsonb_build_object('purpose',p_purpose,'kind',p_kind,'format',p_format,'parent',p_parent,'bytes',p_declared_bytes,'duration',p_duration);
 cached:=private.begin_action('asset_reserve',p_key,payload);if cached is not null then return cached;end if;
 -- One project lock serializes full-cap reservations; declared byte count never determines allocation.
 select storage_reserved_bytes into allocated from private.runtime_config where singleton for update;
 select count(*) filter(where state='pending'),count(*),coalesce(sum(reserved_bytes),0) into pending,active,allocated
   from public.assets where owner_id=actor and object_deleted_at is null;
 if pending>=3 or active>=30 or allocated+cap>120000000 then raise exception 'RATE_LIMITED: asset quota';end if;
 if (select storage_reserved_bytes from private.runtime_config where singleton)+cap>700000000 then raise exception 'RATE_LIMITED: project storage';end if;
 bucket_name:=case when p_purpose='evidence' then 'creator-evidence' when p_purpose in ('submission','brief_reference') then 'engagement-files' else 'portfolio-media' end;
 insert into public.assets(id,owner_id,bucket,path,purpose,kind,format,portfolio_item_id,brief_id,engagement_id,max_bytes,reserved_bytes,declared_duration_sec)
 values(asset_uuid,actor,bucket_name,actor::text||'/'||asset_uuid::text||'.'||p_format,p_purpose,p_kind,p_format,
   case when p_purpose in ('portfolio_preview','portfolio_source','evidence') then p_parent end,
   case when p_purpose='brief_reference' then p_parent end,case when p_purpose='submission' then p_parent end,cap,cap,p_duration)
 returning * into a;
 update private.runtime_config set storage_reserved_bytes=storage_reserved_bytes+cap where singleton;
 cached:=to_jsonb(a);perform private.end_action('asset_reserve',p_key,payload,cached);return cached;
end; $$;

create or replace function private.portfolio_changed() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='UPDATE' and (new.preview_asset_id is distinct from old.preview_asset_id or new.workflow is distinct from old.workflow or new.human_contribution is distinct from old.human_contribution or new.rights_offer is distinct from old.rights_offer or new.model_refs is distinct from old.model_refs) then
   update public.claim_signals set stale=true where item_id=new.id and status in ('platform_checked','independently_verified') and (claim_code<>'file_metadata' or asset_id is distinct from new.preview_asset_id);
 end if;
 perform private.refresh_creator_projection(new.creator_id);return new;
end; $$;

create or replace function public.record_asset_check(p_id uuid,p_result jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.assets;actual bigint;result jsonb;
begin
 select * into a from public.assets where id=p_id for update;
 if not found then raise exception 'NOT_FOUND';end if;
 if a.state='ready' then return to_jsonb(a);end if;
 if a.state<>'pending' or a.object_deleted_at is not null then raise exception 'INVALID_TRANSITION';end if;
 perform private.assert_keys(p_result,array['actualBytes','mime','sha256','widthPx','heightPx','checkedDurationSec','checks']);
 actual:=(p_result->>'actualBytes')::bigint;
 if actual not between 1 and a.max_bytes or p_result->>'sha256' !~ '^[a-f0-9]{64}$' then raise exception 'VALIDATION_FAILED: technical result';end if;
 perform 1 from private.runtime_config where singleton for update;
 update public.assets set state='ready',actual_bytes=actual,reserved_bytes=actual,mime=p_result->>'mime',sha256=p_result->>'sha256',
   width_px=(p_result->>'widthPx')::integer,height_px=(p_result->>'heightPx')::integer,checked_duration_sec=(p_result->>'checkedDurationSec')::numeric,checks=p_result->'checks',checked_at=now()
 where id=p_id returning * into a;
 update private.runtime_config set storage_reserved_bytes=storage_reserved_bytes-(a.max_bytes-actual) where singleton;
 insert into public.claim_signals(creator_id,item_id,asset_id,claim_code,status,assertion,method,checked_at,limitations,simulated)
 select a.owner_id,a.portfolio_item_id,a.id,'file_metadata','platform_checked','File bytes checked by the platform.','sha256_header_dimensions',a.checked_at,
   array['File checks do not prove authorship, identity, permission or malware safety.','Unparsed duration remains creator declared.'],false
 from public.portfolio_items p where p.id=a.portfolio_item_id;
 return to_jsonb(a);
end; $$;

revoke select(evidence_asset_ids,reference_urls,checker_id) on public.claim_signals from authenticated;
