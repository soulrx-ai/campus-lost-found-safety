"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type Props = {
  initialItemId?: string;
};

export default function ClaimForm({
  initialItemId = "",
}: Props) {
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
      className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7"
    >
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Claim details
          </p>

          <h2 className="mt-1 text-xl font-semibold text-stone-900">
            Tell us why this item belongs to you
          </h2>

          <p className="mt-2 text-sm leading-6 text-stone-600">
            Provide enough detail for Staff to verify your ownership claim.
          </p>
        </div>

        <div>
          <label
            htmlFor="claim-item-id"
            className="mb-2 block text-sm font-semibold text-stone-800"
          >
            Item ID <span className="text-red-600">*</span>
          </label>

          <input
            id="claim-item-id"
            type="text"
            required
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
            placeholder="Item UUID"
          />

          <p className="mt-2 text-xs leading-5 text-stone-500">
            This will normally be selected from the item search or matching page.
          </p>
        </div>

        <div>
          <label
            htmlFor="claim-reason"
            className="mb-2 block text-sm font-semibold text-stone-800"
          >
            Why is this item yours?{" "}
            <span className="text-red-600">*</span>
          </label>

          <textarea
            id="claim-reason"
            required
            rows={6}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full resize-y rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm leading-6 text-stone-900 outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
            placeholder="Describe identifying details, where you lost it, or other information that can help Staff verify ownership."
          />

          <p className="mt-2 text-xs leading-5 text-stone-500">
            Avoid sharing unnecessary sensitive personal information.
          </p>
        </div>

        <div>
          <label
            htmlFor="claim-evidence"
            className="mb-2 block text-sm font-semibold text-stone-800"
          >
            Supporting evidence{" "}
            <span className="font-normal text-stone-500">
              (optional)
            </span>
          </label>

          <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4">
            <input
              id="claim-evidence"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) =>
                setEvidence(e.target.files?.[0] ?? null)
              }
              className="block w-full text-sm text-stone-700 file:mr-4 file:rounded-lg file:border-0 file:bg-stone-800 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-stone-700"
            />

            <p className="mt-3 text-xs leading-5 text-stone-500">
              JPG, PNG, or WEBP. Maximum 5 MB.
            </p>

            {evidence && (
              <p className="mt-2 break-all text-xs font-medium text-stone-700">
                Selected: {evidence.name}
              </p>
            )}
          </div>
        </div>

        {message && (
          <div
            role="status"
            className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-700"
          >
            {message}
          </div>
        )}

        <div className="border-t border-stone-100 pt-5">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-stone-800 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Submitting claim..." : "Submit Claim"}
          </button>
        </div>
      </div>
    </form>
  );
}