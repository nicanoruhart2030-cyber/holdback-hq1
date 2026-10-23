-- Row Level Security. Every table has RLS enabled.
-- Agency admins see and change everything. Client users (subcontractors) can
-- only read rows belonging to their own client. The service role (cron, server
-- jobs) bypasses RLS by design and is only used server-side.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

create or replace function public.my_client_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.client_id from public.profiles p where p.id = auth.uid();
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.my_client_id() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.my_client_id() to authenticated;

alter table public.clients enable row level security;
alter table public.agency_admins enable row level security;
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.invoices enable row level security;
alter table public.holdbacks enable row level security;
alter table public.wsib_clearances enable row level security;
alter table public.deadlines enable row level security;
alter table public.drafts enable row level security;
alter table public.activity_log enable row level security;
alter table public.scans enable row level security;
alter table public.scan_files enable row level security;

-- Anonymous visitors get nothing from any table.
revoke all on all tables in schema public from anon;

-- clients ---------------------------------------------------------------------
create policy clients_select on public.clients for select to authenticated
  using (public.is_admin() or id = public.my_client_id());
create policy clients_admin_write on public.clients for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- agency_admins ---------------------------------------------------------------
create policy agency_admins_admin on public.agency_admins for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- profiles --------------------------------------------------------------------
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy profiles_admin_update on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy profiles_admin_delete on public.profiles for delete to authenticated
  using (public.is_admin());

-- Client-scoped tables: read own, admin writes ----------------------------------
do $$
declare t text;
begin
  foreach t in array array['projects', 'invoices', 'holdbacks', 'wsib_clearances', 'deadlines', 'drafts']
  loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.is_admin() or client_id = public.my_client_id())',
      t || '_select', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      t || '_admin_write', t);
  end loop;
end;
$$;

-- activity_log: append-only. Admins read all, clients read their own. -----------
create policy activity_log_select on public.activity_log for select to authenticated
  using (public.is_admin() or client_id = public.my_client_id());
create policy activity_log_admin_insert on public.activity_log for insert to authenticated
  with check (public.is_admin() and (actor_id is null or actor_id = auth.uid()));
revoke update, delete, truncate on public.activity_log from authenticated;

-- Prospect scans: agency only ---------------------------------------------------
create policy scans_admin on public.scans for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy scan_files_admin on public.scan_files for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
