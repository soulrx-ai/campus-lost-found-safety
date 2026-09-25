import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cqdpfhptvyeskgkhziou.supabase.co/";
const SUPABASE_KEY = "sb_publishable_xMQGa9c6280faQKHx4_u3A_94FfjyPG";
const EMBEDDING_URL = `${SUPABASE_URL}functions/v1/generate-embedding`;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function buildItemText(item: Record<string, string | null>): string {
  return [item.name, item.category, item.description, item.color, item.brand, item.location]
    .filter(Boolean)
    .join(", ");
}

async function generateEmbedding(text: string): Promise<number[]> {
  const res = await fetch(EMBEDDING_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SUPABASE_KEY}` },
    body: JSON.stringify({ text, prefix: "passage" }),
  });
  if (!res.ok) throw new Error(await res.text());
  const { embedding } = await res.json();
  return embedding;
}

async function backfill() {
  console.log("ดึง items ที่ไม่มี embedding...");
  const { data: items, error } = await supabase
    .from("items")
    .select("id, name, category, description, color, brand, location")
    .is("embedding", null);
  if (error) { console.error("error:", error.message); process.exit(1); }
  console.log(`พบ ${items.length} items`);
  let ok = 0, fail = 0;
  for (const item of items) {
    try {
      const text = buildItemText(item);
      if (!text.trim()) { console.log("ข้าม:", item.id); continue; }
      const embedding = await generateEmbedding(text);
      const { error: e } = await supabase.from("items").update({ embedding }).eq("id", item.id);
      if (e) throw e;
      ok++;
      console.log(`[${ok}/${items.length}] ${item.name}`);
      await new Promise(r => setTimeout(r, 200));
    } catch (e) { fail++; console.error("fail:", item.id, e); }
  }
  console.log(`เสร็จ: สำเร็จ ${ok}, ล้มเหลว ${fail}`);
}

backfill();