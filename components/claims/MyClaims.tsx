"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type ClaimStatus =
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED";

type Claim = {
  id: string;
  item_id: string;
  claim_reason: string;
  status: string;
  staff_note: string | null;
  created_at: string;
  handover_at: string | null;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

function getStatusLabel(status: string) {
  switch (status as ClaimStatus) {
    case "PENDING_REVIEW":
      return "Pending Review";
    case "APPROVED":
      return "Approved";
    case "REJECTED":
      return "Rejected";
    case "COMPLETED":
      return "Completed";
    default:
      return status;
  }
}

function getStatusClasses(status: string) {
  switch (status as ClaimStatus) {
    case "PENDING_REVIEW":
      return "border-amber-200 bg-amber-50 text-amber-800";

    case "APPROVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";

    case "REJECTED":
      return "border-red-200 bg-red-50 text-red-800";

    case "COMPLETED":
      return "border-stone-300 bg-stone-100 text-stone-800";

    default:
      return "border-stone-200 bg-stone-50 text-stone-700";
  }
}

export default function MyClaims() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadClaims() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("Please login to view your claims.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("claims")
        .select(
          "id, item_id, claim_reason, status, staff_note, created_at, handover_at"
        )
        .eq("claimant_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setMessage(error.message);
      } else {
        setClaims((data ?? []) as Claim[]);
      }

      setLoading(false);
    }

    loadClaims();
  }, []);

  if (loading) {
    return (
      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-stone-600">Loading claims...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {message}
        </div>
      )}

      {!message && claims.length === 0 && (
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold text-stone-900">
            No claims yet
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            You have not submitted any ownership claims.
          </p>
        </div>
      )}

      {claims.map((claim) => (
        <article
          key={claim.id}
          className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Claim
              </p>

              <h2 className="mt-1 break-all text-lg font-semibold text-stone-900">
                #{claim.id.slice(0, 8)}
              </h2>

              <p className="mt-1 text-xs text-stone-500">
                Item ID: {claim.item_id}
              </p>
            </div>

            <span
              className={`inline-flex w-fit shrink-0 items-center rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(
                claim.status
              )}`}
            >
              {getStatusLabel(claim.status)}
            </span>
          </div>

          <div className="mt-5 border-t border-stone-100 pt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Claim reason
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-700">
              {claim.claim_reason}
            </p>
          </div>

          {claim.staff_note && (
            <div className="mt-5 rounded-2xl bg-stone-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Staff note
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-700">
                {claim.staff_note}
              </p>
            </div>
          )}

          {claim.handover_at && (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Handover completed
              </p>

              <p className="mt-1 text-sm text-emerald-900">
                {formatDateTime(claim.handover_at)}
              </p>
            </div>
          )}

          <div className="mt-5 border-t border-stone-100 pt-4">
            <p className="text-xs text-stone-500">
              Submitted {formatDateTime(claim.created_at)}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}