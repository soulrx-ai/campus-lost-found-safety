import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireStaff();
  } catch {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || !("status" in body) ||
        (body.status !== "IN_PROGRESS" && body.status !== "RESOLVED")) {
      return NextResponse.json({ error: "Invalid ticket status." }, { status: 400 });
    }
    const note = "staff_note" in body && typeof body.staff_note === "string" ? body.staff_note.trim() : "";
    if (body.status === "RESOLVED" && !note) {
      return NextResponse.json({ error: "A Staff Note is required before resolving a ticket." }, { status: 400 });
    }

    const supabase = await createClient();
    // The RPC verifies active STAFF internally and commits the note and notification together.
    const { data, error } = await supabase.rpc("update_staff_ticket", {
      p_ticket_id: id, p_status: body.status, p_staff_note: note || null,
    });
    if (error) return NextResponse.json({ error: "Unable to update ticket. Please try again." }, { status: 500 });
    if (!data) return NextResponse.json({ error: "This ticket has already been updated. Refresh the page and try again." }, { status: 409 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unable to update ticket. Please try again." }, { status: 500 });
  }
}
