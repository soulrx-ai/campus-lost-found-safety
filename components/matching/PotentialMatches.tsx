"use client";

import Link from "next/link";
import { calculateMatch, MatchableItem } from "@/lib/matching/calculateMatch";

type Item = MatchableItem & {
    id: string;
    report_type: string;
    brand: string | null;
};

type Props = {
    lostItem: Item;
    foundItems: Item[];
};

export default function PotentialMatches({
    lostItem,
    foundItems,
}: Props) {
    const matches = foundItems
        .map((foundItem) => {
            const result = calculateMatch(lostItem, foundItem);

            return {
                item: foundItem,
                ...result,
            };
        })
        .sort((a, b) => b.score - a.score);

    if (matches.length === 0) {
        return (
            <div className="rounded-2xl border border-stone-200 bg-white p-6">
                <p className="text-stone-600">
                    No published found items are available for comparison.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {matches.map(({ item, score, isPotentialMatch }) => (
                <div
                    key={item.id}
                    className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
                >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-sm font-medium text-stone-500">
                                Found Item
                            </p>

                            <h2 className="mt-1 text-lg font-semibold text-stone-900">
                                {item.name}
                            </h2>

                            <div className="mt-3 space-y-1 text-sm text-stone-600">
                                <p>Category: {item.category}</p>

                                {item.brand && <p>Brand: {item.brand}</p>}

                                {item.color && <p>Color: {item.color}</p>}

                                <p>Location: {item.location}</p>

                                <p>
                                    Date:{" "}
                                    {new Date(item.date_time).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        <div className="text-right">
                            <p className="text-2xl font-bold text-stone-900">
                                {score}%
                            </p>

                            <p className="text-sm text-stone-500">
                                Match Score
                            </p>
                        </div>
                    </div>

                    {isPotentialMatch ? (
                        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-stone-100 p-4">
                            <div>
                                <p className="font-semibold text-stone-900">
                                    Potential Match
                                </p>

                                <p className="text-sm text-stone-600">
                                    This item scored more than 70%.
                                </p>
                            </div>

                            <Link
                                href={`/claims/new?item=${item.id}`}
                                className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
                            >
                                Claim Item
                            </Link>
                        </div>
                    ) : (
                        <p className="mt-4 text-sm text-stone-500">
                            Match score is not high enough to be considered a potential
                            match.
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
}