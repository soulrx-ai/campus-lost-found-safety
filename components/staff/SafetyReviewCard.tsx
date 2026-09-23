"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

type SafetyIncident = {
  id: string;
  reporter_id: string;
  title: string;
  description: string;
  location: string;
  incident_time: string;
  status: string;
  created_at: string;
  image_url: string;
};

type Props = {
  incident: SafetyIncident;
  staffId: string;
};

export default function SafetyReviewCard({
  incident,
  staffId,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  async function reviewIncident(
    newStatus: "PUBLISHED" | "REJECTED"
  ) {
    setLoading(true);
    setErrorMessage("");

    try {
      const { data, error } = await supabase
        .from("security_incidents")
        .update({
          status: newStatus,
          reviewed_by: staffId,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", incident.id)
        .eq("status", "PENDING_REVIEW")
        .select("id")
        .maybeSingle();

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (!data) {
        setErrorMessage(
          "This incident has already been reviewed. Refresh the page and try again."
        );
        return;
      }

      router.refresh();
    } catch {
      setErrorMessage(
        "Unable to review incident. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function viewIncidentImage() {
    setImageLoading(true);
    setErrorMessage("");

    try {
      const { data, error } = await supabase.storage
        .from("safety-incidents")
        .createSignedUrl(incident.image_url, 60 * 5);

      if (error || !data?.signedUrl) {
        setErrorMessage(
          error?.message ?? "Unable to load incident image."
        );
        return;
      }

      setImageUrl(data.signedUrl);
    } catch {
      setErrorMessage(
        "Unable to load incident image. Please try again."
      );
    } finally {
      setImageLoading(false);
    }
  }

  return (
    <article className="ui-card overflow-hidden border-l-4 border-l-[var(--danger)]">
      <div className="flex flex-col gap-4 border-b border-[var(--border)] p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--danger)]">
            Safety Incident
          </p>

          <h2 className="mt-1 break-words text-xl font-semibold text-[var(--foreground)]">
            {incident.title}
          </h2>

          <p className="mt-1 text-xs text-[var(--foreground-muted)]">
            Submitted {formatDateTime(incident.created_at)}
          </p>
        </div>

        <span className="inline-flex w-fit shrink-0 rounded-full bg-[var(--danger-soft)] px-3 py-1 text-xs font-semibold text-[var(--danger)]">
          {incident.status.replaceAll("_", " ")}
        </span>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <InfoField label="Location" value={incident.location} />
          <InfoField
            label="Incident time"
            value={formatDateTime(incident.incident_time)}
          />
          <InfoField
            label="Reporter ID"
            value={incident.reporter_id}
            breakAll
          />
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
            Description
          </p>

          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--foreground)]">
            {incident.description}
          </p>
        </div>

        <div className="border-t border-[var(--border)] pt-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">
                Private incident image
              </p>

              <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                Available to authorized Staff for incident review.
              </p>
            </div>

            {!imageUrl && (
              <button
                type="button"
                disabled={imageLoading}
                onClick={viewIncidentImage}
                className="ui-button-secondary mt-3 w-full sm:mt-0 sm:w-auto"
              >
                {imageLoading
                  ? "Loading..."
                  : "View incident image"}
              </button>
            )}
          </div>

          {imageUrl && (
            <div className="mt-4 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-2">
              {/* Private Supabase Storage signed URL. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Safety incident evidence"
                className="mx-auto max-h-[28rem] w-full rounded-lg object-contain"
              />
            </div>
          )}
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-3 text-sm leading-6 text-[var(--danger)]"
          >
            {errorMessage}
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={loading}
            onClick={() => reviewIncident("REJECTED")}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-md)] border border-[var(--danger)]/30 bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--danger)] transition hover:bg-[var(--danger-soft)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            Reject
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => reviewIncident("PUBLISHED")}
            className="ui-button-primary w-full sm:w-auto"
          >
            {loading ? "Processing..." : "Publish incident"}
          </button>
        </div>
      </div>
    </article>
  );
}

function InfoField({
  label,
  value,
  breakAll = false,
}: {
  label: string;
  value: string;
  breakAll?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
        {label}
      </p>

      <p
        className={`mt-1 text-sm leading-6 text-[var(--foreground)] ${
          breakAll ? "break-all" : "break-words"
        }`}
      >
        {value}
      </p>
    </div>
  );
}