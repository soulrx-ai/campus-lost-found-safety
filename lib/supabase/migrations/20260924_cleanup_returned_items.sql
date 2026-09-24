create or replace function public.delete_expired_returned_item(
  p_item_id text,
  p_cutoff timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  -- ตรวจซ้ำในฐานข้อมูลก่อนลบ:
  -- Item ต้อง RETURNED และต้องมี Claim ที่ส่งมอบสำเร็จก่อนวัน cutoff
  if not exists (
    select 1
    from public.items i
    where i.id::text = p_item_id
      and i.status = 'RETURNED'
      and exists (
        select 1
        from public.claims c
        where c.item_id::text = p_item_id
          and c.status = 'COMPLETED'
          and c.handover_at is not null
          and c.handover_at <= p_cutoff
      )
  ) then
    return false;
  end if;

  -- รักษา Service Ticket ไว้ แต่ถอดการเชื่อมโยง Claim ที่กำลังจะลบ
  update public.service_tickets
  set claim_id = null,
      updated_at = now()
  where claim_id::text in (
    select c.id::text
    from public.claims c
    where c.item_id::text = p_item_id
  );

  -- ลบ Claim ทั้งหมดของ Item นี้ แล้วลบ Item
  delete from public.claims
  where item_id::text = p_item_id;

  delete from public.items
  where id::text = p_item_id
    and status = 'RETURNED';

  get diagnostics deleted_count = row_count;
  return deleted_count = 1;
end;
$$;

revoke all on function public.delete_expired_returned_item(text, timestamptz)
from public, anon, authenticated;

grant execute on function public.delete_expired_returned_item(text, timestamptz)
to service_role;