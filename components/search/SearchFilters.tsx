"use client";

import { Text, UiText } from "@/components/i18n/Text";
import { useLanguage } from "@/components/i18n/LanguageProvider";
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
  const { t } = useLanguage();
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
        <section className="ui-card overflow-hidden">
            <div className="border-b border-[var(--border)] bg-[var(--surface-soft)] px-5 py-4 sm:px-6">
                <h2 className="font-semibold text-[var(--foreground)]">
                    <Text id="Search Filters" />
                </h2>

                <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                    <Text id="Use one or more fields to narrow the results." />
                </p>
            </div>

            <div className="p-5 sm:p-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <FilterField label="Item name">
                        <input
                            type="text"
                            placeholder={t("e.g. AirPods")}
                            value={filters.name}
                            onChange={(e) =>
                                update("name", e.target.value)
                            }
                            className="ui-input"
                        />
                    </FilterField>

                    <FilterField label="Category">
                        <select
                            value={filters.category}
                            onChange={(e) =>
                                update("category", e.target.value)
                            }
                            className="ui-input"
                        >
                            <option value=""><Text id="All categories" /></option>
                            <option value="Electronics">
                                <Text id="Electronics" />
                            </option>
                            <option value="Wallet"><Text id="Wallet" /></option>
                            <option value="Bag"><Text id="Bag" /></option>
                            <option value="Document"><Text id="Document" /></option>
                            <option value="Clothing"><Text id="Clothing" /></option>
                            <option value="Accessory"><Text id="Accessory" /></option>
                            <option value="Other"><Text id="Other" /></option>
                        </select>
                    </FilterField>

                    <FilterField label="Brand">
                        <input
                            type="text"
                            placeholder={t("e.g. Apple")}
                            value={filters.brand}
                            onChange={(e) =>
                                update("brand", e.target.value)
                            }
                            className="ui-input"
                        />
                    </FilterField>

                    <FilterField label="Color">
                        <input
                            type="text"
                            placeholder={t("e.g. Black")}
                            value={filters.color}
                            onChange={(e) =>
                                update("color", e.target.value)
                            }
                            className="ui-input"
                        />
                    </FilterField>

                    <FilterField label="Location">
                        <input
                            type="text"
                            placeholder={t("e.g. Thaiburi Building")}
                            value={filters.location}
                            onChange={(e) =>
                                update("location", e.target.value)
                            }
                            className="ui-input"
                        />
                    </FilterField>

                    <FilterField label="Date">
                        <input
                            type="date"
                            value={filters.date}
                            onChange={(e) =>
                                update("date", e.target.value)
                            }
                            className="ui-input"
                        />
                    </FilterField>

                    <FilterField label="Report type">
                        <select
                            value={filters.reportType}
                            onChange={(e) =>
                                update("reportType", e.target.value)
                            }
                            className="ui-input"
                        >
                            <option value=""><Text id="Lost & Found" /></option>
                            <option value="LOST"><Text id="Lost" /></option>
                            <option value="FOUND"><Text id="Found" /></option>
                        </select>
                    </FilterField>
                </div>

                <div className="mt-6 flex flex-col gap-3 border-t border-[var(--border)] pt-5 sm:flex-row">
                    <button
                        type="button"
                        onClick={onSearch}
                        disabled={loading}
                        className="ui-button-primary sm:min-w-28"
                    >
                        {loading ? <Text id="Searching..." /> : <Text id="Search" />}
                    </button>

                    <button
                        type="button"
                        onClick={onClear}
                        disabled={loading}
                        className="ui-button-secondary sm:min-w-24"
                    >
                        <Text id="Clear" />
                    </button>
                </div>
            </div>
        </section>
    );
}

function FilterField({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                <UiText text={label} />
            </span>
            {children}
        </label>
    );
}