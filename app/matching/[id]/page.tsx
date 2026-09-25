import { Text } from "@/components/i18n/Text";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/guards";
import PotentialMatches from "@/components/matching/PotentialMatches";

import { createAdminClient } from "@/lib/supabase/admin";

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

    const { data: lostItem, error: lostError } = await supabase
        .from("items")
        .select(
            "id, report_type, name, category, brand, color, location, date_time"
        )
        .eq("id", id)
        .eq("reporter_id", profile.id)
        .eq("report_type", "LOST")
        .eq("status", "PUBLISHED")
        .maybeSingle();

    if (lostError) throw new Error("Unable to load lost report.");
    if (!lostItem) {
        notFound();
    }

    const { data: foundItems, error: foundError } = await supabase
        .from("items")
        .select(
            "id, report_type, name, category, brand, color, location, date_time"
        )
        .eq("report_type", "FOUND")
        .eq("status", "PUBLISHED");

    if (foundError) throw new Error("Unable to load found reports.");
    const admin = createAdminClient();
    const { data: settings, error: settingsError } = await admin.from("system_settings").select("matching_threshold").eq("id", "global").maybeSingle();
    if (settingsError || !settings || !Number.isInteger(settings.matching_threshold) || settings.matching_threshold < 0 || settings.matching_threshold > 100) throw new Error("Unable to load matching settings.");
    const matchingThreshold = settings.matching_threshold;

    return (
        <main className="page-shell">
            <div className="app-container">
                <div className="mx-auto max-w-5xl">
                    <header className="page-header mb-7">
                        <p className="page-eyebrow">
                            <Text id="Matching" />
                        </p>

                        <h1 className="page-title">
                            <Text id="Potential Matches" />
                        </h1>

                        <p className="page-description">
                            <Text id="Comparing published found items with your lost report" />{" "}
                            <span className="font-semibold text-[var(--foreground)]">
                                {lostItem.name}
                            </span>
                            .
                        </p>
                    </header>

                    <div className="mb-6 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--warning-soft)] p-4">
                        <p className="text-sm font-medium text-[var(--warning)]">
                            <Text id="Matching is only a suggestion" />
                        </p>

                        <p className="mt-1 text-sm leading-6 text-[var(--foreground-muted)]">
                            <Text id="Match threshold guidance" params={{ threshold: matchingThreshold }} />
                        </p>
                    </div>

                    <PotentialMatches
                        lostItem={lostItem}
                        foundItems={foundItems ?? []}
                        matchingThreshold={matchingThreshold}
                    />
                </div>
            </div>
        </main>
    );
}