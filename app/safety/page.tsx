"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SafetyFilters, {
  SafetyFilterValues,
} from "@/components/safety/SafetyFilters";

type Incident = {
  id: string;
  title: string;
  description: string;
  location: string;
  incident_time: string;
  status: string;
};

const initialFilters: SafetyFilterValues = {
  location: "",
  date: "",
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

export default function SafetyPage() {
  const supabase = createClient();

  const [filters, setFilters] =
    useState<SafetyFilterValues>(initialFilters);

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function searchIncidents(activeFilters: SafetyFilterValues = filters) {
    setLoading(true);
    setMessage("");

    let query = supabase
      .from("security_incidents")
      .select(
        "id, title, description, location, incident_time, status"
      )
      .eq("status", "PUBLISHED")
      .order("incident_time", { ascending: false });

    if (activeFilters.location.trim()) {
      query = query.ilike(
        "location",
        `%${activeFilters.location.trim()}%`
      );
    }

    if (activeFilters.date) {
      const start = new Date(`${activeFilters.date}T00:00:00`);
      const end = new Date(`${activeFilters.date}T23:59:59.999`);

      query = query
        .gte("incident_time", start.toISOString())
        .lte("incident_time", end.toISOString());
    }

    const { data, error } = await query;

    setLoading(false);

    if (error) {
      setIncidents([]);
      setMessage(error.message);
      return;
    }

    const results = (data ?? []) as Incident[];

    setIncidents(results);

    if (results.length === 0) {
      setMessage("No safety incidents found.");
    }
  }

  useEffect(() => {
    searchIncidents(initialFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clearFilters() {
    setFilters(initialFilters);
    searchIncidents(initialFilters);
  }

  return (
    <main className="page-shell">
      <div className="app-container">
        <div className="mx-auto max-w-5xl">
          <header className="mb-7">
            <p className="text-sm font-semibold text-[var(--danger)]">
              Campus Safety
            </p>

            <h1 className="page-title">Safety Incidents</h1>

            <p className="page-description">
              View published campus safety reports and filter incidents by
              location or date.
            </p>
          </header>

          <SafetyFilters
            filters={filters}
            onChange={setFilters}
            onSearch={searchIncidents}
            onClear={clearFilters}
            loading={loading}
          />

          {loading && incidents.length === 0 && (
            <div className="ui-card mt-6 p-6">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border-strong)] border-t-[var(--danger)]" />
                <p className="text-sm text-[var(--foreground-muted)]">
                  Loading safety incidents...
                </p>
              </div>
            </div>
          )}

          {message && !loading && (
            <div className="ui-card mt-5 p-4 text-sm text-[var(--foreground)]">
              {message}
            </div>
          )}

          <div className="mt-6 space-y-4">
            {incidents.map((incident) => (
              <article
                key={incident.id}
                className="ui-card overflow-hidden border-l-4 border-l-[var(--danger)]"
              >
                <div className="flex flex-col gap-3 border-b border-[var(--border)] p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--danger)]">
                      Safety Incident
                    </p>

                    <h2 className="mt-1 break-words text-xl font-semibold text-[var(--foreground)]">
                      {incident.title}
                    </h2>
                  </div>

                  <span
                    className={`inline-flex w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      incident.status === "CLOSED"
                        ? "bg-[var(--surface-soft)] text-[var(--foreground-muted)]"
                        : "bg-[var(--danger-soft)] text-[var(--danger)]"
                    }`}
                  >
                    {incident.status}
                  </span>
                </div>

                <div className="space-y-5 p-5 sm:p-6">
                  <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[var(--foreground)]">
                    {incident.description}
                  </p>

                  <div className="grid gap-4 border-t border-[var(--border)] pt-5 sm:grid-cols-2">
                    <InfoField
                      label="Location"
                      value={incident.location}
                    />

                    <InfoField
                      label="Incident time"
                      value={formatDateTime(incident.incident_time)}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function InfoField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
        {label}
      </p>

      <p className="mt-1 break-words text-sm text-[var(--foreground)]">
        {value}
      </p>
    </div>
  );
}