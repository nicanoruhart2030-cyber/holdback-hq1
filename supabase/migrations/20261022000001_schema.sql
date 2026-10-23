-- Holdback HQ core schema.
-- Money is numeric(14,2) in CAD. Dates are calendar dates in America/Toronto.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tenancy
-- ---------------------------------------------------------------------------

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  trade text not null,
  contact_name text,
  email text,
  phone text,
  plan_tier text not null default 'solo' check (plan_tier in ('solo', 'crew', 'pro')),
  monthly_fee numeric(14, 2) not null default 0 check (monthly_fee >= 0),
  status text not null default 'active' check (status in ('onboarding', 'active', 'paused', 'churned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Emails allowed to become agency admins on first sign-in.
create table public.agency_admins (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null default 'client' check (role in ('admin', 'client')),
  client_id uuid references public.clients (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_client_id_idx on public.profiles (client_id);

-- ---------------------------------------------------------------------------
-- Construction data
-- ---------------------------------------------------------------------------

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null,
  gc_name text not null,
  gc_contact_email text,
  payer_type text not null default 'contractor' check (payer_type in ('owner', 'contractor')),
  address text,
  contract_value numeric(14, 2) not null default 0 check (contract_value >= 0),
  holdback_percent numeric(5, 2) not null default 10 check (holdback_percent between 0 and 100),
  contract_start_date date,
  substantial_completion_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_client_id_idx on public.projects (client_id);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  number text not null,
  amount numeric(14, 2) not null check (amount >= 0),
  tax numeric(14, 2) not null default 0 check (tax >= 0),
  issue_date date,
  submitted_date date,
  due_date date,
  disputed_date date,
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'disputed', 'paid', 'partial', 'overdue')),
  amount_paid numeric(14, 2) not null default 0 check (amount_paid >= 0),
  source_file_path text,
  extraction_confidence numeric(4, 3) check (extraction_confidence between 0 and 1),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, number)
);

create index invoices_client_id_idx on public.invoices (client_id);
create index invoices_status_idx on public.invoices (status);

create table public.holdbacks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  period_start date not null,
  period_end date not null,
  amount_retained numeric(14, 2) not null check (amount_retained >= 0),
  release_due_date date,
  released boolean not null default false,
  released_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (period_end >= period_start),
  check (released = false or released_date is not null)
);

create index holdbacks_project_id_idx on public.holdbacks (project_id);
create index holdbacks_client_id_idx on public.holdbacks (client_id);

create table public.wsib_clearances (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  gc_name text not null,
  certificate_number text not null,
  issue_date date not null,
  expiry_date date not null,
  status text not null default 'valid' check (status in ('valid', 'expiring', 'expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expiry_date >= issue_date)
);

create index wsib_client_id_idx on public.wsib_clearances (client_id);

-- ---------------------------------------------------------------------------
-- Generated work
-- ---------------------------------------------------------------------------

create table public.deadlines (
  id uuid primary key default gen_random_uuid(),
  dedupe_key text not null unique,
  rule_id text not null,
  type text not null,
  entity_type text not null check (entity_type in ('invoice', 'holdback', 'project', 'wsib_clearance')),
  entity_id uuid not null,
  client_id uuid not null references public.clients (id) on delete cascade,
  project_id uuid references public.projects (id) on delete cascade,
  due_date date not null,
  severity text not null check (severity in ('overdue', 'critical', 'warning', 'info')),
  title text not null,
  amount numeric(14, 2),
  resolved boolean not null default false,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index deadlines_open_idx on public.deadlines (due_date) where resolved = false;
create index deadlines_client_id_idx on public.deadlines (client_id);

create table public.drafts (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('payment_reminder', 'holdback_release_request', 'wsib_renewal')),
  client_id uuid not null references public.clients (id) on delete cascade,
  deadline_id uuid references public.deadlines (id) on delete set null,
  dedupe_key text not null,
  to_email text,
  reply_to text,
  subject text not null,
  body text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'sent', 'rejected')),
  related_entity_type text not null,
  related_entity_id uuid not null,
  generated_by text not null default 'template',
  approved_by uuid references auth.users (id) on delete set null,
  approved_at timestamptz,
  sent_at timestamptz,
  provider_message_id text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- At most one open draft per deadline.
create unique index drafts_one_pending_per_key on public.drafts (dedupe_key) where status = 'pending';
create index drafts_status_idx on public.drafts (status);
create index drafts_client_id_idx on public.drafts (client_id);

create table public.activity_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  actor_type text not null check (actor_type in ('user', 'system', 'ai')),
  action text not null,
  entity_type text not null,
  entity_id text,
  client_id uuid references public.clients (id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index activity_log_created_idx on public.activity_log (created_at desc);
create index activity_log_client_idx on public.activity_log (client_id);

-- ---------------------------------------------------------------------------
-- Cash Leak Scan (prospects, no account)
-- ---------------------------------------------------------------------------

create table public.scans (
  id uuid primary key default gen_random_uuid(),
  prospect_name text not null,
  prospect_company text,
  prospect_email text,
  status text not null default 'processing' check (status in ('processing', 'ready', 'failed')),
  report jsonb,
  expires_at timestamptz default (now() + interval '30 days'),
  converted_client_id uuid references public.clients (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (converted_client_id is not null or expires_at is not null)
);

create index scans_expires_idx on public.scans (expires_at) where converted_client_id is null;

create table public.scan_files (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scans (id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  extracted jsonb,
  confidence numeric(4, 3),
  error text,
  created_at timestamptz not null default now()
);

create index scan_files_scan_idx on public.scan_files (scan_id);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array['clients', 'profiles', 'projects', 'invoices', 'holdbacks',
                           'wsib_clearances', 'deadlines', 'drafts', 'scans']
  loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      t || '_updated_at', t);
  end loop;
end;
$$;

-- Keep the denormalized client_id (used by RLS) in sync with the project.
create or replace function public.set_client_id_from_project()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select p.client_id into new.client_id from public.projects p where p.id = new.project_id;
  if new.client_id is null then
    raise exception 'Unknown project %', new.project_id;
  end if;
  return new;
end;
$$;

create trigger invoices_client_id before insert or update of project_id on public.invoices
  for each row execute function public.set_client_id_from_project();
create trigger holdbacks_client_id before insert or update of project_id on public.holdbacks
  for each row execute function public.set_client_id_from_project();

-- Create a profile for every new auth user. Allowlisted emails become admins.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    lower(new.email),
    case when exists (select 1 from public.agency_admins a where a.email = lower(new.email))
      then 'admin' else 'client' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
