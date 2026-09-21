import MyClaims from "@/components/claims/MyClaims";

export default function ClaimsPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-stone-500">
              Lost & Found
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
              My Claims
            </h1>

            <p className="mt-3 text-sm leading-6 text-stone-600 sm:text-base">
              Track your ownership claims and see updates from Staff.
            </p>
          </div>
        </section>

        <section className="mt-6">
          <MyClaims />
        </section>
      </div>
    </main>
  );
}