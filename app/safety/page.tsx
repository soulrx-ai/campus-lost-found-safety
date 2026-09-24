"use client";

import { AppMessage, DisplayValue, Text, UiText } from "@/components/i18n/Text";
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
  image_url: string;
  created_at: string;
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

  const [selectedIncident, setSelectedIncident] =
    useState<Incident | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] =
    useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState("");

  async function searchIncidents(activeFilters: SafetyFilterValues = filters) {
    setLoading(true);
    setMessage("");

    let query = supabase
      .from("security_incidents")
      .select(
        "id, title, description, location, incident_time, status, image_url, created_at"
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

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeIncidentModal();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function clearFilters() {
    setFilters(initialFilters);
    searchIncidents(initialFilters);
  }

  async function openIncidentModal(incident: Incident) {
    setSelectedIncident(incident);
    setSelectedImageUrl(null);
    setImageError("");

    if (!incident.image_url) {
      setImageLoading(false);
      return;
    }

    setImageLoading(true);

    const { data, error } = await supabase.storage
      .from("safety-incidents")
      .createSignedUrl(incident.image_url, 60 * 30);

    if (error || !data?.signedUrl) {
      setSelectedImageUrl(null);
      setImageError("Unable to load incident image.");
      setImageLoading(false);
      return;
    }

    setSelectedImageUrl(data.signedUrl);
    setImageLoading(false);
  }

  function closeIncidentModal() {
    setSelectedIncident(null);
    setSelectedImageUrl(null);
    setImageError("");
    setImageLoading(false);
  }

  return (
    <main className="page-shell">
      <div className="app-container">
        <div className="mx-auto max-w-5xl">
          <header className="page-header mb-7">
            <p className="text-sm font-semibold text-[var(--danger)]">
              <Text id="Campus Safety" />
            </p>

            <h1 className="page-title">
              <Text id="Safety Incidents" />
            </h1>

            <p className="page-description">
              <Text id="View published campus safety reports and filter incidents by location or date." />
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
                  <Text id="Loading safety incidents..." />
                </p>
              </div>
            </div>
          )}

          {message && !loading && (
            <div className="ui-card mt-5 p-4 text-sm text-[var(--foreground)]">
              <AppMessage text={message} />
            </div>
          )}

          <div className="mt-6 space-y-4">
            {incidents.map((incident) => (
              <article
                key={incident.id}
                className="ui-card overflow-hidden border-l-4 border-l-[var(--danger)] transition hover:shadow-md"
              >
                <div className="flex flex-col gap-3 border-b border-[var(--border)] p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--danger)]">
                      <Text id="Safety Incident" />
                    </p>

                    <h2 className="mt-1 break-words text-xl font-semibold text-[var(--heading)]">
                      {incident.title}
                    </h2>
                  </div>

                  <span
                    className={`inline-flex w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${incident.status === "CLOSED"
                        ? "bg-[var(--surface-soft)] text-[var(--foreground-muted)]"
                        : "bg-[var(--danger-soft)] text-[var(--danger)]"
                      }`}
                  >
                    <DisplayValue value={incident.status} />
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

                  <div className="flex justify-end border-t border-[var(--border)] pt-4">
                    <button
                      type="button"
                      onClick={() => openIncidentModal(incident)}
                      className="ui-button-secondary"
                    >
                      <Text id="View Details" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      {selectedIncident && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Incident Details"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={closeIncidentModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl sm:p-7"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--danger)]">
                  <Text id="Incident Details" />
                </p>

                <h2 className="mt-1 break-words text-xl font-semibold text-[var(--heading)] sm:text-2xl">
                  {selectedIncident.title}
                </h2>

                <div className="mt-2">
                  <span className="inline-flex rounded-full bg-[var(--danger-soft)] px-3 py-1 text-xs font-semibold text-[var(--danger)]">
                    <DisplayValue value={selectedIncident.status} />
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={closeIncidentModal}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-[var(--foreground-muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-5">
              <section>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
                  <Text id="Attached Incident Image" />
                </p>

                <div className="mt-2 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]">
                  {imageLoading ? (
                    <div className="flex min-h-52 flex-col items-center justify-center gap-3 p-6">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--border-strong)] border-t-[var(--danger)]" />

                      <p className="text-sm text-[var(--foreground-muted)]">
                        <Text id="Loading image..." />
                      </p>
                    </div>
                  ) : selectedImageUrl ? (
                    <div>
                      <img
                        src={selectedImageUrl}
                        alt={selectedIncident.title}
                        className="max-h-96 w-full object-contain"
                        loading="lazy"
                      />

                      <div className="border-t border-[var(--border)] bg-[var(--surface)] p-3 text-center">
                        <a
                          href={selectedImageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-[var(--info)] hover:underline"
                        >
                          <Text id="Open Full Size" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-36 items-center justify-center p-6 text-center">
                      <p className="text-sm text-[var(--foreground-muted)]">
                        {imageError ? (
                          <AppMessage text={imageError} />
                        ) : (
                          <Text id="No image attached." />
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </section>

              <section>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
                  <Text id="Incident Description" />
                </p>

                <div className="mt-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                  <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[var(--foreground)]">
                    {selectedIncident.description}
                  </p>
                </div>
              </section>

              <div className="grid gap-4 rounded-xl border border-[var(--border)] p-4 sm:grid-cols-2">
                <InfoField
                  label="Location"
                  value={selectedIncident.location}
                />

                <InfoField
                  label="Incident time"
                  value={formatDateTime(selectedIncident.incident_time)}
                />

                <InfoField
                  label="Reported on"
                  value={formatDateTime(selectedIncident.created_at)}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end border-t border-[var(--border)] pt-4">
              <button
                type="button"
                onClick={closeIncidentModal}
                className="ui-button-secondary w-full sm:w-auto"
              >
                <Text id="Close" />
              </button>
            </div>
          </div>
        </div>
      )}
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
        <UiText text={label} />
      </p>

      <p className="mt-1 break-words text-sm text-[var(--foreground)]">
        {value}
      </p>
    </div>
  );
}