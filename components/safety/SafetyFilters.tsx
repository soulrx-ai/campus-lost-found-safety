export type SafetyFilterValues = {
  location: string;
  date: string;
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
    <section className="ui-card overflow-hidden">
      <div className="border-b border-[var(--border)] bg-[var(--surface-soft)] px-5 py-4 sm:px-6">
        <h2 className="font-semibold text-[var(--foreground)]">
          Filter incidents
        </h2>

        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
          Narrow the published safety reports shown below.
        </p>
      </div>

      <div className="p-5 sm:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="safety-location"
              className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
            >
              Location
            </label>

            <input
              id="safety-location"
              type="text"
              value={filters.location}
              onChange={(event) =>
                update("location", event.target.value)
              }
              placeholder="e.g. Thaiburi Building"
              className="ui-input"
            />
          </div>

          <div>
            <label
              htmlFor="safety-date"
              className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
            >
              Date
            </label>

            <input
              id="safety-date"
              type="date"
              value={filters.date}
              onChange={(event) =>
                update("date", event.target.value)
              }
              className="ui-input"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClear}
            disabled={loading}
            className="ui-button-secondary w-full sm:w-auto"
          >
            Clear filters
          </button>

          <button
            type="button"
            onClick={onSearch}
            disabled={loading}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-md)] bg-[var(--danger-solid)] px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {loading ? "Searching..." : "Search incidents"}
          </button>
        </div>
      </div>
    </section>
  );
}