-- Contact information is deliberately separated from publicly searchable profiles.
create table public.account_contacts (
  user_id uuid primary key references public.accounts(id) on delete cascade,
  payload jsonb not null default '{}' check (jsonb_typeof(payload)='object' and octet_length(payload::text)<=6000),
  sharing text not null default 'selected' check (sharing in ('private','selected','applicants')),
  version integer not null default 1 check(version>0),
  updated_at timestamptz not null default now()
);
alter table public.account_contacts enable row level security;
revoke all on public.account_contacts from public,anon,authenticated;
grant select on public.account_contacts to authenticated;

create function private.contact_visible(subject uuid) returns boolean
language plpgsql stable security definer set search_path='' as $$
declare actor uuid:=auth.uid();scope text;
begin
  if actor is null then return false;end if;
  if actor=subject then return true;end if;
  select sharing into scope from public.account_contacts where user_id=subject;
  if scope is null or scope='private' then return false;end if;
  if exists(select 1 from public.engagements e where
    (e.brand_id=subject and e.creator_id=actor) or (e.creator_id=subject and e.brand_id=actor)) then return true;end if;
  return scope='applicants' and exists(select 1 from public.applications a join public.briefs b on b.id=a.brief_id
    where a.state='submitted' and a.brief_revision=b.published_revision and
    ((b.brand_id=subject and a.creator_id=actor) or (a.creator_id=subject and b.brand_id=actor)));
end $$;
revoke all on function private.contact_visible(uuid) from public,anon;
grant execute on function private.contact_visible(uuid) to authenticated;
create policy contact_relationship on public.account_contacts for select to authenticated
  using (user_id=(select auth.uid()) or private.contact_visible(user_id));

