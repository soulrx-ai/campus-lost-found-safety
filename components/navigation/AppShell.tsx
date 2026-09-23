"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Theme = "light" | "dark";

type AppRole = "USER" | "STAFF" | "ADMIN";

type Profile = {
    id: string;
    full_name: string;
    role: AppRole;
};

type Notification = {
    id: string;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    created_at: string;
};

const AUTH_ROUTES = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/auth/callback",
];

export default function AppShell({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isAuthRoute = AUTH_ROUTES.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
    );

    if (isAuthRoute) return children;

    return <AuthenticatedShell key={pathname} pathname={pathname}>{children}</AuthenticatedShell>;
}

function AuthenticatedShell({ children, pathname }: {
    children: React.ReactNode;
    pathname: string;
}) {
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);

    const [theme, setTheme] = useState<Theme>("light");
    const [profile, setProfile] = useState<Profile | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notificationError, setNotificationError] = useState("");
    const [signingOut, setSigningOut] = useState(false);
    const [logoutError, setLogoutError] = useState("");
    const pendingReads = useRef(new Set<string>());
    const sidebarRef = useRef<HTMLDialogElement>(null);
    const controlsRef = useRef<HTMLDivElement>(null);

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    useEffect(() => {
        function syncTheme() {
            // Preserve an in-memory choice on route changes if storage is blocked.
            let nextTheme: Theme = document.documentElement.classList.contains("dark") ? "dark" : "light";
            try {
                nextTheme = localStorage.getItem("theme") === "dark" ? "dark" : "light";
            } catch {}
            document.documentElement.classList.toggle("dark", nextTheme === "dark");
            setTheme(nextTheme);
        }

        const frame = requestAnimationFrame(syncTheme);
        function handleStorage(event: StorageEvent) {
            if (event.key === "theme" || event.key === null) syncTheme();
        }
        window.addEventListener("storage", handleStorage);
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener("storage", handleStorage);
        };
    }, []);

    function toggleTheme() {
        const nextTheme: Theme = theme === "light" ? "dark" : "light";
        document.documentElement.classList.toggle("dark", nextTheme === "dark");
        setTheme(nextTheme);
        try {
            localStorage.setItem("theme", nextTheme);
        } catch {
            // Theme switching still works for this page without persistent storage.
        }
    }

    useEffect(() => {
        let active = true;

        async function loadShell() {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!active) return;

            if (!user) {
                setProfile(null);
                setNotifications([]);
                setLoading(false);
                return;
            }

            const [{ data: profileData }, { data: notificationData, error: listError }, { count, error: countError }] =
                await Promise.all([
                    supabase
                        .from("profiles")
                        .select("id, full_name, role")
                        .eq("id", user.id)
                        .single(),

                    supabase
                        .from("notifications")
                        .select(
                            "id, title, message, type, is_read, created_at"
                        )
                        .eq("user_id", user.id)
                        .order("created_at", { ascending: false })
                        .limit(8),
                    supabase
                        .from("notifications")
                        .select("id", { count: "exact", head: true })
                        .eq("user_id", user.id)
                        .eq("is_read", false),
                ]);

            if (!active) return;

            setProfile((profileData as Profile | null) ?? null);
            setNotifications(
                (notificationData as Notification[] | null) ?? []
            );
            setUnreadCount(count ?? 0);
            setNotificationError(listError || countError ? "Unable to load notifications. Please try again later." : "");
            setLoading(false);
        }

        void loadShell().catch(() => {
            if (active) setLoading(false);
        });

        return () => {
            active = false;
        };
    }, [supabase]);

    useEffect(() => {
        if (!notificationsOpen && !profileOpen) return;
        const previousFocus = document.activeElement;
        function dismiss(event: PointerEvent) {
            if (!controlsRef.current?.contains(event.target as Node)) {
                setNotificationsOpen(false);
                setProfileOpen(false);
            }
        }
        function escape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setNotificationsOpen(false);
                setProfileOpen(false);
                if (previousFocus instanceof HTMLElement) previousFocus.focus();
            }
        }
        document.addEventListener("pointerdown", dismiss);
        document.addEventListener("keydown", escape);
        return () => {
            document.removeEventListener("pointerdown", dismiss);
            document.removeEventListener("keydown", escape);
        };
    }, [notificationsOpen, profileOpen]);

    useEffect(() => {
        if (!sidebarOpen) return;

        const dialog = sidebarRef.current;
        const previousFocus = document.activeElement;
        dialog?.showModal();
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            dialog?.close();
            document.body.style.overflow = previousOverflow;
            if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
        };
    }, [sidebarOpen]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--background)]">
                {children}
            </div>
        );
    }

    /*
     * Protected pages already enforce authentication with the
     * existing server-side guards. If no profile is available here,
     * avoid rendering account-specific shell controls.
     */
    if (!profile) {
        return children;
    }

    async function markNotificationRead(id: string) {
        const target = notifications.find((notification) => notification.id === id);
        if (!target || target.is_read || !profile || pendingReads.current.has(id)) return;

        pendingReads.current.add(id);
        setNotificationError("");
        try {
            const { data, error } = await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("id", id)
                .eq("user_id", profile.id)
                .select("id")
                .maybeSingle();

            if (error || !data) {
                setNotificationError("Unable to mark this notification as read. Please try again.");
                return;
            }
            setNotifications((current) => current.map((notification) =>
                notification.id === id ? { ...notification, is_read: true } : notification
            ));
            setUnreadCount((current) => Math.max(0, current - 1));
        } catch {
            setNotificationError("Unable to mark this notification as read. Please try again.");
        } finally {
            pendingReads.current.delete(id);
        }
    }

    async function handleLogout() {
        setSigningOut(true);
        setLogoutError("");
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            router.replace("/login");
            router.refresh();
        } catch {
            setLogoutError("Unable to sign out. Please try again.");
        } finally {
            setSigningOut(false);
        }
    }

    return (
        <div className="flex min-h-screen flex-col bg-[var(--background)]">
            <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur">
                <div className="app-container">
                    <div className="flex min-h-16 items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                            <button
                                type="button"
                                aria-label="Open navigation menu"
                                aria-expanded={sidebarOpen}
                                aria-controls="app-sidebar"
                                onClick={() => {
                                    setNotificationsOpen(false);
                                    setProfileOpen(false);
                                    setSidebarOpen(true);
                                }}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]"
                            >
                                <MenuIcon />
                            </button>

                            <Link href="/" className="min-w-0">
                                <span className="block truncate text-base font-bold text-[var(--foreground)] sm:text-lg">
                                    Campus Lost &amp; Safety
                                </span>
                                <span className="hidden text-xs text-[var(--foreground-muted)] sm:block">
                                    Lost &amp; Found · Safety Services
                                </span>
                            </Link>
                        </div>

                        <div ref={controlsRef} className="relative flex shrink-0 items-center gap-2">
                            <div>
                                <button
                                    type="button"
                                    aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
                                    aria-controls="notification-panel"
                                    aria-expanded={notificationsOpen}
                                    onClick={() => {
                                        setNotificationsOpen((open) => !open);
                                        setProfileOpen(false);
                                    }}
                                    className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]"
                                >
                                    <BellIcon />

                                    {unreadCount > 0 && (
                                        <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[var(--danger-solid)] px-1 text-[10px] font-bold text-white">
                                            {unreadCount > 9 ? "9+" : unreadCount}
                                        </span>
                                    )}
                                </button>

                                {notificationsOpen && (
                                    <div id="notification-panel" className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-xl">
                                        <div className="border-b border-[var(--border)] px-4 py-3">
                                            <p className="font-semibold text-[var(--foreground)]">
                                                Notifications
                                            </p>
                                            <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
                                                {unreadCount} unread
                                            </p>
                                        </div>

                                        {notificationError && <p role="alert" className="px-4 py-3 text-sm text-[var(--danger)]">{notificationError}</p>}
                                        <div className="max-h-[min(24rem,calc(100dvh-10rem))] overflow-y-auto overscroll-contain">
                                            {notifications.length === 0 ? (
                                                <p className="px-4 py-8 text-center text-sm text-[var(--foreground-muted)]">
                                                    No notifications yet.
                                                </p>
                                            ) : (
                                                notifications.map((notification) => (
                                                    <button
                                                        key={notification.id}
                                                        type="button"
                                                        onClick={() =>
                                                            void markNotificationRead(
                                                                notification.id
                                                            )
                                                        }
                                                        className={`block w-full border-b border-[var(--border)] px-4 py-3 text-left transition last:border-b-0 hover:bg-[var(--surface-soft)] ${notification.is_read
                                                                ? "bg-[var(--surface)]"
                                                                : "bg-[var(--primary-soft)]"
                                                            }`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <span
                                                                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.is_read
                                                                        ? "bg-[var(--border-strong)]"
                                                                        : "bg-[var(--danger)]"
                                                                    }`}
                                                            />

                                                            <span className="min-w-0 [overflow-wrap:anywhere]">
                                                                <span className="block font-medium text-[var(--foreground)]">
                                                                    {notification.title}
                                                                </span>

                                                                <span className="mt-1 block text-xs leading-5 text-[var(--foreground-muted)]">
                                                                    {notification.message}
                                                                </span>

                                                                <span className="mt-1.5 block text-[11px] text-[var(--foreground-muted)]">
                                                                    {new Date(
                                                                        notification.created_at
                                                                    ).toLocaleString()}
                                                                </span>
                                                            </span>
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <button
                                    type="button"
                                    aria-label="Account menu"
                                    aria-controls="account-panel"
                                    aria-expanded={profileOpen}
                                    onClick={() => {
                                        setProfileOpen((open) => !open);
                                        setNotificationsOpen(false);
                                    }}
                                    className="flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2.5 text-[var(--foreground)] transition hover:bg-[var(--surface-soft)] sm:px-3"
                                >
                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--success-soft)] text-xs font-bold text-[var(--success)]">
                                        {profile.full_name.charAt(0).toUpperCase()}
                                    </span>

                                    <span className="hidden max-w-36 truncate text-sm font-medium sm:block">
                                        {profile.full_name}
                                    </span>

                                    <ChevronIcon />
                                </button>

                                {profileOpen && (
                                    <div id="account-panel" className="absolute right-0 top-12 z-50 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-xl">
                                        <div className="border-b border-[var(--border)] px-4 py-4">
                                            <p className="truncate font-semibold text-[var(--foreground)]">
                                                {profile.full_name}
                                            </p>
                                            <p className="mt-1 text-xs font-semibold text-[var(--success)]">
                                                {profile.role}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={toggleTheme}
                                            aria-label={`Appearance: ${theme === "dark" ? "Dark" : "Light"}. Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
                                            aria-pressed={theme === "dark"}
                                            className="flex min-h-11 w-full items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 text-left text-sm text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]"
                                        >
                                            <span>Appearance</span>
                                            <span className="text-[var(--foreground-muted)]">{theme === "dark" ? "Dark" : "Light"}</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => void handleLogout()}
                                            disabled={signingOut}
                                            className="w-full px-4 py-3 text-left text-sm font-medium text-[var(--danger)] transition hover:bg-[var(--danger-soft)]"
                                        >
                                            {signingOut ? "Signing out..." : "Sign out"}
                                        </button>
                                        {logoutError && <p role="alert" className="px-4 pb-3 text-xs text-[var(--danger)]">{logoutError}</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex-1">
                {pathname !== "/" && (
                    <div className="app-container pt-3">
                        <Link href="/" className="inline-flex min-h-9 items-center gap-2 rounded-md text-sm text-[var(--foreground-muted)] transition hover:text-[var(--success)]">
                            <span aria-hidden="true">&larr;</span>
                            Back to Home
                        </Link>
                    </div>
                )}
                {children}
            </div>

            <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
                <div className="app-container py-6">
                    <div className="flex flex-col gap-2 text-sm text-[var(--foreground-muted)] sm:flex-row sm:items-center sm:justify-between">
                        <p>
                            Lost &amp; Found &amp; Safety Incident Reporting System
                        </p>
                        <p>Walailak University</p>
                    </div>
                </div>
            </footer>

            {sidebarOpen && (
                <dialog
                    ref={sidebarRef}
                    id="app-sidebar"
                    aria-label="Main navigation"
                    onCancel={() => setSidebarOpen(false)}
                    onClick={(event) => {
                        if (event.target === event.currentTarget) setSidebarOpen(false);
                    }}
                    className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-[min(21rem,88vw)] max-w-none border-0 bg-[var(--surface)] p-0 text-[var(--foreground)] shadow-2xl backdrop:bg-black/30 backdrop:backdrop-blur-[1px] motion-safe:transition-transform motion-safe:duration-200 motion-safe:starting:-translate-x-full"
                >
                    <aside className="flex h-full flex-col border-r border-[var(--border)]">
                        <div className="flex min-h-16 shrink-0 items-center justify-between border-b border-[var(--border)] px-5">
                            <div>
                                <p className="font-bold text-[var(--foreground)]">
                                    Campus Lost &amp; Safety
                                </p>
                                <p className="text-xs text-[var(--foreground-muted)]">
                                    Navigation
                                </p>
                            </div>

                            <button
                                type="button"
                                aria-label="Close navigation menu"
                                onClick={() => setSidebarOpen(false)}
                                className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--foreground-muted)] transition hover:bg-[var(--surface-soft)]"
                            >
                                <CloseIcon />
                            </button>
                        </div>

                        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5" onClick={(event) => {
                            if ((event.target as HTMLElement).closest("a")) setSidebarOpen(false);
                        }}>
                            <NavSection title="General">
                                <SideLink href="/" label="Home" pathname={pathname} />
                                <SideLink
                                    href="/search"
                                    label="Lost & Found / Search"
                                    pathname={pathname}
                                />
                                <SideLink
                                    href="/matching"
                                    label="Find Matches"
                                    pathname={pathname}
                                />
                            </NavSection>

                            <NavSection title="Report">
                                <SideLink
                                    href="/lost/report"
                                    label="Report Lost"
                                    pathname={pathname}
                                />
                                <SideLink
                                    href="/found/report"
                                    label="Report Found"
                                    pathname={pathname}
                                />
                                <SideLink
                                    href="/safety/report"
                                    label="Report Safety"
                                    pathname={pathname}
                                    danger
                                />
                            </NavSection>

                            <NavSection title="My Activity">
                                <SideLink
                                    href="/claims"
                                    label="My Claims"
                                    pathname={pathname}
                                />
                                <SideLink
                                    href="/safety"
                                    label="Safety Updates"
                                    pathname={pathname}
                                />
                                <SideLink
                                    href="/tickets"
                                    label="Service Tickets"
                                    pathname={pathname}
                                />
                            </NavSection>

                            {profile.role === "STAFF" && (
                                <NavSection title="Staff">
                                    <SideLink
                                        href="/staff/items"
                                        label="Review Items"
                                        pathname={pathname}
                                    />
                                    <SideLink
                                        href="/staff/claims"
                                        label="Review Claims"
                                        pathname={pathname}
                                    />
                                    <SideLink
                                        href="/staff/safety"
                                        label="Review Safety"
                                        pathname={pathname}
                                    />
                                    <SideLink
                                        href="/staff/tickets"
                                        label="Manage Tickets"
                                        pathname={pathname}
                                    />
                                </NavSection>
                            )}

                            {profile.role === "ADMIN" && (
                                <NavSection title="Admin">
                                    <SideLink
                                        href="/admin"
                                        label="Dashboard"
                                        pathname={pathname}
                                    />
                                    <SideLink
                                        href="/admin/users"
                                        label="Users & Roles"
                                        pathname={pathname}
                                    />
                                    <SideLink
                                        href="/admin/notifications"
                                        label="Notifications"
                                        pathname={pathname}
                                    />
                                    <SideLink
                                        href="/admin/logs"
                                        label="Activity Logs"
                                        pathname={pathname}
                                    />
                                </NavSection>
                            )}
                        </nav>

                        <div className="shrink-0 border-t border-[var(--border)] p-4">
                            <div className="rounded-[var(--radius-md)] bg-[var(--surface-soft)] p-3">
                                <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                                    {profile.full_name}
                                </p>
                                <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
                                    {profile.role}
                                </p>
                            </div>
                        </div>
                    </aside>
                </dialog>
            )}
        </div>
    );
}

