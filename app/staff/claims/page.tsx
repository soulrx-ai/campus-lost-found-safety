import StaffClaimCard from "@/components/claims/StaffClaimCard";
import { requireStaff } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

type ClaimStatus =
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED";

export default async function StaffClaimsPage() {
  const staff = await requireStaff();
  const supabase = await createClient();

  const { data: claims, error } = await supabase
    .from("claims")
    .select(
      "id, item_id, claimant_id, claim_reason, evidence, status, staff_note, created_at"
    )
    .in("status", [
      "PENDING_REVIEW",
      "APPROVED",
      "REJECTED",
      "COMPLETED",
    ])
    .order("created_at", {
      ascending: false,
    });

  const pendingCount =
    claims?.filter((claim) => claim.status === "PENDING_REVIEW")
      .length ?? 0;

  const handoverCount =
    claims?.filter((claim) => claim.status === "APPROVED")
      .length ?? 0;

  return (
    <main className="page-shell">
      <div className="app-container">
        <div className="mx-auto max-w-5xl">
          <header className="mb-7">
            <p className="page-eyebrow">Staff Operations</p>

            <h1 className="page-title">
              Claim Review &amp; Handover
            </h1>

            <p className="page-description">
              Review ownership claims and record the final handover when an
              approved item is returned to its claimant.
            </p>
          </header>

          {error ? (
            <div className="rounded-2xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-5 text-sm text-[var(--danger)]">
              <p className="font-semibold">Unable to load claims</p>
              <p className="mt-1">{error.message}</p>
            </div>
          ) : !claims || claims.length === 0 ? (
            <div className="ui-card p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                No claims
              </h2>

              <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                There are currently no claims to review.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-5 grid gap-3 sm:grid-cols-2">
                <div className="ui-card p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
                    Waiting for review
                  </p>

                  <p className="mt-2 text-2xl font-bold text-[var(--warning)]">
                    {pendingCount}
                  </p>
                </div>

                <div className="ui-card p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
                    Ready for handover
                  </p>

                  <p className="mt-2 text-2xl font-bold text-[var(--success)]">
                    {handoverCount}
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {claims.map((claim) => (
                  <StaffClaimCard
                    key={claim.id}
                    claim={{
                      ...claim,
                      status: claim.status as ClaimStatus,
                    }}
                    staffId={staff.id}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}