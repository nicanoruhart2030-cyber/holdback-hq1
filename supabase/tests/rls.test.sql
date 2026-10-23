-- RLS policy tests. Runs inside a transaction and rolls back, so it is safe
-- against a seeded local database:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls.test.sql
-- Requires seed.sql to be loaded. Any failed assertion raises and aborts.

begin;

insert into public.agency_admins (email) values ('rls-admin@test.local');
insert into auth.users (id, email) values
  ('f0000000-0000-4000-8000-00000000000a', 'rls-admin@test.local'),
  ('f0000000-0000-4000-8000-00000000000c', 'rls-client@test.local'),
  ('f0000000-0000-4000-8000-00000000000d', 'rls-nobody@test.local');
update public.profiles set client_id = 'a1000000-0000-4000-8000-000000000001'
  where id = 'f0000000-0000-4000-8000-00000000000c';

insert into storage.objects (bucket_id, name) values
  ('documents', 'invoices/a1000000-0000-4000-8000-000000000001/own.pdf'),
  ('documents', 'invoices/a1000000-0000-4000-8000-000000000002/other.pdf'),
  ('documents', 'scans/00000000-0000-4000-8000-000000000000/prospect.pdf');

do $$
begin
  if (select role from public.profiles where id = 'f0000000-0000-4000-8000-00000000000a') <> 'admin' then
    raise exception 'FAIL: allowlisted email did not become admin';
  end if;
  if (select role from public.profiles where id = 'f0000000-0000-4000-8000-00000000000c') <> 'client' then
    raise exception 'FAIL: regular email should become client';
  end if;
  raise notice 'PASS: profile roles assigned on sign-up';
end;
$$;

-- Client user -----------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"f0000000-0000-4000-8000-00000000000c","role":"authenticated"}';

do $$
declare n int;
begin
  select count(*) into n from public.clients;
  if n <> 1 then raise exception 'FAIL: client sees % clients, expected 1', n; end if;
  select count(*) into n from public.projects;
  if n <> 2 then raise exception 'FAIL: client sees % projects, expected 2', n; end if;
  select count(*) into n from public.invoices where client_id <> 'a1000000-0000-4000-8000-000000000001';
  if n <> 0 then raise exception 'FAIL: client sees % foreign invoices', n; end if;
  select count(*) into n from public.invoices;
  if n <> 10 then raise exception 'FAIL: client sees % invoices, expected 10', n; end if;
  select count(*) into n from public.holdbacks;
  if n <> 3 then raise exception 'FAIL: client sees % holdbacks, expected 3', n; end if;
  select count(*) into n from public.wsib_clearances;
  if n <> 2 then raise exception 'FAIL: client sees % WSIB rows, expected 2', n; end if;
  select count(*) into n from public.scans;
  if n <> 0 then raise exception 'FAIL: client can see prospect scans'; end if;
  select count(*) into n from public.agency_admins;
  if n <> 0 then raise exception 'FAIL: client can see the admin allowlist'; end if;
  select count(*) into n from public.profiles;
  if n <> 1 then raise exception 'FAIL: client sees % profiles, expected 1', n; end if;
  select count(*) into n from public.activity_log where client_id is distinct from 'a1000000-0000-4000-8000-000000000001';
  if n <> 0 then raise exception 'FAIL: client sees foreign activity'; end if;
  select count(*) into n from storage.objects;
  if n <> 1 then raise exception 'FAIL: client sees % storage objects, expected 1', n; end if;
  raise notice 'PASS: client reads are scoped to own client';
end;
$$;

do $$
declare n int;
begin
  update public.invoices set amount_paid = 0 where true;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: client updated % invoices', n; end if;
  update public.profiles set role = 'admin' where id = auth.uid();
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: client escalated own role'; end if;
  delete from public.drafts where true;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: client deleted drafts'; end if;
  begin
    insert into public.clients (name, trade) values ('Intruder', 'None');
    raise exception 'FAIL: client inserted a client row';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.activity_log (actor_type, action, entity_type) values ('user', 'forged', 'invoice');
    raise exception 'FAIL: client wrote to activity_log';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS: client writes are blocked';
end;
$$;

-- User with no client and no admin role ----------------------------------------
set local request.jwt.claims = '{"sub":"f0000000-0000-4000-8000-00000000000d","role":"authenticated"}';
do $$
declare n int;
begin
  select (select count(*) from public.clients) + (select count(*) from public.invoices)
       + (select count(*) from storage.objects) into n;
  if n <> 0 then raise exception 'FAIL: unassigned user sees % rows', n; end if;
  raise notice 'PASS: unassigned user sees nothing';
end;
$$;

-- Admin -------------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"f0000000-0000-4000-8000-00000000000a","role":"authenticated"}';
do $$
declare n int;
begin
  select count(*) into n from public.clients;
  if n <> 3 then raise exception 'FAIL: admin sees % clients, expected 3', n; end if;
  select count(*) into n from public.invoices;
  if n <> 25 then raise exception 'FAIL: admin sees % invoices, expected 25', n; end if;
  select count(*) into n from storage.objects;
  if n <> 3 then raise exception 'FAIL: admin sees % objects, expected 3', n; end if;
  insert into public.clients (name, trade) values ('Admin Created', 'Roofing');
  insert into public.activity_log (actor_id, actor_type, action, entity_type)
    values (auth.uid(), 'user', 'test.insert', 'client');
  begin
    insert into public.activity_log (actor_id, actor_type, action, entity_type)
      values ('f0000000-0000-4000-8000-00000000000c', 'user', 'impersonated', 'client');
    raise exception 'FAIL: admin logged activity as another user';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.activity_log set action = 'tampered' where true;
    raise exception 'FAIL: activity_log is mutable';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS: admin sees everything; activity log is append-only';
end;
$$;

-- Anonymous ---------------------------------------------------------------------
reset role;
set local role anon;
set local request.jwt.claims = '';
do $$
begin
  begin
    perform 1 from public.clients;
    raise exception 'FAIL: anon can read clients';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.invoices;
    raise exception 'FAIL: anon can read invoices';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS: anon has no table access';
end;
$$;

reset role;
rollback;
