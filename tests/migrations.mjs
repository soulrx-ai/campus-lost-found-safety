import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";

// Pass an installed @electric-sql/pglite module path. This runs in memory only.
const { PGlite } = await import(process.argv[2] ? pathToFileURL(process.argv[2]).href : "@electric-sql/pglite");
const db = new PGlite();
try {
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create function auth.uid() returns uuid language sql as
      $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
    grant usage on schema public, auth to anon, authenticated, service_role;
    create table public.profiles(id uuid primary key, role text, status text);
    create table public.items(id uuid primary key, category text, status text);
    create table public.claims(id uuid primary key, item_id uuid references items(id), status text, handover_at timestamptz);
    create table public.service_tickets(id uuid primary key, claim_id uuid references claims(id), status text, resolved_at timestamptz, updated_at timestamptz);
    create table public.security_incidents(id uuid primary key, status text);
    alter table public.security_incidents enable row level security;
    grant all on public.security_incidents to authenticated;
    create policy "Staff can manage safety incidents" on public.security_incidents for all to authenticated using (true);
    create function public.review_claim(uuid,text,text) returns void language sql as $$ select $$;
    create function public.complete_claim_handover(uuid,text) returns void language sql as $$ select $$;
    insert into profiles values
      ('00000000-0000-0000-0000-000000000001','STAFF','ACTIVE'),
      ('00000000-0000-0000-0000-000000000002','ADMIN','ACTIVE'),
      ('00000000-0000-0000-0000-000000000003','STAFF','INACTIVE');
    insert into items values ('00000000-0000-0000-0000-000000000010','Custom','RETURNED');
    insert into items values ('00000000-0000-0000-0000-000000000011','custom','PUBLISHED');
    insert into claims values ('00000000-0000-0000-0000-000000000020','00000000-0000-0000-0000-000000000010','COMPLETED','2020-01-01');
    insert into service_tickets values ('00000000-0000-0000-0000-000000000030','00000000-0000-0000-0000-000000000020','IN_PROGRESS',null,now());
    insert into security_incidents values
      ('00000000-0000-0000-0000-000000000040','PENDING_REVIEW'),
      ('00000000-0000-0000-0000-000000000041','REJECTED');
  `);
  const migrations = readdirSync("supabase/migrations").filter(x => x.endsWith(".sql")).sort();
  for (let pass = 0; pass < 2; pass++) {
    for (const name of migrations) await db.exec(readFileSync(`supabase/migrations/${name}`, "utf8"));
  }
  console.log(`PASS: ${migrations.length} migrations replay twice without errors`);
  const scalar = async sql => Object.values((await db.query(sql)).rows[0])[0];
  assert.equal(await scalar("select count(*) from items"), 2);
  assert.equal(await scalar("select count(*) from item_categories where lower(name)='custom'"), 1);
  await assert.rejects(db.query("insert into item_categories(name) values ('CUSTOM')"), /duplicate key/);
  console.log("PASS: prerequisites, case-insensitive categories, and existing records preserved");

  assert.equal(await scalar("select has_function_privilege('anon','public.review_claim(uuid,text,text)','EXECUTE')"), false);
  assert.equal(await scalar("select has_function_privilege('authenticated','public.review_claim(uuid,text,text)','EXECUTE')"), true);
  assert.equal(await scalar("select has_function_privilege('authenticated','public.delete_expired_returned_item(text,timestamptz)','EXECUTE')"), false);
  assert.equal(await scalar("select has_function_privilege('service_role','public.delete_expired_returned_item(text,timestamptz)','EXECUTE')"), true);
  assert.equal(await scalar("select has_table_privilege('anon','public.item_categories','SELECT')"), false);
  console.log("PASS: anonymous and cleanup RPC privileges");

  await db.exec("set role authenticated; set test.uid = '00000000-0000-0000-0000-000000000001'");
  assert.equal(await scalar("select public.get_my_role()"), "STAFF");
  assert.equal(await scalar("select count(*) from system_settings"), 0);
  assert.equal((await db.query("update security_incidents set status='PUBLISHED' where status='REJECTED' returning id")).rows.length, 0);
  assert.equal((await db.query("update security_incidents set status='PUBLISHED' where status='PENDING_REVIEW' returning id")).rows.length, 1);
  await assert.rejects(db.query("delete from security_incidents"), /permission denied/);
  await db.exec("set test.uid = '00000000-0000-0000-0000-000000000002'");
  assert.equal(await scalar("select count(*) from system_settings"), 1);
  assert.equal((await db.query("update security_incidents set status='REJECTED' returning id")).rows.length, 0);
  await db.exec("set test.uid = '00000000-0000-0000-0000-000000000003'");
  assert.equal(await scalar("select public.get_my_role()"), null);
  await db.exec("reset role");
  console.log("PASS: STAFF/ADMIN boundaries, inactive roles, Safety finality and deletion denial");

  await assert.rejects(db.query("update service_tickets set status='RESOLVED', staff_note='   '"), /Staff Note/);
  await assert.rejects(db.query("update service_tickets set status='RESOLVED', staff_note=E' \\t\\n '"), /Staff Note/);
  assert.equal(await scalar("select status from service_tickets"), "IN_PROGRESS");
  assert.equal(await scalar("select resolved_at from service_tickets"), null);
  await db.exec("update service_tickets set status='RESOLVED', staff_note=E' \\tFixed\\n '");
  assert.equal(await scalar("select staff_note from service_tickets"), "Fixed");
  assert.ok(await scalar("select resolved_at is not null from service_tickets"));
  await assert.rejects(db.query("update service_tickets set staff_note=''"), /Staff Note/);
  console.log("PASS: resolution requires and retains a trimmed note and sets resolved_at atomically");

  assert.equal(await scalar("select delete_expired_returned_item('00000000-0000-0000-0000-000000000011',now())"), false);
  assert.equal(await scalar("select delete_expired_returned_item('00000000-0000-0000-0000-000000000010',now())"), true);
  assert.equal(await scalar("select count(*) from claims"), 0);
  assert.equal(await scalar("select count(*) from items"), 1);
  assert.equal(await scalar("select claim_id from service_tickets"), null);
  assert.equal(await scalar("select staff_note from service_tickets"), "Fixed");
  console.log("PASS: in-memory cleanup preserves tickets and skips ineligible items");
} finally {
  await db.close();
}
