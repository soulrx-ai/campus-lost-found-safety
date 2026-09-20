import { requireUser } from "@/lib/auth/guards";
import AppNavigation from "@/components/navigation/AppNavigation";

export default async function MatchingLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const profile = await requireUser();

    return (
        <>
            <AppNavigation
                fullName={profile.full_name}
                role={profile.role}
            />
            {children}
        </>
    );
}