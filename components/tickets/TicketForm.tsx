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
      className="space-y-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-800">
          Ticket Type <span className="text-red-500">*</span>
        </label>
        <select
          required
          value={ticketType}
          // 3. ยืนยันกับ TypeScript ว่า e.target.value คือ ValidTicketType แน่นอน
          onChange={(e) => setTicketType(e.target.value as ValidTicketType)}
          className="w-full rounded-lg border border-stone-400 bg-white px-3 py-2 text-stone-900 focus:border-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-700"
        >
          <option value="NOT_RECEIVED">Item Not Received</option>
          <option value="SYSTEM_PROBLEM">System Problem</option>
          <option value="GENERAL">General</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-800">
          Related Claim ID
        </label>
        <input
          type="text"
          value={claimId}
          onChange={(e) => setClaimId(e.target.value)}
          placeholder="Optional"
          className="w-full rounded-lg border border-stone-400 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-500 focus:border-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-700"
        />
        <p className="mt-1 text-xs text-stone-600">
          Optional. Use this when the issue is related to a claim.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-800">
          Subject <span className="text-red-500">*</span>
        </label>
        <input
          required
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full rounded-lg border border-stone-400 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-500 focus:border-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-700"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-800">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          required
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-stone-400 bg-white px-3 py-2 text-stone-900 placeholder:text-stone-500 focus:border-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-700"
        />
      </div>

      {message && (
        <div className="rounded-lg border border-stone-300 bg-stone-100 p-3 text-sm font-medium text-stone-800">
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