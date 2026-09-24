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
