import { Text } from "@/components/i18n/Text";
import ItemReviewCard from "@/components/staff/ItemReviewCard";
import { requireStaff } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export default async function StaffItemsPage() {
    const staff = await requireStaff();
    const supabase = await createClient();

    const { data: items, error } = await supabase
        .from("items")
        .select(
            "id, reporter_id, report_type, name, category, brand, color, description, location, date_time, image_url, status"
        )
        .eq("status", "PENDING_REVIEW")
        .order("created_at", { ascending: true });

    return (
        <main className="page-shell">
            <div className="app-container">
                <div className="mx-auto max-w-5xl">
                    <header className="mb-7">
                        <p className="page-eyebrow"><Text id="Staff Operations" /></p>

                        <h1 className="page-title">
                            <Text id="Lost & Found Review" />
                        </h1>

                        <p className="page-description">
                            <Text id="Review pending lost and found reports before they become visible in the published item workflow." />
                        </p>
                    </header>

                    {error ? (
                        <div className="rounded-2xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-5 text-sm text-[var(--danger)]">
                            <p className="font-semibold">
                                <Text id="Unable to load pending reports" />
                            </p>

                            <p className="mt-1">{error.message}</p>
                        </div>
                    ) : !items || items.length === 0 ? (
                        <div className="ui-card p-6 sm:p-8">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--success-soft)] text-lg font-semibold text-[var(--success)]">
                                ✓
                            </div>

                            <h2 className="mt-4 text-lg font-semibold text-[var(--foreground)]">
                                <Text id="No pending reports" />
                            </h2>

                            <p className="mt-2 max-w-lg text-sm leading-6 text-[var(--foreground-muted)]">
                                <Text id="There are currently no lost or found reports waiting for Staff review." />
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="ui-card mb-5 flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="font-medium text-[var(--foreground)]">
                                        <Text id="Review queue" />
                                    </p>

                                    <p className="mt-0.5 text-sm text-[var(--foreground-muted)]">
                                        <Text id="Oldest reports are shown first." />
                                    </p>
                                </div>

                                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--warning-soft)] px-3 py-1.5 text-sm font-medium text-[var(--warning)]">
                                    <span
                                        aria-hidden="true"
                                        className="h-2 w-2 rounded-full bg-[var(--warning)]"
                                    />

                                    {items.length} <Text id="pending" />
                                </div>
                            </div>

                            <div className="space-y-5">
                                {items.map((item) => (
                                    <ItemReviewCard
                                        key={item.id}
                                        item={item}
                                        staffId={staff.id}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}