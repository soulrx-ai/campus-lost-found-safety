import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  let staff;
  try {
    staff = await requireStaff();
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
    // Validate server configuration before making the ticket update.
    const admin = body.status === "RESOLVED" ? createAdminClient() : null;
    const { data, error } = await supabase.from("service_tickets")
      .update(body.status === "RESOLVED" ? {
        status: "RESOLVED", assigned_to: staff.id,
        staff_note: note, resolved_at: new Date().toISOString(),
      } : { status: "IN_PROGRESS", assigned_to: staff.id, resolved_at: null })
      .eq("id", id)
      .eq("status", body.status === "IN_PROGRESS" ? "OPEN" : "IN_PROGRESS")
      .select("id, requester_id, subject")
      .maybeSingle();

    if (error) return NextResponse.json({ error: "Unable to update ticket. Please try again." }, { status: 500 });
    if (!data) return NextResponse.json({ error: "This ticket has already been updated. Refresh the page and try again." }, { status: 409 });

    if (admin) {
      try {
        // Recipient and subject come from the saved ticket, never the request body.
        const { error: notificationError } = await admin.from("notifications").insert({
          user_id: data.requester_id, title: `Service Ticket Resolved: ${data.subject}`,
          message: note, type: "INFO", is_read: false,
        });
        if (notificationError) throw new Error("Notification insert failed");
      } catch {
        return NextResponse.json({ error: "Ticket resolved and Staff Note saved, but the notification could not be sent." }, { status: 502 });
      }
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unable to update ticket. Please try again." }, { status: 500 });
  }
}
