import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { pipeline } from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2";
import { createClient } from "npm:@supabase/supabase-js@2.116.0";

const MAX_TEXT_LENGTH = 1_000;

type EmbeddingPrefix = "query" | "passage";
type EmbeddingOutput = { data: Iterable<number> };
type EmbeddingPipeline = (
  text: string,
  options: { pooling: "mean"; normalize: boolean }
) => Promise<EmbeddingOutput>;

let embedder: EmbeddingPipeline | null = null;

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function getEmbedder(): Promise<EmbeddingPipeline> {
  if (!embedder) {
    const loaded = await pipeline(
      "feature-extraction",
      "Xenova/multilingual-e5-small"
    );
    embedder = loaded as unknown as EmbeddingPipeline;
  }
  return embedder;
}

serve(async (request) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return json({ error: "Authentication required." }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    return json({ error: "Function configuration unavailable." }, 500);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return json({ error: "Authentication required." }, 401);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError || profile?.status !== "ACTIVE") {
    return json({ error: "An active account is required." }, 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "A valid JSON body is required." }, 400);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return json({ error: "A JSON object is required." }, 400);
  }

  const { text, prefix } = body as Record<string, unknown>;
  if (typeof text !== "string" || !text.trim()) {
    return json({ error: "text must be a non-empty string." }, 400);
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return json({ error: `text must be ${MAX_TEXT_LENGTH} characters or fewer.` }, 400);
  }
  if (prefix !== "query" && prefix !== "passage") {
    return json({ error: "prefix must be query or passage." }, 400);
  }

  try {
    const model = await getEmbedder();
    const output = await model(`${prefix as EmbeddingPrefix}: ${text.trim()}`, {
      pooling: "mean",
      normalize: true,
    });
    return json({ embedding: Array.from(output.data) }, 200);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Embedding failed.";
    return json({ error: message }, 500);
  }
});
