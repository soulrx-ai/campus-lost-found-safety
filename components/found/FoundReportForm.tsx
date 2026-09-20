"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function FoundReportForm() {
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
            className="space-y-5 rounded-2xl bg-white p-6 shadow-sm"
        >
            <div>
                <label className="mb-1 block text-sm font-medium">
                    Item Name *
                </label>

                <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. AirPods"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2"
                />
            </div>

            <div>
                <label className="mb-1 block text-sm font-medium">
                    Category *
                </label>

                <select
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2"
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
                <label className="mb-1 block text-sm font-medium">
                    Brand
                </label>

                <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Apple"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2"
                />
            </div>

            <div>
                <label className="mb-1 block text-sm font-medium">
                    Color
                </label>

                <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="e.g. White"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2"
                />
            </div>

            <div>
                <label className="mb-1 block text-sm font-medium">
                    Description
                </label>

                <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the found item"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2"
                />
            </div>

            <div>
                <label className="mb-1 block text-sm font-medium">
                    Date / Time Found *
                </label>

                <input
                    required
                    type="datetime-local"
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2"
                />
            </div>

            <div>
                <label className="mb-1 block text-sm font-medium">
                    Location *
                </label>

                <input
                    required
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Thaiburi Building"
                    className="w-full rounded-lg border border-stone-300 px-3 py-2"
                />
            </div>

            <div>
                <label className="mb-1 block text-sm font-medium">
                    Item Image *
                </label>

                <input
                    id="found-image"
                    required
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => setImage(e.target.files?.[0] ?? null)}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2"
                />

                <p className="mt-1 text-xs text-stone-500">
                    The image is kept private and is not displayed in public search.
                </p>
            </div>

            {message && (
                <div className="rounded-lg bg-stone-100 p-3 text-sm">
                    {message}
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-stone-800 px-4 py-3 font-medium text-white disabled:opacity-50"
            >
                {loading ? "Submitting..." : "Submit Found Report"}
            </button>
        </form>
    );
}