function NavSection({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="mb-6 last:mb-0">
            <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">
                {title}
            </p>
            <div className="space-y-1">{children}</div>
        </section>
    );
}

function SideLink({
    href,
    label,
    pathname,
    danger = false,
}: {
    href: string;
    label: string;
    pathname: string;
    danger?: boolean;
}) {
    const active =
        href === "/" || href === "/admin" || href === "/safety"
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);

    return (
        <Link
            href={href}
            aria-current={active ? "page" : undefined}
            className={`block rounded-xl px-3 py-2.5 text-sm font-medium transition ${active
                    ? danger
                        ? "bg-[var(--danger-soft)] text-[var(--danger)]"
                        : "bg-[var(--primary-soft)] text-[var(--foreground)]"
                    : danger
                        ? "text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                        : "text-[var(--foreground-muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
                }`}
        >
            {label}
        </Link>
    );
}

function MenuIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-5 w-5"
            aria-hidden="true"
        >
            <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    );
}

function BellIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden="true"
        >
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M10 21h4" />
        </svg>
    );
}

function ChevronIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4 text-[var(--foreground-muted)]"
            aria-hidden="true"
        >
            <path d="m7 10 5 5 5-5" />
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-5 w-5"
            aria-hidden="true"
        >
            <path d="M6 6l12 12M18 6 6 18" />
        </svg>
    );
}