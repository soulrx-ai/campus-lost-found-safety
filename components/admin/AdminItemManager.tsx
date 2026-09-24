"use client";

import { AppMessage, DisplayValue, Text } from "@/components/i18n/Text";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import CategoryManager from "@/components/admin/CategoryManager";
import { useCategories } from "@/components/categories/useCategories";
import { FormEvent, useEffect, useState } from "react";

type Item = {
  id: string;
  reporter_id: string;
  report_type: string;
  name: string;
  category: string;
  brand: string | null;
  color: string | null;
  description: string | null;
  location: string;
  date_time: string;
  image_url: string;
  image_preview_url?: string | null;
  status: string;
  created_at: string;
};

type ItemDraft = {
  name: string;
  category: string;
  brand: string;
  color: string;
  description: string;
  location: string;
  date_time: string;
};

type ListResponse = {
  items: Item[];
  total: number;
  page: number;
  pageSize: number;
  error?: string;
};

type SystemSettings = {
  matching_threshold: number;
  data_retention_days: number;
  updated_at?: string;
};

const inputClass =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)]";

const greenActionButtonClass =
  "!bg-[#187f7a] !text-white hover:!bg-[#106661] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#187f7a]";

function toDateTimeInput(value: string) {
  const date = new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

function toDraft(item: Item): ItemDraft {
  return {
    name: item.name,
    category: item.category,
    brand: item.brand ?? "",
    color: item.color ?? "",
    description: item.description ?? "",
    location: item.location,
    date_time: toDateTimeInput(item.date_time),
  };
}

export default function AdminItemManager() {
  const { t } = useLanguage();
  const { categories, error: categoriesError, refreshCategories } = useCategories();
  const [activeTab, setActiveTab] = useState<"items" | "categories">("items");

  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [searchDraft, setSearchDraft] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    location: "",
    reportType: "",
    status: "",
  });

  const [editing, setEditing] = useState<Item | null>(null);
  const [draft, setDraft] = useState<ItemDraft | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState<Item | null>(null);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [settingsNotice, setSettingsNotice] = useState("");
  const [settingsDraft, setSettingsDraft] = useState({
    matching_threshold: "70",
    data_retention_days: "30",
  });

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      setSettingsLoading(true);
      setSettingsError("");

      try {
        const response = await fetch("/api/admin/system-settings", {
          cache: "no-store",
        });
        const result = (await response.json()) as {
          settings?: SystemSettings;
          error?: string;
        };

        if (!response.ok || !result.settings) {
          throw new Error(result.error ?? "Unable to load system settings.");
        }

        if (!cancelled) {
          setSettingsDraft({
            matching_threshold: String(result.settings.matching_threshold),
            data_retention_days: String(result.settings.data_retention_days),
          });
        }
      } catch (loadError) {
        if (!cancelled) {
          setSettingsError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load system settings.",
          );
        }
      } finally {
        if (!cancelled) setSettingsLoading(false);
      }
    }

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadItems() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: String(page),
        });

        if (filters.search) params.set("search", filters.search);
        if (filters.category) params.set("category", filters.category);
        if (filters.location) params.set("location", filters.location);
        if (filters.reportType) params.set("reportType", filters.reportType);
        if (filters.status) params.set("status", filters.status);

        const response = await fetch(`/api/admin/items?${params.toString()}`);
        const result = (await response.json()) as ListResponse;

        if (!response.ok) {
          throw new Error(result.error ?? "Unable to load items.");
        }

        if (!cancelled) {
          setItems(result.items);
          setTotal(result.total);
          setPageSize(result.pageSize);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load items.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadItems();

    return () => {
      cancelled = true;
    };
  }, [filters, page, refreshKey]);

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSettingsSaving(true);
    setSettingsError("");
    setSettingsNotice("");

    try {
      const payload = {
        matching_threshold: Number(settingsDraft.matching_threshold),
        data_retention_days: Number(settingsDraft.data_retention_days),
      };

      const response = await fetch("/api/admin/system-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as {
        settings?: SystemSettings;
        error?: string;
      };

      if (!response.ok || !result.settings) {
        throw new Error(result.error ?? "Unable to save system settings.");
      }
      setSettingsDraft({
        matching_threshold: String(result.settings.matching_threshold),
        data_retention_days: String(result.settings.data_retention_days),
      });
      setSettingsNotice("Settings saved.");
    } catch (saveError) {
      setSettingsError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save system settings.",
      );
    } finally {
      setSettingsSaving(false);
    }
  }

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    setFilters({
      search: searchDraft.trim(),
      category: String(formData.get("category") ?? "").trim(),
      location: String(formData.get("location") ?? "").trim(),
      reportType: String(formData.get("reportType") ?? ""),
      status: String(formData.get("status") ?? ""),
    });
    setPage(1);
    setNotice("");
  }

  function clearFilters() {
    setSearchDraft("");
    setFilters({
      search: "",
      category: "",
      location: "",
      reportType: "",
      status: "",
    });
    setPage(1);
    setNotice("");
  }

  async function saveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || !draft) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`/api/admin/items/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to update item.");
      }

      setEditing(null);
      setDraft(null);
      setNotice("Item updated.");
      setRefreshKey((current) => current + 1);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update item.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem() {
    if (!deleting || !deleteConfirmed) return;

    setDeletingBusy(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(`/api/admin/items/${deleting.id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to delete item.");
      }

      setDeleting(null);
      setDeleteConfirmed(false);
      setNotice(
        result.imageCleanupWarning
          ? result.imageCleanupWarning
          : "Item deleted.",
      );

      // Trigger a reload by changing the current page filter object.
      setRefreshKey((current) => current + 1);
    } catch (deleteFailure) {
      setDeleting(null);
      setDeleteConfirmed(false);
      setDeleteError(
        deleteFailure instanceof Error
          ? deleteFailure.message
          : "Unable to delete item.",
      );
    } finally {
      setDeletingBusy(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label={t("Item Management sections")}
        className="flex gap-2 border-b border-[var(--border)]"
      >
        <button
          type="button"
          id="admin-items-tab"
          role="tab"
          aria-selected={activeTab === "items"}
          aria-controls="admin-items-panel"
          onClick={() => setActiveTab("items")}
          className={`rounded-t-xl border border-b-0 px-4 py-3 text-sm font-medium transition ${
            activeTab === "items"
              ? "border-[var(--border)] bg-[var(--surface)] text-[var(--success)]"
              : "border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <Text id="Item Management" />
        </button>
        <button
          type="button"
          id="admin-categories-tab"
          role="tab"
          aria-selected={activeTab === "categories"}
          aria-controls="admin-categories-panel"
          onClick={() => setActiveTab("categories")}
          className={`rounded-t-xl border border-b-0 px-4 py-3 text-sm font-medium transition ${
            activeTab === "categories"
              ? "border-[var(--border)] bg-[var(--surface)] text-[var(--success)]"
              : "border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <Text id="Category Management" />
        </button>
      </div>

      {activeTab === "categories" ? (
        <div
          role="tabpanel"
          id="admin-categories-panel"
          aria-labelledby="admin-categories-tab"
          tabIndex={0}
        >
          <CategoryManager
            onRefresh={() => {
              refreshCategories();
              setRefreshKey((current) => current + 1);
              setFilters((current) => ({ ...current, category: "" }));
              setPage(1);
            }}
          />
        </div>
      ) : (
    <section
      role="tabpanel"
      id="admin-items-panel"
      aria-labelledby="admin-items-tab"
      tabIndex={0}
      className="ui-card overflow-hidden"
    >
      <div className="border-b border-[var(--border)] p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              <Text id="Lost and found items" />
            </h2>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              <Text id="Review and maintain item reports submitted by users." />
            </p>
          </div>

          <p className="text-sm text-[var(--foreground-muted)]">
            {total} <Text id="Items" />
          </p>
        </div>
      </div>

      <section aria-labelledby="system-settings-title" className="border-b border-[var(--border)]">
        <h2 id="system-settings-title" className="px-5 py-4 font-semibold text-[var(--heading)] sm:px-6">
            <Text id="System Settings" />
        </h2>

        <div className="border-t border-[var(--border)] bg-[var(--surface-soft)] p-5 sm:p-6">
          <p className="mb-5 text-sm text-[var(--foreground-muted)]">
            <Text id="Configure matching and data retention." />
          </p>

          {settingsLoading ? (
            <p className="text-sm text-[var(--foreground-muted)]">
              <Text id="Loading system settings..." />
            </p>
          ) : (
            <form onSubmit={saveSettings} className="max-w-xl space-y-5">
              <label className="block text-sm font-medium">
                <Text id="Matching Threshold" />
                <span className="mt-1 block text-xs font-normal text-[var(--foreground-muted)]">
                  <Text id="Minimum score to show as a potential match." />
                </span>

                <span className="mt-2 flex">
                  <input
                    required
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    className={`${inputClass} rounded-r-none`}
                    value={settingsDraft.matching_threshold}
                    onChange={(event) =>
                      setSettingsDraft({
                        ...settingsDraft,
                        matching_threshold: event.target.value,
                      })
                    }
                  />
                  <span className="inline-flex items-center rounded-r-xl border border-l-0 border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--foreground-muted)]">
                    %
                  </span>
                </span>
              </label>

              <label className="block text-sm font-medium">
                <Text id="Data Retention Period" />
                <span className="mt-1 block text-xs font-normal text-[var(--foreground-muted)]">
                  <Text id="Configured retention period for Lost & Found records." />
                </span>

                <span className="mt-2 flex">
                  <input
                    required
                    type="number"
                    min={1}
                    max={3650}
                    step={1}
                    className={`${inputClass} rounded-r-none`}
                    value={settingsDraft.data_retention_days}
                    onChange={(event) =>
                      setSettingsDraft({
                        ...settingsDraft,
                        data_retention_days: event.target.value,
                      })
                    }
                  />
                  <span className="inline-flex items-center rounded-r-xl border border-l-0 border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--foreground-muted)]">
                    <Text id="days" />
                  </span>
                </span>

                <span className="mt-2 block text-xs font-normal text-[var(--foreground-muted)]">
                  <Text id="This value is saved as policy; automatic deletion requires a separate scheduled job." />
                </span>
              </label>

              {settingsError && (
                <p role="alert" className="text-sm text-[var(--danger)]">
                  {settingsError}
                </p>
              )}

              {settingsNotice && (
                <p role="status" className="text-sm text-[var(--success)]">
                  <Text id="Settings saved." />
                </p>
              )}

              <button
                type="submit"
                disabled={settingsSaving}
                className={`ui-button-primary ${greenActionButtonClass} w-full disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto`}
              >
                {settingsSaving ? (
                  <Text id="Saving settings..." />
                ) : (
                  <Text id="Save settings" />
                )}
              </button>
            </form>
          )}
        </div>
      </section>

      <form
        onSubmit={applyFilters}
        className="grid gap-3 border-b border-[var(--border)] p-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        <input
          className={inputClass}
          value={searchDraft}
          onChange={(event) => setSearchDraft(event.target.value)}
          placeholder={t("Search item name")}
          aria-label={t("Search item name")}
        />

        {categoriesError && (
          <p role="alert" className="col-span-full text-sm text-[var(--danger)]">
            <AppMessage text={categoriesError} />
          </p>
        )}

        <select
          name="category"
          className={inputClass}
          defaultValue=""
          aria-label={t("Filter by category")}
        >
          <option value="">{t("Filter by category")}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.name}>
              <DisplayValue value={category.name} />
            </option>
          ))}
        </select>

        <input
          name="location"
          className={inputClass}
          placeholder={t("Filter by location")}
          aria-label={t("Filter by location")}
        />

        <select name="reportType" className={inputClass} defaultValue="">
          <option value="">{t("All report types")}</option>
          <option value="LOST">{t("LOST")}</option>
          <option value="FOUND">{t("FOUND")}</option>
        </select>

        <select name="status" className={inputClass} defaultValue="">
          <option value="">{t("All statuses")}</option>
          <option value="PENDING_REVIEW">{t("PENDING_REVIEW")}</option>
          <option value="PUBLISHED">{t("PUBLISHED")}</option>
          <option value="REJECTED">{t("REJECTED")}</option>
        </select>

        <div className="flex gap-2">
          <button
            type="submit"
            className={`ui-button-primary ${greenActionButtonClass} flex-1`}
          >
            <Text id="Apply filters" />
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="ui-button-secondary"
          >
            <Text id="Clear" />
          </button>
        </div>
      </form>

      {error && (
        <div
          role="alert"
          className="m-5 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]"
        >
          <AppMessage text={error} />
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="m-5 rounded-xl border border-[var(--success)]/20 bg-[var(--success-soft)] p-3 text-sm text-[var(--success)]"
        >
          {notice}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[950px] text-left text-sm">
          <thead className="bg-[var(--surface-soft)] text-xs uppercase text-[var(--foreground-muted)]">
            <tr>
              <th className="px-4 py-3">
                <Text id="Item" />
              </th>
              <th className="px-4 py-3">
                <Text id="Category" />
              </th>
              <th className="px-4 py-3">
                <Text id="Location" />
              </th>
              <th className="px-4 py-3">
                <Text id="Type" />
              </th>
              <th className="px-4 py-3">
                <Text id="Status" />
              </th>
              <th className="px-4 py-3">
                <Text id="Date" />
              </th>
              <th className="px-4 py-3">
                <Text id="Actions" />
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--border)]">
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-[var(--foreground-muted)]"
                >
                  <Text id="Loading items..." />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-[var(--foreground-muted)]"
                >
                  <Text id="No items found." />
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="align-top">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      {item.image_preview_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image_preview_url}
                          alt={t("Item image")}
                          className="h-12 w-12 rounded-lg border border-[var(--border)] object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-[var(--surface-soft)]" />
                      )}
                      <div>
                        <p className="font-medium text-[var(--foreground)]">
                          {item.name}
                        </p>
                        <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                          {item.reporter_id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">{item.category}</td>
                  <td className="px-4 py-4">{item.location}</td>
                  <td className="px-4 py-4">
                    <DisplayValue value={item.report_type} />
                  </td>
                  <td className="px-4 py-4">
                    <DisplayValue value={item.status} />
                  </td>
                  <td className="px-4 py-4">{formatDate(item.date_time)}</td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="ui-button-secondary"
                        onClick={() => {
                          setEditing(item);
                          setDraft(toDraft(item));
                          setError("");
                        }}
                      >
                        <Text id="Edit" />
                      </button>
                      <button
                        type="button"
                        aria-label={t("Delete {name}", { name: item.name })}
                        title={t("Delete {name}", { name: item.name })}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--danger)]/30 text-[var(--danger)] transition hover:bg-[var(--danger-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--danger)]"
                        onClick={() => {
                          setDeleting(item);
                          setDeleteConfirmed(false);
                          setError("");
                          setDeleteError("");
                        }}
                      >
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-5 w-5"
                        >
                          <path d="M3 6h18" />
                          <path d="M8 6V4h8v2" />
                          <path d="m19 6-1 14H6L5 6" />
                          <path d="M10 11v5M14 11v5" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] p-4">
        <p className="text-sm text-[var(--foreground-muted)]">
          <Text
            id="Page {page} of {totalPages}"
            params={{ page, totalPages }}
          />
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            className="ui-button-secondary"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            <Text id="Previous" />
          </button>
          <button
            type="button"
            className="ui-button-secondary"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((current) => current + 1)}
          >
            <Text id="Next" />
          </button>
        </div>
      </div>

      {editing && draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-item-title"
            onSubmit={saveItem}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-[var(--surface)] p-5 shadow-xl sm:p-6"
          >
            <h2 id="edit-item-title" className="text-xl font-semibold">
              <Text id="Edit item" />
            </h2>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              <Text id="Reporter, report type, status, and image are not changed here." />
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm">
                <Text id="Item name" />
                <input
                  required
                  className={`${inputClass} mt-1`}
                  value={draft.name}
                  onChange={(event) =>
                    setDraft({ ...draft, name: event.target.value })
                  }
                />
              </label>

              <label className="text-sm">
                <Text id="Category" />
                <select
                  required={
                    !draft.category ||
                    categories.some((category) => category.name === draft.category)
                  }
                  className={`${inputClass} mt-1`}
                  value={draft.category}
                  onChange={(event) =>
                    setDraft({ ...draft, category: event.target.value })
                  }
                >
                  <option value="">
                    <Text id="Select category" />
                  </option>

                  {draft.category &&
                    !categories.some((category) => category.name === draft.category) && (
                      <option value={draft.category} disabled>
                        {draft.category} ({t("Inactive current value")})
                      </option>
                    )}

                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      <DisplayValue value={category.name} />
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm">
                <Text id="Brand" />
                <input
                  className={`${inputClass} mt-1`}
                  value={draft.brand}
                  onChange={(event) =>
                    setDraft({ ...draft, brand: event.target.value })
                  }
                />
              </label>

              <label className="text-sm">
                <Text id="Color" />
                <input
                  className={`${inputClass} mt-1`}
                  value={draft.color}
                  onChange={(event) =>
                    setDraft({ ...draft, color: event.target.value })
                  }
                />
              </label>

              <label className="text-sm">
                <Text id="Location" />
                <input
                  required
                  className={`${inputClass} mt-1`}
                  value={draft.location}
                  onChange={(event) =>
                    setDraft({ ...draft, location: event.target.value })
                  }
                />
              </label>

              <label className="text-sm">
                <Text id="Lost / found date and time" />
                <input
                  required
                  type="datetime-local"
                  className={`${inputClass} mt-1`}
                  value={draft.date_time}
                  onChange={(event) =>
                    setDraft({ ...draft, date_time: event.target.value })
                  }
                />
              </label>

              <label className="text-sm sm:col-span-2">
                <Text id="Description" />
                <textarea
                  rows={4}
                  className={`${inputClass} mt-1`}
                  value={draft.description}
                  onChange={(event) =>
                    setDraft({ ...draft, description: event.target.value })
                  }
                />
              </label>
            </div>

            {error && (
              <p role="alert" className="mt-4 text-sm text-[var(--danger)]">
                <AppMessage text={error} />
              </p>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="ui-button-secondary"
                disabled={saving}
                onClick={() => {
                  setEditing(null);
                  setDraft(null);
                }}
              >
                <Text id="Cancel" />
              </button>
              <button
                type="submit"
                className={`ui-button-primary ${greenActionButtonClass}`}
                disabled={saving}
              >
                {saving ? <Text id="Saving..." /> : <Text id="Save Changes" />}
              </button>
            </div>
          </form>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-item-title"
            className="w-full max-w-lg rounded-2xl bg-[var(--surface)] p-5 shadow-xl sm:p-6"
          >
            <h2 id="delete-item-title" className="text-xl font-semibold">
              <Text id="Delete item" />
            </h2>

            <p className="mt-2 text-sm text-[var(--foreground-muted)]">
              {deleting.name}
            </p>

            <p className="mt-2 text-sm text-[var(--danger)]">
              <Text id="Deleting is permanent. Items with claims cannot be deleted." />
            </p>

            <label className="mt-5 flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={deleteConfirmed}
                onChange={(event) => setDeleteConfirmed(event.target.checked)}
              />
              <span>
                <Text id="I understand that this action cannot be undone." />
              </span>
            </label>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="ui-button-secondary"
                disabled={deletingBusy}
                onClick={() => setDeleting(null)}
              >
                <Text id="Cancel" />
              </button>

              <button
                type="button"
                disabled={!deleteConfirmed || deletingBusy}
                onClick={deleteItem}
                className="rounded-xl bg-[var(--danger)] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletingBusy ? (
                  <Text id="Deleting..." />
                ) : (
                  <Text id="Delete item" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteError && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-error-title"
            className="w-full max-w-md rounded-2xl border border-[var(--danger)]/20 bg-[var(--surface)] p-5 shadow-xl sm:p-6"
          >
            <h2
              id="delete-error-title"
              className="text-lg font-semibold text-[var(--danger)]"
            >
              <Text id="Unable to delete item" />
            </h2>

            <p
              role="alert"
              className="mt-3 text-sm leading-6 text-[var(--foreground)]"
            >
              <AppMessage text={deleteError} />
            </p>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="ui-button-primary"
                onClick={() => setDeleteError("")}
              >
                <Text id="Close" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
      )}
    </div>
  );
}
