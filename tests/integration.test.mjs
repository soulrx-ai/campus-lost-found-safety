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

for (const role of [null, "USER", "STAFF", "ADMIN"]) {
  for (const status of ["ACTIVE", "INACTIVE"]) {
    test(`category routes enforce ${role ?? "anonymous"}/${status}`, async () => {
      const reads = [];
      let privileged = 0;
      const client = database((table, calls) => {
        if (table === "profiles") return { data: { role, status }, error: null };
        reads.push(calls);
        return { data: [], error: null };
      });
      client.auth = { getUser: async () => ({ data: { user: role ? { id: "user" } : null } }) };
      const mocks = {
        "@/lib/supabase/server": { createClient: async () => client },
        "@/lib/supabase/admin": { createAdminClient: () => {
          privileged++;
          return { ...database(() => ({ data: { id: "category" }, error: null })), rpc: async () => ({ error: null }) };
        } },
      };
      const collection = load("app/api/categories/route.ts", mocks);
      const individual = load("app/api/categories/[id]/route.ts", mocks);
      const baseStatus = !role ? 401 : status !== "ACTIVE" ? 403 : 200;
      assert.equal((await collection.GET(new Request("https://test.invalid/api/categories"))).status, baseStatus);
      if (baseStatus === 200) assert.ok(reads[0].some(call => call[0] === "eq" && call[1] === "is_active" && call[2] === true));
      const adminStatus = !role ? 401 : status !== "ACTIVE" || role !== "ADMIN" ? 403 : 200;
      assert.equal((await collection.GET(new Request("https://test.invalid/api/categories?includeInactive=true"))).status, adminStatus);
      const ctx = { params: Promise.resolve({ id: "00000000-0000-0000-0000-000000000001" }) };
      assert.equal((await collection.POST(request({ name: "New" }))).status, adminStatus === 200 ? 201 : adminStatus);
      for (const is_active of [true, false]) {
        assert.equal((await individual.PATCH(request({ name: "Renamed", is_active }), ctx)).status, adminStatus);
      }
      assert.equal((await individual.DELETE(request({}), ctx)).status, adminStatus);
      assert.equal(privileged, adminStatus === 200 ? 4 : 0);
    });
  }
}

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

test("Staff dashboard loads exact workflow counts and preserves query failures", async () => {
  const calls = [];
  const client = database((table, queryCalls) => {
    calls.push([table, queryCalls]);
    const filter = queryCalls.find(call => call[0] === "eq" || call[0] === "in");
    if (table === "security_incidents") {
      return { count: null, error: { message: "incident count failed" } };
    }
    if (table === "service_tickets") return { count: 5, error: null };
    if (table === "items") return { count: 2, error: null };
    return { count: filter?.[2] === "APPROVED" ? 3 : 4, error: null };
  });
  const { loadStaffDashboard } = load("lib/staff/dashboard.ts");
  const metrics = await loadStaffDashboard(client);

  assert.deepEqual(Array.from(metrics, metric => [metric.key, metric.count, metric.error]), [
    ["items", 2, null],
    ["claims", 4, null],
    ["handovers", 3, null],
    ["safety", null, "incident count failed"],
    ["tickets", 5, null],
  ]);
  assert.equal(calls.length, 5);
  assert.ok(calls.every(([, queryCalls]) => queryCalls.some(call =>
    call[0] === "select" && call[1] === "id" && call[2]?.count === "exact" && call[2]?.head === true
  )));
  assert.ok(calls.some(([table, queryCalls]) => table === "service_tickets" && queryCalls.some(call =>
    call[0] === "in" && call[1] === "status" && Array.from(call[2]).join(",") === "OPEN,IN_PROGRESS"
  )));
});

test("Staff dashboard renders partial errors and all workflow links after Staff authorization", async () => {
  let authorized = 0;
  const metrics = [
    { key: "items", count: 2, error: null },
    { key: "claims", count: null, error: "claims unavailable" },
    { key: "handovers", count: 1, error: null },
    { key: "safety", count: 0, error: null },
    { key: "tickets", count: 3, error: null },
  ];
  const page = load("app/staff/page.tsx", {
    "next/link": { default: "a" },
    "@/components/i18n/Text": { Text: ({ id }) => id },
    "@/lib/auth/guards": { requireStaff: async () => { authorized++; return staff; } },
    "@/lib/staff/dashboard": { loadStaffDashboard: async () => metrics },
    "@/lib/supabase/server": { createClient: async () => ({}) },
  });
  const html = require("react-dom/server").renderToStaticMarkup(await page.default());

  assert.equal(authorized, 1);
  assert.match(html, /claims unavailable/);
  assert.match(html, /role="alert"/);
  for (const href of ["/staff/items", "/staff/claims", "/staff/safety", "/staff/tickets"]) {
    assert.match(html, new RegExp(`href="${href}"`));
  }
  assert.doesNotMatch(html, /image_url|evidence|requester_id|reporter_id/);
});

