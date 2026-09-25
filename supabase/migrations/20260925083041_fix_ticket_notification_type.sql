-- Keep ticket resolution and its notification atomic while using an allowed notification type.
CREATE OR REPLACE FUNCTION public.update_staff_ticket(p_ticket_id uuid, p_status text, p_staff_note text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare ticket public.service_tickets; clean_note text := regexp_replace(p_staff_note, '^[[:space:]]+|[[:space:]]+$', '', 'g');
begin
  if auth.uid() is null or public.get_my_role() is distinct from 'STAFF' then
    raise exception 'Active Staff access required' using errcode = '42501';
  end if;
  if p_status is null or p_status not in ('IN_PROGRESS','RESOLVED') then raise exception 'Invalid ticket status'; end if;
  if p_status = 'RESOLVED' and nullif(clean_note,'') is null then raise exception 'A Staff Note is required'; end if;
  select * into ticket from public.service_tickets where id = p_ticket_id for update;
  if not found or ticket.status is distinct from (case when p_status = 'IN_PROGRESS' then 'OPEN' else 'IN_PROGRESS' end) then return false; end if;
  update public.service_tickets set status = p_status, assigned_to = auth.uid(),
    staff_note = case when p_status = 'RESOLVED' then clean_note else staff_note end,
    resolved_at = case when p_status = 'RESOLVED' then now() else null end where id = p_ticket_id;
  if p_status = 'RESOLVED' then
    insert into public.notifications(user_id,title,message,type,is_read)
    values(ticket.requester_id,'Service Ticket Resolved: ' || ticket.subject,clean_note,'SERVICE_TICKET',false);
  end if;
  return true;
end $function$;
revoke all on function public.update_staff_ticket(uuid,text,text) from public, anon;
grant execute on function public.update_staff_ticket(uuid,text,text) to authenticated;
