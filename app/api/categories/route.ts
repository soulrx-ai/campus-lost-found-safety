import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "Unable to verify user permissions." },
      { status: 403 },
    );
  }

  if (profile.role !== "ADMIN" || profile.status !== "ACTIVE") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  return null;
}

// Category names are used in public report and search forms.
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const { data: profile, error: profileError } = await supabase
      .from("profiles").select("role, status").eq("id", user.id).single();
    if (profileError || !profile || profile.status !== "ACTIVE") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
    const includeInactive = new URL(request.url).searchParams.get("includeInactive") === "true";
    if (includeInactive && profile.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    let query = supabase
      .from("item_categories")
      .select("id, name, created_at, is_active");
    if (!includeInactive) query = query.eq("is_active", true);
    const { data, error } = await query.order("name", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: "Unable to load categories. Please try again." },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { categories: data ?? [] },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to load categories." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = (await request.json()) as { name?: unknown };
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name || name.length > 80) {
      return NextResponse.json(
        { error: "Category name must contain 1 to 80 characters." },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("item_categories")
      .insert({ name })
      .select("id, name, created_at, is_active")
      .single();

    if (error?.code === "23505") {
      return NextResponse.json(
        { error: "A category with this name already exists." },
        { status: 409 },
      );
    }

    if (error || !data) {
      return NextResponse.json(
        { error: "Unable to create category." },
        { status: 500 },
      );
    }

    return NextResponse.json({ category: data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Unable to create category." },
      { status: 500 },
    );
  }
}
