"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type UserProfile = {
  id: string;
  full_name: string;
  phone: string | null;
  role: string;
  status: string;
  created_at: string;
};

// สร้าง Supabase client ครั้งเดียว
const supabase = createClient();

export default function UserTable() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // ดึงข้อมูลจาก Supabase โดยไม่แก้ state
  const fetchUsers = useCallback(async () => {
    return await supabase
      .from("profiles")
      .select("id, full_name, phone, role, status, created_at")
      .order("created_at", { ascending: false });
  }, []);

  // โหลดข้อมูลครั้งแรกเมื่อเปิดหน้า
  useEffect(() => {
    let cancelled = false;

    async function loadInitialUsers() {
      const { data, error } = await fetchUsers();

      if (cancelled) return;

      if (error) {
        setMessage(error.message);
        setUsers([]);
      } else {
        setUsers((data ?? []) as UserProfile[]);
      }

      setLoading(false);
    }

    void loadInitialUsers();

    return () => {
      cancelled = true;
    };
  }, [fetchUsers]);

  // โหลดข้อมูลใหม่หลังจากแก้ไข Role หรือ Status
  async function loadUsers() {
    const { data, error } = await fetchUsers();

    if (error) {
      setMessage(error.message);
      setUsers([]);
      return;
    }

    setUsers((data ?? []) as UserProfile[]);
  }

  // เปลี่ยน Role
  async function updateRole(userId: string, role: string) {
    setMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", userId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("User role updated successfully.");
    await loadUsers();
  }

  // เปลี่ยน Status
  async function updateStatus(userId: string, status: string) {
    setMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({ status })
      .eq("id", userId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("User status updated successfully.");
    await loadUsers();
  }

  if (loading) {
    return <p>Loading users...</p>;
  }

  return (
    <div>
      {message && (
        <div className="mb-4 rounded-lg bg-white p-4 text-sm">
          {message}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-stone-100">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Phone</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
              <th className="p-4">Created</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b last:border-b-0"
              >
                <td className="p-4">{user.full_name}</td>

                <td className="p-4">
                  {user.phone ?? "-"}
                </td>

                <td className="p-4">
                  <select
                    value={user.role}
                    onChange={(e) =>
                      updateRole(user.id, e.target.value)
                    }
                    className="rounded-lg border px-2 py-1"
                  >
                    <option value="USER">USER</option>
                    <option value="STAFF">STAFF</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </td>

                <td className="p-4">
                  <select
                    value={user.status}
                    onChange={(e) =>
                      updateStatus(user.id, e.target.value)
                    }
                    className="rounded-lg border px-2 py-1"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </td>

                <td className="p-4">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}