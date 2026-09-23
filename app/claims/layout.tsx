import { requireUser } from "@/lib/auth/guards";

export default async function ClaimsLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    await requireUser();

    return children;
}