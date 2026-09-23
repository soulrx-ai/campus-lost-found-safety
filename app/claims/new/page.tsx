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
    <main className="page-shell">
      <div className="app-container">
        <div className="mx-auto max-w-3xl">
          <header className="mb-7">
            <p className="page-eyebrow">Lost &amp; Found</p>

            <h1 className="page-title">Submit a claim</h1>

            <p className="page-description">
              Explain why you believe the found item belongs to you. Staff
              will review your claim before any handover can take place.
            </p>
          </header>

          <ClaimForm initialItemId={params.item ?? ""} />
        </div>
      </div>
    </main>
  );
}