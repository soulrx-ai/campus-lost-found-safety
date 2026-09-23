"use client";

import { AppMessage, DisplayValue, Text } from "@/components/i18n/Text";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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

function statusClass(status: string) {
  switch (status) {
    case "APPROVED":
    case "COMPLETED":
      return "bg-[var(--success-soft)] text-[var(--success)]";

    case "REJECTED":
      return "bg-[var(--danger-soft)] text-[var(--danger)]";

    case "PENDING_REVIEW":
      return "bg-[var(--warning-soft)] text-[var(--warning)]";

    default:
      return "bg-[var(--surface-soft)] text-[var(--foreground-muted)]";
  }
}

export default function MyClaims() {
  const supabase = createClient();

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
  }, [supabase]);

  if (loading) {
    return (
      <div className="ui-card p-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border-strong)] border-t-[var(--primary)]" />

          <p className="text-sm text-[var(--foreground-muted)]">
            <Text id="Loading claims..." />
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className="ui-card p-5 text-sm text-[var(--foreground)]">
          <AppMessage text={message} />
        </div>
      )}

      {!message && claims.length === 0 && (
        <div className="ui-card p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            <Text id="No claims yet" />
          </h2>

          <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
            <Text id="You have not submitted any ownership claims." />
          </p>
        </div>
      )}

      {claims.map((claim) => (
        <article
          key={claim.id}
          className="ui-card overflow-hidden"
        >
          <div className="flex flex-col gap-3 border-b border-[var(--border)] p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
                <Text id="Claim" />
              </p>

              <h2 className="mt-1 font-semibold text-[var(--foreground)]">
                #{claim.id.slice(0, 8)}
              </h2>

              <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                <Text id="Submitted" /> {formatDateTime(claim.created_at)}
              </p>
            </div>

            <span
              className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                claim.status
              )}`}
            >
              <DisplayValue value={claim.status} />
            </span>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
                <Text id="Item ID" />
              </p>

              <p className="mt-1 break-all text-sm text-[var(--foreground)]">
                {claim.item_id}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
                <Text id="Your claim reason" />
              </p>

              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--foreground)]">
                {claim.claim_reason}
              </p>
            </div>

            {claim.staff_note && (
              <div className="rounded-xl bg-[var(--surface-soft)] p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
                  <Text id="Staff note" />
                </p>

                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--foreground)]">
                  {claim.staff_note}
                </p>
              </div>
            )}

            {claim.handover_at && (
              <div className="rounded-xl border border-[var(--success)]/20 bg-[var(--success-soft)] p-4">
                <p className="text-sm font-semibold text-[var(--success)]">
                  <Text id="Handover completed" />
                </p>

                <p className="mt-1 text-sm text-[var(--success)]">
                  {formatDateTime(claim.handover_at)}
                </p>
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}