# AtlasLogix Maroc — Enterprise Fleet Management & LTL Optimization Platform

Modern, multilingual (**English `EN`**, **French `FR`**, **Arabic `AR` RTL with Droid Arabic Naskh / Noto Naskh Arabic**) Fleet Telemetry, Idling Cost Monitor, LTL Capacity Optimizer, Fuel Ledger, and GUI Configuration Studio tailored for Moroccan transportation and logistics companies.

---

## Core Modules

1. **Overview (Executive Dashboard)**
   - Top KPI Ribbon: Total Active Trucks, Today's Wasted Fuel (`MAD` dynamically calculated from the active diesel tariff), Fleet Capacity Utilization (`%`), and Active Idling Alerts.
   - 30-Day **Fuel Spend vs. Revenue** interactive line/area chart + Moroccan highway corridor utilization (`A1`, `A2`, `A3`, `A5`, `A7`, `N1 Express`).
2. **Live Map & Idling Monitor**
   - Complete, undivided map of the Kingdom of Morocco from **Tangier (`35.89°N`)** to **Dakhla, El Guerguerat, and Lagouira (`20.83°N`)**.
   - **Google Maps Route & Distance Matrix Engine**: Switch between the full Kingdom Vector Telemetry Map and interactive **Google Maps Live Route** view, with automated road distance (`km`), HGV transit duration, ADM Class-3 highway toll (`MAD`), and trip diesel burn calculation.
   - Real-time GPS telemetry alert feed + Remote Idle Engine Shutoff command.
3. **LTL Capacity Optimizer**
   - Visual 33/34-slot Euro-Pallet (`EPAL`) trailer deck with 3 animated utilization bars (**Volume $\text{m}^3$**, **Weight `t`**, and **Pallets `EPAL`**).
   - Inline **Capacity & Pallets Configurator** on every truck + drag-and-drop **Pending Shipments** queue + **`+ Add Shipment`** creator with Google Maps road distance calculation.
4. **Driver Eco-Scoring**
   - Sortable/filterable ranking table based on fuel efficiency (`L/100km`), 30-day idle time (`mins` & `MAD`), safety incidents (harsh braking & overspeed), and `0–100` Eco-Score (`Green` / `Yellow` / `Red` tiers).
5. **Fleet & Fuel Manager**
   - **Fuel Tariff & Purchases Ledger**: Manual benchmark fuel price entry (`MAD/L`), station invoice CRUD (*Afriquia*, *Shell*, *TotalEnergies*, *Winxo*, *Depot Bulk*), and 1-click weighted average sync.
   - **Trucks Registry CRUD**: Full specifications for Trailer Type (`Tautliner 13.6m`, `Reefer Frigo ATP`, `Mega Box Van`, `Container Chassis`, `Rigid 19T`), Axle/GVW (`40T`, `44T`, `19T`), Pallets (`EPAL`), Volume ($\text{m}^3$), Weight (`kg`), Fuel Tank (`L` & `%`), and Google Maps Route Distance (`km`).
   - **Drivers Directory CRUD**: Add, edit, and remove drivers with automatic Eco-Score ranking.
6. **GUI Configuration Studio & Cloud Handover (`GUI Config & Cloud` tab)**
   - Configure company profiles, operational formulas (idling threshold, idle burn rate, target `L/100km`, cruise speed, ADM toll rate, Eco-score cutoffs, default trailer capacities), Supabase & Google Maps API keys, `.env.local` generation, and full JSON state export/import without touching code.
   - Automatic `localStorage` persistence so all GUI edits survive browser refreshes.

---

## Quick Handover Guide for Ibrahim (GitHub + Supabase + Vercel)

### 1. Local Development
```bash
npm install
npm run dev -- --port 3055
```
Open `http://localhost:3055`.

### 2. Supabase Database Setup
1. Create a new project in [Supabase](https://supabase.com/dashboard).
2. Open **SQL Editor → New Query** and paste the contents of [`supabase/schema.sql`](./supabase/schema.sql) (or copy it directly from the in-app **GUI Config & Cloud → 4. Ibrahim Handover** tab).
3. Copy your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from **Project Settings → API**.

### 3. Deploy to GitHub & Vercel
1. Push this repository to GitHub.
2. Import the repository at [vercel.com/new](https://vercel.com/new).
3. Add the environment variables from [`.env.example`](./.env.example) (or generate them via the in-app **GUI Config & Cloud → 3. Supabase & API Keys** tab) and click **Deploy**.
