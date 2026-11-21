-- ============================================================================
-- AtlasLogix Maroc — Supabase PostgreSQL Schema (Fleet & LTL Optimization)
-- Fuel Benchmark: 15.90 MAD / Liter (Moroccan Gasoil Commercial Tariff)
-- ============================================================================

create extension if not exists "pgcrypto";

-- 1. Companies (Multi-tenant Moroccan Logistics Operators)
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_fr text not null,
  name_ar text not null,
  default_locale text not null default 'fr' check (default_locale in ('en', 'fr', 'ar')),
  headquarters_city text not null,
  tax_ice text not null unique,
  diesel_tariff_mad_per_liter numeric(6, 2) not null default 15.90,
  created_at timestamptz not null default now()
);

-- 2. Drivers (With Eco-Score, Fuel Efficiency L/100km, Idle Time & Safety Incidents)
create table public.drivers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  driver_code text not null unique,
  full_name text not null,
  full_name_ar text not null,
  phone text not null,
  assigned_truck_code text not null,
  primary_corridor text not null,
  fuel_efficiency_l_per_100km numeric(5, 2) not null,
  total_idle_minutes_30d integer not null default 0,
  safety_incidents_30d integer not null default 0,
  harsh_braking_count integer not null default 0,
  overspeed_count integer not null default 0,
  eco_score integer not null check (eco_score between 0 and 100),
  eco_tier text not null check (eco_tier in ('green', 'yellow', 'red')),
  km_driven_30d integer not null default 0,
  updated_at timestamptz not null default now()
);

create index idx_drivers_company_id on public.drivers(company_id);
create index idx_drivers_eco_score on public.drivers(eco_score desc);

-- 3. Trucks (Active Fleet, Telemetry & LTL Capacity)
create table public.trucks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  truck_code text not null unique,
  plate_number text not null unique,
  model text not null,
  driver_id uuid references public.drivers(id) on delete set null,
  status text not null check (status in ('moving', 'idling', 'alert', 'loading')),
  current_city text not null,
  destination_city text not null,
  highway_corridor text not null,
  latitude numeric(9, 6) not null,
  longitude numeric(9, 6) not null,
  speed_kmh integer not null default 0,
  idle_minutes integer not null default 0,
  fuel_burn_rate_l_hr numeric(5, 2) not null default 0,
  max_volume_m3 numeric(6, 2) not null default 90.00,
  used_volume_m3 numeric(6, 2) not null default 0.00,
  max_weight_kg integer not null default 24000,
  used_weight_kg integer not null default 0,
  max_pallets integer not null default 33,
  used_pallets integer not null default 0,
  updated_at timestamptz not null default now()
);

create index idx_trucks_company_status on public.trucks(company_id, status);
create index idx_trucks_driver_id on public.trucks(driver_id);

-- 4. GPS Telemetry & Idling Alerts Stream
create table public.telemetry_alerts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  truck_id uuid not null references public.trucks(id) on delete cascade,
  truck_code text not null,
  alert_type text not null check (alert_type in ('idling', 'harsh_braking', 'overspeed', 'backhaul_opportunity', 'geofence')),
  severity text not null check (severity in ('warning', 'critical', 'info', 'success')),
  highway_or_hub text not null,
  idle_duration_mins integer not null default 0,
  wasted_fuel_liters numeric(6, 2) not null default 0.00,
  wasted_fuel_mad numeric(10, 2) not null default 0.00,
  message_en text not null,
  message_fr text not null,
  message_ar text not null,
  acknowledged boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_telemetry_alerts_company_created on public.telemetry_alerts(company_id, created_at desc);
create index idx_telemetry_alerts_truck_id on public.telemetry_alerts(truck_id);

-- 5. LTL Shipments (Pending & Assigned Pallets with Backhaul Matching)
create table public.ltl_shipments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  shipment_code text not null unique,
  origin_city text not null,
  destination_city text not null,
  corridor text not null,
  pallet_count integer not null check (pallet_count > 0),
  volume_m3 numeric(6, 2) not null check (volume_m3 > 0),
  weight_kg integer not null check (weight_kg > 0),
  freight_revenue_mad numeric(10, 2) not null,
  is_backhaul_match boolean not null default false,
  recommended_truck_code text,
  empty_km_saved integer not null default 0,
  assigned_truck_id uuid references public.trucks(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'assigned', 'in_transit')),
  created_at timestamptz not null default now()
);

create index idx_ltl_shipments_company_status on public.ltl_shipments(company_id, status);
create index idx_ltl_shipments_assigned_truck on public.ltl_shipments(assigned_truck_id);

