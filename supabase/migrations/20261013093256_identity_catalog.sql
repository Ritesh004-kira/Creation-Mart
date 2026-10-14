create schema if not exists private;
create extension if not exists pgcrypto with schema extensions;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table public.accounts (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check(length(display_name) between 2 and 80),
  role text check(role in ('creator','brand')), onboarded_at timestamptz,
  created_at timestamptz not null default now(), version integer not null default 1 check(version>0)
);
create table public.creator_profiles (
  user_id uuid primary key references public.accounts(id), slug text not null unique,
  display_name text not null, headline text not null default '', bio text not null default '',
  country text not null default '', timezone text not null default '',
  languages text[] not null default '{}', specialties text[] not null default '{}', skills text[] not null default '{}',
  outcomes text[] not null default '{}', styles text[] not null default '{}', tool_slugs text[] not null default '{}',
  model_slugs text[] not null default '{}', capabilities jsonb not null default '[]',
  media_kinds text[] not null default '{}', formats text[] not null default '{}',
  aspect_ratios text[] not null default '{}', workflow_stages text[] not null default '{}',
  minimum_price_minor bigint, currency text not null default 'INR', available boolean not null default false,
  delivery_days integer not null default 7 check(delivery_days between 1 and 90),
  rights_offer jsonb, published boolean not null default false,
  search_text text not null default '', search_doc tsvector not null default '',
  version integer not null default 1 check(version>0),updated_at timestamptz not null default now()
);
create table public.brand_profiles (
  user_id uuid primary key references public.accounts(id),company_name text not null default '',
  industry text not null default '',audience text not null default '',tone text not null default '',country text not null default '',
  version integer not null default 1 check(version>0),updated_at timestamptz not null default now()
);
create table public.catalog_terms (
  kind text not null check(kind in ('tool','model','skill','specialty','outcome','style','workflow','format','aspect_ratio','language')),
  slug text not null,label text not null,aliases text[] not null default '{}',
  active boolean not null default true,metadata jsonb not null default '{}',primary key(kind,slug)
);
create table public.idempotency_keys (
  actor_id uuid not null references public.accounts(id),operation text not null,key uuid not null,
  request_hash text not null,result_ref jsonb not null,created_at timestamptz not null default now(),
  primary key(actor_id,operation,key)
);
create table private.operators (user_id uuid not null references auth.users(id),scope text not null check(scope in ('reviewer','worker')),enabled boolean not null default false,allowed_model text,primary key(user_id,scope));
create table private.runtime_config (
  singleton boolean primary key default true check(singleton),run_id uuid not null,ai_enabled boolean not null default false,
  storage_reserved_bytes bigint not null default 0 check(storage_reserved_bytes between 0 and 700000000)
);
insert into private.runtime_config(singleton,run_id) values(true,'c213484a-0c12-4cd6-a2a0-e4f67ae38db8');
alter table public.accounts enable row level security;
alter table public.creator_profiles enable row level security;
alter table public.brand_profiles enable row level security;
alter table public.catalog_terms enable row level security;
alter table public.idempotency_keys enable row level security;
alter table private.operators enable row level security;
alter table private.runtime_config enable row level security;
revoke all on public.accounts,public.creator_profiles,public.brand_profiles,public.catalog_terms,public.idempotency_keys from anon,authenticated;
revoke all on private.operators,private.runtime_config from anon,authenticated;
grant select on public.accounts,public.creator_profiles,public.brand_profiles,public.catalog_terms to authenticated;
grant select on public.creator_profiles,public.catalog_terms to anon;
create policy account_owner on public.accounts for select to authenticated using(id=(select auth.uid()));
create policy creator_visible on public.creator_profiles for select to anon,authenticated using(published or user_id=(select auth.uid()));
create policy brand_owner on public.brand_profiles for select to authenticated using(user_id=(select auth.uid()));
create policy catalog_public on public.catalog_terms for select to anon,authenticated using(active);
create policy idempotency_owner on public.idempotency_keys for select to authenticated using(actor_id=(select auth.uid()));
-- No client write grants on immutable role, identity, derived, operational or idempotency columns.
create function private.actor_role() returns text language sql stable security definer set search_path='' as $$
  select role from public.accounts where id=auth.uid()
