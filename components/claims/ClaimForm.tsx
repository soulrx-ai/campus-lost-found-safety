"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  initialItemId?: string;
};

export default function ClaimForm({
  initialItemId = "",
}: Props) {
  const supabase = createClient();

  const [itemId, setItemId] = useState(initialItemId);
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState<File | null>(null);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");

    const cleanItemId = itemId.trim();
    const cleanReason = reason.trim();

    if (!cleanItemId) {
      setMessage("Item ID is required.");
      return;
    }

    if (!cleanReason) {
      setMessage(
        "Please explain why the item belongs to you."
      );
      return;
    }

    setLoading(true);

    let evidencePath: string | null = null;

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setMessage(
          "You must login before submitting a claim."
        );
        return;
      }

      // Verify that the target is currently a published FOUND item.
      const { data: targetItem, error: itemError } =
        await supabase
          .from("items")
          .select("id, report_type, status")
          .eq("id", cleanItemId)
          .eq("report_type", "FOUND")
          .eq("status", "PUBLISHED")
          .maybeSingle();

      if (itemError) {
        setMessage(
          `Unable to verify item: ${itemError.message}`
        );
        return;
      }

      if (!targetItem) {
        setMessage(
          "This item is not available for claiming."
        );
        return;
      }

      if (evidence) {
        const extension =
          evidence.name
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
          setMessage(
            "Evidence must be JPG, PNG, or WEBP."
          );
          return;
        }

        if (evidence.size > 5 * 1024 * 1024) {
          setMessage(
            "Evidence must not exceed 5 MB."
          );
          return;
        }

        evidencePath =
          `${user.id}/${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } =
          await supabase.storage
            .from("claim-evidence")
            .upload(evidencePath, evidence, {
              cacheControl: "3600",
              upsert: false,
            });

        if (uploadError) {
          setMessage(
            `Evidence upload failed: ${uploadError.message}`
          );
          return;
        }
      }

      const { error: insertError } =
        await supabase
          .from("claims")
          .insert({
            item_id: cleanItemId,
            claimant_id: user.id,
            claim_reason: cleanReason,
            evidence: evidencePath,
            status: "PENDING_REVIEW",
          });

      if (insertError) {
        if (evidencePath) {
          await supabase.storage
            .from("claim-evidence")
            .remove([evidencePath]);
        }

        setMessage(
          `Unable to submit claim: ${insertError.message}`
        );
        return;
      }

      setReason("");
      setEvidence(null);

      const input = document.getElementById(
        "claim-evidence"
      ) as HTMLInputElement | null;

      if (input) {
        input.value = "";
      }

      setMessage(
        "Claim submitted successfully and is waiting for Staff review."
      );
    } catch {
      if (evidencePath) {
        await supabase.storage
          .from("claim-evidence")
          .remove([evidencePath]);
      }

      setMessage(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl bg-white p-6 shadow-sm"
    >
      <div>
        <label className="mb-1 block text-sm font-medium">
          Item ID *
        </label>

        <input
          type="text"
          required
          value={itemId}
          onChange={(e) => setItemId(e.target.value)}
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
          placeholder="Item UUID"
        />

        <p className="mt-1 text-xs text-stone-500">
          This will normally be selected from the item
          search or matching page.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Claim Reason *
        </label>

        <textarea
          required
          rows={5}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
          placeholder="Describe details that help Staff verify ownership."
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Evidence (optional)
        </label>

        <input
          id="claim-evidence"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) =>
            setEvidence(e.target.files?.[0] ?? null)
          }
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
        />

        <p className="mt-1 text-xs text-stone-500">
          Optional supporting evidence. Maximum 5 MB.
        </p>
      </div>

      {message && (
        <div className="rounded-lg bg-stone-100 p-3 text-sm">
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-stone-800 px-4 py-3 font-medium text-white disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit Claim"}
      </button>
    </form>
  );
}