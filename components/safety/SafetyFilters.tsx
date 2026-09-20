export type SafetyFilterValues = {
  location: string;
  date: string;
  status: string;
};

type Props = {
  filters: SafetyFilterValues;
  onChange: (filters: SafetyFilterValues) => void;
  onSearch: () => void;
  onClear: () => void;
  loading: boolean;
};

export default function SafetyFilters({
  filters,
  onChange,
  onSearch,
  onClear,
  loading,
}: Props) {
  function update(
    field: keyof SafetyFilterValues,
    value: string
  ) {
    onChange({
      ...filters,
      [field]: value,
    });
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-3">
        <input
          type="text"
          value={filters.location}
          onChange={(e) =>
            update("location", e.target.value)
          }
          placeholder="Location"
          className="rounded-lg border border-stone-300 px-3 py-2"
        />

        <input
          type="date"
          value={filters.date}
          onChange={(e) => update("date", e.target.value)}
          className="rounded-lg border border-stone-300 px-3 py-2"
        />

        <select
          value={filters.status}
          onChange={(e) =>
            update("status", e.target.value)
          }
          className="rounded-lg border border-stone-300 px-3 py-2"
        >
          <option value="">Published incidents</option>
          <option value="PUBLISHED">Published</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={onSearch}
          disabled={loading}
          className="rounded-lg bg-red-700 px-5 py-2 text-white disabled:opacity-50"
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