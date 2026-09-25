-- Restrict vector matching to signed-in users and pin the function search path.
alter function public.match_items(extensions.vector, double precision, integer)
  set search_path = public, extensions;

revoke all on function public.match_items(extensions.vector, double precision, integer)
  from public, anon;

grant execute on function public.match_items(extensions.vector, double precision, integer)
  to authenticated;
