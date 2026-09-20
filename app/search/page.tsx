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
        <main className="min-h-screen bg-stone-50 px-4 py-10">
            <div className="mx-auto max-w-5xl">
                <div className="mb-6">
                    <p className="text-sm font-medium text-stone-500">
                        Lost & Found
                    </p>

                    <h1 className="mt-1 text-3xl font-bold">
                        Search Items
                    </h1>

                    <p className="mt-2 text-stone-600">
                        Search approved lost and found reports.
                    </p>
                </div>

                <SearchFilters
                    filters={filters}
                    onChange={setFilters}
                    onSearch={searchItems}
                    onClear={clearFilters}
                    loading={loading}
                />

                {message && (
                    <p className="mt-6 rounded-lg bg-white p-4 text-sm">
                        {message}
                    </p>
                )}

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {items.map((item) => (
                        <ItemCard key={item.id} item={item} />
                    ))}
                </div>
            </div>
        </main>
    );
}