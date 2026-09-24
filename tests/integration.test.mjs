import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
// Execute the real handlers with isolated database doubles; no network or real cleanup.
function load(path, mocks = {}, env = {}) {
  const source = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, {
    exports, process: { env }, Request, Response, URL, console,
    require(name) {
      if (name in mocks) return mocks[name];
      if (name === "react/jsx-runtime") return require(name);
      if (name === "next/server") return { NextResponse: { json: (body, init) => Response.json(body, init) } };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return exports;
}

function database(resolve) {
  return { from(table) {
    const calls = [];
    const query = new Proxy({}, { get(_, method) {
      if (method === "then") return (ok, fail) => Promise.resolve(resolve(table, calls)).then(ok, fail);
      return (...args) => { calls.push([method, ...args]); return query; };
    } });
    return query;
  } };
}

const context = { params: Promise.resolve({ id: "test-id" }) };
const request = (body) => new Request("https://test.invalid/api", { method: "PATCH", body: JSON.stringify(body) });
const staff = { id: "staff", role: "STAFF", status: "ACTIVE" };

for (const role of ["ADMIN", "USER", "STAFF"]) {
  test(`requireStaff enforces the ${role} boundary`, async () => {
    const client = database(() => ({ data: { ...staff, role }, error: null }));
    client.auth = { getUser: async () => ({ data: { user: { id: "staff" } } }) };
    const guards = load("lib/auth/guards.ts", {
      "next/navigation": { redirect: () => { throw new Error("redirect"); } },
      "@/lib/supabase/server": { createClient: async () => client },
    });
    if (role === "STAFF") assert.equal((await guards.requireStaff()).role, role);
    else await assert.rejects(guards.requireStaff(), /redirect/);
  });
}

function ticketHandler({ updateError = null, notificationError = null, denied = false, missing = false } = {}) {
  const writes = [];
  const client = database((table, calls) => {
    writes.push({ table, calls });
    return { data: missing ? null : { id: "test-id", requester_id: "owner", subject: "Help" }, error: updateError };
  });
  const admin = database((table, calls) => { writes.push({ table, calls }); return { error: notificationError }; });
  const handler = load("app/api/staff/tickets/[id]/route.ts", {
    "@/lib/auth/guards": { requireStaff: async () => { if (denied) throw new Error("denied"); return staff; } },
    "@/lib/supabase/server": { createClient: async () => client },
    "@/lib/supabase/admin": { createAdminClient: () => admin },
  });
  return { ...handler, writes };
}

test("ticket resolution rejects missing and whitespace-only notes before writing", async () => {
  for (const staff_note of [undefined, "", " \n\t "]) {
    const handler = ticketHandler();
    assert.equal((await handler.PATCH(request({ status: "RESOLVED", staff_note }), context)).status, 400);
    assert.equal(handler.writes.length, 0);
  }
});

test("ticket resolution saves the trimmed note and timestamp before notifying the stored owner", async () => {
  const handler = ticketHandler();
  assert.equal((await handler.PATCH(request({ status: "RESOLVED", staff_note: "  Restart device  ", requester_id: "attacker" }), context)).status, 200);
  assert.deepEqual(handler.writes.map(x => x.table), ["service_tickets", "notifications"]);
  const update = handler.writes[0].calls.find(x => x[0] === "update")[1];
  assert.equal(update.staff_note, "Restart device");
  assert.ok(Number.isFinite(Date.parse(update.resolved_at)));
  const notice = handler.writes[1].calls.find(x => x[0] === "insert")[1];
  assert.equal(notice.user_id, "owner");
  assert.equal(notice.message, "Restart device");
});

test("failed ticket writes never retry without the note or insert notifications", async () => {
  const handler = ticketHandler({ updateError: { code: "42703", message: "staff_note unavailable" } });
  assert.equal((await handler.PATCH(request({ status: "RESOLVED", staff_note: "Fixed" }), context)).status, 500);
  assert.equal(handler.writes.length, 1);
});

test("notification failure returns an error instead of success", async () => {
  const handler = ticketHandler({ notificationError: { message: "failed" } });
  const response = await handler.PATCH(request({ status: "RESOLVED", staff_note: "Fixed" }), context);
  assert.equal(response.status, 502);
  assert.match((await response.json()).error, /notification could not be sent/);
});

test("ticket route rejects non-staff and stale updates", async () => {
  const denied = ticketHandler({ denied: true });
  assert.equal((await denied.PATCH(request({ status: "IN_PROGRESS" }), context)).status, 403);
  assert.equal(denied.writes.length, 0);
  const stale = ticketHandler({ missing: true });
  assert.equal((await stale.PATCH(request({ status: "RESOLVED", staff_note: "Fixed" }), context)).status, 409);
  assert.equal(stale.writes.length, 1);
});

test("Safety only changes pending incidents and exports no DELETE handler", async () => {
  const client = database((table, calls) => {
    assert.equal(table, "security_incidents");
    assert.ok(calls.some(x => x[0] === "eq" && x[1] === "status" && x[2] === "PENDING_REVIEW"));
    assert.ok(!calls.some(x => x[0] === "delete" || x[0] === "in"));
    return { data: null, error: null }; // A rejected/already-reviewed incident cannot match.
  });
  const handler = load("app/api/staff/safety/[id]/route.ts", {
    "@/lib/auth/guards": { requireStaff: async () => staff },
    "@/lib/supabase/server": { createClient: async () => client },
  });
  assert.equal(handler.DELETE, undefined);
  assert.equal((await handler.PATCH(request({ status: "PUBLISHED" }), context)).status, 409);
  assert.equal((await handler.PATCH(request(null), context)).status, 400);
});

test("Safety cards show review buttons only for pending incidents and never deletion", () => {
  const { default: Card } = load("components/staff/SafetyReviewCard.tsx", {
    react: { useState: value => [value, () => {}] },
    "next/navigation": { useRouter: () => ({ refresh() {} }) },
    "@/components/i18n/Text": { Text: "Text", AppMessage: "AppMessage", DisplayValue: "DisplayValue", UiText: "UiText" },
    "@/components/i18n/LanguageProvider": { useLanguage: () => ({ t: value => value }) },
    "@/lib/supabase/client": { createClient: () => ({}) },
  });
  function labels(node) {
    if (Array.isArray(node)) return node.flatMap(labels);
    if (!node || typeof node !== "object") return [];
    return [node.props?.id, ...labels(node.props?.children)].filter(Boolean);
  }
  for (const status of ["PENDING_REVIEW", "REJECTED", "PUBLISHED"]) {
    const content = labels(Card({ incident: { id: "incident", status, created_at: "2026-09-01", incident_time: "2026-09-01" }, staffId: "staff" }));
    assert.equal(content.includes("Publish incident"), status === "PENDING_REVIEW");
    assert.equal(content.includes("Reject"), status === "PENDING_REVIEW");
    assert.equal(content.includes("Delete incident"), false);
  }
});

test("Admin item handlers deny unauthorized access before creating a privileged client", async () => {
  const handler = load("app/api/admin/items/[id]/route.ts", {
    "@/lib/auth/guards": { requireAdmin: async () => { throw new Error("denied"); } },
    "@/lib/supabase/admin": { createAdminClient: () => { throw new Error("Must not be called"); } },
  });
  assert.equal((await handler.PATCH(request({}), context)).status, 401);
  assert.equal((await handler.DELETE(request({}), context)).status, 401);
});

function cleanup({ dbError = false, deleted = true, storageError = false, retention = 30 } = {}) {
  const events = [];
  const admin = database((table, calls) => {
    if (table === "system_settings") return { data: { data_retention_days: retention }, error: null };
    if (table === "items") return { data: { id: "item", image_url: "item.jpg" }, error: null };
    const selected = calls.find(x => x[0] === "select")[1];
    return { data: selected === "item_id" ? [{ item_id: "item" }] : [{ evidence: "evidence.jpg", handover_photo_url: "handover.jpg" }], error: null };
  });
  admin.rpc = async () => { events.push("database"); return { data: deleted, error: dbError ? { message: "failed" } : null }; };
  admin.storage = { from: bucket => ({ remove: async () => { events.push(bucket); return { error: storageError ? { message: "failed" } : null }; } }) };
  const handler = load("app/api/cron/cleanup-returned-items/route.ts", {
    "@/lib/supabase/admin": { createAdminClient: () => admin },
  }, { CRON_SECRET: "test-only-secret", RETENTION_CLEANUP_ENABLED: "true" });
  return { ...handler, events };
}

const cleanupRequest = (query = "", authorized = true) => new Request(`https://test.invalid/cleanup${query}`, {
  headers: authorized ? { authorization: "Bearer test-only-secret" } : {},
});

test("cleanup authenticates first and defaults to a mutation-free dry run", async () => {
  const handler = cleanup();
  assert.equal((await handler.GET(cleanupRequest("", false))).status, 401);
  const result = await (await handler.GET(cleanupRequest())).json();
  assert.equal(result.dryRun, true);
  assert.equal(result.candidateCount, 1);
  assert.equal(handler.events.length, 0);
});

test("mocked cleanup preserves Storage when database deletion fails or is skipped", async () => {
  for (const options of [{ dbError: true }, { deleted: false }]) {
    const handler = cleanup(options);
    const result = await (await handler.GET(cleanupRequest("?dryRun=false"))).json();
    assert.deepEqual(handler.events, ["database"]);
    assert.equal(result.deletedCount, 0);
  }
});

test("mocked cleanup deletes database first and reports orphan files separately", async () => {
  const handler = cleanup({ storageError: true });
  const result = await (await handler.GET(cleanupRequest("?dryRun=false"))).json();
  assert.deepEqual(handler.events, ["database", "claim-evidence", "handover", "lost-found"]);
  assert.equal(result.deletedCount, 1);
  assert.equal(result.orphanCleanupWarnings.length, 3);
  assert.equal(result.skipped.length, 0);
});

test("cleanup refuses invalid retention settings", async () => {
  const handler = cleanup({ retention: 0 });
  assert.equal((await handler.GET(cleanupRequest())).status, 503);
  assert.equal(handler.events.length, 0);
});
