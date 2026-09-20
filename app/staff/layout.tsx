import StaffNavigation from "@/components/staff/StaffNavigation";
import { requireStaff } from "@/lib/auth/guards";

export default async function StaffLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    await requireStaff();

    return (
        <>
            <StaffNavigation />
            {children}
        </>
    );
}