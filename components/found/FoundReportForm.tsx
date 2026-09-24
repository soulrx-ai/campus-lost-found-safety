"use client";

import { AppMessage, DisplayValue, Text, UiText } from "@/components/i18n/Text";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { useCategories } from "@/components/categories/useCategories";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function FoundReportForm() {
  const { t } = useLanguage();
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
    const supabase = createClient();

    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [brand, setBrand] = useState("");
    const [color, setColor] = useState("");
    const [description, setDescription] = useState("");
    const [dateTime, setDateTime] = useState("");
    const [location, setLocation] = useState("");
    const [image, setImage] = useState<File | null>(null);

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setMessage("");

        if (!image) {
            setMessage("Please select an image.");
            return;
        }

        setLoading(true);

        try {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError || !user) {
                setMessage("You must login before submitting a report.");
                return;
            }

            const extension = image.name.split(".").pop()?.toLowerCase();

            if (!extension) {
                setMessage("Invalid image file.");
                return;
            }

            const allowedExtensions = ["jpg", "jpeg", "png", "webp"];

            if (!allowedExtensions.includes(extension)) {
                setMessage("Only JPG, PNG, and WEBP images are allowed.");
                return;
            }

            if (image.size > 5 * 1024 * 1024) {
                setMessage("Image must not exceed 5 MB.");
                return;
            }

            const filePath =
                `${user.id}/found/${crypto.randomUUID()}.${extension}`;

            const { error: uploadError } = await supabase.storage
                .from("lost-found")
                .upload(filePath, image, {
                    cacheControl: "3600",
                    upsert: false,
                });

            if (uploadError) {
                setMessage(`Image upload failed: ${uploadError.message}`);
                return;
            }

            const { error: insertError } = await supabase
                .from("items")
                .insert({
                    reporter_id: user.id,
                    report_type: "FOUND",
                    name: name.trim(),
                    category,
                    brand: brand.trim() || null,
                    color: color.trim() || null,
                    description: description.trim() || null,
                    date_time: new Date(dateTime).toISOString(),
                    location: location.trim(),
                    image_url: filePath,
                    status: "PENDING_REVIEW",
                });

            if (insertError) {
                await supabase.storage
                    .from("lost-found")
                    .remove([filePath]);

                setMessage(`Unable to submit report: ${insertError.message}`);
                return;
            }

            setName("");
            setCategory("");
            setBrand("");
            setColor("");
            setDescription("");
            setDateTime("");
            setLocation("");
            setImage(null);

            const fileInput = document.getElementById(
                "found-image"
            ) as HTMLInputElement | null;

            if (fileInput) {
                fileInput.value = "";
            }

            setMessage(
                "Report submitted successfully and is waiting for Staff review."
            );
        } catch {
            setMessage("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="ui-card overflow-hidden"
        >
            <div className="border-b border-[var(--border)] bg-[var(--success-soft)] px-5 py-4 sm:px-6">
                <p className="text-sm font-semibold text-[var(--success)]">
                    <Text id="Found Item Information" />
                </p>

                <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                    <Text id="Fields marked with * are required." />
                </p>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
                <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Item Name *">
                        <input
                            required
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t("e.g. AirPods")}
                            className="ui-input"
                        />
                    </Field>

                    <Field label="Category *">
                        <select
                            required
                            disabled={categoriesLoading || Boolean(categoriesError) || categories.length === 0}
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="ui-input"
                        >
                            <option value=""><Text id="Select category" /></option>
                            {categories.map((itemCategory) => (
                                <option key={itemCategory.id} value={itemCategory.name}>
                                    <DisplayValue value={itemCategory.name} />
                                </option>
                            ))}
                        </select>
                        {categoriesError && (
                            <p role="alert" className="mt-1 text-xs text-[var(--danger)]">
                                <AppMessage text={categoriesError} />
                            </p>
                        )}
                    </Field>

                    <Field label="Brand">
                        <input
                            type="text"
                            value={brand}
                            onChange={(e) => setBrand(e.target.value)}
                            placeholder={t("e.g. Apple")}
                            className="ui-input"
                        />
                    </Field>

                    <Field label="Color">
                        <input
                            type="text"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            placeholder={t("e.g. White")}
                            className="ui-input"
                        />
                    </Field>

                    <Field label="Date / Time Found *">
                        <input
                            required
                            type="datetime-local"
                            value={dateTime}
                            onChange={(e) => setDateTime(e.target.value)}
                            className="ui-input"
                        />
                    </Field>

                    <Field label="Location *">
                        <input
                            required
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder={t("e.g. Thaiburi Building")}
                            className="ui-input"
                        />
                    </Field>
                </div>

                <Field label="Description">
                    <textarea
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t("Describe the found item")}
                        className="ui-input resize-y"
                    />
                </Field>

                <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-strong)] bg-[var(--surface-soft)] p-4">
                    <label
                        htmlFor="found-image"
                        className="mb-2 block text-sm font-semibold text-[var(--foreground)]"
                    >
                        <Text id="Item Image *" />
                    </label>

                    <input
                        id="found-image"
                        required
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) =>
                            setImage(e.target.files?.[0] ?? null)
                        }
                        className="block w-full text-sm text-[var(--foreground-muted)] file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--primary)] file:px-4 file:py-2 file:font-medium file:text-[var(--primary-contrast)]"
                    />

                    <p className="mt-3 text-xs leading-5 text-[var(--foreground-muted)]">
                        <Text id="JPG, PNG or WEBP · Maximum 5 MB. The image is kept private and is not displayed in public search." />
                    </p>
                </div>

                {message && (
                    <div
                        role="status"
                        className="rounded-[var(--radius-md)] bg-[var(--primary-soft)] p-4 text-sm text-[var(--foreground)]"
                    >
                        <AppMessage text={message} />
                    </div>
                )}

                <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs leading-5 text-[var(--foreground-muted)]">
                        <Text id="Staff approval is required before this report is published." />
                    </p>

                    <button
                        type="submit"
                        disabled={loading}
                        className="ui-button-primary w-full sm:w-auto"
                    >
                        {loading
                            ? <Text id="Submitting..." />
                            : <Text id="Submit Found Report" />}
                    </button>
                </div>
            </div>
        </form>
    );
}

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                <UiText text={label} />
            </label>
            {children}
        </div>
    );
}
