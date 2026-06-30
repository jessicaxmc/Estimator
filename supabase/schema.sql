-- Run this in Supabase: Dashboard > SQL Editor > New query
-- This creates one placeholder table ("items") just to prove the app can read/write.
-- Once you tell me the real app spec, I'll replace this with the actual tables you need.

create extension if not exists "pgcrypto";

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table items enable row level security;

-- Open access for now (no login system yet). Fine for local testing —
-- tighten this once the real app has auth or is shared more widely.
create policy "Allow all access (starter)"
on items
for all
using (true)
with check (true);
