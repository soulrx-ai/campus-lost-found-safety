"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  initialClaimId?: string;
};

export default function TicketForm({
  initialClaimId = "",
}: Props) {
  const supabase = createClient();

  const [ticketType, setTicketType] =
    useState("GENERAL");

  const [claimId, setClaimId] =
    useState(initialClaimId);

  const [subject, setSubject] = useState("");
  const [description, setDescription] =
    useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setMessage(
          "You must login before creating a ticket."
        );
        return;
      }

      const { error } = await supabase
        .from("service_tickets")
        .insert({
          requester_id: user.id,
          claim_id: claimId.trim() || null,
          ticket_type: ticketType,
          subject: subject.trim(),
          description: description.trim(),
          status: "OPEN",
        });

      if (error) {
        setMessage(
          `Unable to create ticket: ${error.message}`
        );
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
      className="space-y-5 rounded-2xl bg-white p-6 shadow-sm"
    >
      <div>
        <label className="mb-1 block text-sm font-medium">
          Ticket Type *
        </label>

        <select
          required
          value={ticketType}
          onChange={(e) =>
            setTicketType(e.target.value)
          }
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
        >
          <option value="NOT_RECEIVED">
            Item Not Received
          </option>

          <option value="SYSTEM_PROBLEM">
            System Problem
          </option>

          <option value="GENERAL">
            General
          </option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Related Claim ID
        </label>

        <input
          type="text"
          value={claimId}
          onChange={(e) =>
            setClaimId(e.target.value)
          }
          placeholder="Optional"
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
        />

        <p className="mt-1 text-xs text-stone-500">
          Optional. Use this when the issue is related to a
          claim.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Subject *
        </label>

        <input
          required
          type="text"
          value={subject}
          onChange={(e) =>
            setSubject(e.target.value)
          }
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Description *
        </label>

        <textarea
          required
          rows={5}
          value={description}
          onChange={(e) =>
            setDescription(e.target.value)
          }
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
        />
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
        {loading ? "Creating..." : "Create Ticket"}
      </button>
    </form>
  );
}