DROP FUNCTION IF EXISTS match_items(vector,double precision,integer);

CREATE OR REPLACE FUNCTION match_items(
  query_embedding vector(384),
  match_threshold float default 0.5,
  match_count int default 20
)
RETURNS TABLE (
  id uuid,
  name text,
  category text,
  description text,
  color text,
  brand text,
  location text,
  report_type text,
  status text,
  image_url text,
  date_time timestamptz,
  similarity float
)
LANGUAGE sql STABLE
SECURITY DEFINER
AS $$
  SELECT
    items.id,
    items.name,
    items.category,
    items.description,
    items.color,
    items.brand,
    items.location,
    items.report_type,
    items.status,
    items.image_url,
    items.date_time,
    1 - (items.embedding <=> query_embedding) as similarity
  FROM items
  WHERE
    items.embedding IS NOT NULL
    AND items.status = 'PUBLISHED'
    AND 1 - (items.embedding <=> query_embedding) > match_threshold
  ORDER BY items.embedding <=> query_embedding
  LIMIT match_count;
$$;

GRANT EXECUTE ON FUNCTION match_items(vector, double precision, integer) TO anon, authenticated, service_role;