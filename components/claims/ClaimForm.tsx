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
      className="ui-card overflow-hidden"
    >
      <div className="border-b border-[var(--border)] bg-[var(--surface-soft)] px-5 py-4 sm:px-7">
        <h2 className="font-semibold text-[var(--foreground)]">
          Ownership claim
        </h2>

        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
          Provide enough information for Staff to review your claim.
        </p>
      </div>

      <div className="space-y-6 p-5 sm:p-7">
        <div>
          <label
            htmlFor="claim-item-id"
            className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
          >
            Item ID *
          </label>

          <input
            id="claim-item-id"
            type="text"
            required
            value={itemId}
            onChange={(event) =>
              setItemId(event.target.value)
            }
            className="ui-input"
            placeholder="Item UUID"
          />

          <p className="mt-1.5 text-xs leading-5 text-[var(--foreground-muted)]">
            This is normally filled automatically when you claim an item
            from Search or Find Matches.
          </p>
        </div>

        <div>
          <label
            htmlFor="claim-reason"
            className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
          >
            Claim reason *
          </label>

          <textarea
            id="claim-reason"
            required
            rows={5}
            value={reason}
            onChange={(event) =>
              setReason(event.target.value)
            }
            className="ui-input min-h-32 resize-y"
            placeholder="Describe details that can help Staff verify ownership."
          />

          <p className="mt-1.5 text-xs leading-5 text-[var(--foreground-muted)]">
            Avoid including unnecessary sensitive information.
          </p>
        </div>

        <div className="border-t border-[var(--border)] pt-6">
          <div className="mb-3">
            <p className="text-sm font-medium text-[var(--foreground)]">
              Supporting evidence
            </p>

            <p className="mt-1 text-xs leading-5 text-[var(--foreground-muted)]">
              Optional. You can submit an image that helps Staff verify your
              ownership.
            </p>
          </div>

          <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-soft)] p-4">
            <input
              id="claim-evidence"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) =>
                setEvidence(event.target.files?.[0] ?? null)
              }
              className="block w-full text-sm text-[var(--foreground-muted)] file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--primary)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
            />

            <p className="mt-3 text-xs text-[var(--foreground-muted)]">
              JPG, PNG or WEBP. Maximum 5 MB.
            </p>
          </div>
        </div>

        {message && (
          <div
            role="status"
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3 text-sm leading-6 text-[var(--foreground)]"
          >
            {message}
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-[var(--foreground-muted)] sm:max-w-sm">
            Submitting a claim does not confirm ownership. Staff must review
            it before the handover process can begin.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="ui-button-primary w-full sm:w-auto"
          >
            {loading ? "Submitting..." : "Submit claim"}
          </button>
        </div>
      </div>
    </form>
  );
}