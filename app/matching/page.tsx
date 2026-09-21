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
        <main className="min-h-screen bg-stone-50 px-4 py-10">
            <div className="mx-auto max-w-4xl">
                <div className="mb-8">
                    <p className="text-sm font-medium text-stone-500">
                        Lost & Found
                    </p>

                    <h1 className="mt-1 text-3xl font-bold text-stone-900">
                        Find Potential Matches
                    </h1>

                    <p className="mt-2 text-stone-600">
                        Select one of your lost item reports to compare it with
                        published found items.
                    </p>
                </div>

                {!lostItems || lostItems.length === 0 ? (
                    <div className="rounded-2xl border border-stone-200 bg-white p-6">
                        <p className="text-stone-600">
                            You do not have any lost item reports yet.
                        </p>

                        <Link
                            href="/lost/report"
                            className="mt-4 inline-block rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white"
                        >
                            Report Lost Item
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {lostItems.map((item) => (
                            <div
                                key={item.id}
                                className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div>
                                        <h2 className="font-semibold text-stone-900">
                                            {item.name}
                                        </h2>

                                        <div className="mt-2 space-y-1 text-sm text-stone-600">
                                            <p>Category: {item.category}</p>

                                            {item.brand && <p>Brand: {item.brand}</p>}

                                            {item.color && <p>Color: {item.color}</p>}

                                            <p>Location: {item.location}</p>

                                            <p>Status: {item.status}</p>
                                        </div>
                                    </div>

                                    <Link
                                        href={`/matching/${item.id}`}
                                        className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
                                    >
                                        Find Matches
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}