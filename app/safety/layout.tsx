import { requireUser } from "@/lib/auth/guards";

export default async function SafetyLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    await requireUser();

    return <>{children}</>;
}