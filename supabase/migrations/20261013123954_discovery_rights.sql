create function private.rights_rule(code text,expected text,source_kind text,source_id text,outcome text,explanation text) returns jsonb
language sql immutable security invoker set search_path='' as $$select jsonb_build_array(jsonb_build_object('code',code,'expected',expected,'sourceKind',source_kind,'sourceId',source_id,'outcome',outcome,'explanation',explanation))$$;
create function public.evaluate_rights(p_request jsonb,p_offer jsonb,p_pipeline jsonb default '[]',p_final jsonb default null) returns jsonb
language plpgsql stable security invoker set search_path='' as $$
declare rules jsonb:='[]';offer jsonb;source text;permission text;outcome text;territory_ok boolean;refs jsonb;model jsonb;catalog jsonb;model_name text;prefix text;condition text;input jsonb;i integer;overall text;
begin
 perform private.validate_rights_request(p_request);perform private.validate_rights_offer(p_offer);
 if jsonb_typeof(p_pipeline) is distinct from 'array' or jsonb_array_length(p_pipeline)>20 then raise exception 'VALIDATION_FAILED: pipeline';end if;
 for i in 0..(case when p_final is null then 0 else 1 end) loop
   offer:=case when i=0 then p_offer else p_final->'offer' end;source:=case when i=0 then 'proposed_offer' else 'final_offer' end;
   perform private.validate_rights_offer(offer);
   foreach permission in array array['commercial','paidAds','modifications','sourceFiles','exclusiveArrangement','trainingUse'] loop
     if (p_request->>permission)::boolean then
       outcome:=case when offer->permission='false'::jsonb then 'blocked' when offer->permission='null'::jsonb then 'needs_review' else 'compatible_declared' end;
       rules:=rules||private.rights_rule(permission,'permission allowed','creator_declaration',source,outcome,
         case outcome when 'blocked' then 'Creator explicitly declines this use.' when 'needs_review' then 'Permission is unknown.' else 'Creator declares this permission.' end);
     end if;
   end loop;
   if offer->>'attribution'='required' and not(p_request->>'attributionAccepted')::boolean then
     rules:=rules||private.rights_rule('attribution','no required attribution','creator_declaration',source,'blocked','Required attribution is not accepted.');
   elsif offer->>'attribution'='unknown' then rules:=rules||private.rights_rule('attribution','known attribution terms','creator_declaration',source,'needs_review','Attribution terms are unknown.');end if;
   territory_ok:=offer->'territories' ? 'WORLD' or not exists(select 1 from jsonb_array_elements_text(p_request->'territories') t where not(offer->'territories' ? t));
   outcome:=case when jsonb_array_length(offer->'territories')=0 then 'needs_review' when territory_ok then 'compatible_declared' else 'blocked' end;
   rules:=rules||private.rights_rule('territory',(select string_agg(t,', ') from jsonb_array_elements_text(p_request->'territories') t),'creator_declaration',source,outcome,
     case outcome when 'needs_review' then 'Territory is unknown.' when 'compatible_declared' then 'Declared territory covers the requested use.' else 'Declared territory does not cover the requested use.' end);
   outcome:=case when offer->'maxTermDays'='null'::jsonb then 'needs_review' when (offer->>'maxTermDays')::integer<(p_request->>'termDays')::integer then 'blocked' else 'compatible_declared' end;
   rules:=rules||private.rights_rule('term',(p_request->>'termDays')||' days','creator_declaration',source,outcome,
     case outcome when 'needs_review' then 'Term is unknown.' when 'blocked' then 'Offered term is shorter than requested.' else 'Declared term covers the request.' end);
   outcome:=case offer->>'thirdPartyStatus' when 'restricted' then 'blocked' when 'unknown' then 'needs_review' else 'compatible_declared' end;
   rules:=rules||private.rights_rule('third_party','input permission','creator_declaration',source,outcome,case when outcome='compatible_declared' then 'Input clearance is declared, not independently verified.' else 'Input clearance needs resolution.' end);
   if jsonb_array_length(offer->'restrictions')>0 then rules:=rules||private.rights_rule('restrictions','review stated restrictions','creator_declaration',source,'needs_review',(select string_agg(t,'; ') from jsonb_array_elements_text(offer->'restrictions') t));end if;
   refs:=case when i=0 then p_pipeline else p_final->'modelRefs' end;prefix:=case when i=0 then 'proposed:' else 'final:' end;
   if jsonb_typeof(refs) is distinct from 'array' or jsonb_array_length(refs)>20 then raise exception 'VALIDATION_FAILED: model refs';end if;
   for model in select value from jsonb_array_elements(refs) loop
     model_name:=coalesce(model->>'catalogSlug',model->>'customName','unknown');
     select metadata into catalog from public.catalog_terms where kind='model' and slug=model->>'catalogSlug' and active;
     if not found then rules:=rules||private.rights_rule('model_conditions','known usage terms','catalog_reference',prefix||model_name,'needs_review','Model conditions are not cataloged.');continue;end if;
     if (p_request->>'commercial')::boolean and catalog->'commercial' is distinct from 'true'::jsonb then
       rules:=rules||private.rights_rule('model_commercial','commercial use','catalog_reference',prefix||model_name,case when catalog->'commercial'='false'::jsonb then 'blocked' else 'needs_review' end,'Publisher commercial conditions need review.');
     end if;
     for condition in select jsonb_array_elements_text(coalesce(catalog->'conditionCodes','[]')) loop
       if (condition='no_paid_ads' and (p_request->>'paidAds')::boolean) or (condition='no_training_use' and (p_request->>'trainingUse')::boolean) or (condition='no_modifications' and (p_request->>'modifications')::boolean) then
         rules:=rules||private.rights_rule(condition,'requested use permitted','catalog_reference',prefix||model_name,'blocked','Publisher explicitly prohibits the requested use.');
       elsif condition not in ('no_paid_ads','no_training_use','no_modifications') then rules:=rules||private.rights_rule(condition,'conditions satisfied','catalog_reference',prefix||model_name,'needs_review','Document the applicable publisher conditions.');end if;
     end loop;
   end loop;
 end loop;
 if p_final is not null then
   if jsonb_typeof(p_final->'inputs') is distinct from 'array' or jsonb_array_length(p_final->'inputs')>20 then raise exception 'VALIDATION_FAILED: final inputs';end if;
   i:=0;for input in select value from jsonb_array_elements(p_final->'inputs') loop
     if (p_request->>'commercial')::boolean then rules:=rules||private.rights_rule('final_input_commercial','commercial input permission','final_declaration',i::text,
       case when input->'commercialPermission'='false'::jsonb then 'blocked' when input->'commercialPermission'='true'::jsonb then 'compatible_declared' else 'needs_review' end,'Input permission is declared for this delivered version.');end if;
     if input->>'release'='unknown' then rules:=rules||private.rights_rule('final_release','required release documented','final_declaration',i::text,'needs_review','Release status is unknown.');end if;i:=i+1;
   end loop;
   if jsonb_array_length(p_final->'limitations')>0 then rules:=rules||private.rights_rule('final_limitations','limitations reviewed','final_declaration','final','needs_review',(select string_agg(t,'; ') from jsonb_array_elements_text(p_final->'limitations') t));end if;
 end if;
 overall:=case when exists(select 1 from jsonb_array_elements(rules) r where r->>'outcome'='blocked') then 'blocked' when exists(select 1 from jsonb_array_elements(rules) r where r->>'outcome'='needs_review') then 'needs_review' else 'compatible_declared' end;
 return jsonb_build_object('schemaVersion',1,'overall',overall,'basis','declarations_and_references','rules',rules,'generatedAt',now());
