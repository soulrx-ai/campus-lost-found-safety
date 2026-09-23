import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: Request
) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    let page = 1;

    while (true) {
      const { data, error } =
        await admin.auth.admin.listUsers({
          page,
          perPage: 1000,
        });

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      const user = data.users.find(
        (item) =>
          item.email?.trim().toLowerCase() === email
      );

      if (user) {
        return NextResponse.json({
          id: user.id,
        });
      }

      if (data.users.length < 1000) {
        break;
      }

      page += 1;
    }

    return NextResponse.json(
      { error: "The selected user does not exist." },
      { status: 404 }
    );
  } catch {
    return NextResponse.json(
      { error: "Unauthorized or unable to find user." },
      { status: 401 }
    );
  }
}