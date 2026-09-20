"use client";

import { useState } from "react";
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
  status: "",
};

export default function SafetyPage() {
  const supabase = createClient();

  const [filters, setFilters] =
    useState<SafetyFilterValues>(initialFilters);

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function searchIncidents() {
    setLoading(true);
    setMessage("");

    let query = supabase
      .from("security_incidents")
      .select(
        "id, title, description, location, incident_time, status"
      )
      .in("status", ["PUBLISHED", "CLOSED"])
      .order("incident_time", { ascending: false });

    if (filters.location.trim()) {
      query = query.ilike(
        "location",
        `%${filters.location.trim()}%`
      );
    }

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.date) {
      const start = new Date(
        `${filters.date}T00:00:00`
      );

      const end = new Date(
        `${filters.date}T23:59:59.999`
      );

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

  function clearFilters() {
    setFilters(initialFilters);
    setIncidents([]);
    setMessage("");
  }

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-medium text-red-600">
          Campus Safety
        </p>

        <h1 className="mt-1 text-3xl font-bold text-stone-900">
          Safety Incidents
        </h1>

        <p className="mt-2 text-stone-600">
          View published campus safety reports.
        </p>

        <div className="mt-6">
          <SafetyFilters
            filters={filters}
            onChange={setFilters}
            onSearch={searchIncidents}
            onClear={clearFilters}
            loading={loading}
          />
        </div>

        {message && (
          <div className="mt-5 rounded-lg bg-white p-4 text-sm">
            {message}
          </div>
        )}

        <div className="mt-6 space-y-4">
          {incidents.map((incident) => (
            <article
              key={incident.id}
              className="rounded-2xl border-l-4 border-red-700 bg-white p-5 shadow-sm"
            >
              <div className="flex justify-between gap-4">
                <h2 className="text-xl font-semibold">
                  {incident.title}
                </h2>

                <span className="rounded-full bg-red-50 px-3 py-1 text-xs text-red-700">
                  {incident.status}
                </span>
              </div>

              <p className="mt-3 text-stone-700">
                {incident.description}
              </p>

              <div className="mt-4 text-sm text-stone-600">
                <p>
                  <strong>Location:</strong>{" "}
                  {incident.location}
                </p>

                <p>
                  <strong>Incident time:</strong>{" "}
                  {new Date(
                    incident.incident_time
                  ).toLocaleString()}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}