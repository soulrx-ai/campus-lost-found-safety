"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  initialClaimId?: string;
};

// 1. สร้าง Type แยกออกมา เพื่อให้เรียกใช้ได้ง่ายๆ
type ValidTicketType = "NOT_RECEIVED" | "SYSTEM_PROBLEM" | "GENERAL";

export default function TicketForm({ initialClaimId = "" }: Props) {
  const supabase = createClient();

  // 2. เรียกใช้ Type ที่สร้างไว้
  const [ticketType, setTicketType] = useState<ValidTicketType>("GENERAL");
  const [claimId, setClaimId] = useState(initialClaimId);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setMessage("You must login before creating a ticket.");
        return;
      }

      const cleanClaimId = claimId.trim();

if (cleanClaimId) {
  const { data: relatedClaim, error: claimError } =
    await supabase
      .from("claims")
      .select("id")
      .eq("id", cleanClaimId)
      .eq("claimant_id", user.id)
      .maybeSingle();

  if (claimError) {
    setMessage(
      `Unable to verify related claim: ${claimError.message}`
    );
    return;
  }

  if (!relatedClaim) {
    setMessage(
      "The related claim was not found or does not belong to your account."
    );
    return;
  }
}

      const { error } = await supabase.from("service_tickets").insert({
        requester_id: user.id,
        claim_id: cleanClaimId || null,
        ticket_type: ticketType,
        subject: subject.trim(),
        description: description.trim(),
        status: "OPEN",
      });

      if (error) {
        setMessage(`Unable to create ticket: ${error.message}`);
        return;
      }

      setTicketType("GENERAL");
      setClaimId("");
      setSubject("");
      setDescription("");

      setMessage("Service ticket created successfully.");
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-stone-200 dark:border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm"
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-800 dark:text-[var(--foreground)]">
          Ticket Type <span className="text-red-500 dark:text-[var(--danger)]">*</span>
        </label>
        <select
          required
          value={ticketType}
          // 3. ยืนยันกับ TypeScript ว่า e.target.value คือ ValidTicketType แน่นอน
          onChange={(e) => setTicketType(e.target.value as ValidTicketType)}
          className="w-full rounded-lg border border-stone-400 dark:border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-stone-900 dark:text-[var(--foreground)] focus:border-stone-700 dark:focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-stone-700 dark:focus:ring-[var(--primary)]"
        >
          <option value="NOT_RECEIVED">Item Not Received</option>
          <option value="SYSTEM_PROBLEM">System Problem</option>
          <option value="GENERAL">General</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-800 dark:text-[var(--foreground)]">
          Related Claim ID
        </label>
        <input
          type="text"
          value={claimId}
          onChange={(e) => setClaimId(e.target.value)}
          placeholder="Optional"
          className="w-full rounded-lg border border-stone-400 dark:border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-stone-900 dark:text-[var(--foreground)] placeholder:text-stone-500 dark:placeholder:text-[var(--foreground-muted)] focus:border-stone-700 dark:focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-stone-700 dark:focus:ring-[var(--primary)]"
        />
        <p className="mt-1 text-xs text-stone-600 dark:text-[var(--foreground-muted)]">
          Optional. Use this when the issue is related to a claim.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-800 dark:text-[var(--foreground)]">
          Subject <span className="text-red-500 dark:text-[var(--danger)]">*</span>
        </label>
        <input
          required
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full rounded-lg border border-stone-400 dark:border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-stone-900 dark:text-[var(--foreground)] placeholder:text-stone-500 dark:placeholder:text-[var(--foreground-muted)] focus:border-stone-700 dark:focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-stone-700 dark:focus:ring-[var(--primary)]"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-800 dark:text-[var(--foreground)]">
          Description <span className="text-red-500 dark:text-[var(--danger)]">*</span>
        </label>
        <textarea
          required
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-stone-400 dark:border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-stone-900 dark:text-[var(--foreground)] placeholder:text-stone-500 dark:placeholder:text-[var(--foreground-muted)] focus:border-stone-700 dark:focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-stone-700 dark:focus:ring-[var(--primary)]"
        />
      </div>

      {message && (
        <div className="rounded-lg border border-stone-300 dark:border-[var(--border-strong)] bg-stone-100 dark:bg-[var(--surface-soft)] p-3 text-sm font-medium text-stone-800 dark:text-[var(--foreground)]">
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-stone-800 px-4 py-3 font-medium text-white disabled:opacity-50 hover:bg-stone-900"
      >
        {loading ? "Creating..." : "Create Ticket"}
      </button>
    </form>
  );
}