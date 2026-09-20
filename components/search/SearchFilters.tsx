export type SearchFilterValues = {
    name: string;
    category: string;
    brand: string;
    color: string;
    location: string;
    date: string;
    reportType: string;
};

type Props = {
    filters: SearchFilterValues;
    onChange: (filters: SearchFilterValues) => void;
    onSearch: () => void;
    onClear: () => void;
    loading: boolean;
};

export default function SearchFilters({
    filters,
    onChange,
    onSearch,
    onClear,
    loading,
}: Props) {
    function update(
        field: keyof SearchFilterValues,
        value: string
    ) {
        onChange({
            ...filters,
            [field]: value,
        });
    }

    return (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <input
                    type="text"
                    placeholder="Item name"
                    value={filters.name}
                    onChange={(e) => update("name", e.target.value)}
                    className="rounded-lg border border-stone-300 px-3 py-2"
                />

                <select
                    value={filters.category}
                    onChange={(e) => update("category", e.target.value)}
                    className="rounded-lg border border-stone-300 px-3 py-2"
                >
                    <option value="">All categories</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Wallet">Wallet</option>
                    <option value="Bag">Bag</option>
                    <option value="Document">Document</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Accessory">Accessory</option>
                    <option value="Other">Other</option>
                </select>

                <input
                    type="text"
                    placeholder="Brand"
                    value={filters.brand}
                    onChange={(e) => update("brand", e.target.value)}
                    className="rounded-lg border border-stone-300 px-3 py-2"
                />

                <input
                    type="text"
                    placeholder="Color"
                    value={filters.color}
                    onChange={(e) => update("color", e.target.value)}
                    className="rounded-lg border border-stone-300 px-3 py-2"
                />

                <input
                    type="text"
                    placeholder="Location"
                    value={filters.location}
                    onChange={(e) => update("location", e.target.value)}
                    className="rounded-lg border border-stone-300 px-3 py-2"
                />

                <input
                    type="date"
                    value={filters.date}
                    onChange={(e) => update("date", e.target.value)}
                    className="rounded-lg border border-stone-300 px-3 py-2"
                />

                <select
                    value={filters.reportType}
                    onChange={(e) => update("reportType", e.target.value)}
                    className="rounded-lg border border-stone-300 px-3 py-2"
                >
                    <option value="">Lost & Found</option>
                    <option value="LOST">Lost</option>
                    <option value="FOUND">Found</option>
                </select>
            </div>

            <div className="mt-5 flex gap-3">
                <button
                    type="button"
                    onClick={onSearch}
                    disabled={loading}
                    className="rounded-lg bg-stone-800 px-5 py-2 text-white disabled:opacity-50"
                >
                    {loading ? "Searching..." : "Search"}
                </button>

                <button
                    type="button"
                    onClick={onClear}
                    className="rounded-lg border border-stone-300 px-5 py-2"
                >
                    Clear
                </button>
            </div>
        </div>
    );
}