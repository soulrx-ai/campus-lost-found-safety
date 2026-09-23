import { Text } from "@/components/i18n/Text";
import MyClaims from "@/components/claims/MyClaims";

export default function ClaimsPage() {
  return (
    <main className="page-shell">
      <div className="app-container">
        <div className="mx-auto max-w-4xl">
          <header className="mb-7">
            <p className="page-eyebrow"><Text id="Lost & Found" /></p>

            <h1 className="page-title"><Text id="My Claims" /></h1>

            <p className="page-description">
              <Text id="Track your ownership claims, Staff review decisions, and completed item handovers." />
            </p>
          </header>

          <MyClaims />
        </div>
      </div>
    </main>
  );
}