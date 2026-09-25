-- Create vector matching only when pgvector and the embedding column exist.
-- The function returns public search-card fields and is callable only by signed-in users.
do $migration$
begin
  if to_regtype('extensions.vector') is not null
    and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'items'
        and column_name = 'embedding'
    )
  then
    execute 'drop function if exists public.match_items(extensions.vector, double precision, integer)';
    execute $sql$
      create function public.match_items(
        query_embedding extensions.vector(384),
        match_threshold double precision default 0.5,
        match_count integer default 20
      )
      returns table (
        id uuid,
        report_type text,
        name text,
        category text,
        brand text,
        color text,
        date_time timestamptz,
        location text,
        similarity double precision
      )
      language plpgsql
      security definer
      set search_path = public, extensions
      as $function$
      begin
        if auth.uid() is null or not exists (
          select 1
          from public.profiles
          where profiles.id = auth.uid()
            and profiles.status = 'ACTIVE'
        ) then
          raise exception 'Active account required' using errcode = '42501';
        end if;

        return query
        select
          items.id,
          items.report_type,
          items.name,
          items.category,
          items.brand,
          items.color,
          items.date_time,
          items.location,
          (1 - (items.embedding <=> query_embedding))::double precision
        from public.items
        where items.status = 'PUBLISHED'
          and items.embedding is not null
          and 1 - (items.embedding <=> query_embedding) >= match_threshold
        order by items.embedding <=> query_embedding
        limit least(greatest(match_count, 1), 50);
      end
      $function$
    $sql$;

    execute 'revoke all on function public.match_items(extensions.vector, double precision, integer)
      from public, anon, service_role';
    execute 'grant execute on function public.match_items(extensions.vector, double precision, integer)
      to authenticated';
  end if;
end
$migration$;
