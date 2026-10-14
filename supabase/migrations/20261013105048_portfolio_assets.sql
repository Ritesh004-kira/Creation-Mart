create table public.portfolio_items (
 id uuid primary key default gen_random_uuid(),creator_id uuid not null references public.accounts(id),
 title text not null default 'Untitled work',objective text not null default '',description text not null default '',
 media_kind text not null default 'image' check(media_kind in ('image','video','audio','text','three_d')),
 preview_asset_id uuid,output_formats text[] not null default '{}',width_px integer,height_px integer,duration_sec numeric,
 outcomes text[] not null default '{}',styles text[] not null default '{}',workflow jsonb not null default '[]',
 model_refs jsonb not null default '[]',generation_disclosure text not null default 'unknown' check(generation_disclosure in ('ai_generated','ai_assisted','no_ai','unknown')),
 model_disclosure_note text not null default '',human_contribution text not null default '',rights_offer jsonb,
 artifact_origin text not null default 'creator_supplied' check(artifact_origin in ('creator_supplied','procedural_demo','simulated')),
 published boolean not null default false,version integer not null default 1 check(version>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.assets (
 id uuid primary key default gen_random_uuid(),owner_id uuid not null references public.accounts(id),
 bucket text not null check(bucket in ('portfolio-media','creator-evidence','engagement-files')),path text not null unique,
 purpose text not null check(purpose in ('portfolio_preview','portfolio_source','evidence','brief_reference','submission')),
 kind text not null check(kind in ('image','video','audio','text','three_d')),format text not null check(format in ('png','jpeg','webp','mp4','wav','mp3','txt','json')),
 portfolio_item_id uuid references public.portfolio_items(id),brief_id uuid,engagement_id uuid,
 max_bytes bigint not null check(max_bytes>0),reserved_bytes bigint not null check(reserved_bytes>=0),actual_bytes bigint,
 mime text,sha256 text,width_px integer,height_px integer,declared_duration_sec numeric,checked_duration_sec numeric,
 state text not null default 'pending' check(state in ('pending','ready','rejected')),checks jsonb,checked_at timestamptz,
 object_deleted_at timestamptz,created_at timestamptz not null default now(),
 check(num_nonnulls(portfolio_item_id,brief_id,engagement_id)=1)
);
alter table public.portfolio_items add constraint portfolio_preview_fk foreign key(preview_asset_id) references public.assets(id);
create table public.claim_signals (
 id uuid primary key default gen_random_uuid(),creator_id uuid not null references public.accounts(id),item_id uuid references public.portfolio_items(id),
 asset_id uuid references public.assets(id),claim_code text not null,
 status text not null check(status in ('creator_declared','evidence_attached','platform_checked','independently_verified')),
 assertion text not null check(length(assertion) between 1 and 500),evidence_asset_ids uuid[] not null default '{}',
 reference_urls text[] not null default '{}',checker_id uuid,method text,checked_at timestamptz,limitations text[] not null default '{}',
 simulated boolean not null default false,stale boolean not null default false,created_at timestamptz not null default now()
);
alter table public.creator_profiles add column is_demo boolean not null default false;
alter table public.portfolio_items enable row level security;
alter table public.assets enable row level security;
alter table public.claim_signals enable row level security;
revoke all on public.portfolio_items,public.assets,public.claim_signals from public,anon,authenticated;
grant select on public.portfolio_items,public.assets to anon,authenticated;
grant select(id,creator_id,item_id,asset_id,claim_code,status,assertion,method,checked_at,limitations,simulated,stale,created_at) on public.claim_signals to anon,authenticated;
grant select(evidence_asset_ids,reference_urls,checker_id) on public.claim_signals to authenticated;
create policy portfolio_read on public.portfolio_items for select to anon,authenticated using(
 creator_id=(select auth.uid()) or (published and exists(select 1 from public.creator_profiles c where c.user_id=creator_id and c.published)));
create policy claims_read on public.claim_signals for select to anon,authenticated using(
 creator_id=(select auth.uid()) or (item_id is not null and exists(select 1 from public.portfolio_items p where p.id=item_id and p.published)));
create function private.asset_visible(a public.assets) returns boolean language plpgsql stable security definer set search_path='' as $$
declare participant boolean;
begin
 if a.owner_id=auth.uid() then return true;end if;
 if a.purpose='portfolio_preview' and a.state='ready' and a.object_deleted_at is null then
   return exists(select 1 from public.portfolio_items p join public.creator_profiles c on c.user_id=p.creator_id where p.id=a.portfolio_item_id and p.preview_asset_id=a.id and p.published and c.published);
 end if;
 if auth.uid() is not null and a.engagement_id is not null and to_regclass('public.engagements') is not null then
   execute 'select exists(select 1 from public.engagements where id=$1 and (brand_id=$2 or creator_id=$2))' into participant using a.engagement_id,auth.uid();return participant;
 end if;
 if auth.uid() is not null and a.brief_id is not null and to_regclass('public.briefs') is not null then
   execute 'select exists(select 1 from public.briefs where id=$1 and brand_id=$2)' into participant using a.brief_id,auth.uid();if participant then return true;end if;
   if to_regclass('public.engagements') is not null then
     execute 'select exists(select 1 from public.engagements where brief_id=$1 and creator_id=$2)' into participant using a.brief_id,auth.uid();return participant;
   end if;
 end if;
 return false;
end; $$;
revoke all on function private.asset_visible(public.assets) from public;
grant execute on function private.asset_visible(public.assets) to anon,authenticated;
create policy asset_read on public.assets for select to anon,authenticated using(private.asset_visible(assets));
create index portfolio_creator_idx on public.portfolio_items(creator_id,published);
create index asset_owner_state_idx on public.assets(owner_id,state);
create index asset_engagement_idx on public.assets(engagement_id);
create index claim_item_idx on public.claim_signals(item_id);
create index claim_asset_idx on public.claim_signals(asset_id);

create function private.begin_action(op text,key uuid,payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare cached public.idempotency_keys;hash text;actor uuid:=auth.uid();
begin
 if actor is null or not exists(select 1 from public.accounts where id=actor and role is not null) then raise exception 'NOT_AUTHENTICATED' using errcode='42501';end if;
 if key is null or op not in ('portfolio_create','portfolio_publish','profile_publish','asset_reserve','claim_create') then raise exception 'VALIDATION_FAILED';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text||op||key::text,0));
 hash:=encode(extensions.digest(convert_to(payload::text,'UTF8'),'sha256'),'hex');
 select * into cached from public.idempotency_keys where actor_id=actor and operation=op and idempotency_keys.key=begin_action.key;
 if found then if cached.request_hash<>hash then raise exception 'IDEMPOTENCY_CONFLICT';end if;return cached.result_ref;end if;
 perform set_config('creation_mart.operation',op,true);return null;
end; $$;
create function private.end_action(op text,key uuid,payload jsonb,result jsonb) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or current_setting('creation_mart.operation',true) is distinct from op then raise exception 'FORBIDDEN' using errcode='42501';end if;
 insert into public.idempotency_keys(actor_id,operation,key,request_hash,result_ref) values(auth.uid(),op,key,encode(extensions.digest(convert_to(payload::text,'UTF8'),'sha256'),'hex'),result);
end; $$;
revoke all on function private.begin_action(text,uuid,jsonb),private.end_action(text,uuid,jsonb,jsonb) from public,anon;
grant execute on function private.begin_action(text,uuid,jsonb),private.end_action(text,uuid,jsonb,jsonb) to authenticated;

create function private.validate_portfolio(p public.portfolio_items,publication boolean default false) returns void
language plpgsql stable security invoker set search_path='' as $$
declare step jsonb;key text;m jsonb;required_keys text[]:=array['id','ordinal','stage','toolSlug','description','humanAction','inputDeclaration'];
begin
 if octet_length(to_jsonb(p)::text)>32000 or length(p.title) not between 2 and 80 or length(p.objective)>2000 or length(p.description)>2000
   or length(p.human_contribution)>2000 or length(p.model_disclosure_note)>2000 or jsonb_typeof(p.workflow) is distinct from 'array'
   or jsonb_typeof(p.model_refs) is distinct from 'array' or jsonb_array_length(p.workflow)>12 or jsonb_array_length(p.model_refs)>20
 then raise exception 'VALIDATION_FAILED: portfolio fields';end if;
 if p.width_px is not null and p.width_px not between 1 and 4096 or p.height_px is not null and p.height_px not between 1 and 4096
   or p.duration_sec is not null and p.duration_sec not between 1 and (case when p.media_kind='video' then 60 else 120 end)
 then raise exception 'VALIDATION_FAILED: media bounds';end if;
 perform private.validate_catalog_array(p.outcomes,'outcome');perform private.validate_catalog_array(p.styles,'style');perform private.validate_catalog_array(p.output_formats,'format');
 if exists(select 1 from unnest(p.output_formats) f where not(f=any(case p.media_kind when 'image' then array['png','jpeg','webp'] when 'three_d' then array['png','jpeg','webp'] when 'video' then array['mp4'] when 'audio' then array['wav','mp3'] when 'text' then array['txt'] end))) then raise exception 'VALIDATION_FAILED: output formats';end if;
 if p.rights_offer is not null then perform private.validate_rights_offer(p.rights_offer);end if;
 if p.artifact_origin='procedural_demo' and p.generation_disclosure<>'no_ai' then raise exception 'VALIDATION_FAILED: procedural origin';end if;
 for step in select value from jsonb_array_elements(p.workflow) loop
   if jsonb_typeof(step)<>'object' or not(step ?& required_keys) or exists(select 1 from jsonb_object_keys(step) k where not(k=any(required_keys||array['toolVersion','model','promptExcerpt','usedAt','termsUrl']))) then raise exception 'VALIDATION_FAILED: workflow keys';end if;
   perform (step->>'id')::uuid;
   if jsonb_typeof(step->'ordinal')<>'number' or (step->>'ordinal')::numeric not between 1 and 12 or (step->>'ordinal')::numeric<>trunc((step->>'ordinal')::numeric)
     or coalesce(step->>'stage','') not in ('input','generation','editing','quality_check','export')
     or not exists(select 1 from public.catalog_terms where kind='tool' and slug=step->>'toolSlug' and active) then raise exception 'VALIDATION_FAILED: workflow values';end if;
   foreach key in array array['description','humanAction','inputDeclaration'] loop if jsonb_typeof(step->key)<>'string' or length(step->>key) not between 1 and 2000 then raise exception 'VALIDATION_FAILED: workflow text';end if;end loop;
   if step ? 'promptExcerpt' and (jsonb_typeof(step->'promptExcerpt')<>'string' or length(step->>'promptExcerpt')>500) then raise exception 'VALIDATION_FAILED: public excerpt';end if;
 end loop;
 if (select count(distinct value->>'id') from jsonb_array_elements(p.workflow))<>jsonb_array_length(p.workflow)
   or (select count(distinct value->>'ordinal') from jsonb_array_elements(p.workflow))<>jsonb_array_length(p.workflow) then raise exception 'VALIDATION_FAILED: workflow order';end if;
 for m in select value from jsonb_array_elements(p.model_refs) loop
   if jsonb_typeof(m)<>'object' or not(m ?& array['catalogSlug','version']) or exists(select 1 from jsonb_object_keys(m) k where k not in ('catalogSlug','customName','version','termsUrl','entitlementDeclaration'))
     or length(coalesce(m->>'version','')) not between 1 and 80 or (m->>'catalogSlug' is null and length(coalesce(m->>'customName','')) not between 1 and 80)
     or (m->>'catalogSlug' is not null and not exists(select 1 from public.catalog_terms where kind='model' and slug=m->>'catalogSlug' and active))
   then raise exception 'VALIDATION_FAILED: model reference';end if;
 end loop;
 if p.preview_asset_id is not null and not exists(select 1 from public.assets a where a.id=p.preview_asset_id and a.owner_id=p.creator_id and a.portfolio_item_id=p.id and a.purpose='portfolio_preview' and a.object_deleted_at is null) then raise exception 'NOT_FOUND: preview association';end if;
 if publication then
   if length(p.objective)<1 or length(p.description)<1 or length(p.human_contribution)<1 or p.rights_offer is null or cardinality(p.output_formats)=0
     or jsonb_array_length(p.workflow)=0 or (jsonb_array_length(p.model_refs)=0 and length(trim(p.model_disclosure_note))=0)
     or not exists(select 1 from public.assets a where a.id=p.preview_asset_id and a.state='ready' and a.sha256 is not null and a.checked_at is not null
       and a.format=any(p.output_formats) and (a.kind=p.media_kind or p.media_kind='three_d' and a.kind='image'))
   then raise exception 'PUBLICATION_INCOMPLETE';end if;
 end if;
end; $$;
create function private.guard_portfolio() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null or new.creator_id<>auth.uid() or private.actor_role() is distinct from 'creator' then raise exception 'FORBIDDEN' using errcode='42501';end if;
 if tg_op='INSERT' then
   if current_setting('creation_mart.operation',true) is distinct from 'portfolio_create' or new.published or new.version<>1 then raise exception 'PROTECTED_FIELD' using errcode='42501';end if;
 else
   if new.id<>old.id or new.creator_id<>old.creator_id or new.created_at<>old.created_at then raise exception 'PROTECTED_FIELD' using errcode='42501';end if;
   if coalesce(current_setting('creation_mart.expected_item_version',true),'')<>old.version::text then raise exception 'VERSION_CONFLICT';end if;
   if new.published<>old.published and current_setting('creation_mart.operation',true) is distinct from 'portfolio_publish' then raise exception 'PROTECTED_FIELD' using errcode='42501';end if;
   new.version:=old.version+1;new.updated_at:=now();
 end if;
 perform private.validate_portfolio(new,new.published);return new;
end; $$;
create trigger portfolio_guard before insert or update on public.portfolio_items for each row execute function private.guard_portfolio();
create policy portfolio_insert on public.portfolio_items for insert to authenticated with check(creator_id=(select auth.uid()) and private.actor_role()='creator');
create policy portfolio_update on public.portfolio_items for update to authenticated using(creator_id=(select auth.uid())) with check(creator_id=(select auth.uid()));
grant insert(creator_id,title,objective,description,media_kind,preview_asset_id,output_formats,width_px,height_px,duration_sec,outcomes,styles,workflow,model_refs,generation_disclosure,model_disclosure_note,human_contribution,rights_offer,artifact_origin),
 update(title,objective,description,media_kind,preview_asset_id,output_formats,width_px,height_px,duration_sec,outcomes,styles,workflow,model_refs,generation_disclosure,model_disclosure_note,human_contribution,rights_offer,artifact_origin,published) on public.portfolio_items to authenticated;
revoke all on function private.validate_portfolio(public.portfolio_items,boolean),private.guard_portfolio() from public,anon;
grant execute on function private.validate_portfolio(public.portfolio_items,boolean),private.guard_portfolio() to authenticated;

create function private.portfolio_payload(p jsonb) returns public.portfolio_items language plpgsql immutable security invoker set search_path='' as $$
declare row public.portfolio_items;
begin
 if jsonb_typeof(p) is distinct from 'object' or octet_length(p::text)>32000 or exists(select 1 from jsonb_object_keys(p) k where k not in ('title','objective','description','kind','previewAssetId','outputFormats','widthPx','heightPx','durationSec','outcomes','styles','modelRefs','workflow','humanContribution','generationDisclosure','modelDisclosureNote','rightsOffer','artifactOrigin')) then raise exception 'VALIDATION_FAILED: portfolio input';end if;
 row.title:=coalesce(p->>'title','Untitled work');row.objective:=coalesce(p->>'objective','');row.description:=coalesce(p->>'description','');
 row.media_kind:=coalesce(p->>'kind','image');row.preview_asset_id:=(p->>'previewAssetId')::uuid;
 row.output_formats:=array(select jsonb_array_elements_text(coalesce(p->'outputFormats','[]')));row.outcomes:=array(select jsonb_array_elements_text(coalesce(p->'outcomes','[]')));row.styles:=array(select jsonb_array_elements_text(coalesce(p->'styles','[]')));
 row.width_px:=(p->>'widthPx')::integer;row.height_px:=(p->>'heightPx')::integer;row.duration_sec:=(p->>'durationSec')::numeric;
 row.model_refs:=coalesce(p->'modelRefs','[]');row.workflow:=coalesce(p->'workflow','[]');row.human_contribution:=coalesce(p->>'humanContribution','');
 row.generation_disclosure:=coalesce(p->>'generationDisclosure','unknown');row.model_disclosure_note:=coalesce(p->>'modelDisclosureNote','');
 row.rights_offer:=p->'rightsOffer';row.artifact_origin:=coalesce(p->>'artifactOrigin','creator_supplied');return row;
end; $$;
revoke all on function private.portfolio_payload(jsonb) from public,anon;
grant execute on function private.portfolio_payload(jsonb) to authenticated;
create function public.create_portfolio_item(p_input jsonb,p_key uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
declare p public.portfolio_items;cached jsonb;result jsonb;
begin
 if private.actor_role() is distinct from 'creator' then raise exception 'FORBIDDEN' using errcode='42501';end if;
 cached:=private.begin_action('portfolio_create',p_key,p_input);if cached is not null then return cached;end if;
 p:=private.portfolio_payload(p_input);
 insert into public.portfolio_items(creator_id,title,objective,description,media_kind,preview_asset_id,output_formats,width_px,height_px,duration_sec,outcomes,styles,workflow,model_refs,generation_disclosure,model_disclosure_note,human_contribution,rights_offer,artifact_origin)
 values(auth.uid(),p.title,p.objective,p.description,p.media_kind,p.preview_asset_id,p.output_formats,p.width_px,p.height_px,p.duration_sec,p.outcomes,p.styles,p.workflow,p.model_refs,p.generation_disclosure,p.model_disclosure_note,p.human_contribution,p.rights_offer,p.artifact_origin) returning * into p;
 result:=to_jsonb(p);perform private.end_action('portfolio_create',p_key,p_input,result);return result;
end; $$;
create function public.save_portfolio_item(p_id uuid,p_input jsonb,p_expected_version integer) returns jsonb language plpgsql security invoker set search_path='' as $$
declare p public.portfolio_items;result public.portfolio_items;
begin
 if private.actor_role() is distinct from 'creator' or not exists(select 1 from public.portfolio_items where id=p_id and creator_id=auth.uid()) then raise exception 'NOT_FOUND';end if;
 p:=private.portfolio_payload(p_input);perform set_config('creation_mart.expected_item_version',p_expected_version::text,true);
 update public.portfolio_items set title=p.title,objective=p.objective,description=p.description,media_kind=p.media_kind,preview_asset_id=p.preview_asset_id,output_formats=p.output_formats,width_px=p.width_px,height_px=p.height_px,duration_sec=p.duration_sec,
 outcomes=p.outcomes,styles=p.styles,workflow=p.workflow,model_refs=p.model_refs,generation_disclosure=p.generation_disclosure,model_disclosure_note=p.model_disclosure_note,human_contribution=p.human_contribution,rights_offer=p.rights_offer,artifact_origin=p.artifact_origin
 where id=p_id and creator_id=auth.uid() and version=p_expected_version returning * into result;
 if not found then raise exception 'VERSION_CONFLICT';end if;return to_jsonb(result);
end; $$;
create function public.publish_portfolio_item(p_id uuid,p_expected_version integer,p_key uuid,p_published boolean default true) returns jsonb language plpgsql security invoker set search_path='' as $$
declare cached jsonb;result jsonb;p public.portfolio_items;payload jsonb:=jsonb_build_object('id',p_id,'version',p_expected_version,'published',p_published);
begin
 if private.actor_role() is distinct from 'creator' or not exists(select 1 from public.portfolio_items where id=p_id and creator_id=auth.uid()) then raise exception 'NOT_FOUND';end if;
 cached:=private.begin_action('portfolio_publish',p_key,payload);if cached is not null then return cached;end if;
 perform set_config('creation_mart.expected_item_version',p_expected_version::text,true);
 update public.portfolio_items set published=p_published where id=p_id and creator_id=auth.uid() and version=p_expected_version returning * into p;
 if not found then raise exception 'VERSION_CONFLICT';end if;result:=to_jsonb(p);perform private.end_action('portfolio_publish',p_key,payload,result);return result;
end; $$;
revoke all on function public.create_portfolio_item(jsonb,uuid),public.save_portfolio_item(uuid,jsonb,integer),public.publish_portfolio_item(uuid,integer,uuid,boolean) from public,anon;
grant execute on function public.create_portfolio_item(jsonb,uuid),public.save_portfolio_item(uuid,jsonb,integer),public.publish_portfolio_item(uuid,integer,uuid,boolean) to authenticated;

create function private.reserve_asset(p_purpose text,p_kind text,p_format text,p_parent uuid,p_declared_bytes bigint,p_duration numeric,p_key uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();role text:=private.actor_role();id uuid:=gen_random_uuid();cap bigint;bucket_name text;parent_ok boolean;payload jsonb;cached jsonb;a public.assets;allocated bigint;pending integer;active integer;
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
 values(id,actor,bucket_name,actor::text||'/'||id::text||'.'||p_format,p_purpose,p_kind,p_format,
   case when p_purpose in ('portfolio_preview','portfolio_source','evidence') then p_parent end,
   case when p_purpose='brief_reference' then p_parent end,case when p_purpose='submission' then p_parent end,cap,cap,p_duration)
 returning * into a;
 update private.runtime_config set storage_reserved_bytes=storage_reserved_bytes+cap where singleton;
 cached:=to_jsonb(a);perform private.end_action('asset_reserve',p_key,payload,cached);return cached;
end; $$;
revoke all on function private.reserve_asset(text,text,text,uuid,bigint,numeric,uuid) from public,anon;
grant execute on function private.reserve_asset(text,text,text,uuid,bigint,numeric,uuid) to authenticated;
create function public.reserve_asset(p_purpose text,p_kind text,p_format text,p_parent uuid,p_declared_bytes bigint,p_duration numeric,p_key uuid) returns jsonb
language sql security invoker set search_path='' as $$select private.reserve_asset(p_purpose,p_kind,p_format,p_parent,p_declared_bytes,p_duration,p_key)$$;
revoke all on function public.reserve_asset(text,text,text,uuid,bigint,numeric,uuid) from public,anon;
grant execute on function public.reserve_asset(text,text,text,uuid,bigint,numeric,uuid) to authenticated;

create function public.record_asset_check(p_id uuid,p_result jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
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
   array['File checks do not prove authorship, identity, permission or malware safety.','Unparsed duration remains creator declared.'],p.artifact_origin in ('procedural_demo','simulated')
 from public.portfolio_items p where p.id=a.portfolio_item_id;
 return to_jsonb(a);
end; $$;
create function public.reject_asset_after_delete(p_id uuid,p_deleted boolean,p_reason text) returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.assets;allocation bigint;
begin
 select * into a from public.assets where id=p_id for update;if not found then raise exception 'NOT_FOUND';end if;
 if a.object_deleted_at is not null then return to_jsonb(a);end if;
 if a.state not in ('pending','rejected') then raise exception 'INVALID_TRANSITION';end if;
 allocation:=a.reserved_bytes;perform 1 from private.runtime_config where singleton for update;
 update public.assets set state='rejected',checks=jsonb_build_object('reason',left(p_reason,160)),object_deleted_at=case when p_deleted then now() end,reserved_bytes=case when p_deleted then 0 else reserved_bytes end where id=p_id returning * into a;
 if p_deleted then update private.runtime_config set storage_reserved_bytes=storage_reserved_bytes-allocation where singleton;end if;return to_jsonb(a);
end; $$;
revoke all on function public.record_asset_check(uuid,jsonb),public.reject_asset_after_delete(uuid,boolean,text) from public,anon,authenticated;
grant execute on function public.record_asset_check(uuid,jsonb),public.reject_asset_after_delete(uuid,boolean,text) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('portfolio-media','portfolio-media',false,25000000,array['image/png','image/jpeg','image/webp','video/mp4','audio/wav','audio/x-wav','audio/mpeg','text/plain']),
 ('creator-evidence','creator-evidence',false,2000000,array['image/png','image/jpeg','image/webp','application/json','text/plain']),
 ('engagement-files','engagement-files',false,25000000,array['image/png','image/jpeg','image/webp','video/mp4','audio/wav','audio/x-wav','audio/mpeg','text/plain']);
create policy reserved_asset_upload on storage.objects for insert to authenticated with check(
 exists(select 1 from public.assets a where a.owner_id=(select auth.uid()) and a.state='pending' and a.object_deleted_at is null and a.bucket=bucket_id and a.path=name
   and (metadata is null or coalesce((metadata->>'size')::bigint,0)<=a.max_bytes)));
-- No SELECT/UPDATE/DELETE policy: callers cannot mint arbitrarily long signed reads or overwrite bytes.
-- The user-auth Edge handler checks actual visibility before minting 120/60-second read capabilities.

create function private.refresh_creator_projection(subject uuid) returns void language plpgsql security definer set search_path='' as $$
declare text_doc text;rich boolean;
begin
 select exists(select 1 from public.portfolio_items p join public.assets a on a.id=p.preview_asset_id where p.creator_id=subject and p.published and jsonb_array_length(p.workflow)>=3 and a.state='ready') into rich;
 select concat_ws(' ',c.display_name,c.headline,c.bio,array_to_string(c.specialties,' '),array_to_string(c.skills,' '),array_to_string(c.outcomes,' '),array_to_string(c.styles,' '),array_to_string(c.tool_slugs,' '),array_to_string(c.model_slugs,' '),
   (select string_agg(concat_ws(' ',title,objective,description,array_to_string(output_formats,' ')),' ') from public.portfolio_items where creator_id=subject and published))
 into text_doc from public.creator_profiles c where c.user_id=subject;
 update public.creator_profiles set
   media_kinds=array(select distinct media_kind from public.portfolio_items where creator_id=subject and published),
   formats=array(select distinct f from public.portfolio_items p cross join unnest(p.output_formats) f where p.creator_id=subject and p.published),
   aspect_ratios=array(select distinct r from public.creator_profiles c cross join jsonb_array_elements(c.capabilities) cap cross join jsonb_array_elements_text(cap->'aspectRatios') r where c.user_id=subject),
   workflow_stages=array(select distinct s->>'stage' from public.portfolio_items p cross join jsonb_array_elements(p.workflow) s where p.creator_id=subject and p.published),
   search_text=coalesce(text_doc,''),search_doc=to_tsvector('simple',coalesce(text_doc,'')),published=published and rich,updated_at=now()
 where user_id=subject;
end; $$;
create function private.portfolio_changed() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='UPDATE' and (new.preview_asset_id is distinct from old.preview_asset_id or new.workflow is distinct from old.workflow or new.human_contribution is distinct from old.human_contribution or new.rights_offer is distinct from old.rights_offer or new.model_refs is distinct from old.model_refs) then
   update public.claim_signals set stale=true where item_id=new.id and status in ('platform_checked','independently_verified');
 end if;
 perform private.refresh_creator_projection(new.creator_id);return new;
end; $$;
create trigger portfolio_projection after insert or update on public.portfolio_items for each row execute function private.portfolio_changed();
revoke all on function private.refresh_creator_projection(uuid),private.portfolio_changed() from public,anon,authenticated;
create function private.publish_creator(p_expected_version integer,p_key uuid,p_published boolean) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();p public.creator_profiles;result jsonb;cached jsonb;payload jsonb:=jsonb_build_object('version',p_expected_version,'published',p_published);
begin
 if actor is null or private.actor_role() is distinct from 'creator' then raise exception 'FORBIDDEN' using errcode='42501';end if;
 cached:=private.begin_action('profile_publish',p_key,payload);if cached is not null then return cached;end if;
 select * into p from public.creator_profiles where user_id=actor for update;
 if p_expected_version is null or p.version<>p_expected_version then raise exception 'VERSION_CONFLICT';end if;
 if p_published is null then raise exception 'VALIDATION_FAILED';end if;
 if p_published then perform private.validate_rights_offer(p.rights_offer);perform private.validate_capabilities(p.capabilities);end if;
 if p_published and (length(p.headline)<10 or length(p.bio)<30 or p.rights_offer is null or p.country !~ '^[A-Z]{2}$' or p.currency !~ '^[A-Z]{3}$' or not exists(select 1 from pg_timezone_names where name=p.timezone)) then raise exception 'PUBLICATION_INCOMPLETE';end if;
 if p_published and (jsonb_array_length(p.capabilities)=0 or cardinality(p.languages)=0 or cardinality(p.specialties)=0 or p.minimum_price_minor is null
   or not exists(select 1 from public.portfolio_items i join public.assets a on a.id=i.preview_asset_id where i.creator_id=actor and i.published and jsonb_array_length(i.workflow)>=3 and a.state='ready'))
 then raise exception 'PUBLICATION_INCOMPLETE';end if;
 update public.creator_profiles set published=p_published,version=version+1,updated_at=now() where user_id=actor returning * into p;
 result:=to_jsonb(p);perform private.end_action('profile_publish',p_key,payload,result);return result;
end; $$;
revoke all on function private.publish_creator(integer,uuid,boolean) from public,anon;
grant execute on function private.publish_creator(integer,uuid,boolean) to authenticated;
create function public.publish_creator(p_expected_version integer,p_key uuid,p_published boolean default true) returns jsonb
language sql security invoker set search_path='' as $$select private.publish_creator(p_expected_version,p_key,p_published)$$;
revoke all on function public.publish_creator(integer,uuid,boolean) from public,anon;
grant execute on function public.publish_creator(integer,uuid,boolean) to authenticated;
insert into public.catalog_terms(kind,slug,label,aliases) values ('tool','browser-canvas','Browser Canvas','{}');

