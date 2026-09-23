import { requireStaff } from "@/lib/auth/guards";

export default async function StaffLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    await requireStaff();

    return children;
}