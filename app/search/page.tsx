"use client";

import { AppMessage, Text } from "@/components/i18n/Text";

import { useEffect, useState } from "react";
import ItemCard from "@/components/search/ItemCard";
import SearchFilters, {
    SearchFilterValues,
} from "@/components/search/SearchFilters";

type SearchItem = {
    id: string;
    report_type: string;
    name: string;
    category: string;
    brand: string | null;
    color: string | null;
    date_time: string;
    location: string;
};

const initialFilters: SearchFilterValues = {
    name: "",
    category: "",
    brand: "",
    color: "",
    location: "",
    date: "",
    reportType: "",
};

export default function SearchPage() {
    const [filters, setFilters] =
        useState<SearchFilterValues>(initialFilters);

    const [items, setItems] = useState<SearchItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    useEffect(() => {
        void loadLatestItems();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function loadLatestItems() {
        await requestSearch(new URLSearchParams(), "No published items are available yet.");
    }

    async function requestSearch(params: URLSearchParams, emptyMessage: string) {
        setLoading(true);
        setMessage("");
        try {
            const response = await fetch(`/api/search?${params.toString()}`);
            const body = await response.json() as { results?: SearchItem[]; error?: string };
            if (!response.ok) throw new Error(body.error || "Unable to search items.");
            const results = body.results ?? [];
            setItems(results);
            if (results.length === 0) setMessage(emptyMessage);
        } catch (error: unknown) {
            setItems([]);
            setMessage(error instanceof Error ? error.message : "Unable to search items.");
        } finally {
            setLoading(false);
        }
    }

    async function searchItems() {
        const params = new URLSearchParams();
        if (filters.name.trim()) params.set("q", filters.name.trim());
        if (filters.category) params.set("category", filters.category);
        if (filters.brand.trim()) params.set("brand", filters.brand.trim());
        if (filters.color.trim()) params.set("color", filters.color.trim());
        if (filters.location.trim()) params.set("location", filters.location.trim());
        if (filters.reportType) params.set("report_type", filters.reportType);
        if (filters.date) params.set("date", filters.date);
        await requestSearch(params, "No published items matched your search.");
    }

    function clearFilters() {
        setFilters(initialFilters);
        void loadLatestItems();
    }

    return (
        <main className="page-shell">
            <div className="app-container">
                <div className="mx-auto max-w-6xl">
                    <header className="page-header mb-7">
                        <p className="page-eyebrow">
                            <Text id="Lost & Found" />
                        </p>

                        <h1 className="page-title">
                            <Text id="Search Items" />
                        </h1>

                        <p className="page-description">
                            <Text id="Search approved lost and found reports using item details, location, date or report type." />
                        </p>
                    </header>

                    <SearchFilters
                        filters={filters}
                        onChange={setFilters}
                        onSearch={searchItems}
                        onClear={clearFilters}
                        loading={loading}
                    />

                    {message && (
                        <div
                            role="status"
                            className="ui-card mt-6 p-4 text-sm text-[var(--foreground-muted)]"
                        >
                            <AppMessage text={message} />
                        </div>
                    )}

                    {items.length > 0 && (
                        <section className="mt-7">
                            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                                <div>
                                    <h2 className="text-lg font-semibold text-[var(--heading)]">
                                        <Text id="Published Items" />
                                    </h2>

                                    <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                                        <Text id="Latest published lost and found reports." />
                                    </p>
                                </div>

                                <span className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-medium text-[var(--primary)]">
                                    <Text id={items.length === 1 ? "{count} result" : "{count} results"} params={{ count: items.length }} />
                                </span>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                {items.map((item) => (
                                    <ItemCard
                                        key={item.id}
                                        item={item}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </main>
    );
}
