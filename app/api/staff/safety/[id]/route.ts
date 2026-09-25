import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ReviewStatus = "PUBLISHED" | "REJECTED";

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  let staff;
  try {
    staff = await requireStaff();
  } catch {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  try {
    const { id } = await context.params;
    const body: unknown = await request.json().catch(() => null);
    const status = body && typeof body === "object" && "status" in body ? body.status : null;

    if (!id) {
      return NextResponse.json(
        { error: "Incident ID is required." },
        { status: 400 }
      );
    }

    if (
      status !== "PUBLISHED" &&
      status !== "REJECTED"
    ) {
      return NextResponse.json(
        { error: "Invalid incident status." },
        { status: 400 }
      );
    }

    const reviewStatus: ReviewStatus = status;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("security_incidents")
      .update({
        status: reviewStatus,
        reviewed_by: staff.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("status", "PENDING_REVIEW")
      .select("id, status")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          error:
            "Incident not found or has already been reviewed.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch {
    const message = "Unable to update incident.";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}