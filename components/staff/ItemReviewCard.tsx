"use client";

import { useLanguage } from "@/components/i18n/LanguageProvider";
import { AppMessage, DisplayValue, Text, UiText } from "@/components/i18n/Text";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function formatDateTime(value: string) {
    return new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Bangkok",
    }).format(new Date(value));
}

type ReviewItem = {
    id: string;
    report_type: string;
    name: string;
    category: string;
    brand: string | null;
    color: string | null;
    description: string | null;
    location: string;
    date_time: string;
    image_url: string;
    status: string;
    reporter_id: string;
};

type Props = {
    item: ReviewItem;
    staffId: string;
};

export default function ItemReviewCard({
    item,
    staffId,
}: Props) {
    const router = useRouter();
    const { t } = useLanguage();
    const supabase = createClient();

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const [imageUrl, setImageUrl] =
        useState<string | null>(null);

    const [imageLoading, setImageLoading] =
        useState(false);

    async function viewItemImage() {
        setImageLoading(true);
        setErrorMessage("");

        try {
            const { data, error } =
                await supabase.storage
                    .from("lost-found")
                    .createSignedUrl(
                        item.image_url,
                        60 * 5
                    );

            if (error || !data?.signedUrl) {
                setErrorMessage(
                    error?.message ??
                    "Unable to load item image."
                );
                return;
            }

            setImageUrl(data.signedUrl);
        } catch {
            setErrorMessage(
                "Unable to load item image. Please try again."
            );
        } finally {
            setImageLoading(false);
        }
    }

    async function reviewItem(
        newStatus: "PUBLISHED" | "REJECTED"
    ) {
        setLoading(true);
        setErrorMessage("");

        try {
            const { data, error } = await supabase
                .from("items")
                .update({
                    status: newStatus,
                    reviewed_by: staffId,
                    reviewed_at:
                        new Date().toISOString(),
                })
                .eq("id", item.id)
                .eq("status", "PENDING_REVIEW")
                .select("id")
                .maybeSingle();

            if (error) {
                setErrorMessage(error.message);
                return;
            }

            if (!data) {
                setErrorMessage(
                    "This report has already been reviewed. Refresh the page and try again."
                );
                return;
            }

            router.refresh();
        } catch {
            setErrorMessage(
                "Unable to review this report. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    const isLost = item.report_type === "LOST";

    return (
        <article className="ui-card overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-[var(--border)] p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${isLost
                                    ? "bg-[var(--warning-soft)] text-[var(--warning)]"
                                    : "bg-[var(--success-soft)] text-[var(--success)]"
                                }`}
                        >
                            <DisplayValue value={item.report_type} />
                        </span>

                        <span className="inline-flex rounded-full bg-[var(--surface-soft)] px-3 py-1 text-xs font-medium text-[var(--foreground-muted)]">
                            <DisplayValue value={item.status} />
                        </span>
                    </div>

                    <h2 className="mt-3 break-words text-xl font-semibold text-[var(--heading)]">
                        {item.name}
                    </h2>

                    <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                        <Text id="Waiting for Staff review" />
                    </p>
                </div>

                <div className="shrink-0 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs text-[var(--foreground-muted)]">
                    {formatDateTime(item.date_time)}
                </div>
            </div>

            <div className="p-5 sm:p-6">
                <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                    <InfoField
                        label="Category"
                        value=<DisplayValue value={item.category} />
                    />

                    <InfoField
                        label="Brand"
                        value={item.brand || <Text id="Not specified" />}
                    />

                    <InfoField
                        label="Color"
                        value={item.color || <Text id="Not specified" />}
                    />

                    <InfoField
                        label="Location"
                        value={item.location}
                    />

                    <InfoField
                        label="Lost / Found Date"
                        value={formatDateTime(item.date_time)}
                    />

                    <InfoField
                        label="Reporter ID"
                        value={item.reporter_id}
                        breakAll
                    />
                </div>

                {item.description && (
                    <div className="mt-6 rounded-xl bg-[var(--surface-soft)] p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
                            <Text id="Description" />
                        </p>

                        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--foreground)]">
                            {item.description}
                        </p>
                    </div>
                )}

                <div className="mt-6 border-t border-[var(--border)] pt-6">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="text-sm font-semibold text-[var(--heading)]">
                                <Text id="Private report image" />
                            </h3>

                            <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                                <Text id="Only authorized Staff can load this image for review." />
                            </p>
                        </div>

                        {!imageUrl && (
                            <button
                                type="button"
                                disabled={imageLoading}
                                onClick={viewItemImage}
                                className="ui-button-secondary mt-3 w-full sm:mt-0 sm:w-auto"
                            >
                                {imageLoading
                                    ? <Text id="Loading..." />
                                    : <Text id="View report image" />}
                            </button>
                        )}
                    </div>

                    {imageUrl && (
                        <div className="mt-4 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-2">
                            {/* Private signed URL returned by Supabase Storage. */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={imageUrl}
                                alt={t("Private report image")}
                                className="mx-auto max-h-[28rem] w-full rounded-lg object-contain"
                            />
                        </div>
                    )}
                </div>

                {errorMessage && (
                    <div
                        role="alert"
                        className="mt-5 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-3 text-sm leading-6 text-[var(--danger)]"
                    >
                        <AppMessage text={errorMessage} />
                    </div>
                )}

                <div className="mt-6 flex flex-col gap-3 border-t border-[var(--border)] pt-6 sm:flex-row sm:items-center sm:justify-end">
                    <button
                        type="button"
                        disabled={loading}
                        onClick={() =>
                            reviewItem("REJECTED")
                        }
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-md)] border border-[var(--danger)]/30 bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--danger)] transition hover:bg-[var(--danger-soft)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                        <Text id="Reject" />
                    </button>

                    <button
                        type="button"
                        disabled={loading}
                        onClick={() =>
                            reviewItem("PUBLISHED")
                        }
                        className="ui-button-primary w-full sm:w-auto"
                    >
                        {loading
                            ? <Text id="Processing..." />
                            : <Text id="Publish report" />}
                    </button>
                </div>
            </div>
        </article>
    );
}

function InfoField({
    label,
    value,
    breakAll = false,
}: {
    label: string;
    value: React.ReactNode;
    breakAll?: boolean;
}) {
    return (
        <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
                <UiText text={label} />
            </p>

            <p
                className={`mt-1 text-sm leading-6 text-[var(--foreground)] ${breakAll ? "break-all" : "break-words"
                    }`}
            >
                {value}
            </p>
        </div>
    );
}