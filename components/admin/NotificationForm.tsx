"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function NotificationForm() {
  const supabase = createClient();

  const [userId, setUserId] = useState("");
  const [title, setTitle] = useState("");
  const [messageText, setMessageText] = useState("");
  const [type, setType] = useState("SYSTEM");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const cleanedUserId = userId.trim();
      const cleanedTitle = title.trim();
      const cleanedMessage = messageText.trim();

      if (!cleanedUserId || !cleanedTitle || !cleanedMessage) {
        setMessage("Please fill in all required fields.");
        return;
      }

      const { data: recipient, error: recipientError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", cleanedUserId)
        .maybeSingle();

      if (recipientError) {
        setMessage(recipientError.message);
        return;
      }

      if (!recipient) {
        setMessage("The selected user does not exist.");
        return;
      }

      const { error } = await supabase.from("notifications").insert({
        user_id: cleanedUserId,
        title: cleanedTitle,
        message: cleanedMessage,
        type,
        is_read: false,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setUserId("");
      setTitle("");
      setMessageText("");
      setType("SYSTEM");

      setMessage("Notification sent successfully.");
    } catch {
      setMessage("Something went wrong.");
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
        <label className="mb-1 block text-sm font-medium">User ID *</label>

        <input
          required
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="User UUID"
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Notification Type *
        </label>

        <select
          required
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
        >
          <option value="SYSTEM">SYSTEM</option>
          <option value="ITEM">ITEM</option>
          <option value="CLAIM">CLAIM</option>
          <option value="SAFETY">SAFETY</option>
          <option value="SERVICE_TICKET">SERVICE_TICKET</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Title *</label>

        <input
          required
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Message *</label>

        <textarea
          required
          rows={5}
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
        />
      </div>

      {message && (
        <div className="rounded-lg bg-stone-100 p-3 text-sm">{message}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-stone-800 px-4 py-3 text-white disabled:opacity-50"
      >
        {loading ? "Sending..." : "Send Notification"}
      </button>
    </form>
  );
}
