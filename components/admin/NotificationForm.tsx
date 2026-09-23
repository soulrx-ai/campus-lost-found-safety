"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function NotificationForm() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
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
      const cleanedEmail = email.trim().toLowerCase();
      const cleanedTitle = title.trim();
      const cleanedMessage = messageText.trim();

      if (!cleanedEmail || !cleanedTitle || !cleanedMessage) {
        setMessage("Please fill in all required fields.");
        return;
      }

      const recipientResponse = await fetch(
        `/api/admin/notification-recipient?email=${encodeURIComponent(
          cleanedEmail,
        )}`,
      );

      const recipientData = await recipientResponse.json();

      if (!recipientResponse.ok) {
        setMessage(recipientData.error ?? "Unable to find the selected user.");
        return;
      }

      const recipientId = recipientData.id;

      const { error } = await supabase.from("notifications").insert({
        user_id: recipientId,
        title: cleanedTitle,
        message: cleanedMessage,
        type,
        is_read: false,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setEmail("");
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
    <form onSubmit={handleSubmit} className="ui-card overflow-hidden">
      <div className="border-b border-[var(--border)] bg-[var(--surface-soft)] px-5 py-4 sm:px-6">
        <h2 className="font-semibold text-[var(--foreground)]">
          Notification details
        </h2>

        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
          Fields marked with * are required.
        </p>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <div>
          <label
            htmlFor="notification-user"
            className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
          >
            User Email *
          </label>

          <input
            id="notification-user"
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="user@example.com"
            className="ui-input"
          />

          <p className="mt-1.5 text-xs text-[var(--foreground-muted)]">
            Enter the email address of an existing registered user.
          </p>
        </div>

        <div>
          <label
            htmlFor="notification-type"
            className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
          >
            Notification type *
          </label>

          <select
            id="notification-type"
            required
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="ui-input"
          >
            <option value="SYSTEM">SYSTEM</option>
            <option value="ITEM">ITEM</option>
            <option value="CLAIM">CLAIM</option>
            <option value="SAFETY">SAFETY</option>
            <option value="SERVICE_TICKET">SERVICE TICKET</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="notification-title"
            className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
          >
            Title *
          </label>

          <input
            id="notification-title"
            required
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Notification title"
            className="ui-input"
          />
        </div>

        <div>
          <label
            htmlFor="notification-message"
            className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
          >
            Message *
          </label>

          <textarea
            id="notification-message"
            required
            rows={5}
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
            placeholder="Write the notification message"
            className="ui-input min-h-32 resize-y"
          />
        </div>

        {message && (
          <div
            role="status"
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3 text-sm text-[var(--foreground)]"
          >
            {message}
          </div>
        )}

        <div className="border-t border-[var(--border)] pt-5">
          <button
            type="submit"
            disabled={loading}
            className="ui-button-primary w-full"
          >
            {loading ? "Sending..." : "Send notification"}
          </button>
        </div>
      </div>
    </form>
  );
}
