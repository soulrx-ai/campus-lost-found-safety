import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    await requireStaff();
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Incident ID is required." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. Fetch incident to retrieve storage image url
    const { data: incident } = await supabase
      .from("security_incidents")
      .select("image_url")
      .eq("id", id)
      .maybeSingle();

    if (incident?.image_url) {
      await supabase.storage
        .from("safety-incidents")
        .remove([incident.image_url]);
    }

    // 2. Delete incident record
    const { error } = await supabase
      .from("security_incidents")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Unable to delete safety incident." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const staff = await requireStaff();
    const { id } = await context.params;
    const body = await request.json();
    const { status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "Incident ID and status are required." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("security_incidents")
      .update({
        status,
        reviewed_by: staff.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id, status")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Unable to update incident." },
      { status: 500 }
    );
  }
}
