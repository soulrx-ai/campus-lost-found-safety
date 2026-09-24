import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);

    const requestedPage = Number(searchParams.get("page") ?? "1");
    const page =
      Number.isInteger(requestedPage) && requestedPage > 0
        ? requestedPage
        : 1;

    const search = searchParams.get("search")?.trim().slice(0, 120) ?? "";
    const category = searchParams.get("category")?.trim().slice(0, 80) ?? "";
    const location = searchParams.get("location")?.trim().slice(0, 120) ?? "";
    const reportType = searchParams.get("reportType") ?? "";
    const status = searchParams.get("status")?.trim() ?? "";

    const admin = createAdminClient();
    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE - 1;

    let query = admin
      .from("items")
      .select(
        "id, reporter_id, report_type, name, category, brand, color, description, location, date_time, image_url, status, created_at",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(start, end);

    if (search) query = query.ilike("name", `%${search}%`);
    if (category) query = query.ilike("category", `%${category}%`);
    if (location) query = query.ilike("location", `%${location}%`);

    if (reportType === "LOST" || reportType === "FOUND") {
      query = query.eq("report_type", reportType);
    }

    if (status) query = query.eq("status", status);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const items = await Promise.all(
      (data ?? []).map(async (item) => {
        const { data: signedImage, error: imageError } =
          await admin.storage
            .from("lost-found")
            .createSignedUrl(item.image_url, 60 * 5);

        return {
          ...item,
          image_preview_url: imageError
            ? null
            : signedImage?.signedUrl ?? null,
        };
      })
    );

    return NextResponse.json({
      items,
      total: count ?? 0,
      page,
      pageSize: PAGE_SIZE,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to load items." },
      { status: 500 }
    );
  }
}