import MyClaims from "@/components/claims/MyClaims";

export default function ClaimsPage() {
  return (
    <main className="page-shell">
      <div className="app-container">
        <div className="mx-auto max-w-4xl">
          <header className="mb-7">
            <p className="page-eyebrow">Lost &amp; Found</p>

            <h1 className="page-title">My Claims</h1>

            <p className="page-description">
              Track your ownership claims, Staff review decisions, and
              completed item handovers.
            </p>
          </header>

          <MyClaims />
        </div>
      </div>
    </main>
  );
}