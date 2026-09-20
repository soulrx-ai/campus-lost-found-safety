import Link from "next/link";
import { requireUser } from "@/lib/auth/guards";
import LogoutButton from "@/components/auth/LogoutButton";

export default async function Home() {
  const profile = await requireUser();

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-stone-500">
              Campus Lost & Found and Safety System
            </p>

            <h1 className="mt-1 text-3xl font-bold text-stone-900">
              Welcome, {profile.full_name}
            </h1>

            <p className="mt-2 text-stone-600">
              Role: {profile.role}
            </p>
          </div>

          <LogoutButton />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MenuCard
            href="/lost/report"
            title="Report Lost Item"
            description="Report an item that you lost."
          />

          <MenuCard
            href="/found/report"
            title="Report Found Item"
            description="Report an item that you found."
          />

          <MenuCard
            href="/search"
            title="Search Items"
            description="Search published lost and found items."
          />

          <MenuCard
            href="/claims"
            title="My Claims"
            description="View your submitted claims."
          />

          <MenuCard
            href="/safety"
            title="Safety Incidents"
            description="View published safety incidents."
          />

          <MenuCard
            href="/safety/report"
            title="Report Safety Incident"
            description="Submit a campus safety incident."
          />

          <MenuCard
            href="/tickets"
            title="Service Tickets"
            description="View your service tickets."
          />

          {profile.role === "STAFF" && (
            <MenuCard
              href="/staff/claims"
              title="Staff Operations"
              description="Review claims and manage handovers."
            />
          )}

          {profile.role === "ADMIN" && (
            <MenuCard
              href="/admin"
              title="Admin Dashboard"
              description="Manage users, notifications and system activity."
            />
          )}
        </div>
      </div>
    </main>
  );
}

function MenuCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <h2 className="font-semibold text-stone-900">{title}</h2>
      <p className="mt-2 text-sm text-stone-600">{description}</p>
    </Link>
  );
}