"use client";

import { useState } from "react";
import { Text } from "@/components/i18n/Text";
import SafetyReviewCard from "@/components/staff/SafetyReviewCard";
import { ComponentProps } from "react";

type SafetyIncident = ComponentProps<typeof SafetyReviewCard>["incident"];

type Props = {
  incidents: SafetyIncident[];
  staffId: string;
};

type TabKey = "ALL" | "PENDING_REVIEW" | "PUBLISHED";

export default function StaffSafetyReviewList({
  incidents,
  staffId,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("ALL");

  const pendingCount = incidents.filter(
    (item) => item.status === "PENDING_REVIEW"
  ).length;

  const publishedCount = incidents.filter(
    (item) => item.status === "PUBLISHED"
  ).length;

  const filteredIncidents = incidents.filter((item) => {
    if (activeTab === "ALL") return true;
    return item.status === activeTab;
  });

  return (
    <div>
      {/* Stat overview cards */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="ui-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
            <Text id="Pending Review" />
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--warning)]">
            {pendingCount}
          </p>
        </div>

        <div className="ui-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
            <Text id="Published" />
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--success)]">
            {publishedCount}
          </p>
        </div>

        <div className="ui-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
            <Text id="Total incidents" />
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--foreground)]">
            {incidents.length}
          </p>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="mb-6 flex gap-2 overflow-x-auto border-b border-[var(--border)] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("ALL")}
          className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
            activeTab === "ALL"
              ? "bg-[var(--primary)] text-[var(--primary-contrast)] shadow-sm"
              : "text-[var(--foreground-muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
          }`}
        >
          <span><Text id="All" /></span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              activeTab === "ALL"
                ? "bg-white/20 text-white"
                : "bg-[var(--surface-soft)] text-[var(--foreground-muted)]"
            }`}
          >
            {incidents.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("PENDING_REVIEW")}
          className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
            activeTab === "PENDING_REVIEW"
              ? "bg-[var(--warning)] text-white shadow-sm"
              : "text-[var(--foreground-muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
          }`}
        >
          <span><Text id="Pending Review" /></span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              activeTab === "PENDING_REVIEW"
                ? "bg-white/20 text-white"
                : "bg-[var(--warning-soft)] text-[var(--warning)]"
            }`}
          >
            {pendingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("PUBLISHED")}
          className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
            activeTab === "PUBLISHED"
              ? "bg-[var(--success)] text-white shadow-sm"
              : "text-[var(--foreground-muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
          }`}
        >
          <span><Text id="Published" /></span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              activeTab === "PUBLISHED"
                ? "bg-white/20 text-white"
                : "bg-[var(--success-soft)] text-[var(--success)]"
            }`}
          >
            {publishedCount}
          </span>
        </button>
      </div>

      {/* Incident List */}
      {filteredIncidents.length === 0 ? (
        <div className="ui-card p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            <Text id="No incidents found in this category." />
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
            <Text id="There are currently no safety incidents matching this filter." />
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredIncidents.map((incident) => (
            <SafetyReviewCard
              key={incident.id}
              incident={incident}
              staffId={staffId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