function ticketHandler({ updateError = null, notificationError = null, denied = false, missing = false } = {}) {
  const writes = [];
  const client = { rpc: async (name, args) => {
    writes.push({ name, args });
    return { data: !missing, error: updateError || notificationError };
  } };
  const handler = load("app/api/staff/tickets/[id]/route.ts", {
    "@/lib/auth/guards": { requireStaff: async () => { if (denied) throw new Error("denied"); return staff; } },
    "@/lib/supabase/server": { createClient: async () => client },
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

test("ticket resolution sends only validated fields to the atomic RPC", async () => {
  const handler = ticketHandler();
  assert.equal((await handler.PATCH(request({ status: "RESOLVED", staff_note: "  Restart device  ", requester_id: "attacker" }), context)).status, 200);
  assert.equal(handler.writes.length, 1);
  assert.equal(handler.writes[0].name, "update_staff_ticket");
  assert.equal(handler.writes[0].args.p_staff_note, "Restart device");
  assert.equal(handler.writes[0].args.requester_id, undefined);
});

test("failed ticket writes never retry without the note or insert notifications", async () => {
  const handler = ticketHandler({ updateError: { code: "42703", message: "staff_note unavailable" } });
  assert.equal((await handler.PATCH(request({ status: "RESOLVED", staff_note: "Fixed" }), context)).status, 500);
  assert.equal(handler.writes.length, 1);
});

test("notification failure returns an error instead of success", async () => {
  const handler = ticketHandler({ notificationError: { message: "failed" } });
  const response = await handler.PATCH(request({ status: "RESOLVED", staff_note: "Fixed" }), context);
  assert.equal(response.status, 500);
  assert.match((await response.json()).error, /Unable to update ticket/);
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

function cleanup({ dbError = false, deleted = true, storageError = false, retention = 30, imagePath = "item.jpg" } = {}) {
  const events = [];
  const admin = database((table, calls) => {
    if (table === "system_settings") return { data: { data_retention_days: retention }, error: null };
    if (table === "items") return { data: { id: "item", image_url: imagePath }, error: null };
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

test("Admin settings are rendered in an expanded section with both inputs and a save button", () => {
  const { default: Manager } = load("components/admin/AdminItemManager.tsx", {
    react: { useEffect() {}, useState: value => [value === true ? false : value, () => {}] },
    "@/components/i18n/Text": { Text: "Text", AppMessage: "AppMessage", DisplayValue: "DisplayValue" },
    "@/components/i18n/LanguageProvider": { useLanguage: () => ({ t: value => value }) },
    "@/components/admin/CategoryManager": { default: "CategoryManager" },
    "@/components/categories/useCategories": { useCategories: () => ({ categories: [], error: "", refreshCategories() {} }) },
  });
  function nodes(node) {
    if (Array.isArray(node)) return node.flatMap(nodes);
    if (!node || typeof node !== "object") return [];
    return [node, ...nodes(node.props?.children)];
  }
  const tree = nodes(Manager());
  assert.ok(tree.some(node => node.type === "button" && node.props.type === "submit" && node.props.disabled));
  assert.ok(tree.some(node => node.type === "section" && node.props["aria-labelledby"] === "system-settings-title"));
  assert.ok(!tree.some(node => node.type === "details" && !node.props.open));
  for (const id of ["System Settings", "Matching Threshold", "Data Retention Period", "Save settings"]) {
    assert.ok(tree.some(node => node.props.id === id), id);
  }
});

function settingsHandler(role = "ADMIN", status = "ACTIVE", failWrite = false) {
  let settings = { matching_threshold: 70, data_retention_days: 30 };
  let writes = 0;
  const session = database(() => ({ data: { role, status }, error: null }));
  session.auth = { getUser: async () => ({ data: { user: { id: "account" } }, error: null }) };
  const admin = database((table, calls) => {
    assert.equal(table, "system_settings");
    const update = calls.find(call => call[0] === "upsert");
    if (update) {
      writes++;
      if (failWrite) return { data: null, error: { message: "failed" } };
      settings = { ...update[1] };
    }
    return { data: settings, error: null };
  });
  return { ...load("app/api/admin/system-settings/route.ts", {
    "@/lib/supabase/server": { createClient: async () => session },
    "@/lib/supabase/admin": { createAdminClient: () => admin },
  }), writes: () => writes };
}

test("settings API saves and reloads both values for an active ADMIN", async () => {
  const handler = settingsHandler();
  assert.equal((await handler.PUT(request({ matching_threshold: 85, data_retention_days: 60 }))).status, 200);
  const { settings } = await (await handler.GET()).json();
  assert.equal(settings.matching_threshold, 85);
  assert.equal(settings.data_retention_days, 60);
  assert.equal(handler.writes(), 1);
});

test("settings API rejects USER, STAFF, and inactive ADMIN writes", async () => {
  for (const [role, status] of [["USER", "ACTIVE"], ["STAFF", "ACTIVE"], ["ADMIN", "INACTIVE"]]) {
    const handler = settingsHandler(role, status);
    assert.equal((await handler.GET()).status, 403);
    assert.equal((await handler.PUT(request({ matching_threshold: 85, data_retention_days: 60 }))).status, 403);
    assert.equal(handler.writes(), 0);
  }
});

test("settings API reports validation and database errors without success", async () => {
  const handler = settingsHandler("ADMIN", "ACTIVE", true);
  assert.equal((await handler.PUT(request({ matching_threshold: 101, data_retention_days: 30 }))).status, 400);
  assert.equal((await handler.PUT(request({ matching_threshold: 70, data_retention_days: 0 }))).status, 400);
  assert.equal(handler.writes(), 0);
  assert.equal((await handler.PUT(request({ matching_threshold: 80, data_retention_days: 60 }))).status, 500);
});


test("cleanup refuses URLs and traversal before database or storage deletion", async () => {
  for (const imagePath of ["https://example.com/item.jpg", "../item.jpg", "/item.jpg"]) {
    const handler = cleanup({ imagePath });
    const result = await (await handler.GET(cleanupRequest("?dryRun=false"))).json();
    assert.equal(result.deletedCount, 0);
    assert.match(result.skipped[0].reason, /Invalid Storage/);
    assert.deepEqual(handler.events, []);
  }
});

test("Admin item list never selects or signs private images", async () => {
  const admin = database((table, calls) => {
    assert.equal(table, "items");
    assert.ok(!calls.find(call => call[0] === "select")[1].includes("image"));
    return { data: [{ id: "item", name: "Keys" }], count: 1, error: null };
  });
  const handler = load("app/api/admin/items/route.ts", {
    "@/lib/auth/guards": { requireAdmin: async () => ({ role: "ADMIN", status: "ACTIVE" }) },
    "@/lib/supabase/admin": { createAdminClient: () => admin },
  });
  const response = await handler.GET(new Request("https://test.invalid/api/admin/items"));
  assert.equal(response.status, 200);
  assert.ok(!(await response.text()).includes("image"));
});

test("matching weights and configured threshold change actual match eligibility", () => {
  const { calculateMatch } = load("lib/matching/calculateMatch.ts");
  const item = { name: "Phone", category: "Electronics", color: "Black", location: "Library", date_time: "2026-09-24" };
  assert.equal(calculateMatch(item, item, 100).score, 100);
  const other = { ...item, name: "Unrelated" };
  assert.equal(calculateMatch(item, other, 70).score, 70);
  assert.equal(calculateMatch(item, other, 70).isPotentialMatch, true);
  assert.equal(calculateMatch(item, other, 80).isPotentialMatch, false);
});

test("matching component displays the calculated percentage and gates the claim link", () => {
  const { default: Matches } = load("components/matching/PotentialMatches.tsx", {
    "@/components/i18n/Text": { Text: ({ id }) => id, DisplayValue: ({ value }) => value },
    "next/link": { default: "a" },
    "@/lib/matching/calculateMatch": load("lib/matching/calculateMatch.ts"),
  });
  const item = { id: "found", report_type: "FOUND", name: "Phone", category: "Electronics", color: "Black", location: "Library", date_time: "2026-09-24" };
  const render = threshold => require("react-dom/server").renderToStaticMarkup(Matches({ lostItem: item, foundItems: [{ ...item, name: "Unrelated" }], matchingThreshold: threshold }));
  assert.match(render(70), /Matching percentage.*70%/);
  assert.match(render(70), /claims\/new/);
  assert.doesNotMatch(render(80), /claims\/new/);
});

test("inactive profiles and authentication errors fail all page guards", async () => {
  for (const role of ["USER", "STAFF", "ADMIN"]) {
    const client = database(() => ({ data: { id: "account", role, status: "INACTIVE" }, error: null }));
    client.auth = { getUser: async () => ({ data: { user: { id: "account" } }, error: null }) };
    const guards = load("lib/auth/guards.ts", {
      "next/navigation": { redirect: () => { throw new Error("redirect"); } },
      "@/lib/supabase/server": { createClient: async () => client },
    });
    for (const guard of [guards.requireUser, guards.requireStaff, guards.requireAdmin]) await assert.rejects(guard(), /redirect/);
  }
});
