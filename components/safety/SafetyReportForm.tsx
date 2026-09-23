"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SafetyReportForm() {
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [incidentTime, setIncidentTime] = useState("");
  const [image, setImage] = useState<File | null>(null);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!image) {
      setMessage("At least one incident image is required.");
      return;
    }

    setLoading(true);

    let imagePath: string | null = null;

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setMessage("You must login before reporting an incident.");
        return;
      }

      const extension = image.name
        .split(".")
        .pop()
        ?.toLowerCase();

      if (
        !extension ||
        !["jpg", "jpeg", "png", "webp"].includes(extension)
      ) {
        setMessage("Image must be JPG, PNG, or WEBP.");
        return;
      }

      if (image.size > 5 * 1024 * 1024) {
        setMessage("Image must not exceed 5 MB.");
        return;
      }

      imagePath =
        `${user.id}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } =
        await supabase.storage
          .from("safety-incidents")
          .upload(imagePath, image, {
            cacheControl: "3600",
            upsert: false,
          });

      if (uploadError) {
        setMessage(
          `Image upload failed: ${uploadError.message}`
        );
        return;
      }

      const { error: insertError } = await supabase
        .from("security_incidents")
        .insert({
          reporter_id: user.id,
          title: title.trim(),
          description: description.trim(),
          location: location.trim(),
          incident_time: new Date(incidentTime).toISOString(),
          image_url: imagePath,
          status: "PENDING_REVIEW",
        });

      if (insertError) {
        await supabase.storage
          .from("safety-incidents")
          .remove([imagePath]);

        setMessage(
          `Unable to submit incident: ${insertError.message}`
        );
        return;
      }

      setTitle("");
      setDescription("");
      setLocation("");
      setIncidentTime("");
      setImage(null);

      const input = document.getElementById(
        "safety-image"
      ) as HTMLInputElement | null;

      if (input) {
        input.value = "";
      }

      setMessage(
        "Safety incident submitted successfully and is waiting for Staff review."
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
          Incident Title <span className="text-red-500">*</span>
        </label>

        <input
          required
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Broken stair handrail"
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Description <span className="text-red-500">*</span>
        </label>

        <textarea
          required
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what happened or the safety issue."
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Location <span className="text-red-500">*</span>
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
          Incident Date / Time <span className="text-red-500">*</span>
        </label>

        <input
          required
          type="datetime-local"
          value={incidentTime}
          onChange={(e) => setIncidentTime(e.target.value)}
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Incident Image <span className="text-red-500">*</span>
        </label>

        <input
          id="safety-image"
          required
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) =>
            setImage(e.target.files?.[0] ?? null)
          }
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
        />

        <p className="mt-1 text-xs text-stone-500">
          At least one image is required. Maximum 5 MB.
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
        className="w-full rounded-lg bg-red-700 px-4 py-3 font-medium text-white disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit Safety Incident"}
      </button>
    </form>
  );
}