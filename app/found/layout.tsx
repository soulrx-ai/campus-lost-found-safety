import { requireUser } from "@/lib/auth/guards";

export default async function FoundLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    await requireUser();

    return children;
}