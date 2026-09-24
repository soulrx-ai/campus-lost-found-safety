"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  AppMessage,
  DisplayValue,
  Text,
} from "@/components/i18n/Text";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { createClient } from "@/lib/supabase/client";

type ProfileFormProps = {
  initialProfile: {
    fullName: string;
    email: string;
    phone: string;
    role: "USER" | "STAFF" | "ADMIN";
    status: "ACTIVE" | "INACTIVE";
  };
};

const PHONE_REGEX = /^0[0-9]{2}-[0-9]{3}-[0-9]{4}$/;

function isValidPhone(value: string): boolean {
  if (!value) return true;
  return PHONE_REGEX.test(value);
}

function formatPhone(digits: string): string {
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  return `${digits.slice(0, 3)}-${digits.slice(
    3,
    6
  )}-${digits.slice(6, 10)}`;
}

export default function ProfileForm({
  initialProfile,
}: ProfileFormProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [fullName, setFullName] = useState(
    initialProfile.fullName
  );
  const [phone, setPhone] = useState(initialProfile.phone);

  const [savedFullName, setSavedFullName] = useState(
    initialProfile.fullName
  );
  const [savedPhone, setSavedPhone] = useState(
    initialProfile.phone
  );

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const cleanFullName = fullName.trim();
  const cleanPhone = phone.trim();

  const hasChanges =
    cleanFullName !== savedFullName.trim() ||
    cleanPhone !== savedPhone.trim();

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");

    if (!cleanFullName) {
      setErrorMessage("Full name is required.");
      return;
    }

    if (cleanFullName.length > 100) {
      setErrorMessage(
        "Full name must be 100 characters or fewer."
      );
      return;
    }

    if (cleanPhone && !isValidPhone(cleanPhone)) {
      setErrorMessage(
        "Phone number must be in the format 0xx-xxx-xxxx (e.g. 081-234-5478)."
      );
      return;
    }

    if (!hasChanges) {
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.rpc(
        "update_my_profile",
        {
          p_full_name: cleanFullName,
          p_phone: cleanPhone,
        }
      );

      if (error) {
        setErrorMessage(
          "Unable to update your profile. Please try again."
        );
        return;
      }

      setFullName(cleanFullName);
      setPhone(cleanPhone);

      setSavedFullName(cleanFullName);
      setSavedPhone(cleanPhone);

      setSuccessMessage(
        "Profile updated successfully."
      );

      router.refresh();
    } catch {
      setErrorMessage(
        "Unable to update your profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <section className="ui-card p-5 sm:p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-[var(--heading)]">
            <Text id="Personal Information" />
          </h2>

          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            <Text id="Update your personal details used by the system." />
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="profile-full-name"
              className="mb-2 block text-sm font-medium text-[var(--foreground)]"
            >
              <Text id="Full Name" />
              <span
                className="ml-1 required-indicator"
                aria-hidden="true"
              >
                *
              </span>
            </label>

            <input
              id="profile-full-name"
              type="text"
              required
              maxLength={100}
              autoComplete="name"
              value={fullName}
              onChange={(event) => {
                setFullName(event.target.value);
                setSuccessMessage("");
              }}
              className="ui-input"
              placeholder={t("Your full name")}
            />
          </div>

          <div>
            <label
              htmlFor="profile-email"
              className="mb-2 block text-sm font-medium text-[var(--foreground)]"
            >
              <Text id="Email" />
            </label>

            <input
              id="profile-email"
              type="email"
              value={initialProfile.email}
              readOnly
              aria-readonly="true"
              className="ui-input cursor-not-allowed bg-[var(--surface-soft)] text-[var(--foreground-muted)]"
            />

            <p className="mt-1.5 text-xs text-[var(--foreground-muted)]">
              <Text id="Email cannot be changed from this page." />
            </p>
          </div>

          <div>
            <label
              htmlFor="profile-phone"
              className="mb-2 block text-sm font-medium text-[var(--foreground)]"
            >
              <Text id="Phone" />
            </label>

            <input
              id="profile-phone"
              type="tel"
              inputMode="numeric"
              maxLength={12}
              autoComplete="tel"
              value={phone}
              onChange={(event) => {
                const digitsOnly = event.target.value
                  .replace(/[^0-9]/g, "")
                  .slice(0, 10);

                setPhone(formatPhone(digitsOnly));
                setSuccessMessage("");
              }}
              className="ui-input"
              placeholder="0xx-xxx-xxxx"
            />

            <p className="mt-1.5 text-xs text-[var(--foreground-muted)]">
              <Text id="Phone number is optional. Use the format 0xx-xxx-xxxx." />
            </p>
          </div>
        </div>
      </section>

      <section className="ui-card p-5 sm:p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-[var(--heading)]">
            <Text id="Account Information" />
          </h2>

          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            <Text id="These account settings are managed by the system." />
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium text-[var(--foreground)]">
              <Text id="Role" />
            </p>

            <div className="ui-input cursor-not-allowed bg-[var(--surface-soft)] text-[var(--foreground-muted)]">
              <span className="role-badge rounded-full px-2 py-1" data-accent={initialProfile.role.toLowerCase()}><DisplayValue value={initialProfile.role} /></span>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-[var(--foreground)]">
              <Text id="Status" />
            </p>

            <div className="ui-input cursor-not-allowed bg-[var(--surface-soft)] text-[var(--foreground-muted)]">
              <DisplayValue value={initialProfile.status} />
            </div>
          </div>
        </div>
      </section>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-[var(--radius-md)] border border-[var(--danger)]/20 bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]"
        >
          <AppMessage text={errorMessage} />
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="rounded-[var(--radius-md)] border border-[var(--success)]/20 bg-[var(--success-soft)] px-4 py-3 text-sm text-[var(--success)]"
        >
          <AppMessage text={successMessage} />
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={
            saving || !hasChanges || !cleanFullName
          }
          className="ui-button-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <Text id="Saving..." />
          ) : (
            <Text id="Save Changes" />
          )}
        </button>
      </div>
    </form>
  );
}