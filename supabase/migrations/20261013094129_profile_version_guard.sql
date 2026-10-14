create or replace function private.guard_creator_update() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  if current_user in ('postgres','service_role') then return new;end if;
  if coalesce(current_setting('creation_mart.expected_creator_version',true),'')<>old.version::text then raise exception 'VERSION_CONFLICT: guarded save required';end if;
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

create or replace function public.save_creator(p_input jsonb,p_expected_version integer) returns jsonb
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
  perform set_config('creation_mart.expected_creator_version',p_expected_version::text,true);
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

create policy operators_client_deny on private.operators for all to anon,authenticated using(false) with check(false);
create policy runtime_client_deny on private.runtime_config for all to anon,authenticated using(false) with check(false);
