"use client";

import { AppMessage, DisplayValue, Text } from "@/components/i18n/Text";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { useCategories, type CategoryOption } from "@/components/categories/useCategories";
import { FormEvent, useState } from "react";

type Props = {
  onRefresh: () => void;
};

export default function CategoryManager({ onRefresh }: Props) {
  const { t } = useLanguage();
  const { categories, loading, error: loadError, refreshCategories } = useCategories(true);
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<CategoryOption | null>(null);
  const [editName, setEditName] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [deleting, setDeleting] = useState<CategoryOption | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to create category.");
      }

      setNewName("");
      setNotice("Category added.");
      refreshCategories();
      onRefresh();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to create category.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveCategory() {
    if (!editing) return;
    const cleanName = editName.trim();
    if (!cleanName || cleanName.length > 80) {
      setError("Category name must contain 1 to 80 characters.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/categories/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cleanName, is_active: editIsActive }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to update category.");
      }

      setEditing(null);
      setEditName("");
      setSuccessMessage("Category updated.");
      refreshCategories();
      onRefresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update category.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory() {
    if (!deleting) return;

    setSaving(true);
    setError("");
    setNotice("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/categories/${deleting.id}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to delete category.");
      }

      setDeleting(null);
      setSuccessMessage("Category deleted.");
      refreshCategories();
      onRefresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete category.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="ui-card overflow-hidden">
      <div className="border-b border-[var(--border)] p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          <Text id="Category Management" />
        </h2>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
          <Text id="Add, rename, or delete categories used by item reports." />
        </p>
        <p className="mt-2 text-sm text-[var(--foreground-muted)]">
          {categories.length} <Text id="Categories" />
        </p>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <form onSubmit={createCategory} className="flex flex-col gap-3 sm:flex-row">
          <label className="min-w-0 flex-1 text-sm font-medium">
            <Text id="Category name" />
            <input
              required
              maxLength={80}
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              className="ui-input mt-1"
              placeholder={t("Enter category name")}
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="ui-button-primary self-end disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Text id="Add category" />
          </button>
        </form>

        {loadError && (
          <p role="alert" className="text-sm text-[var(--danger)]">
            <AppMessage text={loadError} />
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-[var(--danger)]">
            <AppMessage text={error} />
          </p>
        )}
        {notice && (
          <p role="status" className="text-sm text-[var(--success)]">
            <AppMessage text={notice} />
          </p>
        )}

        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-[var(--surface-soft)] text-xs uppercase text-[var(--foreground-muted)]">
              <tr>
                <th scope="col" className="px-4 py-3">#</th>
                <th scope="col" className="px-4 py-3"><Text id="Category" /></th>
                <th scope="col" className="px-4 py-3"><Text id="Status" /></th>
                <th scope="col" className="px-4 py-3 text-right"><Text id="Actions" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[var(--foreground-muted)]">
                    <Text id="Loading categories..." />
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[var(--foreground-muted)]">
                    <Text id="No categories found." />
                  </td>
                </tr>
              ) : (
                categories.map((category, index) => (
                  <tr key={category.id}>
                    <td className="px-4 py-3 text-[var(--foreground-muted)]">{index + 1}</td>
                    <td className="px-4 py-3">
                      {editing?.id === category.id ? (
                        <input
                          autoFocus
                          required
                          maxLength={80}
                          value={editName}
                          onChange={(event) => setEditName(event.target.value)}
                          className="ui-input min-w-0"
                          aria-label={t("Category name")}
                        />
                      ) : (
                        <DisplayValue value={category.name} />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editing?.id === category.id ? (
                        <select
                          className="ui-input w-auto min-w-32"
                          value={editIsActive ? "active" : "inactive"}
                          onChange={(event) => setEditIsActive(event.target.value === "active")}
                          aria-label={t("Status")}
                        >
                          <option value="active">{t("Active")}</option>
                          <option value="inactive">{t("Inactive")}</option>
                        </select>
                      ) : (
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${category.is_active ? "bg-[var(--success-soft)] text-[var(--success)]" : "bg-[var(--surface-soft)] text-[var(--foreground-muted)]"}`}>
                          <Text id={category.is_active ? "Active" : "Inactive"} />
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editing?.id === category.id ? (
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={saveCategory}
                            className="ui-button-primary whitespace-nowrap disabled:opacity-50"
                          >
                            <Text id="Save Changes" />
                          </button>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => setEditing(null)}
                            className="ui-button-secondary"
                          >
                            <Text id="Cancel" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setError("");
                              setNotice("");
                              setEditing(category);
                              setEditName(category.name);
                              setEditIsActive(category.is_active);
                            }}
                            className="ui-button-secondary"
                          >
                            <Text id="Edit" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setError("");
                              setNotice("");
                              setDeleting(category);
                            }}
                            aria-label={t("Delete category {name}", { name: category.name })}
                            title={t("Delete category {name}", { name: category.name })}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--danger)]/30 text-[var(--danger)] transition hover:bg-[var(--danger-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--danger)]"
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
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-category-title"
            className="w-full max-w-md rounded-2xl bg-[var(--surface)] p-5 shadow-xl sm:p-6"
          >
            <h2 id="delete-category-title" className="text-lg font-semibold text-[var(--danger)]">
              <Text id="Delete category?" />
            </h2>
            <p className="mt-2 text-sm font-medium">{deleting.name}</p>
            <p className="mt-3 text-sm leading-6 text-[var(--foreground-muted)]">
              <Text id="Deleting a category removes it from choices. Existing item records keep their saved category text." />
            </p>
            {error && (
              <p role="alert" className="mt-3 text-sm text-[var(--danger)]">
                <AppMessage text={error} />
              </p>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => setDeleting(null)}
                className="ui-button-secondary"
              >
                <Text id="Cancel" />
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={deleteCategory}
                className="rounded-xl bg-[var(--danger)] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? <Text id="Deleting..." /> : <Text id="Delete" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-success-title"
            className="w-full max-w-md rounded-2xl border border-[var(--success)]/20 bg-[var(--surface)] p-5 shadow-xl sm:p-6"
          >
            <h2
              id="category-success-title"
              className="text-lg font-semibold text-[var(--success)]"
            >
              <AppMessage text={successMessage} />
            </h2>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                autoFocus
                onClick={() => setSuccessMessage("")}
                className="ui-button-primary"
              >
                <Text id="Close" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
