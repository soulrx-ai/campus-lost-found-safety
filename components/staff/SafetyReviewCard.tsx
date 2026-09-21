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
    <article className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-red-600">
            Safety Incident
          </p>

          <h2 className="mt-1 text-xl font-semibold text-stone-900">
            {incident.title}
          </h2>

          <p className="mt-1 text-sm text-stone-500">
            Submitted{" "}
            {formatDateTime(incident.created_at)}
          </p>
        </div>

        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
          {incident.status}
        </span>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-stone-700">
            Location
          </p>
          <p className="text-sm text-stone-600">
            {incident.location}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-stone-700">
            Incident Time
          </p>
          <p className="text-sm text-stone-600">
            {formatDateTime(incident.incident_time)}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium text-stone-700">
          Description
        </p>

        <p className="mt-1 whitespace-pre-wrap text-sm text-stone-600">
          {incident.description}
        </p>
      </div>

      <div className="mt-4">
  <p className="text-sm font-medium text-stone-700">
    Incident Image
  </p>

  {!imageUrl ? (
    <button
      type="button"
      disabled={imageLoading}
      onClick={viewIncidentImage}
      className="mt-2 rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
    >
      {imageLoading ? "Loading..." : "View Incident Image"}
    </button>
  ) : (
    <img
      src={imageUrl}
      alt="Safety incident evidence"
      className="mt-2 max-h-96 rounded-xl border border-stone-200 object-contain"
    />
  )}
</div>

      {errorMessage && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={() => reviewIncident("PUBLISHED")}
          className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
        >
          {loading ? "Processing..." : "Publish"}
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => reviewIncident("REJECTED")}
          className="rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    </article>
  );
}