-- 6. Daily Financial & Fuel Metrics (30-Day Fuel Spend vs. Revenue)
create table public.daily_fleet_financials (
  id bigint generated always as identity primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  metric_date date not null,
  revenue_mad numeric(12, 2) not null,
  fuel_spend_mad numeric(12, 2) not null,
  fuel_liters numeric(10, 2) not null,
  wasted_idle_mad numeric(10, 2) not null,
  capacity_utilization_pct numeric(5, 2) not null,
  unique (company_id, metric_date)
);

create index idx_daily_financials_company_date on public.daily_fleet_financials(company_id, metric_date desc);

-- 7. Fuel Purchases & Station Tariff Ledger
create table public.fuel_purchases (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  invoice_ref text not null unique,
  purchase_date date not null default current_date,
  station_brand text not null check (station_brand in ('Afriquia Pro', 'Shell Maroc', 'TotalEnergies', 'Winxo Pro', 'Petrom')),
  city text not null,
  truck_code text not null,
  liters numeric(8, 2) not null check (liters > 0),
  unit_price_mad numeric(6, 2) not null check (unit_price_mad > 0),
  total_mad numeric(12, 2) generated always as (round(liters * unit_price_mad, 2)) stored,
  payment_method text not null default 'Carte Carburant Pro',
  created_at timestamptz not null default now()
);

create index idx_fuel_purchases_company_date on public.fuel_purchases(company_id, purchase_date desc);
create index idx_fuel_purchases_truck_code on public.fuel_purchases(truck_code);

-- 8. White-Label Client Demo Instances (For Ibrahim's B2B Prospect Demos ?demo=<slug>)
create table if not exists public.demo_instances (
  slug text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- Row-Level Security (RLS) Policies (Supabase Best Practices)
-- Uses TO authenticated + (select auth.jwt() -> 'app_metadata' ->> 'company_id')
-- ============================================================================

alter table public.companies enable row level security;
alter table public.drivers enable row level security;
alter table public.trucks enable row level security;
alter table public.telemetry_alerts enable row level security;
alter table public.ltl_shipments enable row level security;
alter table public.daily_fleet_financials enable row level security;
alter table public.fuel_purchases enable row level security;
alter table public.demo_instances enable row level security;

create policy "Anyone with link can read demo instances"
  on public.demo_instances for select
  to anon, authenticated
  using ( true );

create policy "Admin studio can upsert demo instances"
  on public.demo_instances for all
  to anon, authenticated
  using ( true )
  with check ( true );

create policy "Tenant members can read their company"
  on public.companies for select
  to authenticated
  using ( id = ((select auth.jwt()) -> 'app_metadata' ->> 'company_id')::uuid );

create policy "Tenant members can read drivers"
  on public.drivers for select
  to authenticated
  using ( company_id = ((select auth.jwt()) -> 'app_metadata' ->> 'company_id')::uuid );

create policy "Tenant members can read trucks"
  on public.trucks for select
  to authenticated
  using ( company_id = ((select auth.jwt()) -> 'app_metadata' ->> 'company_id')::uuid );

create policy "Tenant dispatchers can update trucks"
  on public.trucks for update
  to authenticated
  using ( company_id = ((select auth.jwt()) -> 'app_metadata' ->> 'company_id')::uuid )
  with check ( company_id = ((select auth.jwt()) -> 'app_metadata' ->> 'company_id')::uuid );

create policy "Tenant members can read telemetry alerts"
  on public.telemetry_alerts for select
  to authenticated
  using ( company_id = ((select auth.jwt()) -> 'app_metadata' ->> 'company_id')::uuid );

create policy "Tenant dispatchers can acknowledge alerts"
  on public.telemetry_alerts for update
  to authenticated
  using ( company_id = ((select auth.jwt()) -> 'app_metadata' ->> 'company_id')::uuid )
  with check ( company_id = ((select auth.jwt()) -> 'app_metadata' ->> 'company_id')::uuid );

create policy "Tenant members can read LTL shipments"
  on public.ltl_shipments for select
  to authenticated
  using ( company_id = ((select auth.jwt()) -> 'app_metadata' ->> 'company_id')::uuid );

create policy "Tenant dispatchers can assign LTL shipments"
  on public.ltl_shipments for update
  to authenticated
  using ( company_id = ((select auth.jwt()) -> 'app_metadata' ->> 'company_id')::uuid )
  with check ( company_id = ((select auth.jwt()) -> 'app_metadata' ->> 'company_id')::uuid );

create policy "Tenant members can read daily financials"
  on public.daily_fleet_financials for select
  to authenticated
  using ( company_id = ((select auth.jwt()) -> 'app_metadata' ->> 'company_id')::uuid );
