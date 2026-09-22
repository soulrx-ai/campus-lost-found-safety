"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
    const supabase = createClient();

    const [filters, setFilters] =
        useState<SearchFilterValues>(initialFilters);

    const [items, setItems] = useState<SearchItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    async function searchItems() {
        setLoading(true);
        setMessage("");

        let query = supabase
            .from("items")
            .select(
                "id, report_type, name, category, brand, color, date_time, location"
            )
            .eq("status", "PUBLISHED")
            .order("date_time", { ascending: false });

        if (filters.name.trim()) {
            query = query.ilike(
                "name",
                `%${filters.name.trim()}%`
            );
        }

        if (filters.category) {
            query = query.eq("category", filters.category);
        }

        if (filters.brand.trim()) {
            query = query.ilike(
                "brand",
                `%${filters.brand.trim()}%`
            );
        }

        if (filters.color.trim()) {
            query = query.ilike(
                "color",
                `%${filters.color.trim()}%`
            );
        }

        if (filters.location.trim()) {
            query = query.ilike(
                "location",
                `%${filters.location.trim()}%`
            );
        }

        if (filters.reportType) {
            query = query.eq(
                "report_type",
                filters.reportType
            );
        }

        if (filters.date) {
            const start = new Date(`${filters.date}T00:00:00`);
            const end = new Date(`${filters.date}T23:59:59.999`);

            query = query
                .gte("date_time", start.toISOString())
                .lte("date_time", end.toISOString());
        }

        const { data, error } = await query;

        setLoading(false);

        if (error) {
            setItems([]);
            setMessage(error.message);
            return;
        }

        const results = (data ?? []) as SearchItem[];

        setItems(results);

        if (results.length === 0) {
            setMessage("No published items matched your search.");
        }
    }

    function clearFilters() {
        setFilters(initialFilters);
        setItems([]);
        setMessage("");
    }

    return (
        <main className="page-shell">
            <div className="app-container">
                <div className="mx-auto max-w-6xl">
                    <header className="mb-7">
                        <p className="page-eyebrow">
                            Lost & Found
                        </p>

                        <h1 className="page-title">
                            Search Items
                        </h1>

                        <p className="page-description">
                            Search approved lost and found reports using
                            item details, location, date or report type.
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
                            {message}
                        </div>
                    )}

                    {items.length > 0 && (
                        <section className="mt-7">
                            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                                <div>
                                    <h2 className="text-lg font-semibold text-[var(--foreground)]">
                                        Search Results
                                    </h2>

                                    <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                                        Published reports matching your filters.
                                    </p>
                                </div>

                                <span className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-medium text-[var(--primary)]">
                                    {items.length} result
                                    {items.length === 1 ? "" : "s"}
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