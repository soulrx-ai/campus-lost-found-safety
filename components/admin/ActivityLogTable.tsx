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

export default function ActivityLogTable() {
  const supabase = createClient();

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadLogs() {
      const { data, error } = await supabase
        .from("activity_logs")
        .select(
          "id, actor_id, action, entity_type, entity_id, details, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      const activityLogs = (data ?? []) as ActivityLog[];

      setLogs(activityLogs);

      const actorIds = [
        ...new Set(
          activityLogs
            .map((log) => log.actor_id)
            .filter((id): id is string => Boolean(id)),
        ),
      ];

      if (actorIds.length > 0) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", actorIds);

        if (profileError) {
          setMessage(profileError.message);
        } else {
          const profileMap: Record<string, Profile> = {};

          for (const profile of (profileData ?? []) as Profile[]) {
            profileMap[profile.id] = profile;
          }

          setProfiles(profileMap);
        }
      }

      setLoading(false);
    }

    loadLogs();
  }, [supabase]);

  if (loading) {
    return <p>Loading activity logs...</p>;
  }

  return (
    <div>
      {message && (
        <div className="mb-4 rounded-lg bg-white p-4 text-sm">{message}</div>
      )}

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-stone-100">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Action</th>
              <th className="p-4">Entity Type</th>
              <th className="p-4">Entity ID</th>
              <th className="p-4">Time</th>
            </tr>
          </thead>

          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b last:border-b-0">
                <td className="p-4">
                  {log.actor_id? profiles[log.actor_id]?.full_name || "Unknown User" : "System"}
                </td>

                <td className="p-4">{log.action}</td>

                <td className="p-4">{log.entity_type}</td>

                <td className="p-4">
                  {log.entity_id ? log.entity_id.slice(0, 8) : "-"}
                </td>

                <td className="p-4">{formatDateTime(log.created_at)}</td>
              </tr>
            ))}

            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-stone-500">
                  No activity logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