$$;
revoke all on function private.actor_role() from public,anon;
grant execute on function private.actor_role() to authenticated;

create function private.onboard_account(p_role text,p_display_name text,p_key uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();old_role text;cached public.idempotency_keys;request_hash text;result jsonb;
begin
  if actor is null then raise exception 'NOT_AUTHENTICATED' using errcode='42501';end if;
  if p_role is null or p_role not in ('creator','brand') or p_key is null or p_display_name is null or length(trim(p_display_name)) not between 2 and 80 then raise exception 'VALIDATION_FAILED';end if;
  perform pg_advisory_xact_lock(hashtextextended(actor::text,0));
  request_hash:=encode(extensions.digest(convert_to(jsonb_build_object('role',p_role,'name',trim(p_display_name))::text,'UTF8'),'sha256'),'hex');
  select * into cached from public.idempotency_keys where actor_id=actor and operation='onboarding' and key=p_key;
  if found then
    if cached.request_hash<>request_hash then raise exception 'IDEMPOTENCY_CONFLICT';end if;
    return cached.result_ref;
  end if;
  select role into old_role from public.accounts where id=actor for update;
  if old_role is not null then raise exception 'ROLE_IMMUTABLE';end if;
  insert into public.accounts(id,display_name,role,onboarded_at) values(actor,trim(p_display_name),p_role,now())
    on conflict(id) do update set display_name=excluded.display_name,role=excluded.role,onboarded_at=excluded.onboarded_at,version=public.accounts.version+1;
  if p_role='creator' then
    insert into public.creator_profiles(user_id,slug,display_name) values(actor,'creator-'||replace(actor::text,'-',''),trim(p_display_name));
  else insert into public.brand_profiles(user_id,company_name) values(actor,trim(p_display_name));end if;
  result:=jsonb_build_object('id',actor,'role',p_role);
  insert into public.idempotency_keys(actor_id,operation,key,request_hash,result_ref) values(actor,'onboarding',p_key,request_hash,result);
  return result;
end $$;
revoke all on function private.onboard_account(text,text,uuid) from public,anon;
grant execute on function private.onboard_account(text,text,uuid) to authenticated;
create function public.onboard_account(p_role text,p_display_name text,p_key uuid) returns jsonb
language sql security invoker set search_path='' as $$select private.onboard_account(p_role,p_display_name,p_key)$$;
revoke all on function public.onboard_account(text,text,uuid) from public,anon;
grant execute on function public.onboard_account(text,text,uuid) to authenticated;

create index creator_search_idx on public.creator_profiles using gin(search_doc);
create index creator_skills_idx on public.creator_profiles using gin(skills);
create index creator_tools_idx on public.creator_profiles using gin(tool_slugs);
create index creator_models_idx on public.creator_profiles using gin(model_slugs);
create index idempotency_actor_idx on public.idempotency_keys(actor_id);
-- Catalog records are original controlled vocabulary, not provider licensing assertions.
insert into public.catalog_terms(kind,slug,label,aliases) values
 ('tool','comfyui','ComfyUI','{}'),('tool','blender','Blender','{}'),('tool','ffmpeg','FFmpeg','{}'),
 ('tool','krita','Krita','{}'),('tool','audacity','Audacity','{}'),
 ('skill','video-editing','Video editing','{editing}'),('skill','image-editing','Image editing','{retouching}'),
 ('skill','copywriting','Copywriting','{copy}'),('skill','sound-design','Sound design','{}'),
 ('specialty','product-film','Product film','{}'),('specialty','animation','Animation','{}'),('specialty','concept-art','Concept art','{}'),
 ('specialty','audio','Audio production','{}'),('specialty','copywriting','Copywriting','{}'),('specialty','three-d','3D metadata','{}'),
 ('outcome','product-ad','Product ad','{advertisement}'),('outcome','launch-copy','Launch copy','{}'),('outcome','storyboard','Storyboard','{}'),
 ('style','cinematic','Cinematic','{}'),('style','clean','Clean','{minimal}'),('style','illustrated','Illustrated','{}'),
 ('workflow','input','Input','{}'),('workflow','generation','Generation','{}'),('workflow','editing','Editing','{}'),
 ('workflow','quality_check','Quality check','{}'),('workflow','export','Export','{}'),
 ('format','png','PNG','{}'),('format','jpeg','JPEG','{jpg}'),('format','webp','WebP','{}'),('format','mp4','MP4','{}'),
 ('format','wav','WAV','{}'),('format','mp3','MP3','{}'),('format','txt','Plain text','{}'),
 ('aspect_ratio','9:16','Portrait 9:16','{vertical,portrait}'),('aspect_ratio','16:9','Landscape 16:9','{landscape}'),
 ('aspect_ratio','1:1','Square 1:1','{square}'),('language','en','English','{english}'),('language','hi','Hindi','{hindi}');

create function private.assert_keys(v jsonb,keys text[]) returns void
language plpgsql immutable security invoker set search_path='' as $$
begin
  if jsonb_typeof(v) is distinct from 'object' or not(v ?& keys)
    or exists(select 1 from jsonb_object_keys(v) k where not(k=any(keys)))
  then raise exception 'VALIDATION_FAILED: object keys';end if;
end $$;
create function private.validate_rights_offer(v jsonb) returns void
language plpgsql immutable security invoker set search_path='' as $$
declare k text;
begin
  perform private.assert_keys(v,array['schemaVersion','commercial','paidAds','modifications','sourceFiles','exclusiveArrangement','trainingUse','attribution','territories','maxTermDays','thirdPartyStatus','restrictions','declarationText','declaredAt']);
  if v->>'schemaVersion' is distinct from '1' or jsonb_typeof(v->'schemaVersion') is distinct from 'number' then raise exception 'VALIDATION_FAILED: rights version';end if;
  foreach k in array array['commercial','paidAds','modifications','sourceFiles','exclusiveArrangement','trainingUse'] loop
    if jsonb_typeof(v->k) not in ('boolean','null') then raise exception 'VALIDATION_FAILED: permission';end if;
  end loop;
  if coalesce(v->>'attribution','') not in ('required','not_required','unknown') or coalesce(v->>'thirdPartyStatus','') not in ('clear_declared','unknown','restricted')
    or jsonb_typeof(v->'territories') is distinct from 'array' or jsonb_typeof(v->'restrictions') is distinct from 'array'
    or length(v->>'declarationText') not between 1 and 2000 or jsonb_typeof(v->'declarationText') is distinct from 'string'
    or jsonb_typeof(v->'declaredAt') is distinct from 'string' or coalesce(v->>'declaredAt','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}'
  then raise exception 'VALIDATION_FAILED: rights declaration';end if;
  if jsonb_array_length(v->'territories')>20 or jsonb_array_length(v->'restrictions')>20
    or exists(select 1 from jsonb_array_elements(v->'territories') t where jsonb_typeof(t)<>'string' or t#>>'{}' !~ '^(WORLD|[A-Z]{2})$')
    or exists(select 1 from jsonb_array_elements(v->'restrictions') t where jsonb_typeof(t)<>'string' or length(t#>>'{}') not between 1 and 2000)
  then raise exception 'VALIDATION_FAILED: rights arrays';end if;
  if jsonb_typeof(v->'maxTermDays') is distinct from 'null' and
    (jsonb_typeof(v->'maxTermDays') is distinct from 'number' or (v->>'maxTermDays')::numeric not between 1 and 36500 or (v->>'maxTermDays')::numeric<>trunc((v->>'maxTermDays')::numeric))
  then raise exception 'VALIDATION_FAILED: rights term';end if;
  perform (v->>'declaredAt')::timestamptz;
end $$;
create function private.validate_capabilities(v jsonb) returns void
language plpgsql immutable security invoker set search_path='' as $$
declare c jsonb;k text;fmt text;allowed text[];
begin
  if jsonb_typeof(v) is distinct from 'array' or jsonb_array_length(v) not between 1 and 12 then raise exception 'VALIDATION_FAILED: capabilities';end if;
  for c in select value from jsonb_array_elements(v) loop
    perform private.assert_keys(c,array['kind','formats','aspectRatios','maxWidthPx','maxHeightPx','maxDurationSec']);
    if coalesce(c->>'kind','') not in ('image','video','audio','text','three_d') or jsonb_typeof(c->'formats') is distinct from 'array'
      or jsonb_typeof(c->'aspectRatios') is distinct from 'array' then raise exception 'VALIDATION_FAILED: capability kinds';end if;
    if jsonb_array_length(c->'formats') not between 1 and 20 or jsonb_array_length(c->'aspectRatios')>20 then raise exception 'VALIDATION_FAILED: capability arrays';end if;
    allowed:=case c->>'kind' when 'image' then array['png','jpeg','webp'] when 'three_d' then array['png','jpeg','webp'] when 'video' then array['mp4'] when 'audio' then array['wav','mp3'] when 'text' then array['txt'] end;
    if exists(select 1 from jsonb_array_elements(c->'formats') f where jsonb_typeof(f)<>'string') then raise exception 'VALIDATION_FAILED: formats';end if;
    for fmt in select jsonb_array_elements_text(c->'formats') loop if not(fmt=any(allowed)) then raise exception 'VALIDATION_FAILED: paired formats';end if;end loop;
    if (c->>'kind' in ('audio','text') and jsonb_array_length(c->'aspectRatios')<>0) or exists(select 1 from jsonb_array_elements(c->'aspectRatios') r where jsonb_typeof(r)<>'string' or length(r#>>'{}')>20 or r#>>'{}' !~ '^[1-9][0-9]*:[1-9][0-9]*$') then raise exception 'VALIDATION_FAILED: ratios';end if;
    foreach k in array array['maxWidthPx','maxHeightPx','maxDurationSec'] loop
      if jsonb_typeof(c->k) is distinct from 'null' and (jsonb_typeof(c->k) is distinct from 'number' or (c->>k)::numeric not between 1 and case when k='maxDurationSec' then 3600 else 16384 end)
      then raise exception 'VALIDATION_FAILED: capability bounds';end if;
      if k<>'maxDurationSec' and jsonb_typeof(c->k)='number' and (c->>k)::numeric<>trunc((c->>k)::numeric) then raise exception 'VALIDATION_FAILED: integer dimension';end if;
    end loop;
  end loop;
end $$;
create function private.validate_catalog_array(v text[],catalog_kind text,required boolean default false) returns void
language plpgsql stable security invoker set search_path='' as $$
begin
  if v is null or cardinality(v)>20 or (required and cardinality(v)=0)
    or exists(select 1 from unnest(v) x where x is null or not exists(select 1 from public.catalog_terms where kind=catalog_kind and slug=x and active))
    or cardinality(v)<>(select count(distinct x) from unnest(v) x)
  then raise exception 'VALIDATION_FAILED: catalog selections';end if;
end $$;
create function private.guard_creator_update() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  if auth.uid() is null or auth.uid()<>old.user_id or private.actor_role() is distinct from 'creator' then raise exception 'FORBIDDEN' using errcode='42501';end if;
  if octet_length(to_jsonb(new)::text)>32000 then raise exception 'VALIDATION_FAILED: profile size';end if;
  if new.user_id<>old.user_id or new.slug<>old.slug or new.published<>old.published then raise exception 'PROTECTED_FIELD' using errcode='42501';end if;
  if length(new.display_name) not between 2 and 80 or length(new.headline) not between 10 and 120 or length(new.bio) not between 30 and 1500
    or new.country !~ '^[A-Z]{2}$' or new.currency !~ '^[A-Z]{3}$' or new.minimum_price_minor is null or new.minimum_price_minor not between 1 and 1000000000
    or not exists(select 1 from pg_timezone_names where name=new.timezone) then raise exception 'VALIDATION_FAILED: profile fields';end if;
  perform private.validate_catalog_array(new.languages,'language',true);perform private.validate_catalog_array(new.specialties,'specialty',true);
  perform private.validate_catalog_array(new.skills,'skill');perform private.validate_catalog_array(new.outcomes,'outcome');
  perform private.validate_catalog_array(new.styles,'style');perform private.validate_catalog_array(new.tool_slugs,'tool');perform private.validate_catalog_array(new.model_slugs,'model');
  perform private.validate_capabilities(new.capabilities);perform private.validate_rights_offer(new.rights_offer);
  new.version:=old.version+1;new.updated_at:=now();
  return new;
end $$;
create trigger creator_update_guard before update on public.creator_profiles for each row execute function private.guard_creator_update();
create policy creator_update_owner on public.creator_profiles for update to authenticated using(user_id=(select auth.uid()) and private.actor_role()='creator') with check(user_id=(select auth.uid()) and private.actor_role()='creator');
grant update(display_name,headline,bio,country,timezone,languages,specialties,skills,outcomes,styles,tool_slugs,model_slugs,capabilities,minimum_price_minor,currency,available,delivery_days,rights_offer) on public.creator_profiles to authenticated;
create function public.save_creator(p_input jsonb,p_expected_version integer) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare profile public.creator_profiles;k text;
begin
  if auth.uid() is null or private.actor_role() is distinct from 'creator' then raise exception 'FORBIDDEN' using errcode='42501';end if;
  if octet_length(p_input::text)>32000 then raise exception 'VALIDATION_FAILED: profile size';end if;
  perform private.assert_keys(p_input,array['displayName','headline','bio','country','timezone','languages','specialties','skills','outcomes','styles','toolSlugs','modelSlugs','capabilities','minimumPriceMinor','currency','available','deliveryDays','rightsOffer']);
  foreach k in array array['displayName','headline','bio','country','timezone','currency'] loop
    if jsonb_typeof(p_input->k) is distinct from 'string' then raise exception 'VALIDATION_FAILED: text type';end if;
  end loop;
  foreach k in array array['languages','specialties','skills','outcomes','styles','toolSlugs','modelSlugs'] loop
    if jsonb_typeof(p_input->k) is distinct from 'array' or exists(select 1 from jsonb_array_elements(p_input->k) x where jsonb_typeof(x)<>'string') then raise exception 'VALIDATION_FAILED: catalog array type';end if;
  end loop;
  if p_expected_version is null or p_expected_version<1 or jsonb_typeof(p_input->'available') is distinct from 'boolean'
    or jsonb_typeof(p_input->'minimumPriceMinor') is distinct from 'number' or jsonb_typeof(p_input->'deliveryDays') is distinct from 'number'
    or (p_input->>'minimumPriceMinor')::numeric<>trunc((p_input->>'minimumPriceMinor')::numeric)
    or (p_input->>'deliveryDays')::numeric<>trunc((p_input->>'deliveryDays')::numeric)
  then raise exception 'VALIDATION_FAILED';end if;
  update public.creator_profiles set display_name=p_input->>'displayName',headline=p_input->>'headline',bio=p_input->>'bio',
    country=p_input->>'country',timezone=p_input->>'timezone',languages=array(select jsonb_array_elements_text(p_input->'languages')),
    specialties=array(select jsonb_array_elements_text(p_input->'specialties')),skills=array(select jsonb_array_elements_text(p_input->'skills')),
    outcomes=array(select jsonb_array_elements_text(p_input->'outcomes')),styles=array(select jsonb_array_elements_text(p_input->'styles')),
    tool_slugs=array(select jsonb_array_elements_text(p_input->'toolSlugs')),model_slugs=array(select jsonb_array_elements_text(p_input->'modelSlugs')),
    capabilities=p_input->'capabilities',minimum_price_minor=(p_input->>'minimumPriceMinor')::bigint,currency=p_input->>'currency',
    available=(p_input->>'available')::boolean,delivery_days=(p_input->>'deliveryDays')::integer,rights_offer=p_input->'rightsOffer'
    where user_id=auth.uid() and version=p_expected_version returning * into profile;
  if not found then raise exception 'VERSION_CONFLICT';end if;
  return to_jsonb(profile);
end $$;
revoke all on function private.assert_keys(jsonb,text[]),private.validate_rights_offer(jsonb),private.validate_capabilities(jsonb),private.validate_catalog_array(text[],text,boolean),private.guard_creator_update(),public.save_creator(jsonb,integer) from public,anon;
grant execute on function private.assert_keys(jsonb,text[]),private.validate_rights_offer(jsonb),private.validate_capabilities(jsonb),private.validate_catalog_array(text[],text,boolean),private.guard_creator_update(),public.save_creator(jsonb,integer) to authenticated;
