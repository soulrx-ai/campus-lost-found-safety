import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  findMatchingConcept,
  getQueryVariants,
  getSynonymColors,
  getSynonymBrands,
} from "@/lib/semanticSearch";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";
  const category = searchParams.get("category")?.trim() || "";
  const color = searchParams.get("color")?.trim() || "";
  const brand = searchParams.get("brand")?.trim() || "";
  const location = searchParams.get("location")?.trim() || "";
  const reportType = searchParams.get("report_type")?.trim() || "";
  const date = searchParams.get("date")?.trim() || "";

  try {
    const supabase = await createClient();

    // 1. Fetch published items using match_items (SECURITY DEFINER allows reading published items without RLS blocking)
    const dummyVec = Array(384).fill(0.01);
    const { data: rawItems, error } = await (supabase.rpc as any)("match_items", {
      query_embedding: dummyVec,
      match_threshold: 0.0,
      match_count: 100,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let items = (rawItems ?? []) as any[];

    // 2. Multilingual Color Filter (e.g. "สีดำ" matches "black", "Black", "ดำ")
    if (color) {
      const allowedColors = getSynonymColors(color);
      items = items.filter((item) => {
        const itemColor = (item.color || "").toLowerCase().trim();
        return allowedColors.some((c) => itemColor.includes(c) || c.includes(itemColor));
      });
    }

    // 3. Multilingual Brand Filter (e.g. "แอปเปิ้ล" matches "Apple", "apple", "Apply")
    if (brand) {
      const allowedBrands = getSynonymBrands(brand);
      items = items.filter((item) => {
        const itemBrand = (item.brand || "").toLowerCase().trim();
        return allowedBrands.some((b) => itemBrand.includes(b) || b.includes(itemBrand));
      });
    }

    // 4. Category Filter
    if (category) {
      items = items.filter((item) => item.category === category);
    }

    // 5. Location Filter
    if (location) {
      const loc = location.toLowerCase();
      items = items.filter((item) => (item.location || "").toLowerCase().includes(loc));
    }

    // 6. Report Type Filter
    if (reportType) {
      items = items.filter((item) => item.report_type === reportType);
    }

    // 7. Date Filter
    if (date) {
      items = items.filter((item) => item.date_time?.startsWith(date));
    }

    // 8. Name / Concept / Keyword Filter (e.g. ",nv5nv" or "มือถือ" strictly matches phones and excludes wallets)
    if (q) {
      const activeConcept = findMatchingConcept(q);
      const queryVariants = getQueryVariants(q);

      items = items.filter((item) => {
        const itemText = `${item.name} ${item.brand || ""} ${item.category} ${item.description || ""}`.toLowerCase();

        if (activeConcept) {
          // Must match the concept terms strictly
          return activeConcept.terms.some((term) => itemText.includes(term.toLowerCase()));
        }

        // Otherwise check query variants (including keyboard layout conversion)
        return queryVariants.some((variant) => itemText.includes(variant));
      });
    }

    return NextResponse.json({ results: items });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}