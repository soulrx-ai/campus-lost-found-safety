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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await context.params;
    const body = (await request.json()) as { name?: unknown; is_active?: unknown };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const isActive = body.is_active;

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }

    if (!name || name.length > 80) {
      return NextResponse.json(
        { error: "Category name must contain 1 to 80 characters." },
        { status: 400 },
      );
    }

    if (typeof isActive !== "boolean") {
      return NextResponse.json({ error: "Category status must be Active or Inactive." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error: renameError } = await admin.rpc("update_item_category", {
      p_category_id: id,
      p_new_name: name,
      p_is_active: isActive,
    });

    if (renameError?.code === "23505") {
      return NextResponse.json(
        { error: "A category with this name already exists." },
        { status: 409 },
      );
    }

    if (renameError) {
      const status = renameError.message.includes("not found") ? 404 : 500;
      return NextResponse.json(
        { error: status === 404 ? "Category not found." : "Unable to update category." },
        { status },
      );
    }

    const { data, error } = await admin
      .from("item_categories")
      .select("id, name, created_at, is_active")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Unable to load updated category." },
        { status: 500 },
      );
    }

    return NextResponse.json({ category: data });
  } catch {
    return NextResponse.json(
      { error: "Unable to update category." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await context.params;

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("item_categories")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: "Unable to delete category." },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json({ error: "Category not found." }, { status: 404 });
    }

    // Existing items keep their category text; only the selectable category is removed.
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to delete category." },
      { status: 500 },
    );
  }
}