end; $$;
revoke all on function private.rights_rule(text,text,text,text,text,text),public.evaluate_rights(jsonb,jsonb,jsonb,jsonb) from public,anon;
grant execute on function private.rights_rule(text,text,text,text,text,text),public.evaluate_rights(jsonb,jsonb,jsonb,jsonb) to authenticated;

create function private.output_supported(caps jsonb,o jsonb) returns boolean language sql immutable security invoker set search_path='' as $$
 select exists(select 1 from jsonb_array_elements(caps) c where c->>'kind'=o->>'kind' and c->'formats' ? (o->>'format')
   and (not(o ? 'aspectRatio') or c->'aspectRatios' ? (o->>'aspectRatio'))
   and (not(o ? 'widthPx') or c->>'maxWidthPx' is not null and (c->>'maxWidthPx')::numeric>=(o->>'widthPx')::numeric)
   and (not(o ? 'heightPx') or c->>'maxHeightPx' is not null and (c->>'maxHeightPx')::numeric>=(o->>'heightPx')::numeric)
   and (not(o ? 'durationSec') or c->>'maxDurationSec' is not null and (c->>'maxDurationSec')::numeric>=(o->>'durationSec')::numeric))
$$;
create function private.creator_supports_brief(c public.creator_profiles,b jsonb) returns boolean language sql stable security invoker set search_path='' as $$
 select c.published and c.available and c.currency=b->>'currency' and c.minimum_price_minor<=(b->>'budgetMaxMinor')::bigint
   and now()+make_interval(days=>c.delivery_days)<=(b->>'dueAt')::timestamptz
   and not exists(select 1 from jsonb_array_elements(b->'outputs') o where not private.output_supported(c.capabilities,o))
   and c.skills @> array(select jsonb_array_elements_text(b->'requiredSkills'))
   and c.tool_slugs @> array(select jsonb_array_elements_text(b->'requiredTools'))
   and c.model_slugs @> array(select jsonb_array_elements_text(b->'requiredModels'))
   and c.languages && array(select jsonb_array_elements_text(b->'languages'))
