import { DisplayValue, Text } from "@/components/i18n/Text";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/guards";

export default async function MatchingPage() {
    const profile = await requireUser();
    const supabase = await createClient();

    const { data: lostItems } = await supabase
        .from("items")
        .select(
            "id, name, category, brand, color, location, date_time, status"
        )
        .eq("reporter_id", profile.id)
        .eq("report_type", "LOST")
        .eq("status", "PUBLISHED")
        .order("created_at", { ascending: false });

    return (
        <main className="page-shell">
            <div className="app-container">
                <div className="mx-auto max-w-5xl">
                    <header className="page-header mb-7">
                        <p className="page-eyebrow">
                            <Text id="Lost & Found" />
                        </p>

                        <h1 className="page-title">
                            <Text id="Find Potential Matches" />
                        </h1>

                        <p className="page-description">
                            <Text id="Select one of your published lost reports. The system will compare it with published found items." />
                        </p>
                    </header>

                    {!lostItems || lostItems.length === 0 ? (
                        <div className="ui-card p-6 sm:p-8">
                            <div className="max-w-lg">
                                <span className="inline-flex rounded-full bg-[var(--warning-soft)] px-3 py-1 text-xs font-semibold text-[var(--warning)]">
                                    <Text id="NO LOST REPORTS" />
                                </span>

                                <h2 className="mt-4 text-lg font-semibold text-[var(--heading)]">
                                    <Text id="No published lost reports available" />
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
                                    <Text id="Submit a lost item report first. Once Staff approves it, you can use it to find potential matches." />
                                </p>

                                <Link
                                    href="/lost/report"
                                    className="ui-button-primary mt-5"
                                >
                                    <Text id="Report Lost Item" />
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="mb-4 flex items-center justify-between">
                                <p className="text-sm text-[var(--foreground-muted)]">
                                    <Text id="Your published lost reports" />
                                </p>

                                <span className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-medium text-[var(--primary)]">
                                    <Text id={lostItems.length === 1 ? "{count} item" : "{count} items"} params={{ count: lostItems.length }} />
                                </span>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                {lostItems.map((item) => (
                                    <article
                                        key={item.id}
                                        className="ui-card flex h-full flex-col p-5"
                                    >
                                        <div>
                                            <span className="inline-flex rounded-full bg-[var(--warning-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--warning)]">
                                                <DisplayValue value="LOST" />
                                            </span>

                                            <h2 className="mt-3 text-lg font-semibold text-[var(--heading)]">
                                                {item.name}
                                            </h2>

                                            <dl className="mt-4 space-y-2 text-sm text-[var(--foreground-muted)]">
                                                <p>
                                                    <span className="font-medium text-[var(--foreground)]">
                                                        <Text id="Category:" />
                                                    </span>{" "}
                                                    <DisplayValue value={item.category} />
                                                </p>

                                                {item.brand && (
                                                    <p>
                                                        <span className="font-medium text-[var(--foreground)]">
                                                            <Text id="Brand:" />
                                                        </span>{" "}
                                                        {item.brand}
                                                    </p>
                                                )}

                                                {item.color && (
                                                    <p>
                                                        <span className="font-medium text-[var(--foreground)]">
                                                            <Text id="Color:" />
                                                        </span>{" "}
                                                        {item.color}
                                                    </p>
                                                )}

                                                <p>
                                                    <span className="font-medium text-[var(--foreground)]">
                                                        <Text id="Location:" />
                                                    </span>{" "}
                                                    {item.location}
                                                </p>
                                            </dl>
                                        </div>

                                        <div className="mt-auto pt-5">
                                            <Link
                                                href={`/matching/${item.id}`}
                                                className="ui-button-primary w-full"
                                            >
                                                <Text id="Find Matches" />
                                            </Link>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}