"use client";

import { DisplayValue, useLanguage } from "@/components/i18n/LanguageProvider";
import { AppMessage, Text } from "@/components/i18n/Text";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type UserProfile = {
  id: string;
  full_name: string;
  email: string | null;
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
  const { t } = useLanguage();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserProfile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteWarning, setDeleteWarning] = useState("");

  const fetchUsers = useCallback(async () => {
    const response = await fetch("/api/admin/user", {
      method: "GET",
      cache: "no-store",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error ?? "Unable to load users.");
    }

    return result.users as UserProfile[];
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialUsers() {
      try {
        const data = await fetchUsers();

        if (cancelled) return;

        setUsers(data);
      } catch (error) {
        if (cancelled) return;

        setMessage(
          error instanceof Error ? error.message : "Unable to load users.",
        );
        setUsers([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadInitialUsers();

    return () => {
      cancelled = true;
    };
  }, [fetchUsers]);

  async function loadUsers() {
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to load users.",
      );
      setUsers([]);
    }
  }

  async function updateRole(userId: string, role: string) {
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
        setMessage("User was not found or could not be updated.");
        return;
      }

      setMessage("User role updated successfully.");
      await loadUsers();
    } catch {
      setMessage("Unable to update user role. Please try again.");
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function updateStatus(userId: string, status: string) {
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
        setMessage("User was not found or could not be updated.");
        return;
      }

      setMessage("User status updated successfully.");
      await loadUsers();
    } catch {
      setMessage("Unable to update user status. Please try again.");
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function confirmDeleteUser() {
    if (!deleteUser) return;

    setDeleting(true);
    setMessage("");
    setDeleteWarning("");

    try {
      const response = await fetch(`/api/admin/user/${deleteUser.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        setDeleteUser(null);
        setDeleteConfirmed(false);
        setDeleteWarning(result.error ?? "Unable to delete this user account.");
        return;
      }

      setDeleteUser(null);
      setDeleteConfirmed(false);
      setMessage("");

      await loadUsers();
      setDeleteSuccess(true);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to delete user.",
      );
    } finally {
      setDeleting(false);
    }
  }

  function openDeleteModal(user: UserProfile) {
    setDeleteUser(user);
    setDeleteConfirmed(false);
  }

  function closeDeleteModal() {
    setDeleteUser(null);
    setDeleteConfirmed(false);
  }

  if (loading) {
    return (
      <div className="ui-card p-6">
        <p className="text-sm text-[var(--foreground-muted)]">
          <Text id="Loading users..." />
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
          <AppMessage text={message} />
        </div>
      )}

      <div className="ui-card overflow-hidden">
        <div className="border-b border-[var(--border)] bg-[var(--surface-soft)] px-5 py-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-[var(--heading)]">
                <Text id="Registered users" />
              </h2>

              <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                <Text id={users.length === 1 ? "{count} user" : "{count} users"} params={{ count: users.length }} />
              </p>
            </div>

            <p className="text-xs text-[var(--foreground-muted)]">
              <Text id="Changes are saved immediately" />
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] bg-[var(--surface-soft)]">
              <tr className="text-xs uppercase tracking-wide text-[var(--foreground-muted)]">
                <th className="px-4 py-3 font-medium"><Text id="Name" /></th>
                <th className="px-4 py-3 font-medium"><Text id="Email" /></th>
                <th className="px-4 py-3 font-medium"><Text id="Phone" /></th>
                <th className="px-4 py-3 font-medium"><Text id="Role" /></th>
                <th className="px-4 py-3 font-medium"><Text id="Created" /></th>
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
                  </td>

                  <td className="px-4 py-4">{user.email || "-"}</td>

                  <td className="px-4 py-4 text-[var(--foreground-muted)]">
                    {user.phone ?? "-"}
                  </td>

                  <td className="px-4 py-4">
                    <select
                      aria-label={t("Change role for {name}", { name: user.full_name })}
                      value={user.role}
                      disabled={updatingUserId === user.id}
                      onChange={(event) =>
                        updateRole(user.id, event.target.value)
                      }
                      className="ui-input min-h-9 min-w-28 py-1.5 text-sm disabled:opacity-50"
                    >
                      <option value="USER"><DisplayValue value="USER" /></option>
                      <option value="STAFF"><DisplayValue value="STAFF" /></option>
                      <option value="ADMIN"><DisplayValue value="ADMIN" /></option>
                    </select>
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-[var(--foreground-muted)]">
                    <div className="flex w-full items-center justify-between gap-5">
                      <span className="min-w-[110px]">
                        {formatDate(user.created_at)}
                      </span>

                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={user.status === "ACTIVE"}
                          aria-label={t(user.status === "ACTIVE" ? "Deactivate {name}" : "Activate {name}", { name: user.full_name })}
                          disabled={updatingUserId === user.id}
                          onClick={() =>
                            updateStatus(
                              user.id,
                              user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                            )
                          }
                          className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                            user.status === "ACTIVE"
                              ? "bg-green-600"
                              : "bg-gray-400"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
                              user.status === "ACTIVE"
                                ? "translate-x-5"
                                : "translate-x-0.5"
                            }`}
                          />
                        </button>

                        <button
                          type="button"
                          aria-label={t("Delete {name}", { name: user.full_name })}
                          title={t("Delete {name}", { name: user.full_name })}
                          onClick={() => openDeleteModal(user)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--danger)]/30 text-[var(--danger)] transition hover:bg-[var(--danger-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--danger)]"
                        >
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-5 w-5"
                          >
                            <path d="M3 6h18" />
                            <path d="M8 6V4h8v2" />
                            <path d="m19 6-1 14H6L5 6" />
                            <path d="M10 11v5M14 11v5" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-[var(--foreground-muted)]"
                  >
                    <Text id="No users found." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {deleteUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-user-title"
        >
          <div className="w-full max-w-md rounded-xl bg-[var(--background)] p-6 shadow-xl">
            <h2
              id="delete-user-title"
              className="text-lg font-semibold text-[var(--heading)]"
            >
              <Text id="Delete account?" />
            </h2>

            <p className="mt-2 text-sm text-[var(--foreground-muted)]">
              <Text id="Are you sure you want to delete this account?" />
            </p>

            <p className="mt-3 text-sm font-medium text-[var(--foreground)]">
              {deleteUser.full_name}
            </p>

            <div className="mt-6 flex items-center justify-between gap-4">
              <label className="flex cursor-pointer items-start gap-2 text-sm text-[var(--foreground-muted)]">
                <input
                  type="checkbox"
                  checked={deleteConfirmed}
                  onChange={(event) => setDeleteConfirmed(event.target.checked)}
                  disabled={deleting}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />

                <span><Text id="I understand that this action cannot be undone." /></span>
              </label>

              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  disabled={deleting}
                  className="ui-button-secondary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Text id="Cancel" />
                </button>

                <button
                  type="button"
                  disabled={!deleteConfirmed || deleting}
                  onClick={confirmDeleteUser}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-[var(--border-strong)] dark:disabled:text-[var(--foreground-muted)]"
                >
                  {deleting ? <Text id="Deleting..." /> : <Text id="Delete" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteSuccess && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-success-title"
        >
          <div className="w-full max-w-md rounded-xl bg-[var(--background)] p-6 text-center shadow-xl">
            <h2
              id="delete-success-title"
              className="text-lg font-semibold text-[var(--heading)]"
            >
              <Text id="Account deleted successfully" />
            </h2>

            <p className="mt-2 text-sm text-[var(--foreground-muted)]">
              <Text id="The user account has been deleted successfully." />
            </p>

            <button
              type="button"
              onClick={() => setDeleteSuccess(false)}
              className="ui-button-secondary mt-6"
            >
              <Text id="OK" />
            </button>
          </div>
        </div>
      )}

      {deleteWarning && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-warning-title"
        >
          <div className="w-full max-w-md rounded-xl bg-[var(--background)] p-6 text-center shadow-xl">
            <h2
              id="delete-warning-title"
              className="text-lg font-semibold text-[var(--heading)]"
            >
              <Text id="Cannot delete this account" />
            </h2>

            <p className="mt-2 text-sm text-[var(--foreground-muted)]">
              <AppMessage text={deleteWarning} />
            </p>

            <button
              type="button"
              onClick={() => setDeleteWarning("")}
              className="ui-button-secondary mt-6"
            >
              <Text id="OK" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
