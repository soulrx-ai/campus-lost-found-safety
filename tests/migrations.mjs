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
    create table public.profiles(id uuid primary key, role text, status text, full_name text, phone text);
    create schema storage;
    create table storage.objects(bucket_id text,name text);
    alter table storage.objects enable row level security;
    create table public.notifications(id uuid default gen_random_uuid(),user_id uuid,title text,message text,type text,is_read boolean);
    create table public.activity_logs(id uuid);
    alter table public.notifications enable row level security;
    create table public.items(id uuid primary key, category text, status text, reporter_id uuid, report_type text, reviewed_by uuid);
    create table public.claims(id uuid primary key, item_id uuid references items(id), status text, handover_at timestamptz, claimant_id uuid, reviewed_by uuid, reviewed_at timestamptz, staff_note text, handover_photo_url text, handover_confirmed_by uuid);
    create table public.service_tickets(id uuid primary key, claim_id uuid references claims(id), status text, resolved_at timestamptz, updated_at timestamptz,requester_id uuid,assigned_to uuid,subject text);
    create table public.security_incidents(id uuid primary key, status text, reporter_id uuid);
    alter table public.items enable row level security;
    alter table public.claims enable row level security;
    alter table public.service_tickets enable row level security;
    grant all on public.items,public.claims,public.service_tickets to authenticated;
    create policy published_items on public.items for select to authenticated using (status='PUBLISHED' or reporter_id=auth.uid());
    create policy own_claims on public.claims for select to authenticated using (claimant_id=auth.uid());
    create policy own_tickets on public.service_tickets for select to authenticated using (requester_id=auth.uid());
    alter table public.security_incidents enable row level security;
    grant all on public.security_incidents to authenticated;
    create policy "Staff can manage safety incidents" on public.security_incidents for all to authenticated using (true);
    create function public.review_claim(uuid,text,text) returns void language sql as $$ select $$;
    create function public.complete_claim_handover(uuid,text) returns void language sql as $$ select $$;
    insert into profiles(id,role,status) values
      ('00000000-0000-0000-0000-000000000001','STAFF','ACTIVE'),
      ('00000000-0000-0000-0000-000000000002','ADMIN','ACTIVE'),
      ('00000000-0000-0000-0000-000000000003','STAFF','INACTIVE'),
      ('00000000-0000-0000-0000-000000000004','USER','ACTIVE'),
      ('00000000-0000-0000-0000-000000000005','USER','INACTIVE');
    insert into items(id,category,status) values ('00000000-0000-0000-0000-000000000010','Custom','RETURNED');
    insert into items(id,category,status) values ('00000000-0000-0000-0000-000000000011','custom','PUBLISHED');
    insert into claims(id,item_id,status,handover_at) values ('00000000-0000-0000-0000-000000000020','00000000-0000-0000-0000-000000000010','COMPLETED','2020-01-01');
    insert into service_tickets(id,claim_id,status,resolved_at,updated_at) values ('00000000-0000-0000-0000-000000000030','00000000-0000-0000-0000-000000000020','IN_PROGRESS',null,now());
    insert into security_incidents(id,status) values
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
  await db.query("select update_item_category((select id from item_categories where lower(name)='custom'),'Renamed',true)");
  assert.equal(await scalar("select count(*) from items where category='Renamed'"), 2);

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
  assert.equal(await scalar("select count(*) from item_categories"), 0);
  await assert.rejects(db.query("select review_claim('00000000-0000-0000-0000-000000000020','APPROVED',null)"), /Active Staff/);
  await assert.rejects(db.query("select complete_claim_handover('00000000-0000-0000-0000-000000000020','fake')"), /Active Staff/);
  await assert.rejects(db.query("select update_my_profile('Changed',null)"), /Active account/);
  await db.exec("reset role");
  console.log("PASS: STAFF/ADMIN boundaries, inactive roles, Safety finality and deletion denial");

  await db.exec("set role authenticated; set test.uid='00000000-0000-0000-0000-000000000004'");
  assert.equal(await scalar("select count(*) from items"), 1);
  await assert.rejects(db.query("insert into items(id,reporter_id,status) values(gen_random_uuid(),auth.uid(),'PUBLISHED')"), /row-level security/);
  await assert.rejects(db.query("select review_claim('00000000-0000-0000-0000-000000000020','APPROVED',null)"), /Active Staff/);
  await db.exec("set test.uid='00000000-0000-0000-0000-000000000005'");
  assert.equal(await scalar("select count(*) from items"), 0);
  assert.equal(await scalar("select count(*) from item_categories"), 0);
  await assert.rejects(db.query("insert into items(id,reporter_id,status) values(gen_random_uuid(),auth.uid(),'PENDING_REVIEW')"), /row-level security/);
  await assert.rejects(db.query("insert into service_tickets(id,requester_id,status) values(gen_random_uuid(),auth.uid(),'OPEN')"), /row-level security/);
  await db.exec("set test.uid='00000000-0000-0000-0000-000000000001'");
  assert.equal((await db.query("update items set status='REJECTED' where status='PUBLISHED' returning id")).rows.length, 0);
  assert.equal((await db.query("update claims set status='COMPLETED' returning id")).rows.length, 0);
  assert.equal((await db.query("update service_tickets set status='RESOLVED',staff_note='Bypass' returning id")).rows.length, 0);
  await db.exec("reset role");
  console.log("PASS: inactive old sessions cannot read/insert; USER cannot publish; direct STAFF workflow bypasses denied");

  await assert.rejects(db.query("update service_tickets set status='RESOLVED', staff_note='   '"), /Staff Note/);
  await assert.rejects(db.query("update service_tickets set status='RESOLVED', staff_note=E' \\t\\n '"), /Staff Note/);
  assert.equal(await scalar("select status from service_tickets"), "IN_PROGRESS");
  assert.equal(await scalar("select resolved_at from service_tickets"), null);
  await db.exec("update service_tickets set status='RESOLVED', staff_note=E' \\tFixed\\n '");
  assert.equal(await scalar("select staff_note from service_tickets"), "Fixed");
  assert.ok(await scalar("select resolved_at is not null from service_tickets"));
  await assert.rejects(db.query("update service_tickets set staff_note=''"), /Staff Note/);
  console.log("PASS: resolution requires and retains a trimmed note and sets resolved_at atomically");

  // Real SQL transaction: failure inserting the required notification rolls back resolution.
  await db.exec(`insert into service_tickets(id,status,requester_id,subject) values
    ('00000000-0000-0000-0000-000000000031','IN_PROGRESS','00000000-0000-0000-0000-000000000002','Help');
    alter table notifications add constraint fail_notification check (false) not valid;
    set role authenticated; set test.uid = '00000000-0000-0000-0000-000000000001';`);
  await assert.rejects(db.query("select update_staff_ticket('00000000-0000-0000-0000-000000000031','RESOLVED','  Fixed  ')"), /fail_notification/);
  await db.exec("reset role");
  assert.equal(await scalar("select status from service_tickets where id='00000000-0000-0000-0000-000000000031'"), 'IN_PROGRESS');
  await db.exec("alter table notifications drop constraint fail_notification; set role authenticated");
  assert.equal(await scalar("select update_staff_ticket('00000000-0000-0000-0000-000000000031','RESOLVED','  Fixed  ')"), true);
  assert.equal(await scalar("select update_staff_ticket('00000000-0000-0000-0000-000000000031','RESOLVED','Again')"), false);
  await db.exec("set test.uid = '00000000-0000-0000-0000-000000000002'");
  await assert.rejects(db.query("select update_staff_ticket('00000000-0000-0000-0000-000000000031','RESOLVED','Fixed')"), /Active Staff/);
  await db.exec("reset role");
  assert.equal(await scalar("select count(*) from notifications"), 1);
  assert.equal(await scalar("select message from notifications"), 'Fixed');
  await db.exec("delete from service_tickets where id='00000000-0000-0000-0000-000000000031'");
  console.log("PASS: notification failure rolls back ticket resolution, retry is atomic, ADMIN denied");

  await db.exec(`insert into items(id,category,status,report_type) values
    ('00000000-0000-0000-0000-000000000012','Custom','PUBLISHED','FOUND');
    insert into claims(id,item_id,status) values
    ('00000000-0000-0000-0000-000000000022','00000000-0000-0000-0000-000000000012','PENDING_REVIEW');
    set role authenticated; set test.uid='00000000-0000-0000-0000-000000000002';`);
  await assert.rejects(db.query("select review_claim('00000000-0000-0000-0000-000000000022','APPROVED',null)"), /Active Staff/);
  await db.exec("set test.uid='00000000-0000-0000-0000-000000000001'");
  await db.query("select review_claim('00000000-0000-0000-0000-000000000022','APPROVED',' Verified ')");
  await assert.rejects(db.query("select complete_claim_handover('00000000-0000-0000-0000-000000000022','missing.jpg')"), /photo is required/);
  await db.exec("reset role");
  assert.equal(await scalar("select status from items where id='00000000-0000-0000-0000-000000000012'"), 'CLAIMED');
  const photo = '00000000-0000-0000-0000-000000000001/00000000-0000-0000-0000-000000000022/photo.jpg';
  await db.query("insert into storage.objects values('handover',$1)", [photo]);
  await db.exec("set role authenticated");
  await db.query("select complete_claim_handover('00000000-0000-0000-0000-000000000022',$1)", [photo]);
  await db.exec("reset role");
  assert.equal(await scalar("select status from items where id='00000000-0000-0000-0000-000000000012'"), 'RETURNED');
  assert.equal(await scalar("select status from claims where id='00000000-0000-0000-0000-000000000022'"), 'COMPLETED');
  await db.exec("delete from claims where id='00000000-0000-0000-0000-000000000022'; delete from items where id='00000000-0000-0000-0000-000000000012'");
  console.log("PASS: STAFF claim/handover transactions require an uploaded photo; ADMIN cannot review");

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
