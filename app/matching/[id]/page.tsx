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
        <main className="min-h-screen bg-stone-50 px-4 py-10">
            <div className="mx-auto max-w-4xl">
                <div className="mb-8">
                    <p className="text-sm font-medium text-stone-500">
                        Matching
                    </p>

                    <h1 className="mt-1 text-3xl font-bold text-stone-900">
                        Potential Matches
                    </h1>

                    <p className="mt-2 text-stone-600">
                        Comparing published found items with your lost report:
                        {" "}
                        <span className="font-medium text-stone-900">
                            {lostItem.name}
                        </span>
                    </p>
                </div>

                <PotentialMatches
                    lostItem={lostItem}
                    foundItems={foundItems ?? []}
                />
            </div>
        </main>
    );
}