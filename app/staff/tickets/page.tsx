import TicketManagementCard from "@/components/staff/TicketManagementCard";
import { requireStaff } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { ComponentProps } from "react"; // <-- 1. เพิ่มบรรทัดนี้

// 2. ลบ type ยาวๆ ทิ้ง แล้วใช้คำสั่งนี้เพื่อดึง Type มาจากการ์ดโดยตรง (รับรองตรงเป๊ะ 100%)
type Ticket = ComponentProps<typeof TicketManagementCard>["ticket"];

export default async function StaffTicketsPage() {
  const staff = await requireStaff();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("service_tickets")
    // (แถม) ผมแนะนำให้เพิ่ม updated_at เข้าไปใน select ด้วย เผื่อในการ์ดมีการแสดงเวลาอัปเดตครับ
    .select(
      "id, requester_id, claim_id, ticket_type, subject, description, status, assigned_to, created_at, updated_at"
    )
    .in("status", ["OPEN", "IN_PROGRESS", "RESOLVED"])
    .order("created_at", {
      ascending: false,
    });

  // 3. แปลงร่างข้อมูลให้เป็น Ticket[] ตามที่ดึงมา
  const tickets = (data ?? []) as Ticket[];

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-sm font-medium text-stone-500">
            Staff Operations
          </p>

          <h1 className="mt-1 text-3xl font-bold text-stone-900">
            Service Tickets
          </h1>

          <p className="mt-2 text-stone-600">
            Process service requests submitted by users.
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            Unable to load tickets: {error.message}
          </div>
        ) : tickets.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-white p-6">
            <h2 className="font-semibold text-stone-900">
              No service tickets
            </h2>

            <p className="mt-2 text-sm text-stone-600">
              There are currently no service tickets to process.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <TicketManagementCard
                key={ticket.id}
                ticket={ticket} // <-- เส้นแดงน่าจะหายไปทันทีครับ
                staffId={staff.id}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}