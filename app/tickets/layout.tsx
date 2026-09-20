import { requireUser } from "@/lib/auth/guards";

export default async function TicketsLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    await requireUser();

    return <>{children}</>;
}