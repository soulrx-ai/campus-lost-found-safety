import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("role, status")
        .eq("id", user.id)
        .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Unable to verify user permissions." },
        { status: 403 }
      );
    }

    if (
      profile.role !== "ADMIN" ||
      profile.status !== "ACTIVE"
    ) {
      return NextResponse.json(
        { error: "Forbidden." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams
      .get("email")
      ?.trim()
      .toLowerCase();

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
        console.error(
          "Unable to list authentication users:",
          error
        );

        return NextResponse.json(
          { error: "Unable to find the selected user." },
          { status: 500 }
        );
      }

      const recipient = data.users.find(
        (item) =>
          item.email?.trim().toLowerCase() === email
      );

      if (recipient) {
        return NextResponse.json({
          id: recipient.id,
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
  } catch (error) {
    console.error(
      "Notification recipient lookup failed:",
      error
    );

    return NextResponse.json(
      { error: "Unable to find the selected user." },
      { status: 500 }
    );
  }
}