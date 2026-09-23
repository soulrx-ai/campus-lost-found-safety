"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ActivityLog = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: unknown;
  created_at: string;
};

type Profile = {
  id: string;
  full_name: string | null;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

const supabase = createClient();

export default function ActivityLogTable() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [profiles, setProfiles] = useState<
    Record<string, Profile>
  >({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadLogs() {
      const { data, error } = await supabase
        .from("activity_logs")
        .select(
          "id, actor_id, action, entity_type, entity_id, details, created_at"
        )
        .order("created_at", {
          ascending: false,
        })
        .limit(100);

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      const activityLogs =
        (data ?? []) as ActivityLog[];

      setLogs(activityLogs);

      const actorIds = [
        ...new Set(
          activityLogs
            .map((log) => log.actor_id)
            .filter(
              (id): id is string =>
                Boolean(id)
            )
        ),
      ];

      if (actorIds.length > 0) {
        const {
          data: profileData,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", actorIds);

        if (profileError) {
          setMessage(profileError.message);
        } else {
          const profileMap: Record<
            string,
            Profile
          > = {};

          for (const profile of
            (profileData ?? []) as Profile[]) {
            profileMap[profile.id] = profile;
          }

          setProfiles(profileMap);
        }
      }

      setLoading(false);
    }

    loadLogs();
  }, []);

  if (loading) {
    return (
      <div className="ui-card p-6">
        <p className="text-sm text-[var(--foreground-muted)]">
          Loading activity logs...
        </p>
      </div>
    );
  }

  return (
    <div>
      {message && (
        <div
          role="alert"
          className="ui-card mb-4 p-4 text-sm text-[var(--foreground)]"
        >
          {message}
        </div>
      )}

      <div className="ui-card overflow-hidden">
        <div className="border-b border-[var(--border)] bg-[var(--surface-soft)] px-5 py-4">
          <h2 className="font-semibold text-[var(--foreground)]">
            Recent activity
          </h2>

          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            Showing up to 100 most recent records.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[800px] w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] bg-[var(--surface-soft)]">
              <tr className="text-xs uppercase tracking-wide text-[var(--foreground-muted)]">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">
                  Entity Type
                </th>
                <th className="px-4 py-3 font-medium">
                  Entity ID
                </th>
                <th className="px-4 py-3 font-medium">Time</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--border)]">
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="transition hover:bg-[var(--surface-soft)]"
                >
                  <td className="px-4 py-4 font-medium text-[var(--foreground)]">
                    {log.actor_id
                      ? profiles[log.actor_id]
                          ?.full_name ||
                        "Unknown User"
                      : "System"}
                  </td>

                  <td className="px-4 py-4 text-[var(--foreground)]">
                    {log.action}
                  </td>

                  <td className="px-4 py-4 text-[var(--foreground-muted)]">
                    {log.entity_type}
                  </td>

                  <td className="px-4 py-4 font-mono text-xs text-[var(--foreground-muted)]">
                    {log.entity_id
                      ? log.entity_id.slice(0, 8)
                      : "-"}
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-[var(--foreground-muted)]">
                    {formatDateTime(log.created_at)}
                  </td>
                </tr>
              ))}

              {logs.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-[var(--foreground-muted)]"
                  >
                    No activity logs found.
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