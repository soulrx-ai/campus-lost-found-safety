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

export default function StaffClaimCard({
  claim,
}: Props) {
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
    <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-stone-500">
            Claim
          </p>

          <h2 className="mt-1 font-semibold text-stone-900">
            Claim ID: {claim.id}
          </h2>

          <p className="mt-1 text-sm text-stone-500">
            Submitted{" "}
            {formatDateTime(claim.created_at)}
          </p>
        </div>

        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
          {claim.status}
        </span>
      </div>

      <div className="mt-5 space-y-3 text-sm">
        <div>
          <p className="font-medium text-stone-700">
            Item ID
          </p>

          <p className="break-all text-stone-600">
            {claim.item_id}
          </p>
        </div>

        <div>
          <p className="font-medium text-stone-700">
            Claimant ID
          </p>

          <p className="break-all text-stone-600">
            {claim.claimant_id}
          </p>
        </div>

        <div>
          <p className="font-medium text-stone-700">
            Claim Reason
          </p>

          <p className="mt-1 whitespace-pre-wrap text-stone-600">
            {claim.claim_reason}
          </p>
        </div>

        <div>
  <p className="font-medium text-stone-700">
    Evidence
  </p>

  {!claim.evidence ? (
    <p className="text-stone-600">
      No evidence submitted
    </p>
  ) : !evidenceUrl ? (
    <button
      type="button"
      disabled={evidenceLoading}
      onClick={viewEvidence}
      className="mt-2 rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
    >
      {evidenceLoading
        ? "Loading..."
        : "View Evidence"}
    </button>
  ) : (
    <img
      src={evidenceUrl}
      alt="Claim ownership evidence"
      className="mt-2 max-h-96 rounded-xl border border-stone-200 object-contain"
    />
  )}
</div>
      </div>

      {claim.status === "PENDING_REVIEW" && (
        <div className="mt-5">
          <label
            htmlFor={`note-${claim.id}`}
            className="mb-1 block text-sm font-medium text-stone-700"
          >
            Staff Note
          </label>

          <textarea
            id={`note-${claim.id}`}
            rows={3}
            value={staffNote}
            onChange={(event) =>
              setStaffNote(event.target.value)
            }
            className="w-full rounded-xl border border-stone-300 px-3 py-2 outline-none focus:border-stone-500"
            placeholder="Optional note"
          />

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() =>
                reviewClaim("APPROVED")
              }
              className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
            >
              {loading
                ? "Processing..."
                : "Approve"}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() =>
                reviewClaim("REJECTED")
              }
              className="rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {claim.status === "APPROVED" && (
        <div className="mt-6 rounded-xl border border-stone-200 bg-stone-50 p-4">
          <h3 className="font-semibold text-stone-900">
            Handover
          </h3>

          <p className="mt-1 text-sm text-stone-600">
            Upload a handover photo when the item is
            returned to the claimant.
          </p>

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={loading}
            onChange={(event) =>
              setHandoverPhoto(
                event.target.files?.[0] ?? null
              )
            }
            className="mt-4 block w-full text-sm text-stone-600"
          />

          <button
            type="button"
            disabled={loading}
            onClick={completeHandover}
            className="mt-4 rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
          >
            {loading
              ? "Completing..."
              : "Confirm Handover"}
          </button>
        </div>
      )}

      {claim.status === "REJECTED" && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          This claim was rejected.
        </div>
      )}

      {claim.status === "COMPLETED" && (
        <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          Handover completed. The item has been
          returned.
        </div>
      )}

      {errorMessage && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}
    </article>
  );
} 