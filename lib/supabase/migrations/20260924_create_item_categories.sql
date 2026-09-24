create table if not exists public.item_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
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
select distinct trim(i.category)
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
