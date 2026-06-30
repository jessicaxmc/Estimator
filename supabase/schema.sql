-- Run this in Supabase: Dashboard > SQL Editor > New query
-- This replaces the old placeholder "items" table from the starter app.

create extension if not exists "pgcrypto";

-- Optional: clean up the old starter table if it still exists
drop table if exists items;

-- Labour types and their hourly rate, e.g. "Painting" = $45/hr
create table if not exists labour_rates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  hourly_rate numeric not null default 0,
  created_at timestamptz not null default now()
);

-- Materials and their cost per unit, e.g. "Paint (per litre)" = $18
create table if not exists materials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit_cost numeric not null default 0,
  unit text not null default 'unit',
  created_at timestamptz not null default now()
);

-- Saved estimates. Selected labour/material lines are stored as JSON
-- snapshots, so an estimate stays accurate even if a rate changes later.
create table if not exists estimates (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,
  client_name text,
  markup_pct numeric not null default 20,
  labour_items jsonb not null default '[]'::jsonb,
  material_items jsonb not null default '[]'::jsonb,
  total numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists estimates_set_updated_at on estimates;
create trigger estimates_set_updated_at
before update on estimates
for each row execute function set_updated_at();

-- Row Level Security: required by Supabase. Open access for now since
-- there's no login yet — anyone with the public key can read/write.
-- Tighten this when accounts are added later.
alter table labour_rates enable row level security;
alter table materials enable row level security;
alter table estimates enable row level security;

drop policy if exists "Allow all access (MVP)" on labour_rates;
create policy "Allow all access (MVP)" on labour_rates for all using (true) with check (true);

drop policy if exists "Allow all access (MVP)" on materials;
create policy "Allow all access (MVP)" on materials for all using (true) with check (true);

drop policy if exists "Allow all access (MVP)" on estimates;
create policy "Allow all access (MVP)" on estimates for all using (true) with check (true);

-- A few starter rates so the app isn't empty on first load.
-- Edit or delete these anytime from the Settings page in the app.
insert into labour_rates (name, hourly_rate) values
  ('Painting', 45),
  ('Carpentry', 55),
  ('Plumbing', 60),
  ('Sawing / cutting', 40)
on conflict do nothing;

insert into materials (name, unit_cost, unit) values
  ('Paint', 18, 'litre'),
  ('Timber (2x4)', 6.5, 'metre'),
  ('PVC pipe', 4.2, 'metre'),
  ('Screws (box)', 8, 'box')
on conflict do nothing;
