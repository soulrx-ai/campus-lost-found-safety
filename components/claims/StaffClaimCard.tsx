"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

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

function getStatusLabel(status: ClaimStatus) {
  switch (status) {
    case "PENDING_REVIEW":
      return "Pending Review";
    case "APPROVED":
      return "Approved";
    case "REJECTED":
      return "Rejected";
    case "COMPLETED":
      return "Completed";
  }
}

function getStatusClasses(status: ClaimStatus) {
  switch (status) {
    case "PENDING_REVIEW":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "APPROVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "REJECTED":
      return "border-red-200 bg-red-50 text-red-800";
    case "COMPLETED":
      return "border-stone-300 bg-stone-100 text-stone-800";
  }
}

export default function StaffClaimCard({
  claim,
}: Props) {
  const router = useRouter();

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
  const [errorMessage, setErrorMessage] = useState("");

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
    <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Ownership Claim
          </p>

          <h2 className="mt-1 break-all text-lg font-semibold text-stone-900">
            Claim #{claim.id.slice(0, 8)}
          </h2>

          <p className="mt-1 text-xs text-stone-500">
            Submitted {formatDateTime(claim.created_at)}
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

      <div className="mt-6 grid gap-5 border-t border-stone-100 pt-5 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Item ID
          </p>

          <p className="mt-1 break-all text-sm text-stone-700">
            {claim.item_id}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Claimant ID
          </p>

          <p className="mt-1 break-all text-sm text-stone-700">
            {claim.claimant_id}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-stone-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Claim reason
        </p>

        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-700">
          {claim.claim_reason}
        </p>
      </div>

      <div className="mt-5 rounded-2xl border border-stone-200 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Supporting evidence
        </p>

        {!claim.evidence ? (
          <p className="mt-2 text-sm text-stone-500">
            No evidence submitted.
          </p>
        ) : !evidenceUrl ? (
          <button
            type="button"
            disabled={evidenceLoading}
            onClick={viewEvidence}
            className="mt-3 rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {evidenceLoading
              ? "Loading evidence..."
              : "View Evidence"}
          </button>
        ) : (
          <div className="mt-3 overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
            <img
              src={evidenceUrl}
              alt="Claim ownership evidence"
              className="max-h-[28rem] w-full object-contain"
            />
          </div>
        )}
      </div>

      {claim.status === "PENDING_REVIEW" && (
        <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50 p-5">
          <div>
            <p className="text-sm font-semibold text-stone-900">
              Review this claim
            </p>

            <p className="mt-1 text-xs leading-5 text-stone-500">
              Add an optional note before approving or rejecting the claim.
            </p>
          </div>

          <div className="mt-4">
            <label
              htmlFor={`note-${claim.id}`}
              className="mb-2 block text-sm font-semibold text-stone-800"
            >
              Staff note
            </label>

            <textarea
              id={`note-${claim.id}`}
              rows={4}
              value={staffNote}
              onChange={(event) =>
                setStaffNote(event.target.value)
              }
              className="w-full resize-y rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm leading-6 text-stone-900 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
              placeholder="Optional note for the claimant"
            />
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={loading}
              onClick={() =>
                reviewClaim("APPROVED")
              }
              className="flex-1 rounded-xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Processing..."
                : "Approve Claim"}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() =>
                reviewClaim("REJECTED")
              }
              className="flex-1 rounded-xl border border-red-300 bg-white px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reject Claim
            </button>
          </div>
        </div>
      )}

      {claim.status === "APPROVED" && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm font-semibold text-emerald-900">
            Claim approved — Handover required
          </p>

          <p className="mt-1 text-sm leading-6 text-emerald-800">
            Upload a photo documenting the handover before completing the return.
          </p>

          <div className="mt-4 rounded-xl border border-emerald-200 bg-white p-4">
            <label
              htmlFor={`handover-${claim.id}`}
              className="mb-2 block text-sm font-semibold text-stone-800"
            >
              Handover photo
            </label>

            <input
              id={`handover-${claim.id}`}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={loading}
              onChange={(event) =>
                setHandoverPhoto(
                  event.target.files?.[0] ?? null
                )
              }
              className="block w-full text-sm text-stone-700 file:mr-4 file:rounded-lg file:border-0 file:bg-stone-800 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-stone-700"
            />

            <p className="mt-2 text-xs text-stone-500">
              JPG, PNG, or WEBP. Maximum 5 MB.
            </p>

            {handoverPhoto && (
              <p className="mt-2 break-all text-xs font-medium text-stone-700">
                Selected: {handoverPhoto.name}
              </p>
            )}

            <button
              type="button"
              disabled={loading}
              onClick={completeHandover}
              className="mt-4 w-full rounded-xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Completing handover..."
                : "Confirm Handover"}
            </button>
          </div>
        </div>
      )}

      {claim.status === "REJECTED" && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-semibold text-red-900">
            Claim rejected
          </p>

          <p className="mt-1 text-sm leading-6 text-red-800">
            This ownership claim was rejected by Staff.
          </p>
        </div>
      )}

      {claim.status === "COMPLETED" && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm font-semibold text-emerald-900">
            Handover completed
          </p>

          <p className="mt-1 text-sm leading-6 text-emerald-800">
            The claim is completed and the item has been returned to the claimant.
          </p>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"
        >
          {errorMessage}
        </div>
      )}
    </article>
  );
}