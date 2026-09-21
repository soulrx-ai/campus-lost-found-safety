import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const supabase = await createClient();

  // Supabase's PKCE email flow redirects here with a one-time code.
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL("/reset-password", origin));
    }
  }

  // Keep supporting recovery links that provide a token hash directly.
  if (tokenHash && type === "recovery") {
    const { error } = await supabase.auth.verifyOtp({
      type: "recovery",
      token_hash: tokenHash,
    });

    if (!error) {
      return NextResponse.redirect(
        new URL("/reset-password", origin)
      );
    }
  }

  // Token ไม่ถูกต้องหรือหมดอายุ — redirect กลับไปขอ reset ใหม่
  return NextResponse.redirect(
    new URL(
      "/forgot-password?error=invalid_token",
      origin
    )
  );
}
