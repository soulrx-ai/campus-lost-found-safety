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