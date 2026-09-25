import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { pipeline } from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2";

// โหลดโมเดลไว้ล่วงหน้า (จะโหลดครั้งแรกตอนเรียกใช้ แล้ว cache ไว้)
let embedder: any = null;

async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline(
      "feature-extraction",
      "Xenova/multilingual-e5-small"
    );
  }
  return embedder;
}

serve(async (req) => {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return new Response(
        JSON.stringify({ error: "กรุณาส่งข้อความในฟิลด์ 'text'" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const model = await getEmbedder();

    // e5 model ต้องการ prefix "query: " หรือ "passage: " นำหน้าข้อความ
    // "passage: " ใช้ตอนเก็บข้อมูลสินค้า, "query: " ใช้ตอนค้นหา
    const prefixedText = `passage: ${text}`;

    const output = await model(prefixedText, {
      pooling: "mean",
      normalize: true,
    });

    const embedding = Array.from(output.data);

    return new Response(
      JSON.stringify({ embedding }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});