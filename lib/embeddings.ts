export async function generateItemEmbedding(item: {
    name: string;
    category?: string | null;
    brand?: string | null;
    color?: string | null;
    description?: string | null;
    location?: string | null;
}): Promise<number[] | null> {
    try {
        const meaningfulValues = [
            item.name,
            item.category,
            item.brand,
            item.color,
            item.description,
            item.location,
        ].filter((val) => Boolean(val && val.trim() !== ""));

        const text = meaningfulValues.join(", ");
        if (!text) return null;

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

        if (!supabaseUrl || !supabaseKey) return null;

        const res = await fetch(`${supabaseUrl}/functions/v1/generate-embedding`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({ text, prefix: "passage" }),
        });

        if (!res.ok) return null;
        const data = await res.json();
        return Array.isArray(data.embedding) ? data.embedding : null;
    } catch {
        return null;
    }
}