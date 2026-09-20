import ClaimForm from "@/components/claims/ClaimForm";

type Props = {
  searchParams: Promise<{
    item?: string;
  }>;
};

export default async function NewClaimPage({
  searchParams,
}: Props) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-medium text-stone-500">
          Lost & Found
        </p>

        <h1 className="mt-1 text-3xl font-bold text-stone-900">
          Submit Claim
        </h1>

        <p className="mt-2 text-stone-600">
          Explain why you believe this item belongs to you.
        </p>

        <div className="mt-6">
          <ClaimForm initialItemId={params.item ?? ""} />
        </div>
      </div>
    </main>
  );
}