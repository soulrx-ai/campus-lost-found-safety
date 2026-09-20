import MyClaims from "@/components/claims/MyClaims";

export default function ClaimsPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-stone-900">
          My Claims
        </h1>

        <p className="mt-2 text-stone-600">
          Track the status of your submitted claims.
        </p>

        <div className="mt-6">
          <MyClaims />
        </div>
      </div>
    </main>
  );
}