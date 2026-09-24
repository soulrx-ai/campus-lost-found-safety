import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }

  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Item ID is required." },
        { status: 400 }
      );
    }

    const body: unknown = await request.json().catch(() => null);

    if (!isRecord(body)) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    if (
      !isString(body.name) ||
      !isString(body.category) ||
      !isString(body.location) ||
      !isString(body.date_time)
    ) {
      return NextResponse.json(
        { error: "Name, category, location, and date are required." },
        { status: 400 }
      );
    }

    const name = body.name.trim();
    const category = body.category.trim();
    const location = body.location.trim();
    const date = new Date(body.date_time);

    if (
      !name ||
      !category ||
      !location ||
      Number.isNaN(date.getTime())
    ) {
      return NextResponse.json(
        { error: "Please provide valid item details." },
        { status: 400 }
      );
    }

    for (const field of ["brand", "color", "description"] as const) {
      if (body[field] !== undefined && body[field] !== null && !isString(body[field])) {
        return NextResponse.json(
          { error: `Invalid ${field} value.` },
          { status: 400 }
        );
      }
    }

    const optionalText = (value: unknown) => {
      if (!isString(value)) return null;
      return value.trim() || null;
    };

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("items")
      .update({
        name,
        category,
        location,
        brand: optionalText(body.brand),
        color: optionalText(body.color),
        description: optionalText(body.description),
        date_time: date.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(
        "id, reporter_id, report_type, name, category, brand, color, description, location, date_time, image_url, status, created_at"
      )
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Item not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ item: data });
  } catch {
    return NextResponse.json(
      { error: "Unable to update item." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }

  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Item ID is required." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: item, error: itemError } = await admin
      .from("items")
      .select("id, image_url")
      .eq("id", id)
      .maybeSingle();

    if (itemError) {
      return NextResponse.json(
        { error: itemError.message },
        { status: 500 }
      );
    }

    if (!item) {
      return NextResponse.json(
        { error: "Item not found." },
        { status: 404 }
      );
    }

    const { data: claim, error: claimError } = await admin
      .from("claims")
      .select("id")
      .eq("item_id", id)
      .limit(1)
      .maybeSingle();

    if (claimError) {
      return NextResponse.json(
        { error: claimError.message },
        { status: 500 }
      );
    }

    if (claim) {
      return NextResponse.json(
        {
          error:
            "This item cannot be deleted because it has claim records.",
        },
        { status: 409 }
      );
    }

    const { error: deleteError } = await admin
      .from("items")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    const { error: storageError } = await admin.storage
      .from("lost-found")
      .remove([item.image_url]);

    return NextResponse.json({
      success: true,
      imageCleanupWarning: storageError
        ? "The item was deleted, but its image could not be removed."
        : null,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to delete item." },
      { status: 500 }
    );
  }
}