import Link from "next/link";
import LogoutButton from "@/components/auth/LogoutButton";

export default function StaffNavigation() {
    return (
        <header className="border-b border-stone-200 bg-white">
            <div className="mx-auto max-w-7xl px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <Link
                            href="/"
                            className="text-lg font-bold text-stone-900"
                        >
                            Campus Lost & Found
                        </Link>

                        <p className="text-xs text-stone-500">
                            Staff Operations
                        </p>
                    </div>

                    <LogoutButton />
                </div>

                <nav className="mt-4 flex flex-wrap gap-2">
                    <NavLink href="/">Home</NavLink>
                    <NavLink href="/staff/items">Review Items</NavLink>
                    <NavLink href="/staff/claims">Review Claims</NavLink>
                    <NavLink href="/staff/safety">Review Safety</NavLink>
                    <NavLink href="/staff/tickets">Manage Tickets</NavLink>
                </nav>
            </div>
        </header>
    );
}

function NavLink({
    href,
    children,
}: {
    href: string;
    children: React.ReactNode;
}) {
    return (
        <Link
            href={href}
            className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100 hover:text-stone-900"
        >
            {children}
        </Link>
    );
}