-- Include the idempotent prerequisites already present in production.
create table if not exists public.item_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists item_categories_name_lower_unique
  on public.item_categories (lower(name));

alter table public.item_categories enable row level security;

-- Keep all existing choices, plus categories already saved on item reports.
insert into public.item_categories (name)
select source.name
from (
  values
    ('Electronics'),
    ('Wallet'),
    ('Bag'),
    ('Document'),
    ('Clothing'),
    ('Accessory'),
    ('Other')
) as source(name)
where not exists (
  select 1
  from public.item_categories existing
  where lower(existing.name) = lower(source.name)
);

insert into public.item_categories (name)
select distinct on (lower(trim(i.category))) trim(i.category)
from public.items i
where nullif(trim(i.category), '') is not null
  and not exists (
    select 1
    from public.item_categories existing
    where lower(existing.name) = lower(trim(i.category))
  );

create or replace function public.rename_item_category(
  p_category_id uuid,
  p_new_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  old_name text;
  clean_name text := trim(p_new_name);
begin
  if clean_name is null or clean_name = '' or length(clean_name) > 80 then
    raise exception 'Category name must contain 1 to 80 characters.';
  end if;

  select name into old_name
  from public.item_categories
  where id = p_category_id
  for update;

  if old_name is null then
    raise exception 'Category not found.';
  end if;

  -- Item reports store category names as text; keep their values consistent
  -- when an admin renames a category. Both updates run in one transaction.
  update public.items
  set category = clean_name
  where category = old_name;

  update public.item_categories
  set name = clean_name
  where id = p_category_id;
end;
$$;

revoke all on function public.rename_item_category(uuid, text)
from public, anon, authenticated;

grant execute on function public.rename_item_category(uuid, text)
to service_role;

alter table public.item_categories
  add column if not exists is_active boolean not null default true;

create or replace function public.update_item_category(
  p_category_id uuid,
  p_new_name text,
  p_is_active boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  old_name text;
  clean_name text := trim(p_new_name);
begin
  if clean_name is null or clean_name = '' or length(clean_name) > 80 then
    raise exception 'Category name must contain 1 to 80 characters.';
  end if;

  select name into old_name
  from public.item_categories
  where id = p_category_id
  for update;

  if old_name is null then
    raise exception 'Category not found.';
  end if;

  if old_name <> clean_name then
    -- Item reports store category names as text, so keep renamed values in sync.
    update public.items
    set category = clean_name
    where category = old_name;
  end if;

  update public.item_categories
  set name = clean_name,
      is_active = p_is_active
  where id = p_category_id;
end;
$$;

revoke all on function public.update_item_category(uuid, text, boolean)
from public, anon, authenticated;

grant execute on function public.update_item_category(uuid, text, boolean)
to service_role;

create table if not exists public.system_settings (
  id text primary key check (id = 'global'),
  matching_threshold integer not null default 70
    check (matching_threshold between 0 and 100),
  data_retention_days integer not null default 30
    check (data_retention_days between 1 and 3650),
  updated_at timestamptz not null default now()
);

alter table public.system_settings enable row level security;

insert into public.system_settings (
  id,
  matching_threshold,
  data_retention_days
)
values ('global', 70, 30)
on conflict (id) do nothing;
alter table public.item_categories enable row level security;
alter table public.system_settings enable row level security;

revoke all on table public.item_categories from anon;
revoke all on table public.system_settings from anon;
revoke all on table public.item_categories from authenticated;
revoke all on table public.system_settings from authenticated;

grant select on table public.item_categories to authenticated;
grant select on table public.system_settings to authenticated;

drop policy if exists "Authenticated users can view active categories" on public.item_categories;
create policy "Authenticated users can view active categories"
on public.item_categories
for select
to authenticated
using (is_active = true or public.get_my_role() = 'ADMIN');

drop policy if exists "Admins can view system settings" on public.system_settings;
create policy "Admins can view system settings"
on public.system_settings
for select
to authenticated
using (public.get_my_role() = 'ADMIN');
