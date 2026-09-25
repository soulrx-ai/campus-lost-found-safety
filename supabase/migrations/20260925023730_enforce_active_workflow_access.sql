-- Repository-only hardening. Apply after the existing workflow migration.
-- Restrictive policies AND with existing ownership/role policies (never grant access).
do $$
declare target text;
begin
  foreach target in array array['items','claims','security_incidents','service_tickets',
    'notifications','activity_logs','item_categories','system_settings'] loop
    execute format('drop policy if exists active_account_required on public.%I', target);
    execute format('create policy active_account_required on public.%I as restrictive for all to authenticated using (public.get_my_role() is not null) with check (public.get_my_role() is not null)', target);
  end loop;
end $$;

drop policy if exists active_account_required on storage.objects;
create policy active_account_required on storage.objects as restrictive
for all to authenticated using (public.get_my_role() is not null)
with check (public.get_my_role() is not null);

-- Evidence previews belong to Staff review; ordinary claim pages are text-only.
drop policy if exists "Users can view own claim evidence" on storage.objects;
drop policy if exists "Users can view own handover photos" on storage.objects;

-- Login must still be able to read its own inactive profile. Writes cannot.
drop policy if exists active_profile_updates on public.profiles;
create policy active_profile_updates on public.profiles as restrictive
for update to authenticated using (public.get_my_role() is not null)
with check (public.get_my_role() is not null);

drop policy if exists "Users can create their own items" on public.items;
create policy "Users can create their own items" on public.items for insert to authenticated
with check (auth.uid() = reporter_id and status = 'PENDING_REVIEW');
drop policy if exists "Staff can manage items" on public.items;
drop policy if exists "Staff can view items" on public.items;
create policy "Staff can view items" on public.items for select to authenticated using (public.get_my_role() = 'STAFF');
drop policy if exists "Staff can review pending items" on public.items;
create policy "Staff can review pending items" on public.items for update to authenticated
using (public.get_my_role() = 'STAFF' and status = 'PENDING_REVIEW')
with check (public.get_my_role() = 'STAFF' and status in ('PUBLISHED','REJECTED') and reviewed_by = auth.uid());

drop policy if exists "Users can create their own safety incidents" on public.security_incidents;
create policy "Users can create their own safety incidents" on public.security_incidents for insert to authenticated
with check (auth.uid() = reporter_id and status = 'PENDING_REVIEW');

-- Claims and ticket state changes must use their atomic, role-checked RPCs.
drop policy if exists "Staff can manage claims" on public.claims;
drop policy if exists "Staff can view claims" on public.claims;
create policy "Staff can view claims" on public.claims for select to authenticated using (public.get_my_role() = 'STAFF');
drop policy if exists "Users can create their own claims" on public.claims;
create policy "Users can create their own claims" on public.claims for insert to authenticated
with check (auth.uid() = claimant_id and status = 'PENDING_REVIEW' and exists
  (select 1 from public.items i where i.id = item_id and i.status = 'PUBLISHED' and i.report_type = 'FOUND'));
drop policy if exists "Staff can manage service tickets" on public.service_tickets;
drop policy if exists "Staff can view service tickets" on public.service_tickets;
create policy "Staff can view service tickets" on public.service_tickets for select to authenticated using (public.get_my_role() = 'STAFF');
drop policy if exists "Users can create their own service tickets" on public.service_tickets;
create policy "Users can create their own service tickets" on public.service_tickets for insert to authenticated
with check (auth.uid() = requester_id and status = 'OPEN' and assigned_to is null and resolved_at is null
  and (claim_id is null or exists (select 1 from public.claims c where c.id = claim_id and c.claimant_id = auth.uid())));

create or replace function public.update_staff_ticket(p_ticket_id uuid, p_status text, p_staff_note text default null)
returns boolean language plpgsql security definer set search_path = public as $$
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
    values(ticket.requester_id,'Service Ticket Resolved: ' || ticket.subject,clean_note,'INFO',false);
  end if;
  return true;
end $$;
revoke all on function public.update_staff_ticket(uuid,text,text) from public, anon;
grant execute on function public.update_staff_ticket(uuid,text,text) to authenticated;

