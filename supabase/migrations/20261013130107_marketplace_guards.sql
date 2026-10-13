create function private.guard_brand_update() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null or old.user_id<>auth.uid() or private.actor_role() is distinct from 'brand' then raise exception 'FORBIDDEN' using errcode='42501';end if;
 if new.user_id<>old.user_id or coalesce(current_setting('creation_mart.expected_brand_version',true),'')<>old.version::text then raise exception 'VERSION_CONFLICT';end if;
 if length(trim(new.company_name)) not between 2 and 80 or length(new.industry)>80 or length(new.audience)>2000 or length(new.tone)>120 or new.country !~ '^[A-Z]{2}$' then raise exception 'VALIDATION_FAILED';end if;
 new.version:=old.version+1;new.updated_at:=now();return new;
end; $$;
create trigger brand_update_guard before update on public.brand_profiles for each row execute function private.guard_brand_update();
create policy brand_update_owner on public.brand_profiles for update to authenticated using(user_id=(select auth.uid()) and private.actor_role()='brand') with check(user_id=(select auth.uid()) and private.actor_role()='brand');
grant update(company_name,industry,audience,tone,country) on public.brand_profiles to authenticated;
create function public.save_brand(p_input jsonb,p_expected_version integer) returns jsonb language plpgsql security invoker set search_path='' as $$
declare b public.brand_profiles;k text;
begin
 if private.actor_role() is distinct from 'brand' then raise exception 'FORBIDDEN' using errcode='42501';end if;
 perform private.assert_keys(p_input,array['companyName','industry','audience','tone','country']);
 foreach k in array array['companyName','industry','audience','tone','country'] loop if jsonb_typeof(p_input->k) is distinct from 'string' then raise exception 'VALIDATION_FAILED';end if;end loop;
 perform set_config('creation_mart.expected_brand_version',p_expected_version::text,true);
 update public.brand_profiles set company_name=p_input->>'companyName',industry=p_input->>'industry',audience=p_input->>'audience',tone=p_input->>'tone',country=p_input->>'country'
 where user_id=auth.uid() and version=p_expected_version returning * into b;
 if not found then raise exception 'VERSION_CONFLICT';end if;return to_jsonb(b);
end; $$;
revoke all on function private.guard_brand_update(),public.save_brand(jsonb,integer) from public,anon;
grant execute on function private.guard_brand_update(),public.save_brand(jsonb,integer) to authenticated;
create function private.create_claim(p_item uuid,p_assertion text,p_evidence uuid[],p_key uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();payload jsonb:=jsonb_build_object('item',p_item,'assertion',p_assertion,'evidence',p_evidence);cached jsonb;s public.claim_signals;
begin
 if actor is null or private.actor_role() is distinct from 'creator' or not exists(select 1 from public.portfolio_items where id=p_item and creator_id=actor) then raise exception 'NOT_FOUND';end if;
 if p_assertion is null or length(trim(p_assertion)) not between 1 and 500 or p_evidence is null or cardinality(p_evidence)>20
   or exists(select 1 from unnest(p_evidence) x where not exists(select 1 from public.assets a where a.id=x and a.owner_id=actor and a.portfolio_item_id=p_item and a.purpose='evidence' and a.state='ready' and a.object_deleted_at is null))
 then raise exception 'VALIDATION_FAILED: evidence';end if;
 cached:=private.begin_action('claim_create',p_key,payload);if cached is not null then return cached;end if;
 insert into public.claim_signals(creator_id,item_id,claim_code,status,assertion,evidence_asset_ids,simulated)
 select actor,p_item,'workflow_declaration',case when cardinality(p_evidence)>0 then 'evidence_attached' else 'creator_declared' end,trim(p_assertion),p_evidence,artifact_origin<>'creator_supplied'
 from public.portfolio_items where id=p_item returning * into s;
 cached:=to_jsonb(s);perform private.end_action('claim_create',p_key,payload,cached);return cached;
end; $$;
revoke all on function private.create_claim(uuid,text,uuid[],uuid) from public,anon;grant execute on function private.create_claim(uuid,text,uuid[],uuid) to authenticated;
create function public.create_claim(p_item uuid,p_assertion text,p_evidence uuid[],p_key uuid) returns jsonb language sql security invoker set search_path='' as $$select private.create_claim(p_item,p_assertion,p_evidence,p_key)$$;
revoke all on function public.create_claim(uuid,text,uuid[],uuid) from public,anon;grant execute on function public.create_claim(uuid,text,uuid[],uuid) to authenticated;
create extension if not exists pg_trgm with schema extensions;
