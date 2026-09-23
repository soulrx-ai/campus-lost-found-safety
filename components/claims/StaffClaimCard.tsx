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

type ClaimStatus =
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED";

type Claim = {
  id: string;
  item_id: string;
  claimant_id: string;
  claim_reason: string;
  evidence: string | null;
  status: ClaimStatus;
  staff_note: string | null;
  created_at: string;
};

type Props = {
  claim: Claim;
  staffId: string;
};

function statusClass(status: ClaimStatus) {
  switch (status) {
    case "PENDING_REVIEW":
      return "bg-[var(--warning-soft)] text-[var(--warning)]";

    case "APPROVED":
    case "COMPLETED":
      return "bg-[var(--success-soft)] text-[var(--success)]";

    case "REJECTED":
      return "bg-[var(--danger-soft)] text-[var(--danger)]";
  }
}

export default function StaffClaimCard({
  claim,
}: Props) {
  const { t } = useLanguage();
  const router = useRouter();
  const supabase = createClient();

  const [staffNote, setStaffNote] = useState(
    claim.staff_note ?? ""
  );

  const [handoverPhoto, setHandoverPhoto] =
    useState<File | null>(null);

  const [evidenceUrl, setEvidenceUrl] =
    useState<string | null>(null);

  const [evidenceLoading, setEvidenceLoading] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  async function viewEvidence() {
    if (!claim.evidence) {
      return;
    }

    setEvidenceLoading(true);
    setErrorMessage("");

    try {
      const { data, error } = await supabase.storage
        .from("claim-evidence")
        .createSignedUrl(claim.evidence, 60 * 5);

      if (error || !data?.signedUrl) {
        setErrorMessage(
          error?.message ?? "Unable to load claim evidence."
        );
        return;
      }

      setEvidenceUrl(data.signedUrl);
    } catch {
      setErrorMessage(
        "Unable to load claim evidence. Please try again."
      );
    } finally {
      setEvidenceLoading(false);
    }
  }

  async function reviewClaim(
    newStatus: "APPROVED" | "REJECTED"
  ) {
    setLoading(true);
    setErrorMessage("");

    try {
      const { error } = await supabase.rpc(
        "review_claim",
        {
          p_claim_id: claim.id,
          p_new_status: newStatus,
          p_staff_note:
            staffNote.trim() || null,
        }
      );

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      router.refresh();
    } catch {
      setErrorMessage(
        "Unable to review claim. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function completeHandover() {
    if (!handoverPhoto) {
      setErrorMessage(
        "Please select a handover photo before completing the handover."
      );
      return;
    }

    const extension =
      handoverPhoto.name
        .split(".")
        .pop()
        ?.toLowerCase();

    const allowedExtensions = [
      "jpg",
      "jpeg",
      "png",
      "webp",
    ];

    if (
      !extension ||
      !allowedExtensions.includes(extension)
    ) {
      setErrorMessage(
        "Handover photo must be JPG, PNG, or WEBP."
      );
      return;
    }

    if (handoverPhoto.size > 5 * 1024 * 1024) {
      setErrorMessage(
        "Handover photo must not exceed 5 MB."
      );
      return;
    }

    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setErrorMessage(
        "Staff authentication could not be verified."
      );
      setLoading(false);
      return;
    }

    const filePath =
      `${user.id}/${claim.id}/${crypto.randomUUID()}.${extension}`;

    let uploaded = false;

    try {
      const { error: uploadError } =
        await supabase.storage
          .from("handover")
          .upload(filePath, handoverPhoto, {
            cacheControl: "3600",
            upsert: false,
          });

      if (uploadError) {
        setErrorMessage(uploadError.message);
        return;
      }

      uploaded = true;

      const { error: handoverError } =
        await supabase.rpc(
          "complete_claim_handover",
          {
            p_claim_id: claim.id,
            p_handover_photo_url: filePath,
          }
        );

      if (handoverError) {
        await supabase.storage
          .from("handover")
          .remove([filePath]);

        uploaded = false;

        setErrorMessage(
          handoverError.message
        );
        return;
      }

      setHandoverPhoto(null);
      router.refresh();
    } catch {
      if (uploaded) {
        await supabase.storage
          .from("handover")
          .remove([filePath]);
      }

      setErrorMessage(
        "Unable to complete handover. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="ui-card overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-[var(--border)] p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
            <Text id="Claim" />
          </p>

          <h2 className="mt-1 break-all font-semibold text-[var(--foreground)]">
            {claim.id}
          </h2>

          <p className="mt-1 text-xs text-[var(--foreground-muted)]">
            <Text id="Submitted" /> {formatDateTime(claim.created_at)}
          </p>
        </div>

        <span
          className={`inline-flex w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
            claim.status
          )}`}
        >
          <DisplayValue value={claim.status} />
        </span>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <InfoField
            label="Item ID"
            value={claim.item_id}
          />

          <InfoField
            label="Claimant ID"
            value={claim.claimant_id}
          />
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
            <Text id="Claim reason" />
          </p>

          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--foreground)]">
            {claim.claim_reason}
          </p>
        </div>

        <div className="border-t border-[var(--border)] pt-5">
          <p className="text-sm font-semibold text-[var(--foreground)]">
            <Text id="Ownership evidence" />
          </p>

          {!claim.evidence ? (
            <p className="mt-2 text-sm text-[var(--foreground-muted)]">
              <Text id="No evidence was submitted with this claim." />
            </p>
          ) : !evidenceUrl ? (
            <button
              type="button"
              disabled={evidenceLoading}
              onClick={viewEvidence}
              className="ui-button-secondary mt-3"
            >
              {evidenceLoading
                ? <Text id="Loading..." />
                : <Text id="View evidence" />}
            </button>
          ) : (
            <div className="mt-3 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-2">
              {/* Private Supabase Storage signed URL. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={evidenceUrl}
                alt={t("Claim ownership evidence")}
                className="mx-auto max-h-[28rem] w-full rounded-lg object-contain"
              />
            </div>
          )}
        </div>

        {claim.status === "PENDING_REVIEW" && (
          <div className="border-t border-[var(--border)] pt-5">
            <label
              htmlFor={`note-${claim.id}`}
              className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
            >
              <Text id="Staff note" />
            </label>

            <textarea
              id={`note-${claim.id}`}
              rows={3}
              value={staffNote}
              onChange={(event) =>
                setStaffNote(event.target.value)
              }
              className="ui-input min-h-24 resize-y"
              placeholder={t("Optional note about the review decision")}
            />

            <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  reviewClaim("REJECTED")
                }
                className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-md)] border border-[var(--danger)]/30 bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--danger)] transition hover:bg-[var(--danger-soft)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                <Text id="Reject" />
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  reviewClaim("APPROVED")
                }
                className="ui-button-primary w-full sm:w-auto"
              >
                {loading ? <Text id="Processing..." /> : <Text id="Approve claim" />}
              </button>
            </div>
          </div>
        )}

        {claim.status === "APPROVED" && (
          <div className="rounded-xl border border-[var(--success)]/20 bg-[var(--success-soft)] p-4 sm:p-5">
            <h3 className="font-semibold text-[var(--foreground)]">
              <Text id="Record handover" />
            </h3>

            <p className="mt-1 text-sm leading-6 text-[var(--foreground-muted)]">
              <Text id="Upload a handover photo only when the item is actually returned to the claimant." />
            </p>

            <div className="mt-4 rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)]/70 p-4">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={loading}
                onChange={(event) =>
                  setHandoverPhoto(
                    event.target.files?.[0] ?? null
                  )
                }
                className="block w-full text-sm text-[var(--foreground-muted)] file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--primary)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[var(--primary-contrast)]"
              />

              <p className="mt-2 text-xs text-[var(--foreground-muted)]">
                <Text id="JPG, PNG or WEBP. Maximum 5 MB." />
              </p>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={completeHandover}
              className="ui-button-primary mt-4 w-full sm:w-auto"
            >
              {loading
                ? <Text id="Completing..." />
                : <Text id="Confirm handover" />}
            </button>
          </div>
        )}

        {claim.status === "REJECTED" && (
          <div className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-4">
            <p className="text-sm font-semibold text-[var(--danger)]">
              <Text id="Claim rejected" />
            </p>

            {claim.staff_note && (
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--foreground)]">
                {claim.staff_note}
              </p>
            )}
          </div>
        )}

        {claim.status === "COMPLETED" && (
          <div className="rounded-xl border border-[var(--success)]/20 bg-[var(--success-soft)] p-4">
            <p className="text-sm font-semibold text-[var(--success)]">
              <Text id="Handover completed" />
            </p>

            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              <Text id="The claim is complete and the item has been returned." />
            </p>
          </div>
        )}

        {errorMessage && (
          <div
            role="alert"
            className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-3 text-sm leading-6 text-[var(--danger)]"
          >
            <AppMessage text={errorMessage} />
          </div>
        )}
      </div>
    </article>
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
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
        <UiText text={label} />
      </p>

      <p className="mt-1 break-all text-sm leading-6 text-[var(--foreground)]">
        {value}
      </p>
    </div>
  );
}