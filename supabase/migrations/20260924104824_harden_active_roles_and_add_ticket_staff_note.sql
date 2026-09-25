alter table public.service_tickets
  add column if not exists staff_note text;

create or replace function public.get_my_role()
returns text
language sql
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
    and status = 'ACTIVE';
$$;

revoke all on function public.get_my_role() from public, anon;
grant execute on function public.get_my_role() to authenticated, service_role;

revoke all on function public.review_claim(uuid, text, text) from public, anon;
grant execute on function public.review_claim(uuid, text, text) to authenticated, service_role;

revoke all on function public.complete_claim_handover(uuid, text) from public, anon;
grant execute on function public.complete_claim_handover(uuid, text) to authenticated, service_role;
