-- Signed upload capabilities last two hours. Retain a one-byte object at a
-- cancelled path until expiry so a previously issued, non-upsert token cannot
-- recreate unreserved data. The service finalizer owns this operation.
alter table public.assets add column upload_blocked_until timestamptz;

create function public.record_asset_upload_blocker(p_id uuid,p_until timestamptz,p_reason text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a public.assets;allocation bigint;
begin
 select * into a from public.assets where id=p_id for update;
 if not found then raise exception 'NOT_FOUND';end if;
 if a.state<>'rejected' then raise exception 'INVALID_TRANSITION';end if;
 if p_until is null or p_until<now() or p_until>now()+interval '2 hours 3 minutes' then raise exception 'VALIDATION_FAILED';end if;
 allocation:=a.reserved_bytes;
 perform 1 from private.runtime_config where singleton for update;
 update public.assets set reserved_bytes=1,object_deleted_at=null,upload_blocked_until=p_until,
 checks=jsonb_build_object('reason',left(p_reason,160),'cancelledUploadBlocked',true)
 where id=p_id returning * into a;
 update private.runtime_config set storage_reserved_bytes=storage_reserved_bytes-allocation+1 where singleton;
 return to_jsonb(a);
end;$$;
revoke all on function public.record_asset_upload_blocker(uuid,timestamptz,text) from public,anon,authenticated;
grant execute on function public.record_asset_upload_blocker(uuid,timestamptz,text) to service_role;
