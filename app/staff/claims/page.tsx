import ClaimReviewCard from "@/components/claims/ClaimReviewCard";

export default function StaffClaimsPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-stone-900">
          Claim Review
        </h1>

        <p className="mt-2 text-stone-600">
          Review ownership claims and record item handovers.
        </p>

        <div className="mt-6">
          <ClaimReviewCard />
        </div>
      </div>
    </main>
  );
}