create function public.save_contact(p_input jsonb,p_sharing text,p_expected_version integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();row public.account_contacts;k text;v text;
begin
  if actor is null or not exists(select 1 from public.accounts where id=actor) then raise exception 'FORBIDDEN' using errcode='42501';end if;
  if p_expected_version is null or p_expected_version<0 or p_sharing is null or p_sharing not in ('private','selected','applicants')
    or p_input is null or jsonb_typeof(p_input)<>'object' or octet_length(p_input::text)>6000 then raise exception 'VALIDATION_FAILED';end if;
  for k,v in select key,value#>>'{}' from jsonb_each(p_input) loop
    if k not in ('contactName','email','alternateEmail','phone','whatsapp','preferredChannel','website','linkedin','instagram','addressLine1','addressLine2','city','region','postalCode','country','jobTitle')
      or jsonb_typeof(p_input->k)<>'string' or length(v)>(case when k in ('website','linkedin','instagram') then 500 when k in ('addressLine1','addressLine2') then 200 when k in ('email','alternateEmail') then 254 else 120 end)
    then raise exception 'VALIDATION_FAILED: contact field';end if;
    if v<>'' and ((k in ('email','alternateEmail') and v !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
      or (k in ('phone','whatsapp') and (v !~ '^\+?[0-9 ()-]{7,40}$'))
      or (k in ('website','linkedin','instagram') and v !~ '^https://[^[:space:]]+$')
      or (k='country' and v !~ '^[A-Z]{2}$')
      or (k='preferredChannel' and v not in ('email','phone','whatsapp'))) then raise exception 'VALIDATION_FAILED: contact format';end if;
  end loop;
  perform pg_advisory_xact_lock(hashtextextended(actor::text,814));
  select * into row from public.account_contacts where user_id=actor for update;
  if coalesce(row.version,0)<>p_expected_version then raise exception 'VERSION_CONFLICT';end if;
  insert into public.account_contacts(user_id,payload,sharing,version) values(actor,p_input,p_sharing,1)
    on conflict(user_id) do update set payload=excluded.payload,sharing=excluded.sharing,version=account_contacts.version+1,updated_at=now()
    returning * into row;
  return to_jsonb(row);
end $$;
revoke all on function public.save_contact(jsonb,text,integer) from public,anon;
grant execute on function public.save_contact(jsonb,text,integer) to authenticated;

create function public.brief_customer(p_brief uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare actor uuid:=auth.uid();b public.briefs;company public.brand_profiles;c public.account_contacts;relevant boolean;
begin
  if actor is null or private.actor_role() not in ('creator','brand') then raise exception 'FORBIDDEN' using errcode='42501';end if;
  select * into b from public.briefs where id=p_brief;
  if not found then raise exception 'NOT_FOUND';end if;
  relevant:=actor=b.brand_id or (private.actor_role()='creator' and (b.state='published'
    or exists(select 1 from public.applications where brief_id=b.id and creator_id=actor and state in ('submitted','selected'))
    or exists(select 1 from public.engagements where brief_id=b.id and creator_id=actor)));
  if not relevant then raise exception 'NOT_FOUND';end if;
  select * into company from public.brand_profiles where user_id=b.brand_id;
  if not found then raise exception 'NOT_FOUND';end if;
  if private.contact_visible(b.brand_id) then select * into c from public.account_contacts where user_id=b.brand_id;end if;
  return jsonb_build_object('company',jsonb_build_object('companyName',company.company_name,'industry',company.industry,
    'audience',company.audience,'tone',company.tone,'country',company.country),'contact',c.payload,
    'contactVisible',c.user_id is not null,'contactUpdatedAt',c.updated_at);
end $$;
revoke all on function public.brief_customer(uuid) from public,anon;
grant execute on function public.brief_customer(uuid) to authenticated;

-- Suggestions are owner-private, untrusted drafts, never authorization or rights inputs.
create table public.ai_requests (
  id uuid primary key default gen_random_uuid(),owner_id uuid not null references public.accounts(id) on delete cascade,
  request_key uuid not null,kind text not null check(kind in ('brief','profile')),request_hash text not null,
  status text not null default 'pending' check(status in ('pending','succeeded','failed')),
  result jsonb,created_at timestamptz not null default now(),completed_at timestamptz,
  unique(owner_id,request_key),check(result is null or octet_length(result::text)<=24000)
);
create index ai_requests_owner_created on public.ai_requests(owner_id,created_at desc);
create index ai_requests_created on public.ai_requests(created_at);
alter table public.ai_requests enable row level security;
revoke all on public.ai_requests from public,anon,authenticated;
grant select on public.ai_requests to authenticated;
create policy ai_request_owner on public.ai_requests for select to authenticated using(owner_id=(select auth.uid()));
create function public.begin_ai_request(p_kind text,p_key uuid,p_hash text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid();row public.ai_requests;
begin
  if actor is null or (p_kind='brief' and private.actor_role() is distinct from 'brand')
    or (p_kind='profile' and private.actor_role() is distinct from 'creator') then raise exception 'FORBIDDEN' using errcode='42501';end if;
  if p_kind is null or p_kind not in ('brief','profile') or p_key is null or p_hash is null or p_hash !~ '^[a-f0-9]{64}$' then raise exception 'VALIDATION_FAILED';end if;
  perform pg_advisory_xact_lock(815);
  perform pg_advisory_xact_lock(hashtextextended(actor::text,815));
  select * into row from public.ai_requests where owner_id=actor and request_key=p_key;
  if found then
    if row.request_hash<>p_hash or row.kind<>p_kind then raise exception 'IDEMPOTENCY_CONFLICT';end if;
    return to_jsonb(row)||jsonb_build_object('claimed',false);
  end if;
  update public.ai_requests set status='failed',result=jsonb_build_object('error','Request expired. Retry with a new request.'),completed_at=now()
    where owner_id=actor and status='pending' and created_at<now()-interval '2 minutes';
  if exists(select 1 from public.ai_requests where owner_id=actor and status='pending')
    or (select count(*) from public.ai_requests where owner_id=actor and created_at>now()-interval '1 hour')>=20
    or (select count(*) from public.ai_requests where owner_id=actor and created_at>now()-interval '1 day')>=100
    or (select count(*) from public.ai_requests where created_at>now()-interval '1 day')>=1000
  then raise exception 'AI_RATE_LIMITED';end if;
  insert into public.ai_requests(owner_id,request_key,kind,request_hash) values(actor,p_key,p_kind,p_hash) returning * into row;
  return to_jsonb(row)||jsonb_build_object('claimed',true);
end $$;
create function public.finish_ai_request(p_id uuid,p_result jsonb,p_success boolean) returns jsonb
language plpgsql security definer set search_path='' as $$
declare row public.ai_requests;
begin
  if auth.uid() is null then raise exception 'FORBIDDEN' using errcode='42501';end if;
  if p_result is null or jsonb_typeof(p_result)<>'object' or octet_length(p_result::text)>24000 or p_success is null then raise exception 'VALIDATION_FAILED';end if;
  select * into row from public.ai_requests where id=p_id and owner_id=auth.uid() for update;
  if not found then raise exception 'NOT_FOUND';end if;
  if row.status<>'pending' then raise exception 'INVALID_TRANSITION';end if;
  update public.ai_requests set result=p_result,status=case when p_success then 'succeeded' else 'failed' end,completed_at=now()
    where id=p_id returning * into row;
  return to_jsonb(row);
end $$;
revoke all on function public.begin_ai_request(text,uuid,text),public.finish_ai_request(uuid,jsonb,boolean) from public,anon;
grant execute on function public.begin_ai_request(text,uuid,text),public.finish_ai_request(uuid,jsonb,boolean) to authenticated;
