import { Text } from "@/components/i18n/Text";
import ProfileForm from "@/components/profile/ProfileForm";
import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const profile = await requireUser();
  const supabase = await createClient();

  const [
    {
      data: { user },
    },
    { data: profileData, error: profileError },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("profiles")
      .select("id, full_name, phone, role, status")
      .eq("id", profile.id)
      .single(),
  ]);

  if (profileError || !profileData) {
    return (
      <main className="page-shell">
        <div className="app-container px-4 sm:px-6 lg:px-8">
          <div className="ui-card">
            <p className="text-sm text-[var(--danger)]">
              <Text id="Unable to load your profile. Please try again later." />
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="app-container">
        <div className="page-header mb-8">
          <p className="page-eyebrow">
            <Text id="Account" />
          </p>

          <h1 className="page-title">
            <Text id="My Profile" />
          </h1>

          <p className="page-description">
            <Text id="Manage your personal account information." />
          </p>
        </div>

        <ProfileForm
          initialProfile={{
            fullName: profileData.full_name ?? "",
            email: user?.email ?? "",
            phone: profileData.phone ?? "",
            role:
              profileData.role === "STAFF" || profileData.role === "ADMIN"
                ? profileData.role
                : "USER",
            status:
              profileData.status === "INACTIVE"
                ? "INACTIVE"
                : "ACTIVE",
          }}
        />
      </div>
    </main>
  );
}