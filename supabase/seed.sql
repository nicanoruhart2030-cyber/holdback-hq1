-- Demo data: 3 fictional subcontractor clients, 6 projects, 25 invoices,
-- holdbacks and WSIB clearances. All names are invented. Dates are relative
-- to current_date so the dashboard always shows live-looking deadlines.
--
-- After seeding, run the daily sweep once (see README) to generate deadlines
-- and draft reminders. To make yourself an agency admin, add your email to
-- public.agency_admins BEFORE your first sign-in:
--   insert into public.agency_admins (email) values ('you@youragency.ca');

insert into public.clients (id, name, trade, contact_name, email, phone, plan_tier, monthly_fee, status) values
  ('a1000000-0000-4000-8000-000000000001', 'Kestrel Electrical Ltd.', 'Electrical', 'Dana Moreau',
   'dana@kestrel-electrical.example', '416-555-0142', 'crew', 499.00, 'active'),
  ('a1000000-0000-4000-8000-000000000002', 'Brightline Mechanical Inc.', 'HVAC / Mechanical', 'Sanjay Patel',
   'sanjay@brightline-mech.example', '905-555-0187', 'pro', 899.00, 'active'),
  ('a1000000-0000-4000-8000-000000000003', 'Northshore Drywall & Framing', 'Drywall / Framing', 'Marie Tremblay',
   'marie@northshore-drywall.example', '647-555-0119', 'solo', 249.00, 'onboarding');

insert into public.projects
  (id, client_id, name, gc_name, gc_contact_email, payer_type, address, contract_value, holdback_percent,
   contract_start_date, substantial_completion_date) values
  ('b2000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001',
   'Harbour Tower Phase 2', 'Meridian Build Group', 'payables@meridian-build.example', 'contractor',
   '88 Harbour St, Toronto, ON', 1850000.00, 10, date '2025-09-08', null),
  ('b2000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001',
   'Lakeshore Clinic Fit-out', 'Corbel Construction', 'ap@corbel-construction.example', 'contractor',
   '2200 Lake Shore Blvd W, Toronto, ON', 420000.00, 10, date '2026-02-02', current_date - 20),
  ('b2000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000002',
   'Riverbend Condominiums', 'Meridian Build Group', 'payables@meridian-build.example', 'contractor',
   '15 Riverbend Rd, Mississauga, ON', 2400000.00, 10, date '2025-04-14', null),
  ('b2000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000002',
   'Elmvale School Retrofit', 'Elmvale Public Schools (owner)', 'facilities@elmvale-schools.example', 'owner',
   '400 Elmvale Ave, Oakville, ON', 760000.00, 10, date '2026-05-04', null),
  ('b2000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000003',
   'Queen West Lofts', 'Corbel Construction', 'ap@corbel-construction.example', 'contractor',
   '1120 Queen St W, Toronto, ON', 310000.00, 10, date '2026-01-12', null),
  ('b2000000-0000-4000-8000-000000000006', 'a1000000-0000-4000-8000-000000000003',
   'Brant Street Medical', 'Ashgrove Contracting', 'accounts@ashgrove-contracting.example', 'contractor',
   '505 Brant St, Burlington, ON', 540000.00, 10, date '2025-11-03', current_date - 75);

-- 25 invoices: 8 paid, 3 partial, 6 submitted, 5 overdue, 2 disputed, 1 draft.
insert into public.invoices
  (id, project_id, client_id, number, amount, tax, issue_date, submitted_date, due_date, disputed_date,
   status, amount_paid, extraction_confidence)
select
  ('c3000000-0000-4000-8000-' || lpad(v.n::text, 12, '0'))::uuid,
  v.project_id::uuid,
  p.client_id,
  v.number,
  v.amount,
  round(v.amount * 0.13, 2),
  case when v.status = 'draft' then current_date - v.days_ago else current_date - v.days_ago - 2 end,
  case when v.status = 'draft' then null else current_date - v.days_ago end,
  case when v.status = 'draft' then null
       else current_date - v.days_ago + (case when p.payer_type = 'owner' then 28 else 35 end) end,
  case when v.disputed_ago is null then null else current_date - v.disputed_ago end,
  v.status,
  case v.status
    when 'paid' then round(v.amount * (1 - p.holdback_percent / 100) + v.amount * 0.13, 2)
    when 'partial' then round((v.amount * (1 - p.holdback_percent / 100) + v.amount * 0.13) * v.paid_fraction, 2)
    else 0 end,
  v.confidence
