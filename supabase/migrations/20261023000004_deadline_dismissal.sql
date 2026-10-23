-- A deadline an admin dismisses stays dismissed: the daily sweep skips its
-- dedupe_key instead of regenerating it. A changed obligation (e.g. a renewed
-- WSIB certificate) produces a new key and surfaces again.
alter table public.deadlines
  add column dismissed boolean not null default false,
  add column dismissed_by uuid references auth.users (id) on delete set null,
  add column dismissed_at timestamptz;

create index deadlines_dismissed_idx on public.deadlines (dedupe_key) where dismissed;
