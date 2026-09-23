import { requireUser } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/profile/ProfileForm";

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
        <div className="app-container">
          <div className="ui-card">
            <p className="text-sm text-[var(--danger)]">
              Unable to load your profile. Please try again later.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="app-container">
        <div className="mb-8">
          <p className="page-eyebrow">Account</p>

          <h1 className="page-title">My Profile</h1>

          <p className="page-description">
            Manage your personal account information.
          </p>
        </div>

        <ProfileForm
          initialProfile={{
            fullName: profileData.full_name ?? "",
            email: user?.email ?? "",
            phone: profileData.phone ?? "",
            role: profileData.role,
            status: profileData.status,
          }}
        />
      </div>
    </main>
  );
}