from (values
  ( 1, 'b2000000-0000-4000-8000-000000000001', 'KE-2051', 48250.00, 150, 'paid',      1.0, null, 0.97),
  ( 2, 'b2000000-0000-4000-8000-000000000001', 'KE-2067', 52100.00, 120, 'paid',      1.0, null, 0.95),
  ( 3, 'b2000000-0000-4000-8000-000000000001', 'KE-2084', 61375.00,  90, 'partial',   0.6, null, 0.92),
  ( 4, 'b2000000-0000-4000-8000-000000000001', 'KE-2096', 57940.00,  58, 'overdue',   0.0, null, 0.91),
  ( 5, 'b2000000-0000-4000-8000-000000000001', 'KE-2110', 44800.00,  31, 'submitted', 0.0, null, 0.88),
  ( 6, 'b2000000-0000-4000-8000-000000000001', 'KE-2123', 39650.00,   6, 'submitted', 0.0, null, 0.74),
  ( 7, 'b2000000-0000-4000-8000-000000000002', 'KE-3004', 36200.00, 110, 'paid',      1.0, null, 0.96),
  ( 8, 'b2000000-0000-4000-8000-000000000002', 'KE-3011', 41880.00,  72, 'disputed',  0.0,   55, 0.90),
  ( 9, 'b2000000-0000-4000-8000-000000000002', 'KE-3019', 28450.00,  40, 'overdue',   0.0, null, 0.93),
  (10, 'b2000000-0000-4000-8000-000000000002', 'KE-3026', 12300.00,   2, 'draft',     0.0, null, 0.61),
  (11, 'b2000000-0000-4000-8000-000000000003', 'BLM-0417', 96400.00, 160, 'paid',     1.0, null, 0.98),
  (12, 'b2000000-0000-4000-8000-000000000003', 'BLM-0432', 104250.00, 130, 'paid',    1.0, null, 0.97),
  (13, 'b2000000-0000-4000-8000-000000000003', 'BLM-0449', 88730.00, 100, 'partial',  0.45, null, 0.94),
  (14, 'b2000000-0000-4000-8000-000000000003', 'BLM-0461', 112900.00, 66, 'overdue',  0.0, null, 0.95),
  (15, 'b2000000-0000-4000-8000-000000000003', 'BLM-0478', 93120.00,  30, 'submitted', 0.0, null, 0.89),
  (16, 'b2000000-0000-4000-8000-000000000004', 'BLM-E102', 67500.00,  95, 'paid',     1.0, null, 0.96),
  (17, 'b2000000-0000-4000-8000-000000000004', 'BLM-E109', 71240.00,  47, 'disputed', 0.0,   40, 0.87),
  (18, 'b2000000-0000-4000-8000-000000000004', 'BLM-E115', 58900.00,  24, 'submitted', 0.0, null, 0.91),
  (19, 'b2000000-0000-4000-8000-000000000005', 'NSD-118', 18450.00,  85, 'paid',      1.0, null, 0.93),
  (20, 'b2000000-0000-4000-8000-000000000005', 'NSD-124', 21760.00,  44, 'overdue',   0.0, null, 0.86),
  (21, 'b2000000-0000-4000-8000-000000000005', 'NSD-131', 19980.00,  12, 'submitted', 0.0, null, 0.79),
  (22, 'b2000000-0000-4000-8000-000000000006', 'NSD-090', 46300.00, 170, 'paid',      1.0, null, 0.97),
  (23, 'b2000000-0000-4000-8000-000000000006', 'NSD-097', 52780.00, 140, 'partial',   0.7, null, 0.92),
  (24, 'b2000000-0000-4000-8000-000000000006', 'NSD-104', 38650.00,  96, 'overdue',   0.0, null, 0.90),
  (25, 'b2000000-0000-4000-8000-000000000006', 'NSD-109', 22410.00,  33, 'submitted', 0.0, null, 0.84)
) as v(n, project_id, number, amount, days_ago, status, paid_fraction, disputed_ago, confidence)
join public.projects p on p.id = v.project_id::uuid;

-- Holdbacks retained per project per quarter. Release dates are computed by the daily sweep.
insert into public.holdbacks (id, project_id, client_id, period_start, period_end, amount_retained, released, released_date) values
  ('d4000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001',
   current_date - 180, current_date - 91, 10035.00, false, null),
  ('d4000000-0000-4000-8000-000000000002', 'b2000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001',
   current_date - 90, current_date - 1, 16376.50, false, null),
  ('d4000000-0000-4000-8000-000000000003', 'b2000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001',
   current_date - 120, current_date - 21, 7703.00, false, null),
  ('d4000000-0000-4000-8000-000000000004', 'b2000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000002',
   current_date - 200, current_date - 111, 20065.00, false, null),
  ('d4000000-0000-4000-8000-000000000005', 'b2000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000002',
   current_date - 110, current_date - 21, 20186.00, false, null),
  ('d4000000-0000-4000-8000-000000000006', 'b2000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000002',
   current_date - 100, current_date - 11, 13874.00, false, null),
  ('d4000000-0000-4000-8000-000000000007', 'b2000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000003',
   current_date - 95, current_date - 6, 6019.00, false, null),
  ('d4000000-0000-4000-8000-000000000008', 'b2000000-0000-4000-8000-000000000006', 'a1000000-0000-4000-8000-000000000003',
   current_date - 240, current_date - 151, 4630.00, true, current_date - 30),
  ('d4000000-0000-4000-8000-000000000009', 'b2000000-0000-4000-8000-000000000006', 'a1000000-0000-4000-8000-000000000003',
   current_date - 150, current_date - 76, 13914.00, false, null);

insert into public.wsib_clearances (id, client_id, gc_name, certificate_number, issue_date, expiry_date, status) values
  ('e5000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'Meridian Build Group',
   'CC-7741-0921', current_date - 80, current_date + 10, 'expiring'),
  ('e5000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001', 'Corbel Construction',
   'CC-7741-1002', current_date - 10, current_date + 80, 'valid'),
  ('e5000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000002', 'Meridian Build Group',
   'CC-5520-0815', current_date - 30, current_date + 60, 'valid'),
  ('e5000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000002', 'Elmvale Public Schools (owner)',
   'CC-5520-0611', current_date - 95, current_date - 5, 'expired'),
  ('e5000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000003', 'Corbel Construction',
   'CC-3198-0730', current_date - 88, current_date + 2, 'expiring'),
  ('e5000000-0000-4000-8000-000000000006', 'a1000000-0000-4000-8000-000000000003', 'Ashgrove Contracting',
   'CC-3198-0904', current_date - 65, current_date + 25, 'expiring');

insert into public.activity_log (actor_type, action, entity_type, entity_id, details)
values ('system', 'seed.loaded', 'system', null, '{"clients": 3, "projects": 6, "invoices": 25}'::jsonb);
