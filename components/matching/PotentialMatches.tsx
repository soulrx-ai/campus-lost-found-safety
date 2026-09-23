"use client";

import { DisplayValue, Text } from "@/components/i18n/Text";

import Link from "next/link";
import {
    calculateMatch,
    MatchableItem,
} from "@/lib/matching/calculateMatch";

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
            const result = calculateMatch(
                lostItem,
                foundItem
            );

            return {
                item: foundItem,
                ...result,
            };
        })
        .sort((a, b) => b.score - a.score);

    if (matches.length === 0) {
        return (
            <div className="ui-card p-6 sm:p-8">
                <h2 className="font-semibold text-[var(--foreground)]">
                    <Text id="No found items available" />
                </h2>

                <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                    <Text id="There are currently no published found items available for comparison." />
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {matches.map(
                ({
                    item,
                    isPotentialMatch,
                }) => (
                    <article
                        key={item.id}
                        className="ui-card overflow-hidden"
                    >
                        <div className="p-5 sm:p-6">
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                    <span className="inline-flex rounded-full bg-[var(--success-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--success)]">
                                        <DisplayValue value="FOUND" />
                                    </span>

                                    <h2 className="mt-3 break-words text-lg font-semibold text-[var(--foreground)]">
                                        {item.name}
                                    </h2>

                                    <div className="mt-4 grid gap-2 text-sm text-[var(--foreground-muted)]">
                                        <p>
                                            <strong className="font-medium text-[var(--foreground)]">
                                                <Text id="Category:" />
                                            </strong>{" "}
                                            <DisplayValue value={item.category} />
                                        </p>

                                        {item.brand && (
                                            <p>
                                                <strong className="font-medium text-[var(--foreground)]">
                                                    <Text id="Brand:" />
                                                </strong>{" "}
                                                {item.brand}
                                            </p>
                                        )}

                                        {item.color && (
                                            <p>
                                                <strong className="font-medium text-[var(--foreground)]">
                                                    <Text id="Color:" />
                                                </strong>{" "}
                                                {item.color}
                                            </p>
                                        )}

                                        <p>
                                            <strong className="font-medium text-[var(--foreground)]">
                                                <Text id="Location:" />
                                            </strong>{" "}
                                            {item.location}
                                        </p>

                                        <p>
                                            <strong className="font-medium text-[var(--foreground)]">
                                                <Text id="Date:" />
                                            </strong>{" "}
                                            {new Date(
                                                item.date_time
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {isPotentialMatch ? (
                            <div className="border-t border-[var(--border)] bg-[var(--success-soft)] p-4 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:px-6">
                                <div>
                                    <p className="font-semibold text-[var(--success)]">
                                        <Text id="Potential Match" />
                                    </p>

                                    <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                                        <Text id="This found item has similar details to your lost report." />
                                    </p>
                                </div>

                                <Link
                                    href={`/claims/new?item=${item.id}`}
                                    className="ui-button-primary mt-4 w-full sm:mt-0 sm:w-auto"
                                >
                                    <Text id="Claim Item" />
                                </Link>
                            </div>
                        ) : (
                            <div className="border-t border-[var(--border)] bg-[var(--surface-soft)] px-5 py-4 text-sm text-[var(--foreground-muted)] sm:px-6">
                                <Text id="This item does not currently meet the potential-match criteria." />
                            </div>
                        )}
                    </article>
                )
            )}
        </div>
    );
}