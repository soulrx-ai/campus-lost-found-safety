import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const PAGE_SIZE = 500;

type ClaimFileRow = {
  evidence: string | null;
  handover_photo_url: string | null;
};

function uniquePaths(paths: Array<string | null>) {
  return [...new Set(paths.filter((path): path is string => Boolean(path)))];
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // ปลอดภัยไว้ก่อน: ค่าเริ่มต้นเป็น dry-run
  // จะลบจริงได้เมื่อตั้ง RETENTION_CLEANUP_ENABLED=true
  // และเรียก URL ด้วย ?dryRun=false เท่านั้น
  const url = new URL(request.url);
  const dryRun =
    url.searchParams.get("dryRun") !== "false" ||
    process.env.RETENTION_CLEANUP_ENABLED !== "true";

  try {
    const admin = createAdminClient();

    const { data: settings, error: settingsError } = await admin
      .from("system_settings")
      .select("data_retention_days")
      .eq("id", "global")
      .maybeSingle();

    if (settingsError || !settings) {
      return NextResponse.json(
        { error: "Unable to load data retention settings." },
        { status: 503 },
      );
    }

    const retentionDays = Number(settings.data_retention_days);
    if (!Number.isInteger(retentionDays) || retentionDays < 1 || retentionDays > 3650) {
      return NextResponse.json({ error: "Invalid retention settings." }, { status: 503 });
    }
    const cutoff = new Date(
      Date.now() - retentionDays * 24 * 60 * 60 * 1000,
    ).toISOString();

    // หา Claims ที่ส่งมอบสำเร็จและเก่ากว่าระยะเวลาที่ตั้งไว้
    const candidateIds = new Set<string>();

    for (let offset = 0; ; offset += PAGE_SIZE) {
      const { data, error } = await admin
        .from("claims")
        .select("item_id")
        .eq("status", "COMPLETED")
        .not("handover_at", "is", null)
        .lte("handover_at", cutoff)
        .order("id", { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) {
        return NextResponse.json(
          { error: "Unable to find expired returned items." },
          { status: 500 },
        );
      }

      for (const claim of data ?? []) {
        if (claim.item_id) candidateIds.add(String(claim.item_id));
      }

      if (!data || data.length < PAGE_SIZE) break;
    }

    const candidates: string[] = [];
    const deleted: string[] = [];
    const orphanCleanupWarnings: Array<{ itemId: string; bucket: string; paths: string[] }> = [];
    const skipped: Array<{ itemId: string; reason: string }> = [];

    for (const itemId of candidateIds) {
      const { data: item, error: itemError } = await admin
        .from("items")
        .select("id, image_url")
        .eq("id", itemId)
        .eq("status", "RETURNED")
        .maybeSingle();

      if (itemError) {
        skipped.push({ itemId, reason: "Unable to load item." });
        continue;
      }

      // ไม่ลบรายการที่ไม่ได้อยู่สถานะ RETURNED
      if (!item) continue;

      candidates.push(itemId);

      if (dryRun) continue;

      const { data: claims, error: claimsError } = await admin
        .from("claims")
        .select("evidence, handover_photo_url")
        .eq("item_id", itemId);

      if (claimsError) {
        skipped.push({ itemId, reason: "Unable to load claim files." });
        continue;
      }

      const claimFiles = (claims ?? []) as ClaimFileRow[];

      const evidencePaths = uniquePaths(
        claimFiles.map((claim) => claim.evidence),
      );
      const handoverPaths = uniquePaths(
        claimFiles.map((claim) => claim.handover_photo_url),
      );
      const itemImagePaths = uniquePaths([item.image_url]);

      const { data: wasDeleted, error: deleteError } = await admin.rpc(
        "delete_expired_returned_item",
        {
          p_item_id: itemId,
          p_cutoff: cutoff,
        },
      );

      if (deleteError || !wasDeleted) {
        skipped.push({
          itemId,
          reason: "Database deletion was not completed.",
        });
        continue;
      }

      deleted.push(itemId);

      // Database deletion must succeed before any Storage object is removed.
      for (const [bucket, paths] of [
        ["claim-evidence", evidencePaths],
        ["handover", handoverPaths],
        ["lost-found", itemImagePaths],
      ] as const) {
        if (!paths.length) continue;
        try {
          const { error } = await admin.storage.from(bucket).remove(paths);
          if (error) orphanCleanupWarnings.push({ itemId, bucket, paths });
        } catch {
          orphanCleanupWarnings.push({ itemId, bucket, paths });
        }
      }
    }

    return NextResponse.json({
      dryRun,
      retentionDays,
      cutoff,
      candidateCount: candidates.length,
      candidateItemIds: candidates,
      deletedCount: deleted.length,
      deletedItemIds: deleted,
      skipped,
      orphanCleanupWarnings,
    });
  } catch {
    return NextResponse.json(
      { error: "Returned-item cleanup failed." },
      { status: 500 },
    );
  }
}