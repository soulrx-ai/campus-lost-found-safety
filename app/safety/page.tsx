"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SafetyFilters, {
  SafetyFilterValues,
} from "@/components/safety/SafetyFilters";

type Incident = {
  id: string;
  reporter_id: string;
  title: string;
  description: string;
  location: string;
  incident_time: string;
  status: string;
  image_url: string;
  created_at: string;
};

const initialFilters: SafetyFilterValues = {
  location: "",
  date: "",
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

export default function SafetyPage() {
  const supabase = createClient();

  const [filters, setFilters] =
    useState<SafetyFilterValues>(initialFilters);

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // State สำหรับ Modal แสดงรายละเอียดและรูปภาพ
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState("");

  async function searchIncidents(activeFilters: SafetyFilterValues = filters) {
    setLoading(true);
    setMessage("");

    let query = supabase
      .from("security_incidents")
      .select(
        "id, reporter_id, title, description, location, incident_time, status, image_url, created_at"
      )
      .eq("status", "PUBLISHED")
      .order("incident_time", { ascending: false });

    if (activeFilters.location.trim()) {
      query = query.ilike(
        "location",
        `%${activeFilters.location.trim()}%`
      );
    }

    if (activeFilters.date) {
      const start = new Date(`${activeFilters.date}T00:00:00`);
      const end = new Date(`${activeFilters.date}T23:59:59.999`);

      query = query
        .gte("incident_time", start.toISOString())
        .lte("incident_time", end.toISOString());
    }

    const { data, error } = await query;

    setLoading(false);

    if (error) {
      setIncidents([]);
      setMessage(error.message);
      return;
    }

    const results = (data ?? []) as Incident[];

    setIncidents(results);

    if (results.length === 0) {
      setMessage("No safety incidents found.");
    }
  }

  useEffect(() => {
    searchIncidents(initialFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clearFilters() {
    setFilters(initialFilters);
    searchIncidents(initialFilters);
  }

  // ฟังก์ชันเปิด Modal และโหลดรูปภาพจาก Supabase Storage
  async function openIncidentModal(incident: Incident) {
    setSelectedIncident(incident);
    setSelectedImageUrl(null);
    setImageError("");
    setImageLoading(true);

    if (!incident.image_url) {
      setImageLoading(false);
      return;
    }

    try {
      // 1. ลองสร้าง Signed URL ก่อน (สำหรับ Private Bucket)
      const { data, error } = await supabase.storage
        .from("safety-incidents")
        .createSignedUrl(incident.image_url, 60 * 30); // 30 นาที

      if (!error && data?.signedUrl) {
        setSelectedImageUrl(data.signedUrl);
      } else {
        // 2. ถ้าไม่ได้ ลองใช้ Public URL
        const { data: publicData } = supabase.storage
          .from("safety-incidents")
          .getPublicUrl(incident.image_url);

        if (publicData?.publicUrl) {
          setSelectedImageUrl(publicData.publicUrl);
        } else {
          setImageError("ไม่สามารถโหลดรูปภาพได้");
        }
      }
    } catch {
      setImageError("เกิดข้อผิดพลาดในการโหลดรูปภาพ");
    } finally {
      setImageLoading(false);
    }
  }

  function closeIncidentModal() {
    setSelectedIncident(null);
    setSelectedImageUrl(null);
    setImageError("");
  }

  // กดปุ่ม Escape เพื่อปิด Modal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeIncidentModal();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <main className="page-shell">
      <div className="app-container">
        <div className="mx-auto max-w-5xl">
          <header className="mb-7">
            <p className="text-sm font-semibold text-[var(--danger)]">
              Campus Safety
            </p>

            <h1 className="page-title">Safety Incidents</h1>

            <p className="page-description">
              View published campus safety reports and filter incidents by
              location or date.
            </p>
          </header>

          <SafetyFilters
            filters={filters}
            onChange={setFilters}
            onSearch={searchIncidents}
            onClear={clearFilters}
            loading={loading}
          />

          {loading && incidents.length === 0 && (
            <div className="ui-card mt-6 p-6">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border-strong)] border-t-[var(--danger)]" />
                <p className="text-sm text-[var(--foreground-muted)]">
                  Loading safety incidents...
                </p>
              </div>
            </div>
          )}

          {message && !loading && (
            <div className="ui-card mt-5 p-4 text-sm text-[var(--foreground)]">
              {message}
            </div>
          )}

          <div className="mt-6 space-y-4">
            {incidents.map((incident) => (
              <article
                key={incident.id}
                className="ui-card overflow-hidden border-l-4 border-l-[var(--danger)] transition hover:shadow-md"
              >
                <div className="flex flex-col gap-3 border-b border-[var(--border)] p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--danger)]">
                      Safety Incident
                    </p>

                    <h2 className="mt-1 break-words text-xl font-semibold text-[var(--foreground)]">
                      {incident.title}
                    </h2>
                  </div>

                  <span
                    className={`inline-flex w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      incident.status === "CLOSED"
                        ? "bg-[var(--surface-soft)] text-[var(--foreground-muted)]"
                        : "bg-[var(--danger-soft)] text-[var(--danger)]"
                    }`}
                  >
                    {incident.status}
                  </span>
                </div>

                <div className="space-y-5 p-5 sm:p-6">
                  <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[var(--foreground)]">
                    {incident.description}
                  </p>

                  <div className="grid gap-4 border-t border-[var(--border)] pt-5 sm:grid-cols-2">
                    <InfoField
                      label="Location"
                      value={incident.location}
                    />

                    <InfoField
                      label="Incident time"
                      value={formatDateTime(incident.incident_time)}
                    />
                  </div>

                  {/* ปุ่มคลิกเพื่อเปิดดูรายละเอียดและรูปภาพ */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
                    <button
                      type="button"
                      onClick={() => openIncidentModal(incident)}
                      className="inline-flex items-center gap-2 rounded-xl bg-[var(--danger)] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
                    >
                      <span>🔍</span>
                      <span>ดูรายละเอียดและรูปภาพ (View Details &amp; Image)</span>
                    </button>

                    <span className="text-xs text-[var(--foreground-muted)]">
                      รายงานเมื่อ {formatDateTime(incident.created_at)}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      {/* Modal ป๊อปอัปดูรายละเอียดและรูปภาพ */}
      {selectedIncident && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={closeIncidentModal}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl sm:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-4">
              <div>
                <span className="inline-flex rounded-full bg-[var(--danger-soft)] px-2.5 py-0.5 text-xs font-bold text-[var(--danger)]">
                  {selectedIncident.status}
                </span>

                <h3 className="mt-2 text-xl font-bold text-[var(--foreground)] sm:text-2xl">
                  {selectedIncident.title}
                </h3>

                <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                  รหัสรายงาน: #{selectedIncident.id.slice(0, 8)} • แจ้งเมื่อ {formatDateTime(selectedIncident.created_at)}
                </p>
              </div>

              <button
                type="button"
                onClick={closeIncidentModal}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-sm font-bold text-[var(--foreground-muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            {/* Body Modal */}
            <div className="mt-5 space-y-5">
              {/* 1. รูปภาพที่ User แนบมา */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">
                  รูปภาพประกอบเหตุการณ์ (Attached Incident Image)
                </p>

                <div className="mt-2 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]">
                  {imageLoading ? (
                    <div className="flex h-56 flex-col items-center justify-center gap-2 p-6 text-[var(--foreground-muted)]">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--border-strong)] border-t-[var(--danger)]" />
                      <p className="text-xs font-medium">กำลังโหลดรูปภาพ...</p>
                    </div>
                  ) : selectedImageUrl ? (
                    <div className="flex flex-col items-center">
                      <img
                        src={selectedImageUrl}
                        alt={selectedIncident.title}
                        className="max-h-96 w-full object-contain bg-black/5"
                        loading="lazy"
                      />
                      <div className="w-full bg-[var(--surface)] p-2.5 text-center border-t border-[var(--border)]">
                        <a
                          href={selectedImageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--info)] hover:underline"
                        >
                          <span>↗</span>
                          <span>เปิดดูภาพขนาดเต็มในแท็บใหม่ (Open Full Size)</span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-36 flex-col items-center justify-center p-6 text-center text-xs text-[var(--foreground-muted)]">
                      <span>📷</span>
                      <p className="mt-1 font-medium">
                        {imageError || "ไม่มีรูปภาพแนบในรายงานนี้"}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. รายละเอียดข้อความที่แจ้ง */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">
                  รายละเอียดเหตุการณ์ (Incident Description)
                </p>
                <div className="mt-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm leading-relaxed text-[var(--foreground)]">
                  <p className="whitespace-pre-wrap break-words">
                    {selectedIncident.description}
                  </p>
                </div>
              </div>

              {/* 3. ข้อมูลสถานที่ และเวลา */}
              <div className="grid gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-xs sm:grid-cols-2">
                <div>
                  <span className="font-bold text-[var(--foreground)]">สถานที่เกิดเหตุ:</span>
                  <p className="mt-0.5 text-sm text-[var(--foreground)]">
                    {selectedIncident.location}
                  </p>
                </div>

                <div>
                  <span className="font-bold text-[var(--foreground)]">วันเวลาที่เกิดเหตุ:</span>
                  <p className="mt-0.5 text-sm text-[var(--foreground)]">
                    {formatDateTime(selectedIncident.incident_time)}
                  </p>
                </div>

                <div>
                  <span className="font-bold text-[var(--foreground)]">ผู้แจ้งเหตุ (Reporter Reference):</span>
                  <p className="mt-0.5 font-mono text-[var(--foreground-muted)]">
                    User #{selectedIncident.reporter_id.slice(0, 8)}
                  </p>
                </div>

                <div>
                  <span className="font-bold text-[var(--foreground)]">วันที่ส่งรายงาน:</span>
                  <p className="mt-0.5 text-[var(--foreground-muted)]">
                    {formatDateTime(selectedIncident.created_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="mt-6 flex justify-end border-t border-[var(--border)] pt-4">
              <button
                type="button"
                onClick={closeIncidentModal}
                className="ui-button-secondary w-full sm:w-auto"
              >
                ปิดหน้าต่าง (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function InfoField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
        {label}
      </p>

      <p className="mt-1 break-words text-sm text-[var(--foreground)]">
        {value}
      </p>
    </div>
  );
}