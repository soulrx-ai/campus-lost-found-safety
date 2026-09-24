import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function checkAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "Unable to verify user permissions." },
      { status: 403 },
    );
  }

  if (profile.role !== "ADMIN" || profile.status !== "ACTIVE") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  return null;
}

export async function GET() {
  const denied = await checkAdmin();
  if (denied) return denied;

  try {
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("system_settings")
      .select("matching_threshold, data_retention_days, updated_at")
      .eq("id", "global")
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json(
        { error: "System configuration is unavailable. Apply the project migration first." },
        { status: 503 },
      );
    }

    return NextResponse.json({ settings: data });
  } catch {
    return NextResponse.json(
      { error: "Unable to load system settings." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const denied = await checkAdmin();
  if (denied) return denied;

  try {
    const body = (await request.json()) as {
      matching_threshold?: unknown;
      data_retention_days?: unknown;
    };

    const matchingThreshold = body.matching_threshold;
    const dataRetentionDays = body.data_retention_days;

    if (
      !Number.isInteger(matchingThreshold) ||
      Number(matchingThreshold) < 0 ||
      Number(matchingThreshold) > 100
    ) {
      return NextResponse.json(
        { error: "Matching threshold must be an integer from 0 to 100." },
        { status: 400 },
      );
    }

    if (
      !Number.isInteger(dataRetentionDays) ||
      Number(dataRetentionDays) < 1 ||
      Number(dataRetentionDays) > 3650
    ) {
      return NextResponse.json(
        { error: "Data retention period must be an integer from 1 to 3650." },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    const { data, error } = await admin
      .from("system_settings")
      .upsert(
        {
          id: "global",
          matching_threshold: Number(matchingThreshold),
          data_retention_days: Number(dataRetentionDays),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      )
      .select("matching_threshold, data_retention_days, updated_at")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Unable to save system settings." },
        { status: 500 },
      );
    }

    return NextResponse.json({ settings: data });
  } catch {
    return NextResponse.json(
      { error: "Unable to save system settings." },
      { status: 500 },
    );
  }
}