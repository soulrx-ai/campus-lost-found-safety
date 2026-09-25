import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  findMatchingConcept,
  getQueryVariants,
  getSynonymBrands,
  getSynonymColors,
} from "@/lib/semanticSearch";

const MAX_QUERY_LENGTH = 100;
const MAX_RESULTS = 50;
const MAX_CANDIDATES = 100;
const SEARCH_FIELDS =
  "id, report_type, name, category, brand, color, date_time, location";

type SearchItem = {
  id: string;
  report_type: string;
  name: string;
  category: string;
  brand: string | null;
  color: string | null;
  date_time: string;
  location: string;
};

function readParameter(searchParams: URLSearchParams, name: string) {
  const value = searchParams.get(name)?.trim() ?? "";
  if (value.length > MAX_QUERY_LENGTH) {
    throw new RangeError(`${name} must be ${MAX_QUERY_LENGTH} characters or fewer.`);
  }
  return value;
}

function toSearchItem(item: SearchItem): SearchItem {
  return {
    id: item.id,
    report_type: item.report_type,
    name: item.name,
    category: item.category,
    brand: item.brand,
    color: item.color,
    date_time: item.date_time,
    location: item.location,
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.status !== "ACTIVE") {
      return NextResponse.json({ error: "Active account required." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const q = readParameter(searchParams, "q");
    const category = readParameter(searchParams, "category");
    const color = readParameter(searchParams, "color");
    const brand = readParameter(searchParams, "brand");
    const location = readParameter(searchParams, "location");
    const reportType = readParameter(searchParams, "report_type");
    const date = readParameter(searchParams, "date");

    if (reportType && reportType !== "LOST" && reportType !== "FOUND") {
      return NextResponse.json({ error: "Invalid report type." }, { status: 400 });
    }

    let query = supabase
      .from("items")
      .select(SEARCH_FIELDS)
      .eq("status", "PUBLISHED")
      .order("date_time", { ascending: false })
      .limit(MAX_CANDIDATES);

    if (category) query = query.eq("category", category);
    if (reportType) query = query.eq("report_type", reportType);
    if (date) {
      query = query
        .gte("date_time", `${date}T00:00:00.000Z`)
        .lte("date_time", `${date}T23:59:59.999Z`);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let items = (data ?? []) as SearchItem[];

    if (color) {
      const allowedColors = getSynonymColors(color);
      items = items.filter((item) => {
        const itemColor = (item.color ?? "").toLowerCase().trim();
        return Boolean(itemColor) && allowedColors.some(
          (candidate) => itemColor.includes(candidate) || candidate.includes(itemColor)
        );
      });
    }

    if (brand) {
      const allowedBrands = getSynonymBrands(brand);
      items = items.filter((item) => {
        const itemBrand = (item.brand ?? "").toLowerCase().trim();
        return Boolean(itemBrand) && allowedBrands.some(
          (candidate) => itemBrand.includes(candidate) || candidate.includes(itemBrand)
        );
      });
    }

    if (location) {
      const normalizedLocation = location.toLowerCase();
      items = items.filter((item) =>
        item.location.toLowerCase().includes(normalizedLocation)
      );
    }

    if (q) {
      const activeConcept = findMatchingConcept(q);
      const queryVariants = getQueryVariants(q);
      items = items.filter((item) => {
        const itemText = `${item.name} ${item.brand ?? ""} ${item.category}`.toLowerCase();
        return activeConcept
          ? activeConcept.terms.some((term) => itemText.includes(term.toLowerCase()))
          : queryVariants.some((variant) => itemText.includes(variant));
      });
    }

    return NextResponse.json({
      results: items.slice(0, MAX_RESULTS).map(toSearchItem),
      searchMode: "multilingual_dictionary",
    });
  } catch (error: unknown) {
    if (error instanceof RangeError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
