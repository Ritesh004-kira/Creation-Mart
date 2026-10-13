create table public.briefs (
 id uuid primary key default gen_random_uuid(),brand_id uuid not null references public.accounts(id),
 state text not null default 'draft' check(state in ('draft','published','engaged','completed','archived')),
 payload jsonb not null default '{}',safe_payload jsonb not null default '{}',requirements jsonb not null default '[]',
 revision integer not null default 1 check(revision>0),published_revision integer,version integer not null default 1 check(version>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.applications (
 id uuid primary key default gen_random_uuid(),brief_id uuid not null references public.briefs(id),creator_id uuid not null references public.accounts(id),
 brief_revision integer not null,quote_minor bigint not null check(quote_minor>0),currency text not null,delivery_days integer not null check(delivery_days between 1 and 90),
 note text not null,pipeline jsonb not null,rights_offer jsonb not null,state text not null default 'submitted' check(state in ('submitted','withdrawn','selected','rejected')),
 version integer not null default 1 check(version>0),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(brief_id,creator_id)
);
create table public.shortlists (
 id uuid primary key default gen_random_uuid(),brand_id uuid not null references public.accounts(id),brief_id uuid not null references public.briefs(id),
 creator_id uuid not null references public.creator_profiles(user_id),created_at timestamptz not null default now(),unique(brand_id,brief_id,creator_id)
);
create table public.engagements (
 id uuid primary key default gen_random_uuid(),brief_id uuid not null unique references public.briefs(id),application_id uuid not null unique references public.applications(id),
 brand_id uuid not null references public.accounts(id),creator_id uuid not null references public.accounts(id),
 brief_snapshot jsonb not null,requirements_snapshot jsonb not null,offer_snapshot jsonb not null,pipeline_snapshot jsonb not null,selection_receipt jsonb not null,
 review_ack text,state text not null default 'active' check(state in ('active','submitted','revision_requested','accepted')),
 revision_count integer not null default 0 check(revision_count>=0),version integer not null default 1 check(version>0),
 selected_at timestamptz not null default now(),accepted_at timestamptz
);
create table public.submissions (
 id uuid primary key default gen_random_uuid(),engagement_id uuid not null references public.engagements(id),creator_id uuid not null references public.accounts(id),
 sequence integer not null check(sequence>0),asset_ids uuid[] not null,output_mapping jsonb not null,creator_checklist jsonb not null,final_rights jsonb not null,
 automatic_checks jsonb not null,rights_receipt jsonb not null,brand_review jsonb,feedback jsonb,submitted_at timestamptz not null default now(),unique(engagement_id,sequence)
);
create table public.workflow_events (
 id uuid primary key default gen_random_uuid(),brief_id uuid references public.briefs(id),engagement_id uuid references public.engagements(id),
 actor_id uuid not null references public.accounts(id),event_type text not null,old_state text,new_state text,entity_version integer not null,
 details jsonb not null default '{}',created_at timestamptz not null default now()
);
alter table public.assets add constraint asset_brief_fk foreign key(brief_id) references public.briefs(id);
alter table public.assets add constraint asset_engagement_fk foreign key(engagement_id) references public.engagements(id);
alter table public.briefs enable row level security;alter table public.applications enable row level security;
alter table public.shortlists enable row level security;alter table public.engagements enable row level security;
alter table public.submissions enable row level security;alter table public.workflow_events enable row level security;
revoke all on public.briefs,public.applications,public.shortlists,public.engagements,public.submissions,public.workflow_events from public,anon,authenticated;
grant select(id,brand_id,state,safe_payload,requirements,revision,published_revision,version,created_at,updated_at) on public.briefs to authenticated;
grant select on public.applications,public.shortlists,public.engagements,public.submissions,public.workflow_events to authenticated;
create policy briefs_visible on public.briefs for select to authenticated using(brand_id=(select auth.uid()) or (private.actor_role()='creator' and state in ('published','engaged','completed')));
create policy applications_visible on public.applications for select to authenticated using(creator_id=(select auth.uid()) or exists(select 1 from public.briefs where id=brief_id and brand_id=(select auth.uid())));
create policy shortlist_owner on public.shortlists for select to authenticated using(brand_id=(select auth.uid()));
create policy engagement_participant on public.engagements for select to authenticated using(brand_id=(select auth.uid()) or creator_id=(select auth.uid()));
create policy submission_participant on public.submissions for select to authenticated using(exists(select 1 from public.engagements e where e.id=engagement_id and (e.brand_id=(select auth.uid()) or e.creator_id=(select auth.uid()))));
create policy event_participant on public.workflow_events for select to authenticated using(exists(select 1 from public.briefs b where b.id=brief_id and b.brand_id=(select auth.uid())) or exists(select 1 from public.engagements e where e.id=engagement_id and (e.brand_id=(select auth.uid()) or e.creator_id=(select auth.uid()))));
create index brief_owner_state_idx on public.briefs(brand_id,state);
create index application_brief_state_idx on public.applications(brief_id,state);
create index application_creator_idx on public.applications(creator_id);
create index shortlist_brief_idx on public.shortlists(brand_id,brief_id);
create index shortlist_creator_idx on public.shortlists(creator_id);
create index engagement_brand_idx on public.engagements(brand_id);
create index engagement_creator_idx on public.engagements(creator_id);
create index submission_parent_idx on public.submissions(engagement_id,sequence);
create index event_brief_idx on public.workflow_events(brief_id);
create index event_engagement_idx on public.workflow_events(engagement_id);

create function private.validate_rights_request(v jsonb) returns void language plpgsql immutable security invoker set search_path='' as $$
declare k text;
begin
 perform private.assert_keys(v,array['schemaVersion','commercial','paidAds','modifications','sourceFiles','exclusiveArrangement','trainingUse','attributionAccepted','territories','termDays','jurisdictionNotes']);
 if v->>'schemaVersion' is distinct from '1' or jsonb_typeof(v->'schemaVersion') is distinct from 'number' then raise exception 'VALIDATION_FAILED: rights schema';end if;
 foreach k in array array['commercial','paidAds','modifications','sourceFiles','exclusiveArrangement','trainingUse','attributionAccepted'] loop if jsonb_typeof(v->k) is distinct from 'boolean' then raise exception 'VALIDATION_FAILED: required permissions';end if;end loop;
 if jsonb_typeof(v->'territories') is distinct from 'array' or jsonb_array_length(v->'territories') not between 1 and 20 or exists(select 1 from jsonb_array_elements(v->'territories') t where jsonb_typeof(t)<>'string' or t#>>'{}' !~ '^(WORLD|[A-Z]{2})$')
   or jsonb_typeof(v->'termDays') is distinct from 'number' or (v->>'termDays')::numeric not between 1 and 36500 or (v->>'termDays')::numeric<>trunc((v->>'termDays')::numeric)
   or jsonb_typeof(v->'jurisdictionNotes') is distinct from 'string' or length(v->>'jurisdictionNotes')>2000
 then raise exception 'VALIDATION_FAILED: rights terms';end if;
end; $$;
create function private.validate_brief(v jsonb,publication boolean default false) returns void language plpgsql stable security invoker set search_path='' as $$
declare k text;o jsonb;keys text[]:=array['schemaVersion','title','objective','audience','brandContext','outcomes','styles','preferredWorkflows','requiredSkills','requiredTools','requiredModels','languages','outputs','budgetMinMinor','budgetMaxMinor','currency','dueAt','revisionRounds','mustInclude','mustAvoid','referenceLinks','referenceRightsDeclaration','rightsRequest'];
begin
 if jsonb_typeof(v) is distinct from 'object' or octet_length(v::text)>32000 or exists(select 1 from jsonb_object_keys(v) x where not(x=any(keys))) then raise exception 'VALIDATION_FAILED: brief keys';end if;
 if publication then perform private.assert_keys(v,keys);end if;
 foreach k in array array['title','objective','audience','brandContext','referenceRightsDeclaration'] loop
   if v ? k and (jsonb_typeof(v->k) is distinct from 'string' or length(v->>k)>(case when k='title' then 80 else 2000 end)) then raise exception 'VALIDATION_FAILED: brief text';end if;
   if publication and length(trim(v->>k))<(case when k='title' then 2 else 1 end) then raise exception 'PUBLICATION_INCOMPLETE';end if;
 end loop;
 foreach k in array array['outcomes','styles','preferredWorkflows','requiredSkills','requiredTools','requiredModels','languages','mustInclude','mustAvoid','referenceLinks'] loop
   if v ? k and (jsonb_typeof(v->k) is distinct from 'array' or jsonb_array_length(v->k)>20 or exists(select 1 from jsonb_array_elements(v->k) x where jsonb_typeof(x)<>'string' or length(x#>>'{}')>2000)) then raise exception 'VALIDATION_FAILED: brief arrays';end if;
 end loop;
 if v ? 'schemaVersion' and (v->>'schemaVersion' is distinct from '1' or jsonb_typeof(v->'schemaVersion') is distinct from 'number') then raise exception 'VALIDATION_FAILED: schema version';end if;
 if v ? 'outputs' then
   if jsonb_typeof(v->'outputs') is distinct from 'array' or jsonb_array_length(v->'outputs')>10 then raise exception 'VALIDATION_FAILED: output groups';end if;
   for o in select value from jsonb_array_elements(v->'outputs') loop
     if jsonb_typeof(o)<>'object' or exists(select 1 from jsonb_object_keys(o) x where x not in ('id','label','kind','quantity','format','widthPx','heightPx','aspectRatio','durationSec','maxBytes','contentRequirements')) then raise exception 'VALIDATION_FAILED: output keys';end if;
     if publication then
       if not(o ?& array['id','label','kind','quantity','format','maxBytes','contentRequirements']) then raise exception 'PUBLICATION_INCOMPLETE';end if;
       perform (o->>'id')::uuid;
       if coalesce(o->>'kind','') not in ('image','video','audio','text') or coalesce(o->>'format','')<>all(case o->>'kind' when 'image' then array['png','jpeg','webp'] when 'video' then array['mp4'] when 'audio' then array['wav','mp3'] when 'text' then array['txt'] else '{}' end) then raise exception 'UNSUPPORTED_MEDIA: output';end if;
       if jsonb_typeof(o->'quantity') is distinct from 'number' or (o->>'quantity')::numeric not between 1 and 50 or (o->>'quantity')::numeric<>trunc((o->>'quantity')::numeric)
         or jsonb_typeof(o->'label') is distinct from 'string' or jsonb_typeof(o->'contentRequirements') is distinct from 'string' or length(coalesce(o->>'label','')) not between 1 and 80 or length(coalesce(o->>'contentRequirements','')) not between 1 and 2000
         or jsonb_typeof(o->'maxBytes') is distinct from 'number' or (o->>'maxBytes')::numeric<>trunc((o->>'maxBytes')::numeric)
         or (o->>'maxBytes')::bigint not between 1 and (case o->>'kind' when 'image' then 8000000 when 'video' then 25000000 when 'audio' then 10000000 else 256000 end)
       then raise exception 'VALIDATION_FAILED: output bounds';end if;
       if o->>'kind' in ('image','video') then
         if not(o ?& array['widthPx','heightPx','aspectRatio']) or jsonb_typeof(o->'widthPx') is distinct from 'number' or jsonb_typeof(o->'heightPx') is distinct from 'number'
           or (o->>'widthPx')::numeric not between 1 and 4096 or (o->>'heightPx')::numeric not between 1 and 4096
           or (o->>'widthPx')::numeric<>trunc((o->>'widthPx')::numeric) or (o->>'heightPx')::numeric<>trunc((o->>'heightPx')::numeric)
           or o->>'aspectRatio' is distinct from ((o->>'widthPx')::integer/gcd((o->>'widthPx')::integer,(o->>'heightPx')::integer))::text||':'||((o->>'heightPx')::integer/gcd((o->>'widthPx')::integer,(o->>'heightPx')::integer))::text
         then raise exception 'VALIDATION_FAILED: output dimensions';end if;
       elsif o ?| array['widthPx','heightPx','aspectRatio'] then raise exception 'VALIDATION_FAILED: nonvisual dimensions';end if;
       if o->>'kind' in ('video','audio') and (jsonb_typeof(o->'durationSec') is distinct from 'number' or (o->>'durationSec')::numeric not between 1 and (case when o->>'kind'='video' then 60 else 120 end)) then raise exception 'VALIDATION_FAILED: output duration';end if;
     end if;
   end loop;
 end if;
 if publication then
   if jsonb_array_length(v->'outputs')=0 or (select count(distinct x->>'id') from jsonb_array_elements(v->'outputs') x)<>jsonb_array_length(v->'outputs') then raise exception 'PUBLICATION_INCOMPLETE: outputs';end if;
   if jsonb_typeof(v->'budgetMinMinor') is distinct from 'number' or jsonb_typeof(v->'budgetMaxMinor') is distinct from 'number'
     or (v->>'budgetMinMinor')::numeric<>trunc((v->>'budgetMinMinor')::numeric) or (v->>'budgetMaxMinor')::numeric<>trunc((v->>'budgetMaxMinor')::numeric)
     or (v->>'budgetMinMinor')::bigint not between 1 and 1000000000 or (v->>'budgetMaxMinor')::bigint not between (v->>'budgetMinMinor')::bigint and 1000000000
     or coalesce(v->>'currency','') !~ '^[A-Z]{3}$' or jsonb_typeof(v->'dueAt') is distinct from 'string' or (v->>'dueAt')::timestamptz<=now()
     or jsonb_typeof(v->'revisionRounds') is distinct from 'number' or (v->>'revisionRounds')::numeric not between 0 and 3 or (v->>'revisionRounds')::numeric<>trunc((v->>'revisionRounds')::numeric)
   then raise exception 'VALIDATION_FAILED: budget or schedule';end if;
   perform private.validate_rights_request(v->'rightsRequest');
   perform private.validate_catalog_array(array(select jsonb_array_elements_text(v->'outcomes')),'outcome',true);
   perform private.validate_catalog_array(array(select jsonb_array_elements_text(v->'styles')),'style');
   perform private.validate_catalog_array(array(select jsonb_array_elements_text(v->'preferredWorkflows')),'workflow');
   perform private.validate_catalog_array(array(select jsonb_array_elements_text(v->'requiredSkills')),'skill');
   perform private.validate_catalog_array(array(select jsonb_array_elements_text(v->'requiredTools')),'tool');
   perform private.validate_catalog_array(array(select jsonb_array_elements_text(v->'requiredModels')),'model');
   perform private.validate_catalog_array(array(select jsonb_array_elements_text(v->'languages')),'language',true);
   if exists(select 1 from jsonb_array_elements_text(v->'referenceLinks') u where u !~ '^https://') then raise exception 'VALIDATION_FAILED: reference links';end if;
 end if;
end; $$;
create function private.compile_requirements(v jsonb) returns jsonb language plpgsql immutable security invoker set search_path='' as $$
declare o jsonb;requirements jsonb:='[]';prefix text;
begin
 for o in select value from jsonb_array_elements(v->'outputs') loop
   prefix:=o->>'id';
   requirements:=requirements||jsonb_build_array(
     jsonb_build_object('id',prefix||':quantity','outputId',prefix,'kind','quantity','expected',o->'quantity','mode','file_check','required',true),
     jsonb_build_object('id',prefix||':format','outputId',prefix,'kind','format','expected',jsonb_build_object('format',o->'format','maxBytes',o->'maxBytes'),'mode','file_check','required',true));
   if o ? 'widthPx' then requirements:=requirements||jsonb_build_array(jsonb_build_object('id',prefix||':dimensions','outputId',prefix,'kind','dimensions','expected',jsonb_build_object('widthPx',o->'widthPx','heightPx',o->'heightPx'),'mode',case when o->>'kind'='image' then 'file_check' else 'brand_review' end,'required',true));end if;
   if o ? 'durationSec' then requirements:=requirements||jsonb_build_array(jsonb_build_object('id',prefix||':duration','outputId',prefix,'kind','duration','expected',o->'durationSec','mode','brand_review','required',true));end if;
   requirements:=requirements||jsonb_build_array(jsonb_build_object('id',prefix||':content','outputId',prefix,'kind','content','expected',jsonb_build_object('instructions',o->'contentRequirements','mustInclude',v->'mustInclude','mustAvoid',v->'mustAvoid'),'mode','brand_review','required',true));
 end loop;
 return requirements||jsonb_build_array(jsonb_build_object('id','brief:rights','kind','rights','expected',v->'rightsRequest','mode','declaration_review','required',true));
end; $$;
revoke all on function private.validate_rights_request(jsonb),private.validate_brief(jsonb,boolean),private.compile_requirements(jsonb) from public,anon;
grant execute on function private.validate_rights_request(jsonb),private.validate_brief(jsonb,boolean),private.compile_requirements(jsonb) to authenticated;

create function private.guard_brief() returns trigger language plpgsql security invoker set search_path='' as $$
declare op text:=current_setting('creation_mart.operation',true);
begin
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
create trigger brief_guard before insert or update on public.briefs for each row execute function private.guard_brief();
create policy brief_insert on public.briefs for insert to authenticated with check(brand_id=(select auth.uid()) and private.actor_role()='brand');
create policy brief_update on public.briefs for update to authenticated using(brand_id=(select auth.uid()) and private.actor_role()='brand') with check(brand_id=(select auth.uid()) and private.actor_role()='brand');
grant insert(brand_id,payload),update(payload,state) on public.briefs to authenticated;
revoke all on function private.guard_brief() from public,anon;
grant execute on function private.guard_brief() to authenticated;
create function private.owned_briefs(p_id uuid default null) returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(to_jsonb(b) order by b.updated_at desc),'[]') from public.briefs b where b.brand_id=auth.uid() and private.actor_role()='brand' and (p_id is null or b.id=p_id)
$$;
revoke all on function private.owned_briefs(uuid) from public,anon;
grant execute on function private.owned_briefs(uuid) to authenticated;
create function public.owned_briefs(p_id uuid default null) returns jsonb language sql security invoker set search_path='' as $$select private.owned_briefs(p_id)$$;
revoke all on function public.owned_briefs(uuid) from public,anon;grant execute on function public.owned_briefs(uuid) to authenticated;
create function public.create_brief(p_input jsonb,p_key uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
declare cached jsonb;id uuid;result jsonb;
begin
 if private.actor_role() is distinct from 'brand' then raise exception 'FORBIDDEN' using errcode='42501';end if;
 cached:=private.begin_action('brief_create',p_key,p_input);if cached is not null then return cached;end if;
 insert into public.briefs(brand_id,payload) values(auth.uid(),p_input) returning briefs.id into id;
 result:=jsonb_build_object('id',id,'version',1,'revision',1,'state','draft');perform private.end_action('brief_create',p_key,p_input,result);return result;
end; $$;
create function public.save_brief(p_id uuid,p_input jsonb,p_expected_version integer,p_start_revision boolean default false) returns jsonb language plpgsql security invoker set search_path='' as $$
declare result record;
begin
 if private.actor_role() is distinct from 'brand' or not exists(select 1 from public.briefs b where b.id=p_id and b.brand_id=auth.uid()) then raise exception 'NOT_FOUND';end if;
 perform set_config('creation_mart.expected_brief_version',p_expected_version::text,true);perform set_config('creation_mart.operation',case when p_start_revision then 'brief_revision' else 'brief_save' end,true);
 update public.briefs set payload=p_input,state=case when p_start_revision then 'draft' else state end where id=p_id and brand_id=auth.uid() and version=p_expected_version returning id,version,revision,state into result;
 if not found then raise exception 'VERSION_CONFLICT';end if;return jsonb_build_object('id',result.id,'version',result.version,'revision',result.revision,'state',result.state);
end; $$;
create function public.publish_brief(p_id uuid,p_expected_version integer,p_key uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
declare payload jsonb:=jsonb_build_object('id',p_id,'version',p_expected_version);cached jsonb;b record;result jsonb;
begin
 if private.actor_role() is distinct from 'brand' or not exists(select 1 from public.briefs where id=p_id and brand_id=auth.uid()) then raise exception 'NOT_FOUND';end if;
 cached:=private.begin_action('brief_publish',p_key,payload);if cached is not null then return cached;end if;
 perform set_config('creation_mart.expected_brief_version',p_expected_version::text,true);
 update public.briefs set state='published' where id=p_id and brand_id=auth.uid() and version=p_expected_version returning id,version,revision,state,requirements into b;
 if not found then raise exception 'VERSION_CONFLICT';end if;result:=jsonb_build_object('id',b.id,'version',b.version,'revision',b.revision,'state',b.state,'requirements',b.requirements);
 perform private.end_action('brief_publish',p_key,payload,result);return result;
end; $$;
revoke all on function public.create_brief(jsonb,uuid),public.save_brief(uuid,jsonb,integer,boolean),public.publish_brief(uuid,integer,uuid) from public,anon;
grant execute on function public.create_brief(jsonb,uuid),public.save_brief(uuid,jsonb,integer,boolean),public.publish_brief(uuid,integer,uuid) to authenticated;

create function private.shortlist_mutation(p_brief uuid,p_creator uuid,p_remove boolean,p_key uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare payload jsonb:=jsonb_build_object('brief',p_brief,'creator',p_creator,'remove',p_remove);cached jsonb;result jsonb;
begin
 if auth.uid() is null or private.actor_role() is distinct from 'brand' or not exists(select 1 from public.briefs where id=p_brief and brand_id=auth.uid()) then raise exception 'NOT_FOUND';end if;
 cached:=private.begin_action('shortlist',p_key,payload);if cached is not null then return cached;end if;
 if p_remove then delete from public.shortlists where brief_id=p_brief and brand_id=auth.uid() and creator_id=p_creator;
 else
   if not exists(select 1 from public.creator_profiles where user_id=p_creator and published) then raise exception 'NOT_FOUND';end if;
   insert into public.shortlists(brand_id,brief_id,creator_id) values(auth.uid(),p_brief,p_creator) on conflict(brand_id,brief_id,creator_id) do nothing;
 end if;
 result:=jsonb_build_object('creatorId',p_creator,'saved',not p_remove);perform private.end_action('shortlist',p_key,payload,result);return result;
end; $$;
revoke all on function private.shortlist_mutation(uuid,uuid,boolean,uuid) from public,anon;grant execute on function private.shortlist_mutation(uuid,uuid,boolean,uuid) to authenticated;
create function public.shortlist_mutation(p_brief uuid,p_creator uuid,p_remove boolean,p_key uuid) returns jsonb language sql security invoker set search_path='' as $$select private.shortlist_mutation(p_brief,p_creator,p_remove,p_key)$$;
revoke all on function public.shortlist_mutation(uuid,uuid,boolean,uuid) from public,anon;grant execute on function public.shortlist_mutation(uuid,uuid,boolean,uuid) to authenticated;

create or replace function private.begin_action(op text,key uuid,payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare cached public.idempotency_keys;hash text;actor uuid:=auth.uid();
begin
 if actor is null or not exists(select 1 from public.accounts where id=actor and role is not null) then raise exception 'NOT_AUTHENTICATED' using errcode='42501';end if;
 if key is null or op not in ('portfolio_create','portfolio_publish','profile_publish','asset_reserve','claim_create','brief_create','brief_publish','shortlist','application_create','application_withdraw','application_select','submission_create','revision_request','engagement_accept') then raise exception 'VALIDATION_FAILED';end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text||op||key::text,0));
 hash:=encode(extensions.digest(convert_to(payload::text,'UTF8'),'sha256'),'hex');
 select * into cached from public.idempotency_keys where actor_id=actor and operation=op and idempotency_keys.key=begin_action.key;
 if found then if cached.request_hash<>hash then raise exception 'IDEMPOTENCY_CONFLICT';end if;return cached.result_ref;end if;
 perform set_config('creation_mart.operation',op,true);return null;
end; $$;
