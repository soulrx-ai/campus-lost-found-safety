"use client";

import { AppMessage, DisplayValue, Text, UiText } from "@/components/i18n/Text";
import { useLanguage } from "@/components/i18n/LanguageProvider";

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

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "PUBLISHED":
      return "bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success)]/20";
    case "PENDING_REVIEW":
      return "bg-[var(--warning-soft)] text-[var(--warning)] border border-[var(--warning)]/20";
    case "REJECTED":
      return "bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)]/20";
    default:
      return "bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary)]/20";
  }
}

function getBorderClass(status: string) {
  switch (status) {
    case "PUBLISHED":
      return "border-l-[var(--success)]";
    case "PENDING_REVIEW":
      return "border-l-[var(--warning)]";
    case "REJECTED":
      return "border-l-[var(--danger)]";
    default:
      return "border-l-[var(--border-strong)]";
  }
}

export default function SafetyReviewCard({
  incident,
}: Props) {
  const { t } = useLanguage();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  async function updateStatus(
    newStatus: "PUBLISHED" | "REJECTED"
  ) {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/staff/safety/${incident.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(
          result.error ?? "Unable to update incident. Please try again."
        );
        return;
      }

      router.refresh();
    } catch {
      setErrorMessage(
        "Unable to update incident. Please try again."
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
    <article
      className={`ui-card overflow-hidden border-l-4 ${getBorderClass(
        incident.status
      )}`}
    >
      <div className="flex flex-col gap-4 border-b border-[var(--border)] p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--danger)]">
            <Text id="Safety Incident" />
          </p>

          <h2 className="mt-1 break-words text-xl font-semibold text-[var(--heading)]">
            {incident.title}
          </h2>

          <p className="mt-1 text-xs text-[var(--foreground-muted)]">
            <Text id="Submitted" /> {formatDateTime(incident.created_at)}
          </p>
        </div>

        <span
          className={`inline-flex w-fit shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(
            incident.status
          )}`}
        >
          <DisplayValue value={incident.status} />
        </span>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        {/* Status Indicator Banner */}
        {incident.status === "PUBLISHED" && (
          <div className="flex items-center gap-2 rounded-xl border border-[var(--success)]/20 bg-[var(--success-soft)] px-3.5 py-2.5 text-xs font-medium text-[var(--success)]">
            <span className="h-2 w-2 rounded-full bg-[var(--success)]" />
            <Text id="Visible to users on Campus Safety page" />
          </div>
        )}

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
            <Text id="Description" />
          </p>

          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--foreground)]">
            {incident.description}
          </p>
        </div>

        <div className="border-t border-[var(--border)] pt-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">
                <Text id="Private incident image" />
              </p>

              <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                <Text id="Available to authorized Staff for incident review." />
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
                  ? <Text id="Loading..." />
                  : <Text id="View incident image" />}
              </button>
            )}
          </div>

          {imageUrl && (
            <div className="mt-4 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-2">
              {/* Private Supabase Storage signed URL. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={t("Safety incident evidence")}
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
            <AppMessage text={errorMessage} />
          </div>
        )}

        {/* Action Buttons */}
        {incident.status !== "PUBLISHED" && (
          <div className="flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:justify-end">
            {incident.status === "PENDING_REVIEW" && (
              <>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => updateStatus("REJECTED")}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--foreground-muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  <Text id="Reject" />
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => updateStatus("PUBLISHED")}
                  className="ui-button-primary ui-button-safety w-full sm:w-auto"
                >
                  {loading ? <Text id="Processing..." /> : <Text id="Publish incident" />}
                </button>
              </>
            )}

            {incident.status === "REJECTED" && (
              <button
                type="button"
                disabled={loading}
                onClick={() => updateStatus("PUBLISHED")}
                className="ui-button-primary ui-button-safety w-full sm:w-auto"
              >
                {loading ? <Text id="Processing..." /> : <Text id="Publish incident" />}
              </button>
            )}
          </div>
        )}
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
        <UiText text={label} />
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