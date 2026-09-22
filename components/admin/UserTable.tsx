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

const supabase = createClient();

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

export default function UserTable() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [updatingUserId, setUpdatingUserId] =
    useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    return await supabase
      .from("profiles")
      .select(
        "id, full_name, phone, role, status, created_at"
      )
      .order("created_at", { ascending: false });
  }, []);

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

  async function loadUsers() {
    const { data, error } = await fetchUsers();

    if (error) {
      setMessage(error.message);
      setUsers([]);
      return;
    }

    setUsers((data ?? []) as UserProfile[]);
  }

  async function updateRole(
    userId: string,
    role: string
  ) {
    setMessage("");
    setUpdatingUserId(userId);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", userId)
        .select("id")
        .maybeSingle();

      if (error) {
        setMessage(error.message);
        return;
      }

      if (!data) {
        setMessage(
          "User was not found or could not be updated."
        );
        return;
      }

      setMessage("User role updated successfully.");
      await loadUsers();
    } catch {
      setMessage(
        "Unable to update user role. Please try again."
      );
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function updateStatus(
    userId: string,
    status: string
  ) {
    setMessage("");
    setUpdatingUserId(userId);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({ status })
        .eq("id", userId)
        .select("id")
        .maybeSingle();

      if (error) {
        setMessage(error.message);
        return;
      }

      if (!data) {
        setMessage(
          "User was not found or could not be updated."
        );
        return;
      }

      setMessage("User status updated successfully.");
      await loadUsers();
    } catch {
      setMessage(
        "Unable to update user status. Please try again."
      );
    } finally {
      setUpdatingUserId(null);
    }
  }

  if (loading) {
    return (
      <div className="ui-card p-6">
        <p className="text-sm text-[var(--foreground-muted)]">
          Loading users...
        </p>
      </div>
    );
  }

  return (
    <div>
      {message && (
        <div
          role="status"
          className="ui-card mb-4 p-4 text-sm text-[var(--foreground)]"
        >
          {message}
        </div>
      )}

      <div className="ui-card overflow-hidden">
        <div className="border-b border-[var(--border)] bg-[var(--surface-soft)] px-5 py-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-[var(--foreground)]">
                Registered users
              </h2>

              <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                {users.length} user{users.length === 1 ? "" : "s"}
              </p>
            </div>

            <p className="text-xs text-[var(--foreground-muted)]">
              Changes are saved immediately
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] bg-[var(--surface-soft)]">
              <tr className="text-xs uppercase tracking-wide text-[var(--foreground-muted)]">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border)]">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="transition hover:bg-[var(--surface-soft)]"
                >
                  <td className="px-4 py-4">
                    <p className="font-medium text-[var(--foreground)]">
                      {user.full_name}
                    </p>

                    <p className="mt-1 max-w-48 truncate text-xs text-[var(--foreground-muted)]">
                      {user.id}
                    </p>
                  </td>

                  <td className="px-4 py-4 text-[var(--foreground-muted)]">
                    {user.phone ?? "-"}
                  </td>

                  <td className="px-4 py-4">
                    <select
                      aria-label={`Role for ${user.full_name}`}
                      value={user.role}
                      disabled={updatingUserId === user.id}
                      onChange={(event) =>
                        updateRole(
                          user.id,
                          event.target.value
                        )
                      }
                      className="ui-input min-h-9 min-w-28 py-1.5 text-sm disabled:opacity-50"
                    >
                      <option value="USER">USER</option>
                      <option value="STAFF">STAFF</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>

                  <td className="px-4 py-4">
                    <select
                      aria-label={`Status for ${user.full_name}`}
                      value={user.status}
                      disabled={updatingUserId === user.id}
                      onChange={(event) =>
                        updateStatus(
                          user.id,
                          event.target.value
                        )
                      }
                      className="ui-input min-h-9 min-w-32 py-1.5 text-sm disabled:opacity-50"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">
                        INACTIVE
                      </option>
                    </select>
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-[var(--foreground-muted)]">
                    {formatDate(user.created_at)}
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-[var(--foreground-muted)]"
                  >
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}