create or replace function public.review_claim(p_claim_id uuid,p_new_status text,p_staff_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare item_id_value uuid; item_status text;
begin
  if auth.uid() is null or public.get_my_role() is distinct from 'STAFF' then raise exception 'Active Staff access required'; end if;
  if p_new_status is null or p_new_status not in ('APPROVED','REJECTED') then raise exception 'Invalid claim status'; end if;
  select c.item_id into item_id_value from public.claims c where c.id=p_claim_id and c.status='PENDING_REVIEW' for update;
  if not found then raise exception 'Claim is not available for review'; end if;
  if p_new_status='APPROVED' then
    select status into item_status from public.items where id=item_id_value for update;
    if item_status is distinct from 'PUBLISHED' then raise exception 'Item is no longer available for claiming'; end if;
    update public.items set status='CLAIMED' where id=item_id_value;
  end if;
  update public.claims set status=p_new_status,reviewed_by=auth.uid(),reviewed_at=now(),
    staff_note=nullif(regexp_replace(p_staff_note,'^[[:space:]]+|[[:space:]]+$','','g'),'') where id=p_claim_id;
end $$;

create or replace function public.complete_claim_handover(p_claim_id uuid,p_handover_photo_url text)
returns void language plpgsql security definer set search_path = public as $$
declare item_id_value uuid; item_status text;
begin
  if auth.uid() is null or public.get_my_role() is distinct from 'STAFF' then raise exception 'Active Staff access required'; end if;
  if p_handover_photo_url is null or not exists (select 1 from storage.objects
    where bucket_id='handover' and name=p_handover_photo_url
      and name like auth.uid()::text || '/' || p_claim_id::text || '/%') then raise exception 'Handover photo is required'; end if;
  select c.item_id into item_id_value from public.claims c where c.id=p_claim_id and c.status='APPROVED' for update;
  if not found then raise exception 'Approved claim not found'; end if;
  select status into item_status from public.items where id=item_id_value for update;
  if item_status is distinct from 'CLAIMED' then raise exception 'Item is not in CLAIMED status'; end if;
  update public.claims set status='COMPLETED',handover_photo_url=p_handover_photo_url,
    handover_at=now(),handover_confirmed_by=auth.uid() where id=p_claim_id;
  update public.items set status='RETURNED' where id=item_id_value;
end $$;
revoke all on function public.review_claim(uuid,text,text),public.complete_claim_handover(uuid,text) from public,anon;
grant execute on function public.review_claim(uuid,text,text),public.complete_claim_handover(uuid,text) to authenticated,service_role;

create or replace function public.update_my_profile(p_full_name text,p_phone text)
returns public.profiles language plpgsql security definer set search_path=public as $$
declare result public.profiles; clean_name text := btrim(coalesce(p_full_name,'')); clean_phone text := nullif(btrim(coalesce(p_phone,'')),'');
begin
  if auth.uid() is null or public.get_my_role() is null then raise exception 'Active account required'; end if;
  if clean_name='' or length(clean_name)>100 then raise exception 'Full name must contain 1 to 100 characters'; end if;
  if length(clean_phone)>30 then raise exception 'Phone number is too long'; end if;
  update public.profiles set full_name=clean_name,phone=clean_phone where id=auth.uid() and status='ACTIVE' returning * into result;
  if not found then raise exception 'Active profile not found'; end if;
  return result;
end $$;
revoke all on function public.update_my_profile(text,text) from public,anon;
grant execute on function public.update_my_profile(text,text) to authenticated;

-- Serialize eligibility with item changes; a failed final delete must roll back claim unlinking.
create or replace function public.delete_expired_returned_item(p_item_id text,p_cutoff timestamptz)
returns boolean language plpgsql security definer set search_path=public as $$
declare item_id_value uuid;
begin
  select id into item_id_value from public.items where id::text=p_item_id and status='RETURNED' for update;
  if not found then return false; end if;
  perform 1 from public.claims where item_id=item_id_value for update;
  if not exists (select 1 from public.claims where item_id=item_id_value and status='COMPLETED' and handover_at<=p_cutoff) then return false; end if;
  update public.service_tickets set claim_id=null,updated_at=now() where claim_id in (select id from public.claims where item_id=item_id_value);
  delete from public.claims where item_id=item_id_value;
  delete from public.items where id=item_id_value and status='RETURNED';
  if not found then raise exception 'Returned item deletion failed'; end if;
  return true;
end $$;
revoke all on function public.delete_expired_returned_item(text,timestamptz) from public,anon,authenticated;
grant execute on function public.delete_expired_returned_item(text,timestamptz) to service_role;

-- Category uniqueness is case-insensitive; update legacy item spellings consistently.
create or replace function public.update_item_category(p_category_id uuid,p_new_name text,p_is_active boolean)
returns void language plpgsql security definer set search_path=public as $$
declare old_name text; clean_name text := btrim(p_new_name);
begin
  if clean_name is null or clean_name='' or length(clean_name)>80 or p_is_active is null then raise exception 'Invalid category'; end if;
  select name into old_name from public.item_categories where id=p_category_id for update;
  if not found then raise exception 'Category not found'; end if;
  update public.items set category=clean_name where lower(btrim(category))=lower(btrim(old_name));
  update public.item_categories set name=clean_name,is_active=p_is_active where id=p_category_id;
end $$;
create or replace function public.rename_item_category(p_category_id uuid,p_new_name text)
returns void language plpgsql security definer set search_path=public as $$
declare active_value boolean;
begin
  select is_active into active_value from public.item_categories where id=p_category_id for update;
  if not found then raise exception 'Category not found'; end if;
  perform public.update_item_category(p_category_id,p_new_name,active_value);
end $$;
revoke all on function public.update_item_category(uuid,text,boolean),public.rename_item_category(uuid,text) from public,anon,authenticated;
grant execute on function public.update_item_category(uuid,text,boolean),public.rename_item_category(uuid,text) to service_role;