$$;
revoke all on function private.output_supported(jsonb,jsonb),private.creator_supports_brief(public.creator_profiles,jsonb) from public;
grant execute on function private.output_supported(jsonb,jsonb),private.creator_supports_brief(public.creator_profiles,jsonb) to anon,authenticated;
create function private.fit_terms(c public.creator_profiles,b jsonb) returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare terms jsonb:='[]';name text;requested text[];covered text[];weight integer;n integer;d integer;published_count integer;rich integer;checked integer;
begin
 for name,requested,covered,weight in select * from (values
  ('outcomes',array(select jsonb_array_elements_text(b->'outcomes')),c.outcomes,35),
  ('style',array(select jsonb_array_elements_text(b->'styles')),c.styles,20),
  ('workflow',array(select jsonb_array_elements_text(b->'preferredWorkflows')),c.workflow_stages,15),
  ('format',array(select distinct o->>'format' from jsonb_array_elements(b->'outputs') o),array(select distinct f from jsonb_array_elements(c.capabilities) cap cross join jsonb_array_elements_text(cap->'formats') f),15)
 ) t loop
   d:=cardinality(requested);select count(*) into n from unnest(requested) r where r=any(covered);
   terms:=terms||jsonb_build_array(jsonb_build_object('name',name,'weight',weight,'value',case when d=0 then 0 else n::numeric/d end,'applicable',d>0,'numerator',n,'denominator',d,'evidenceIds','[]'::jsonb));
 end loop;
 terms:=terms||jsonb_build_array(jsonb_build_object('name','availability','weight',5,'value',case when c.available and now()+make_interval(days=>c.delivery_days)<=(b->>'dueAt')::timestamptz then 1 else 0 end,'applicable',true,'numerator',1,'denominator',1,'evidenceIds','[]'::jsonb));
 select count(*),count(*) filter(where jsonb_array_length(p.workflow)>=3),count(*) filter(where a.state='ready' and a.checked_at is not null and a.sha256 is not null) into published_count,rich,checked
 from public.portfolio_items p left join public.assets a on a.id=p.preview_asset_id where p.creator_id=c.user_id and p.published;
 terms:=terms||jsonb_build_array(jsonb_build_object('name','evidence','weight',10,'value',case when published_count=0 then 0 else (.5*rich+.5*checked)/published_count end,'applicable',true,'numerator',rich+checked,'denominator',2*published_count,'evidenceIds',(select coalesce(jsonb_agg(id),'[]') from public.portfolio_items where creator_id=c.user_id and published)));
 return terms;
