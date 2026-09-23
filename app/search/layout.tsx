import { requireUser } from "@/lib/auth/guards";

export default async function SearchLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    await requireUser();

    return children;
}