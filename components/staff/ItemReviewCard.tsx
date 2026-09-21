"use client";

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

    return (
        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.report_type === "LOST"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                    >
                        {item.report_type}
                    </span>

                    <h2 className="mt-3 text-xl font-semibold text-stone-900">
                        {item.name}
                    </h2>

                    <p className="mt-1 text-sm text-stone-500">
                        Pending staff review
                    </p>
                </div>

                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                    {item.status}
                </span>
            </div>

            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                    <p className="font-medium text-stone-700">
                        Category
                    </p>
                    <p className="text-stone-600">
                        {item.category}
                    </p>
                </div>

                <div>
                    <p className="font-medium text-stone-700">
                        Brand
                    </p>
                    <p className="text-stone-600">
                        {item.brand || "Not specified"}
                    </p>
                </div>

                <div>
                    <p className="font-medium text-stone-700">
                        Color
                    </p>
                    <p className="text-stone-600">
                        {item.color || "Not specified"}
                    </p>
                </div>

                <div>
                    <p className="font-medium text-stone-700">
                        Location
                    </p>
                    <p className="text-stone-600">
                        {item.location}
                    </p>
                </div>

                <div>
                    <p className="font-medium text-stone-700">
                        Lost / Found Date
                    </p>

                    <p className="text-stone-600">
                        {formatDateTime(item.date_time)}
                    </p>
                </div>

                <div>
                    <p className="font-medium text-stone-700">
                        Reporter ID
                    </p>

                    <p className="break-all text-stone-600">
                        {item.reporter_id}
                    </p>
                </div>
            </div>

            {item.description && (
                <div className="mt-4">
                    <p className="text-sm font-medium text-stone-700">
                        Description
                    </p>

                    <p className="mt-1 whitespace-pre-wrap text-sm text-stone-600">
                        {item.description}
                    </p>
                </div>
            )}

            <div className="mt-5">
                <p className="text-sm font-medium text-stone-700">
                    Report Image
                </p>

                {!imageUrl ? (
                    <button
                        type="button"
                        disabled={imageLoading}
                        onClick={viewItemImage}
                        className="mt-2 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {imageLoading
                            ? "Loading..."
                            : "View Report Image"}
                    </button>
                ) : (
                    <img
                        src={imageUrl}
                        alt={`${item.report_type.toLowerCase()} item`}
                        className="mt-3 max-h-96 rounded-xl border border-stone-200 object-contain"
                    />
                )}
            </div>

            {errorMessage && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {errorMessage}
                </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
                <button
                    type="button"
                    disabled={loading}
                    onClick={() =>
                        reviewItem("PUBLISHED")
                    }
                    className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading
                        ? "Processing..."
                        : "Publish"}
                </button>

                <button
                    type="button"
                    disabled={loading}
                    onClick={() =>
                        reviewItem("REJECTED")
                    }
                    className="rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Reject
                </button>
            </div>
        </article>
    );
}