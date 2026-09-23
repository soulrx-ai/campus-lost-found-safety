import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/guards";
import PotentialMatches from "@/components/matching/PotentialMatches";

type PageProps = {
    params: Promise<{
        id: string;
    }>;
};

export default async function MatchDetailPage({
    params,
}: PageProps) {
    const { id } = await params;

    const profile = await requireUser();
    const supabase = await createClient();

    const { data: lostItem } = await supabase
        .from("items")
        .select(
            "id, report_type, name, category, brand, color, location, date_time"
        )
        .eq("id", id)
        .eq("reporter_id", profile.id)
        .eq("report_type", "LOST")
        .eq("status", "PUBLISHED")
        .single();

    if (!lostItem) {
        notFound();
    }

    const { data: foundItems } = await supabase
        .from("items")
        .select(
            "id, report_type, name, category, brand, color, location, date_time"
        )
        .eq("report_type", "FOUND")
        .eq("status", "PUBLISHED");

    return (
        <main className="page-shell">
            <div className="app-container">
                <div className="mx-auto max-w-5xl">
                    <header className="mb-7">
                        <p className="page-eyebrow">
                            Matching
                        </p>

                        <h1 className="page-title">
                            Potential Matches
                        </h1>

                        <p className="page-description">
                            Comparing published found items with your lost
                            report{" "}
                            <span className="font-semibold text-[var(--foreground)]">
                                {lostItem.name}
                            </span>
                            .
                        </p>
                    </header>

                    <div className="mb-6 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--warning-soft)] p-4">
                        <p className="text-sm font-medium text-[var(--warning)]">
                            Matching is only a suggestion
                        </p>

                        <p className="mt-1 text-sm leading-6 text-[var(--foreground-muted)]">
                            A match score does not confirm ownership. Items
                            scoring more than 70% can proceed to the claim
                            process for Staff review.
                        </p>
                    </div>

                    <PotentialMatches
                        lostItem={lostItem}
                        foundItems={foundItems ?? []}
                    />
                </div>
            </div>
        </main>
    );
}