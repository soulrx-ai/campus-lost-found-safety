"use client";

import { useCallback, useEffect, useState } from "react";

export type CategoryOption = {
  id: string;
  name: string;
  created_at: string;
  is_active: boolean;
};

export function useCategories(includeInactive = false) {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const refreshCategories = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      setLoading(true);
      setError("");

      try {
        const endpoint = includeInactive
          ? "/api/categories?includeInactive=true"
          : "/api/categories";
        const response = await fetch(endpoint, { cache: "no-store" });
        const result = (await response.json()) as {
          categories?: CategoryOption[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(result.error ?? "Unable to load categories.");
        }

        if (!cancelled) setCategories(result.categories ?? []);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load categories.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, [includeInactive, reloadKey]);

  return { categories, loading, error, refreshCategories };
}
