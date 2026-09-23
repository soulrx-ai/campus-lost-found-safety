"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LostReportForm() {
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

            const fileExtension = image.name.split(".").pop()?.toLowerCase();

            if (!fileExtension) {
                setMessage("Invalid image file.");
                return;
            }

            const allowedExtensions = ["jpg", "jpeg", "png", "webp"];

            if (!allowedExtensions.includes(fileExtension)) {
                setMessage("Only JPG, PNG, and WEBP images are allowed.");
                return;
            }

            if (image.size > 5 * 1024 * 1024) {
                setMessage("Image must not exceed 5 MB.");
                return;
            }

            const filePath =
                `${user.id}/lost/${crypto.randomUUID()}.${fileExtension}`;

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
                    report_type: "LOST",
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
                await supabase.storage.from("lost-found").remove([filePath]);

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
                "lost-image"
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
            <div className="border-b border-[var(--border)] bg-[var(--surface-soft)] px-5 py-4 sm:px-7">
                <h2 className="font-semibold text-[var(--foreground)]">
                    Item information
                </h2>

                <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                    Fields marked with * are required.
                </p>
            </div>

            <div className="space-y-6 p-5 sm:p-7">
                <div className="grid gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label
                            htmlFor="lost-name"
                            className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
                        >
                            Item name *
                        </label>

                        <input
                            id="lost-name"
                            type="text"
                            required
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="e.g. Black Wallet"
                            className="ui-input"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="lost-category"
                            className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
                        >
                            Category *
                        </label>

                        <select
                            id="lost-category"
                            required
                            value={category}
                            onChange={(event) => setCategory(event.target.value)}
                            className="ui-input"
                        >
                            <option value="">Select category</option>
                            <option value="Electronics">Electronics</option>
                            <option value="Wallet">Wallet</option>
                            <option value="Bag">Bag</option>
                            <option value="Document">Document</option>
                            <option value="Clothing">Clothing</option>
                            <option value="Accessory">Accessory</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="lost-brand"
                            className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
                        >
                            Brand
                        </label>

                        <input
                            id="lost-brand"
                            type="text"
                            value={brand}
                            onChange={(event) => setBrand(event.target.value)}
                            placeholder="e.g. Apple, Nike"
                            className="ui-input"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="lost-color"
                            className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
                        >
                            Color
                        </label>

                        <input
                            id="lost-color"
                            type="text"
                            value={color}
                            onChange={(event) => setColor(event.target.value)}
                            placeholder="e.g. Black"
                            className="ui-input"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="lost-date-time"
                            className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
                        >
                            Date / time lost *
                        </label>

                        <input
                            id="lost-date-time"
                            type="datetime-local"
                            required
                            value={dateTime}
                            onChange={(event) => setDateTime(event.target.value)}
                            className="ui-input"
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <label
                            htmlFor="lost-location"
                            className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
                        >
                            Location *
                        </label>

                        <input
                            id="lost-location"
                            type="text"
                            required
                            value={location}
                            onChange={(event) => setLocation(event.target.value)}
                            placeholder="e.g. Thaiburi Building"
                            className="ui-input"
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <label
                            htmlFor="lost-description"
                            className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
                        >
                            Description
                        </label>

                        <textarea
                            id="lost-description"
                            rows={4}
                            value={description}
                            onChange={(event) =>
                                setDescription(event.target.value)
                            }
                            placeholder="Add useful details about the item"
                            className="ui-input min-h-28 resize-y"
                        />
                    </div>
                </div>

                <div className="border-t border-[var(--border)] pt-6">
                    <label
                        htmlFor="lost-image"
                        className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
                    >
                        Item image *
                    </label>

                    <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-soft)] p-4">
                        <input
                            id="lost-image"
                            type="file"
                            required
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(event) =>
                                setImage(event.target.files?.[0] ?? null)
                            }
                            className="block w-full text-sm text-[var(--foreground-muted)] file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--primary)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[var(--primary-contrast)]"
                        />

                        <p className="mt-3 text-xs leading-5 text-[var(--foreground-muted)]">
                            JPG, PNG or WEBP. Maximum file size 5 MB. The image is kept
                            private and is available to authorized Staff during review.
                        </p>
                    </div>
                </div>

                {message && (
                    <div
                        role="status"
                        className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3 text-sm leading-6 text-[var(--foreground)]"
                    >
                        {message}
                    </div>
                )}

                <div className="flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs leading-5 text-[var(--foreground-muted)] sm:max-w-sm">
                        Your report will remain pending until it has been reviewed by
                        Staff.
                    </p>

                    <button
                        type="submit"
                        disabled={loading}
                        className="ui-button-primary w-full sm:w-auto"
                    >
                        {loading ? "Submitting..." : "Submit lost report"}
                    </button>
                </div>
            </div>
        </form>
    );
}