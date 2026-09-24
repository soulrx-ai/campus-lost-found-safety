-- Additional hardening discovered during integration. Repository only; not applied.
-- Replace broad ALL access so direct Data API calls obey the review workflow too.
drop policy if exists "Staff can manage safety incidents" on public.security_incidents;
drop policy if exists "Staff can view safety incidents" on public.security_incidents;
create policy "Staff can view safety incidents"
on public.security_incidents for select to authenticated
using (public.get_my_role() = 'STAFF');

drop policy if exists "Staff can review pending safety incidents" on public.security_incidents;
create policy "Staff can review pending safety incidents"
on public.security_incidents for update to authenticated
using (public.get_my_role() = 'STAFF' and status = 'PENDING_REVIEW')
with check (public.get_my_role() = 'STAFF' and status in ('PUBLISHED', 'REJECTED'));

revoke delete on public.security_incidents from anon, authenticated;

-- Do not validate or rewrite historical rows. Enforce notes on new resolutions
-- and changes to resolution notes; unrelated cleanup/link updates remain valid.
create or replace function public.validate_ticket_resolution()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  clean_note text := regexp_replace(new.staff_note, '^[[:space:]]+|[[:space:]]+$', '', 'g');
begin
  if new.status = 'RESOLVED' then
    if tg_op = 'INSERT' then
      raise exception 'Tickets must be processed before resolution.';
    end if;

    if old.status is distinct from new.status then
      if old.status <> 'IN_PROGRESS' then
        raise exception 'Only in-progress tickets can be resolved.';
      end if;
      if nullif(clean_note, '') is null then
        raise exception 'A Staff Note is required before resolving a ticket.';
      end if;
      new.staff_note := clean_note;
      new.resolved_at := now();
    elsif old.staff_note is distinct from new.staff_note then
      if nullif(clean_note, '') is null then
        raise exception 'A resolved ticket must retain its Staff Note.';
      end if;
      new.staff_note := clean_note;
      new.resolved_at := old.resolved_at;
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.validate_ticket_resolution() from public, anon, authenticated;
drop trigger if exists validate_ticket_resolution on public.service_tickets;
create trigger validate_ticket_resolution
before insert or update on public.service_tickets
for each row execute function public.validate_ticket_resolution();
