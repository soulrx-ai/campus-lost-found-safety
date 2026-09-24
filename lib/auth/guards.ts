import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AppRole = "USER" | "STAFF" | "ADMIN";

type Profile = {
    id: string;
    full_name: string;
    role: AppRole;
    status: "ACTIVE" | "INACTIVE";
};

export async function requireUser(): Promise<Profile> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // ยังไม่ได้ Login
    if (!user) {
        redirect("/login");
    }

    // อ่าน Role และ Status จาก profiles
    const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, full_name, role, status")
        .eq("id", user.id)
        .single();

    // ไม่มี Profile
    if (error || !profile) {
        redirect("/login");
    }

    // บัญชีถูกปิดใช้งาน
    if (profile.status !== "ACTIVE") {
        redirect("/login?error=inactive");
    }

    return profile as Profile;
}

export async function requireStaff(): Promise<Profile> {
    const profile = await requireUser();

    // STAFF และ ADMIN สามารถเข้า Staff area ได้
    if (profile.role !== "STAFF" && profile.role !== "ADMIN") {
        redirect("/");
    }

    return profile;
}

export async function requireAdmin(): Promise<Profile> {
    const profile = await requireUser();

    // เฉพาะ ADMIN
    if (profile.role !== "ADMIN") {
        redirect("/");
    }

    return profile;
}