end; $$;
create function private.fit_value(terms jsonb) returns numeric language sql immutable security invoker set search_path='' as $$
 select coalesce(round(100*sum((t->>'weight')::numeric*(t->>'value')::numeric)/nullif(sum((t->>'weight')::numeric),0),1),0) from jsonb_array_elements(terms) t where (t->>'applicable')::boolean
$$;
revoke all on function private.fit_terms(public.creator_profiles,jsonb),private.fit_value(jsonb) from public;
grant execute on function private.fit_terms(public.creator_profiles,jsonb),private.fit_value(jsonb) to anon,authenticated;

create function public.search_creators(p_filters jsonb default '{}',p_brief uuid default null,p_page integer default 1,p_page_size integer default 12) returns jsonb
language plpgsql stable security invoker set search_path='' as $$
declare b jsonb;query text:=coalesce(p_filters->>'q','');canonical_query text;aliases jsonb:='[]';term record;k text;request_id uuid:=gen_random_uuid();result jsonb;
begin
 if jsonb_typeof(p_filters) is distinct from 'object' or octet_length(p_filters::text)>8192 or length(query)>160 or p_page not between 1 and 100 or p_page_size not between 1 and 24
   or exists(select 1 from jsonb_object_keys(p_filters) x where x not in ('q','specialties','skills','tools','models','mediaKinds','formats','aspectRatios','styles','languages','availableOnly','budgetMaxMinor','currency','rightsState')) then raise exception 'VALIDATION_FAILED: search filters';end if;
 foreach k in array array['specialties','skills','tools','models','mediaKinds','formats','aspectRatios','styles','languages'] loop
   if p_filters ? k and (jsonb_typeof(p_filters->k) is distinct from 'array' or jsonb_array_length(p_filters->k)>20 or exists(select 1 from jsonb_array_elements(p_filters->k) x where jsonb_typeof(x)<>'string' or length(x#>>'{}')>80)) then raise exception 'VALIDATION_FAILED: search values';end if;
 end loop;
 if p_filters ? 'availableOnly' and jsonb_typeof(p_filters->'availableOnly') is distinct from 'boolean' then raise exception 'VALIDATION_FAILED';end if;
 if p_filters ? 'budgetMaxMinor' and (jsonb_typeof(p_filters->'budgetMaxMinor') is distinct from 'number' or (p_filters->>'budgetMaxMinor')::numeric<1 or coalesce(p_filters->>'currency','') !~ '^[A-Z]{3}$') then raise exception 'VALIDATION_FAILED: currency budget';end if;
 if p_brief is not null then
   if auth.uid() is null then raise exception 'NOT_AUTHENTICATED' using errcode='42501';end if;
   select safe_payload into b from public.briefs where id=p_brief and state='published';if not found then raise exception 'NOT_FOUND';end if;
 elsif p_filters ? 'rightsState' then raise exception 'VALIDATION_FAILED: rights filter needs brief';end if;
 canonical_query:=lower(trim(query));
 for term in select ct.kind,ct.slug,a as alias from public.catalog_terms ct cross join unnest(ct.aliases) a where ct.active and length(a)>0 and position(lower(a) in canonical_query)>0 order by length(a) desc,ct.kind,ct.slug loop
   if position(lower(term.alias) in canonical_query)>0 then aliases:=aliases||jsonb_build_array(jsonb_build_object('alias',term.alias,'kind',term.kind,'slug',term.slug));canonical_query:=replace(canonical_query,lower(term.alias),term.slug);end if;
 end loop;
 with candidates as (
   select c.*,case when b is null then null else private.fit_terms(c,b) end as terms,
     case when b is null then null else public.evaluate_rights(b->'rightsRequest',c.rights_offer,
       coalesce((select jsonb_agg(m) from public.portfolio_items pi cross join jsonb_array_elements(pi.model_refs) m where pi.creator_id=c.user_id and pi.published),'[]'),null) end as receipt,
     case when canonical_query='' then 0 else ts_rank_cd(c.search_doc,websearch_to_tsquery('simple',canonical_query)) end as lexical
   from public.creator_profiles c where c.published
     and (b is null or private.creator_supports_brief(c,b))
     and (canonical_query='' or c.search_doc @@ websearch_to_tsquery('simple',canonical_query))
     and (not coalesce((p_filters->>'availableOnly')::boolean,false) or c.available)
     and (not(p_filters ? 'budgetMaxMinor') or c.currency=p_filters->>'currency' and c.minimum_price_minor<=(p_filters->>'budgetMaxMinor')::bigint)
     and (coalesce(jsonb_array_length(p_filters->'skills'),0)=0 or c.skills @> array(select jsonb_array_elements_text(p_filters->'skills')))
     and (coalesce(jsonb_array_length(p_filters->'tools'),0)=0 or c.tool_slugs @> array(select jsonb_array_elements_text(p_filters->'tools')))
     and (coalesce(jsonb_array_length(p_filters->'models'),0)=0 or c.model_slugs @> array(select jsonb_array_elements_text(p_filters->'models')))
     and (coalesce(jsonb_array_length(p_filters->'specialties'),0)=0 or c.specialties && array(select jsonb_array_elements_text(p_filters->'specialties')))
     and (coalesce(jsonb_array_length(p_filters->'styles'),0)=0 or c.styles && array(select jsonb_array_elements_text(p_filters->'styles')))
     and (coalesce(jsonb_array_length(p_filters->'languages'),0)=0 or c.languages && array(select jsonb_array_elements_text(p_filters->'languages')))
     and (coalesce(jsonb_array_length(p_filters->'mediaKinds'),0)=0 or exists(select 1 from jsonb_array_elements(c.capabilities) cap where p_filters->'mediaKinds' ? (cap->>'kind')))
     and (coalesce(jsonb_array_length(p_filters->'aspectRatios'),0)=0 or exists(select 1 from jsonb_array_elements(c.capabilities) cap where cap->'aspectRatios' ?| array(select jsonb_array_elements_text(p_filters->'aspectRatios'))
       and (coalesce(jsonb_array_length(p_filters->'mediaKinds'),0)=0 or p_filters->'mediaKinds' ? (cap->>'kind'))
       and (coalesce(jsonb_array_length(p_filters->'formats'),0)=0 or cap->'formats' ?| array(select jsonb_array_elements_text(p_filters->'formats')))))
     and (coalesce(jsonb_array_length(p_filters->'formats'),0)=0 or not exists(select 1 from jsonb_array_elements_text(p_filters->'formats') f where not exists(
       select 1 from jsonb_array_elements(c.capabilities) cap where cap->'formats' ? f
       and (coalesce(jsonb_array_length(p_filters->'mediaKinds'),0)=0 or p_filters->'mediaKinds' ? (cap->>'kind'))
       and (coalesce(jsonb_array_length(p_filters->'aspectRatios'),0)=0 or cap->'aspectRatios' ?| array(select jsonb_array_elements_text(p_filters->'aspectRatios'))))))
 ),eligible as (
   select *,case when b is null then null else private.fit_value(terms) end as fit from candidates
   where not(p_filters ? 'rightsState') or receipt->>'overall'=p_filters->>'rightsState'
 ),paged as (
   select * from eligible order by fit desc nulls last,lexical desc,user_id limit p_page_size offset (p_page-1)*p_page_size
 )
 select jsonb_build_object('items',coalesce((select jsonb_agg(jsonb_build_object(
   'id',user_id,'slug',slug,'displayName',display_name,'headline',headline,'available',available,'currency',currency,'minimumPriceMinor',minimum_price_minor,'isDemo',is_demo,
   'capabilities',capabilities,'fit',fit,'terms',terms,'rightsReceipt',receipt,'portfolioIds',(select coalesce(jsonb_agg(id),'[]') from public.portfolio_items where creator_id=paged.user_id and published),
   'reasons',case when b is null then '[]'::jsonb else jsonb_build_array('Every requested output has one matching declared capability.','Required tools, models and skills match.','Currency and declared schedule match the brief.') end)) from paged),'[]'),
   'total',(select count(*) from eligible),'appliedFilters',p_filters,'matchedAliases',aliases,'rankingVersion','fit-v1','requestId',request_id) into result;
 return result;
end; $$;
revoke all on function public.search_creators(jsonb,uuid,integer,integer) from public;
grant execute on function public.search_creators(jsonb,uuid,integer,integer) to anon,authenticated;

create or replace function private.refresh_creator_projection(subject uuid) returns void language plpgsql security definer set search_path='' as $$
declare text_doc text;rich boolean;
begin
 select exists(select 1 from public.portfolio_items p join public.assets a on a.id=p.preview_asset_id where p.creator_id=subject and p.published and jsonb_array_length(p.workflow)>=3 and a.state='ready') into rich;
 select concat_ws(' ',c.display_name,c.headline,c.bio,array_to_string(c.specialties,' '),array_to_string(c.skills,' '),array_to_string(c.outcomes,' '),array_to_string(c.styles,' '),array_to_string(c.tool_slugs,' '),array_to_string(c.model_slugs,' '),c.capabilities::text,
   (select string_agg(concat_ws(' ',title,objective,description,array_to_string(output_formats,' ')),' ') from public.portfolio_items where creator_id=subject and published),
   (select string_agg(concat_ws(' ',ct.label,ct.slug,array_to_string(ct.aliases,' ')),' ') from public.catalog_terms ct where ct.active and (ct.slug=any(c.tool_slugs||c.model_slugs||c.skills||c.specialties||c.outcomes||c.styles||c.languages) or ct.kind='aspect_ratio' and exists(select 1 from jsonb_array_elements(c.capabilities) cap where cap->'aspectRatios' ? ct.slug))))
 into text_doc from public.creator_profiles c where c.user_id=subject;
 update public.creator_profiles set media_kinds=array(select distinct cap->>'kind' from public.creator_profiles c cross join jsonb_array_elements(c.capabilities) cap where c.user_id=subject),
   formats=array(select distinct f from public.creator_profiles c cross join jsonb_array_elements(c.capabilities) cap cross join jsonb_array_elements_text(cap->'formats') f where c.user_id=subject),
   aspect_ratios=array(select distinct r from public.creator_profiles c cross join jsonb_array_elements(c.capabilities) cap cross join jsonb_array_elements_text(cap->'aspectRatios') r where c.user_id=subject),
   workflow_stages=array(select distinct s->>'stage' from public.portfolio_items p cross join jsonb_array_elements(p.workflow) s where p.creator_id=subject and p.published),
   search_text=coalesce(text_doc,''),search_doc=to_tsvector('simple',coalesce(text_doc,'')),published=published and rich,updated_at=now() where user_id=subject;
end; $$;
create function private.profile_projection_changed() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.display_name is distinct from old.display_name or new.headline is distinct from old.headline or new.bio is distinct from old.bio or new.skills is distinct from old.skills or new.capabilities is distinct from old.capabilities or new.tool_slugs is distinct from old.tool_slugs or new.model_slugs is distinct from old.model_slugs or new.styles is distinct from old.styles or new.outcomes is distinct from old.outcomes or new.languages is distinct from old.languages or new.specialties is distinct from old.specialties then perform private.refresh_creator_projection(new.user_id);end if;return new;
end; $$;
revoke all on function private.profile_projection_changed() from public,anon,authenticated;
create trigger profile_projection after update on public.creator_profiles for each row execute function private.profile_projection_changed();
do $$declare c record;begin for c in select user_id from public.creator_profiles loop perform private.refresh_creator_projection(c.user_id);end loop;end;$$;
