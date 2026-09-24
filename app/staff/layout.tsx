import { requireStaff } from "@/lib/auth/guards";

export default async function StaffLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    await requireStaff();

    return <div data-accent="staff">{children}</div>;
}