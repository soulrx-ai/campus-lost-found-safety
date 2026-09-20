"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Claim = {
  id: string;
  item_id: string;
  claim_reason: string;
  status: string;
  staff_note: string | null;
  created_at: string;
  handover_at: string | null;
};

export default function MyClaims() {
  const supabase = createClient();

  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadClaims() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("Please login to view your claims.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("claims")
        .select(
          "id, item_id, claim_reason, status, staff_note, created_at, handover_at"
        )
        .eq("claimant_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setMessage(error.message);
      } else {
        setClaims((data ?? []) as Claim[]);
      }

      setLoading(false);
    }

    loadClaims();
  }, [supabase]);

  if (loading) {
    return <p>Loading claims...</p>;
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className="rounded-lg bg-white p-4 text-sm">
          {message}
        </div>
      )}

      {!message && claims.length === 0 && (
        <div className="rounded-lg bg-white p-4">
          You have not submitted any claims.
        </div>
      )}

      {claims.map((claim) => (
        <article
          key={claim.id}
          className="rounded-2xl bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-semibold">
              Claim #{claim.id.slice(0, 8)}
            </h2>

            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium">
              {claim.status}
            </span>
          </div>

          <p className="mt-3 text-sm text-stone-700">
            {claim.claim_reason}
          </p>

          {claim.staff_note && (
            <p className="mt-3 text-sm">
              <strong>Staff note:</strong>{" "}
              {claim.staff_note}
            </p>
          )}

          {claim.handover_at && (
            <p className="mt-2 text-sm">
              <strong>Handover:</strong>{" "}
              {new Date(claim.handover_at).toLocaleString()}
            </p>
          )}

          <p className="mt-3 text-xs text-stone-500">
            Submitted{" "}
            {new Date(claim.created_at).toLocaleString()}
          </p>
        </article>
      ))}
    </div>
  );
}