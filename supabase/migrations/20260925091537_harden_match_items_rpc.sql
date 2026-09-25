-- Restrict vector matching to signed-in users and pin the function search path.
-- Some test/bootstrap environments do not install pgvector or create match_items.
do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'match_items'
      and pg_get_function_identity_arguments(p.oid) =
        'query_embedding extensions.vector, match_threshold double precision, match_count integer'
  ) then
    execute 'alter function public.match_items(extensions.vector, double precision, integer)
      set search_path = public, extensions';
    execute 'revoke all on function public.match_items(extensions.vector, double precision, integer)
      from public, anon';
    execute 'grant execute on function public.match_items(extensions.vector, double precision, integer)
      to authenticated';
  end if;
end
$$;
