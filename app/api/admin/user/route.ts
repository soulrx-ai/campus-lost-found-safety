import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    await requireAdmin();

    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, phone, role, status, created_at")
      .order("created_at", { ascending: false });

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    const authUsers = [];
    let page = 1;

    while (true) {
      const {
        data,
        error,
      } = await admin.auth.admin.listUsers({
        page,
        perPage: 1000,
      });

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      authUsers.push(...data.users);

      if (data.users.length < 1000) {
        break;
      }

      page += 1;
    }

    const emailById = new Map(
      authUsers.map((user) => [
        user.id,
        user.email ?? null,
      ])
    );

    const users = (profiles ?? []).map((profile) => ({
      ...profile,
      email: emailById.get(profile.id) ?? null,
    }));

    return NextResponse.json({ users });
  } catch {
    return NextResponse.json(
      { error: "Unauthorized or unable to load users." },
      { status: 401 }
    );
  }
}