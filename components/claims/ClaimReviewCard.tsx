"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Claim = {
  id: string;
  item_id: string;
  claimant_id: string;
  claim_reason: string;
  evidence: string | null;
  status: string;
  staff_note: string | null;
  created_at: string;
};

export default function ClaimReviewCard() {
  const supabase = createClient();

  const [claims, setClaims] = useState<Claim[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [photos, setPhotos] =
    useState<Record<string, File | null>>({});

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchClaims = useCallback(async () => {

    return await supabase
      .from("claims")
      .select(
        "id, item_id, claimant_id, claim_reason, evidence, status, staff_note, created_at"
      )
      .in("status", ["PENDING_REVIEW", "APPROVED"])
      .order("created_at", { ascending: true });

  }, [supabase]);

  const loadClaims = useCallback(async () => {
    const { data, error } = await fetchClaims();

    if (error) {
      setMessage(error.message);
      setClaims([]);
    } else {
      setClaims((data ?? []) as Claim[]);
    }

    setLoading(false);
  }, [fetchClaims]);

  useEffect(() => {
    let active = true;
    void fetchClaims().then(({ data, error }) => {
      if (!active) return;
      setClaims((data ?? []) as Claim[]);
      setMessage(error?.message ?? "");
      setLoading(false);
    });
    return () => { active = false; };
  }, [fetchClaims]);

  async function reviewClaim(
    claimId: string,
    status: "APPROVED" | "REJECTED"
  ) {
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("You must login first.");
      return;
    }

    const { error } = await supabase
      .from("claims")
      .update({
        status,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        staff_note: notes[claimId]?.trim() || null,
      })
      .eq("id", claimId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(`Claim ${status.toLowerCase()} successfully.`);
    setLoading(true);
    await loadClaims();
  }

  async function completeHandover(claim: Claim) {
    setMessage("");

    const photo = photos[claim.id];

    if (!photo) {
      setMessage("Handover photo is required.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("You must login first.");
      return;
    }

    const extension = photo.name
      .split(".")
      .pop()
      ?.toLowerCase();

    if (
      !extension ||
      !["jpg", "jpeg", "png", "webp"].includes(extension)
    ) {
      setMessage("Handover photo must be JPG, PNG, or WEBP.");
      return;
    }

    if (photo.size > 5 * 1024 * 1024) {
      setMessage("Handover photo must not exceed 5 MB.");
      return;
    }

    const photoPath =
      `${claim.id}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } =
      await supabase.storage
        .from("handover")
        .upload(photoPath, photo, {
          cacheControl: "3600",
          upsert: false,
        });

    if (uploadError) {
      setMessage(
        `Handover photo upload failed: ${uploadError.message}`
      );
      return;
    }

    const handoverTime = new Date().toISOString();

    const { error: claimError } = await supabase
      .from("claims")
      .update({
        status: "COMPLETED",
        handover_photo_url: photoPath,
        handover_at: handoverTime,
        handover_confirmed_by: user.id,
      })
      .eq("id", claim.id)
      .eq("status", "APPROVED");

    if (claimError) {
      await supabase.storage
        .from("handover")
        .remove([photoPath]);

      setMessage(claimError.message);
      return;
    }

    const { error: itemError } = await supabase
      .from("items")
      .update({
        status: "RETURNED",
      })
      .eq("id", claim.item_id);

    if (itemError) {
      setMessage(
        `Claim completed, but item update failed: ${itemError.message}`
      );
      return;
    }

    setMessage("Handover completed successfully.");
    setLoading(true);
    await loadClaims();
  }

  if (loading) {
    return <p>Loading claims...</p>;
  }

  return (
    <div className="space-y-5">
      {message && (
        <div className="rounded-lg bg-white p-4 text-sm">
          {message}
        </div>
      )}

      {claims.length === 0 && (
        <div className="rounded-lg bg-white p-5">
          No claims are waiting for review or handover.
        </div>
      )}

      {claims.map((claim) => (
        <article
          key={claim.id}
          className="rounded-2xl bg-white p-6 shadow-sm"
        >
          <div className="flex justify-between gap-4">
            <div>
              <p className="text-xs text-stone-500">
                Claim #{claim.id.slice(0, 8)}
              </p>

              <h2 className="mt-1 font-semibold">
                Item {claim.item_id.slice(0, 8)}
              </h2>
            </div>

            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs">
              {claim.status}
            </span>
          </div>

          <div className="mt-4">
            <p className="text-sm font-medium">
              Claim reason
            </p>

            <p className="mt-1 text-sm text-stone-700">
              {claim.claim_reason}
            </p>
          </div>

          {claim.evidence && (
            <p className="mt-3 text-sm text-stone-600">
              Evidence submitted: Yes
            </p>
          )}

          {claim.status === "PENDING_REVIEW" && (
            <>
              <textarea
                rows={3}
                value={notes[claim.id] ?? ""}
                onChange={(e) =>
                  setNotes((current) => ({
                    ...current,
                    [claim.id]: e.target.value,
                  }))
                }
                placeholder="Staff note"
                className="mt-4 w-full rounded-lg border border-stone-300 px-3 py-2"
              />

              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    reviewClaim(claim.id, "APPROVED")
                  }
                  className="rounded-lg bg-stone-800 px-4 py-2 text-white"
                >
                  Approve
                </button>

                <button
                  type="button"
                  onClick={() =>
                    reviewClaim(claim.id, "REJECTED")
                  }
                  className="rounded-lg border border-stone-300 px-4 py-2"
                >
                  Reject
                </button>
              </div>
            </>
          )}

          {claim.status === "APPROVED" && (
            <div className="mt-5 border-t pt-5">
              <p className="font-medium">
                Record Handover
              </p>

              <p className="mt-1 text-sm text-stone-600">
                Staff must upload a handover photo before
                completing the claim.
              </p>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) =>
                  setPhotos((current) => ({
                    ...current,
                    [claim.id]:
                      e.target.files?.[0] ?? null,
                  }))
                }
                className="mt-3 w-full rounded-lg border border-stone-300 px-3 py-2"
              />

              <button
                type="button"
                onClick={() => completeHandover(claim)}
                className="mt-3 rounded-lg bg-stone-800 px-4 py-2 text-white"
              >
                Confirm Handover
              </button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}