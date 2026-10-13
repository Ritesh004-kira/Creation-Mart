create or replace function private.portfolio_changed() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if tg_op='UPDATE' and (new.preview_asset_id is distinct from old.preview_asset_id or new.workflow is distinct from old.workflow or new.human_contribution is distinct from old.human_contribution or new.rights_offer is distinct from old.rights_offer or new.model_refs is distinct from old.model_refs) then
   update public.claim_signals set stale=true
   where item_id=new.id and status in ('evidence_attached','platform_checked','independently_verified')
   and (claim_code<>'file_metadata' or asset_id is distinct from new.preview_asset_id);
 end if;
 perform private.refresh_creator_projection(new.creator_id);
 return new;
end; $$;
