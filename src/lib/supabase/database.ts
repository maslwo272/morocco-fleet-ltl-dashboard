export type Locale = "en" | "fr" | "ar";

export const DIESEL_PRICE_MAD_PER_LITER = 15.9;

export type BrandColorPresetId =
  | "navy"
  | "emerald"
  | "terracotta"
  | "graphite"
  | "indigo"
  | "crimson"
  | "custom";

export type LatinFontId = "jakarta" | "inter" | "ibm-plex" | "dm-sans";
export type ArabicFontId = "droid-naskh" | "cairo" | "tajawal" | "almarai";
export type MonoFontId = "jetbrains" | "ibm-mono";
export type SurfaceStyleId = "sharp" | "modern" | "glass";

export type ClientDemoTabId =
  | "overview"
  | "live-map"
  | "ltl-optimizer"
  | "driver-eco"
  | "tasks"
  | "fleet-manager"
  | "company-branding"
  | "gps-alerts";

export interface GpsAlertsConfig {
  enabled: boolean;
  webhookSecret: string;
  idleTier1Mins: number;
  idleTier2Mins: number;
  cooldownMins: number;
  sendResolvedNotice: boolean;
  idleFuelBurnLph: number;
  overspeedEnabled: boolean;
  overspeedThresholdKmh: number;
  fuelDropEnabled: boolean;
  fuelDropThresholdLiters: number;
  telegramEnabled: boolean;
  telegramChatId: string;
  telegramManagerChatId: string;
  telegramCustomBotToken: string;
  whatsappEnabled: boolean;
  whatsappDispatcherPhone: string;
  whatsappManagerPhone: string;
  whatsappCustomPhoneNumberId: string;
  whatsappCustomAccessToken: string;
  whatsappTemplateName: string;
}

export const DEFAULT_GPS_ALERTS_CONFIG: GpsAlertsConfig = {
  enabled: true,
  webhookSecret: "atlas-gps-2026",
  idleTier1Mins: 10,
  idleTier2Mins: 25,
  cooldownMins: 20,
  sendResolvedNotice: true,
  idleFuelBurnLph: 3.5,
  overspeedEnabled: true,
  overspeedThresholdKmh: 90,
  fuelDropEnabled: true,
  fuelDropThresholdLiters: 15,
  telegramEnabled: true,
  telegramChatId: "",
  telegramManagerChatId: "",
  telegramCustomBotToken: "",
  whatsappEnabled: false,
  whatsappDispatcherPhone: "",
  whatsappManagerPhone: "",
  whatsappCustomPhoneNumberId: "",
  whatsappCustomAccessToken: "",
  whatsappTemplateName: "",
};

export interface GpsTelemetryLatestRow {
  id: string;
  instance_slug: string;
  device_imei: string;
  truck_code: string;
  driver_name: string | null;
  driver_phone: string | null;
  provider: string;
  latitude: number;
  longitude: number;
  speed_kmh: number;
  ignition: boolean;
  fuel_level_pct: number | null;
  fuel_liters: number | null;
  idle_started_at: string | null;
  idle_minutes: number;
  last_tier1_alert_at: string | null;
  last_tier2_alert_at: string | null;
  last_overspeed_alert_at: string | null;
  last_fuel_drop_alert_at: string | null;
  last_ping_at: string;
  raw_payload?: Record<string, any> | null;
}

export interface GpsAlertLogRow {
  id: string;
  instance_slug: string;
  device_imei: string;
  truck_code: string;
  driver_name: string | null;
  alert_type: string;
  severity: string;
  idle_minutes: number;
  wasted_fuel_liters: number;
  wasted_fuel_mad: number;
  latitude: number | null;
  longitude: number | null;
  channel: string;
  delivery_status: string;
  delivery_detail: string | null;
  message_text: string;
  acknowledged: boolean;
  created_at: string;
}

export interface FooterCustomLink {
  label: string;
  url: string;
}

export interface BrandThemeConfig {
  colorPresetId: BrandColorPresetId;
  primaryHex: string;
  primaryHoverHex: string;
  primaryLightHex: string;
  latinFont: LatinFontId;
  arabicFont: ArabicFontId;
  monoFont: MonoFontId;
  surfaceStyle: SurfaceStyleId;
  brandMonogram: string;
  brandTagline: string;
  // Custom Client Logo, Header & Footer Fields
  logoDataUrl?: string;
  headerTitle?: string;
  headerSubtitle?: string;
  headerContactPhone?: string;
  headerAnnouncement?: string;
  footerCompanyLegal?: string;
  footerAddress?: string;
  footerCopyright?: string;
  footerCustomLinks?: FooterCustomLink[];
  footerShowPoweredBy?: boolean;
}

export const BRAND_COLOR_PRESETS: Record<
  Exclude<BrandColorPresetId, "custom">,
  {
    name: string;
    primaryHex: string;
    primaryHoverHex: string;
    primaryLightHex: string;
  }
> = {
  navy: {
    name: "Executive Navy (Atlas Institutional)",
    primaryHex: "#2563EB",
    primaryHoverHex: "#1D4ED8",
    primaryLightHex: "#60A5FA",
  },
  emerald: {
    name: "Royal Moroccan Emerald (Green Freight)",
    primaryHex: "#059669",
    primaryHoverHex: "#047857",
    primaryLightHex: "#34D399",
  },
  terracotta: {
    name: "Marrakech Terracotta & Amber",
    primaryHex: "#D97706",
    primaryHoverHex: "#B45309",
    primaryLightHex: "#FBBF24",
  },
  graphite: {
    name: "Casablanca Slate & Graphite",
    primaryHex: "#334155",
    primaryHoverHex: "#1E293B",
    primaryLightHex: "#94A3B8",
  },
  indigo: {
    name: "Tanger Med Deep Indigo",
    primaryHex: "#4F46E5",
    primaryHoverHex: "#4338CA",
    primaryLightHex: "#818CF8",
  },
  crimson: {
    name: "Atlas Express Crimson",
    primaryHex: "#DC2626",
    primaryHoverHex: "#B91C1C",
    primaryLightHex: "#F87171",
  },
};

export const LATIN_FONT_OPTIONS: {
  id: LatinFontId;
  label: string;
  cssStack: string;
}[] = [
  {
    id: "jakarta",
    label: "Plus Jakarta Sans (Modern Executive)",
    cssStack: 'var(--font-sans), "Plus Jakarta Sans", system-ui, sans-serif',
  },
  {
    id: "inter",
    label: "Inter (Clean Swiss SaaS)",
    cssStack: '"Inter", var(--font-sans), system-ui, sans-serif',
  },
  {
    id: "ibm-plex",
    label: "IBM Plex Sans (Industrial & Technical)",
    cssStack: '"IBM Plex Sans", var(--font-sans), system-ui, sans-serif',
  },
  {
    id: "dm-sans",
    label: "DM Sans (Geometric Enterprise)",
    cssStack: '"DM Sans", var(--font-sans), system-ui, sans-serif',
  },
];

export const ARABIC_FONT_OPTIONS: {
  id: ArabicFontId;
  label: string;
  cssStack: string;
}[] = [
  {
    id: "droid-naskh",
    label: "Droid Arabic Naskh / Noto Naskh (Classic Editorial)",
    cssStack: '"Droid Arabic Naskh", var(--font-arabic), system-ui, sans-serif',
  },
  {
    id: "cairo",
    label: "Cairo (Modern Geometric Kufi)",
    cssStack: '"Cairo", "Droid Arabic Naskh", var(--font-arabic), sans-serif',
  },
  {
    id: "tajawal",
    label: "Tajawal (Clean Corporate Arabic)",
    cssStack: '"Tajawal", "Droid Arabic Naskh", var(--font-arabic), sans-serif',
  },
  {
    id: "almarai",
    label: "Almarai (High-Legibility Dashboard Arabic)",
    cssStack: '"Almarai", "Droid Arabic Naskh", var(--font-arabic), sans-serif',
  },
];

export const MONO_FONT_OPTIONS: {
  id: MonoFontId;
  label: string;
  cssStack: string;
}[] = [
  {
    id: "jetbrains",
    label: "JetBrains Mono (Telemetry Standard)",
    cssStack: 'var(--font-mono), "JetBrains Mono", monospace',
  },
  {
    id: "ibm-mono",
    label: "IBM Plex Mono (Industrial Console)",
    cssStack: '"IBM Plex Mono", var(--font-mono), monospace',
  },
];

export const DEFAULT_BRAND_THEME: BrandThemeConfig = {
  colorPresetId: "navy",
  primaryHex: "#2563EB",
  primaryHoverHex: "#1D4ED8",
  primaryLightHex: "#60A5FA",
  latinFont: "jakarta",
  arabicFont: "droid-naskh",
  monoFont: "jetbrains",
  surfaceStyle: "modern",
  brandMonogram: "MA",
  brandTagline: "Enterprise Fleet & LTL Control",
  logoDataUrl: "",
  headerTitle: "",
  headerSubtitle: "",
  headerContactPhone: "",
  headerAnnouncement: "",
  footerCompanyLegal: "",
  footerAddress: "",
  footerCopyright: "",
  footerCustomLinks: [],
  footerShowPoweredBy: true,
};

export interface FleetOperationalTask {
  id: string;
  title: string;
  description?: string;
  category:
    | "delivery"
    | "maintenance"
    | "customs"
    | "compliance"
    | "admin";
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed";
  dueDate: string;
  assignedTruckCode?: string;
  assignedDriverName?: string;
  routeCorridor?: string;
  costEstimateMad?: number;
  createdAt: string;
}

export interface InstanceFleetData {
  trucks: MapTruck[];
  ltlTrucks: LtlTruck[];
  shipments: LtlShipment[];
  drivers: DriverEcoRecord[];
  fuelPurchases: FuelPurchaseRecord[];
  alerts: TelemetryAlert[];
  tasks?: FleetOperationalTask[];
}

export interface ClientDemoInstance {
  id: string;
  slug: string;
  clientName: Record<Locale, string>;
  city: Record<Locale, string>;
  taxIce: string;
  accessPin: string;
  requirePin: boolean;
  isInteractiveSandbox: boolean;
  allowedTabs: ClientDemoTabId[];
  defaultLocale: Locale;
  defaultColorMode: "light" | "dark";
  fuelPriceMad: number;
  totalFleetCount: number;
  activeTrucksCount: number;
  themeConfig: BrandThemeConfig;
  contactCtaLabel: string;
  contactCtaUrl: string;
  notesForClient: string;
  createdAt: string;
  fleetData?: InstanceFleetData;
  gpsAlertsConfig?: GpsAlertsConfig;
}

// ZERO PRE-LOADED DEMO INSTANCES — Ibrahim creates real client instances from scratch
export const INITIAL_DEMO_INSTANCES: ClientDemoInstance[] = [];

export interface PlatformSystemConfig {
  idlingAlertThresholdMins: number;
  idleFuelBurnLitersPerHour: number;
  targetFleetConsumptionL100km: number;
  avgTruckCruiseSpeedKmh: number;
  admHighwayTollMadPerKm: number;
  ecoGreenMinScore: number;
  ecoYellowMinScore: number;
  defaultMaxPallets: number;
  defaultMaxVolumeM3: number;
  defaultMaxWeightKg: number;
  defaultFuelTankLiters: number;
  supabaseUrl: string;
  supabaseAnonKey: string;
  googleMapsApiKey: string;
  githubRepoUrl: string;
  vercelProjectName: string;
  dataMode: "local_sandbox" | "supabase_live";
  telemetryRefreshSeconds: number;
  adminOwnerName: string;
  masterAdminPassword: string;
  requireGateOnRoot: boolean;
  activeTheme: BrandThemeConfig;
  // Central Hybrid GPS & Alert Messaging Credentials (Ibrahim Master Admin)
  centralTelegramBotToken?: string;
  centralWhatsappPhoneNumberId?: string;
  centralWhatsappAccessToken?: string;
  traccarServerUrl?: string;
}

export const DEFAULT_PLATFORM_CONFIG: PlatformSystemConfig = {
  idlingAlertThresholdMins: 10,
  idleFuelBurnLitersPerHour: 3.5,
  targetFleetConsumptionL100km: 29.5,
  avgTruckCruiseSpeedKmh: 74,
  admHighwayTollMadPerKm: 0.85,
  ecoGreenMinScore: 80,
  ecoYellowMinScore: 65,
  defaultMaxPallets: 33,
  defaultMaxVolumeM3: 90,
  defaultMaxWeightKg: 24000,
  defaultFuelTankLiters: 850,
  supabaseUrl:
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://qosfrncehxnpxtrajpeo.supabase.co",
  supabaseAnonKey:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvc2ZybmNlaHhucHh0cmFqcGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUyOTI1MTQsImV4cCI6MjExMDg2ODUxNH0.d8mVqTzzSz3Sgb1HHPPPGtEc_c7-vCjVA7OYoxJK6fM",
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  githubRepoUrl: "https://github.com/maslwo272/morocco-fleet-ltl-dashboard",
  vercelProjectName: "morocco-fleet-ltl-dashboard",
  dataMode: "supabase_live",
  telemetryRefreshSeconds: 5,
  adminOwnerName: "Ibrahim",
  masterAdminPassword: process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "ibrahim2026",
  requireGateOnRoot: true,
  activeTheme: DEFAULT_BRAND_THEME,
  centralTelegramBotToken: "",
  centralWhatsappPhoneNumberId: "",
  centralWhatsappAccessToken: "",
  traccarServerUrl: "",
};

export interface CompanyProfile {
  id: string;
  code: string;
  name: Record<Locale, string>;
  city: Record<Locale, string>;
  defaultLocale: Locale;
  taxIce: string;
  totalFleetCount: number;
  activeTrucksCount: number;
}

export interface DailyFinancialPoint {
  dayIndex: number;
  dateLabel: string;
  dateIso: string;
  revenueMad: number;
  fuelSpendMad: number;
  fuelLiters: number;
  wastedIdleMad: number;
  utilizationPct: number;
}

export type TrailerType =
  | "Tautliner 13.6m"
  | "Reefer (Frigo ATP)"
  | "Mega Box Van"
  | "Container Chassis"
  | "Rigid 19T"
  | "Medium Distribution 12T"
  | "Light Urban Van 3.5T";

export type AxleConfig =
  | "4x2 + 3-Axle (40T)"
  | "6x4 Heavy (44T)"
  | "4x2 Rigid (19T)"
  | "4x2 Distribution (12T)"
  | "4x2 Light (3.5T-7.5T)";

// Standard Moroccan Truck Brand & Model Presets for Fast Onboarding
export interface TruckBrandPreset {
  brand: string;
  models: string[];
  defaultTankL: number;
  defaultL100km: number;
}

export const TRUCK_BRAND_PRESETS: TruckBrandPreset[] = [
  {
    brand: "Volvo Trucks",
    models: [
      "Volvo FH 500 Globetrotter",
      "Volvo FH 460 Euro 6",
      "Volvo FH16 540 Heavy",
      "Volvo FMX 440",
      "Volvo FL 250 Rigid",
    ],
    defaultTankL: 850,
    defaultL100km: 29.0,
  },
  {
    brand: "Scania",
    models: [
      "Scania R450 Highline",
      "Scania R500 V8",
      "Scania S500 NextGen",
      "Scania G410 XT",
      "Scania P280 Distribution",
    ],
    defaultTankL: 900,
    defaultL100km: 28.5,
  },
  {
    brand: "Mercedes-Benz",
    models: [
      "Mercedes-Benz Actros 1845 LS",
      "Mercedes-Benz Actros 1848 GigaSpace",
      "Mercedes-Benz Actros 2645",
      "Mercedes-Benz Arocs 3340",
      "Mercedes-Benz Atego 1524",
    ],
    defaultTankL: 820,
    defaultL100km: 29.5,
  },
  {
    brand: "MAN",
    models: [
      "MAN TGX 18.470",
      "MAN TGX 18.510",
      "MAN TGS 18.440",
      "MAN TGM 18.290",
    ],
    defaultTankL: 800,
    defaultL100km: 30.0,
  },
  {
    brand: "DAF",
    models: [
      "DAF XF 480 FT",
      "DAF XG 530",
      "DAF CF 450",
      "DAF LF 260 Rigid",
    ],
    defaultTankL: 850,
    defaultL100km: 29.2,
  },
  {
    brand: "Renault Trucks",
    models: [
      "Renault Trucks T 480 High",
      "Renault Trucks T 440",
      "Renault Trucks K 480 Heavy",
      "Renault Trucks D 19T Wide",
    ],
    defaultTankL: 800,
    defaultL100km: 29.8,
  },
  {
    brand: "Iveco",
    models: [
      "Iveco S-Way 490",
      "Iveco Stralis 460",
      "Iveco Eurocargo 180E28",
      "Iveco Daily 70C18",
    ],
    defaultTankL: 780,
    defaultL100km: 29.5,
  },
  {
    brand: "Isuzu / Mitsubishi Fuso",
    models: [
      "Isuzu FVR 19T",
      "Isuzu NPR 71 (7.5T)",
      "Mitsubishi Fuso Canter 8.5T",
      "Hyundai Mighty EX8",
    ],
    defaultTankL: 250,
    defaultL100km: 16.5,
  },
];

// Standard Trailer & Vehicle Capacity Presets (Auto-fills m³, kg, pallets, L/100km)
export interface TrailerCapacityPreset {
  id: string;
  label: string;
  trailerType: TrailerType;
  axleConfig: AxleConfig;
  maxVolumeM3: number;
  maxWeightKg: number;
  maxPallets: number;
  fuelTankCapacityL: number;
  targetConsumptionL100km: number;
}

export const TRAILER_CAPACITY_PRESETS: TrailerCapacityPreset[] = [
  {
    id: "semi-tautliner",
    label: "Semi-Trailer Tautliner 13.6m (90 m³ • 24,000 kg • 33 Pallets)",
    trailerType: "Tautliner 13.6m",
    axleConfig: "4x2 + 3-Axle (40T)",
    maxVolumeM3: 90,
    maxWeightKg: 24000,
    maxPallets: 33,
    fuelTankCapacityL: 850,
    targetConsumptionL100km: 29.5,
  },
  {
    id: "semi-frigo",
    label: "Semi-Trailer Reefer / Frigo ATP 13.6m (86 m³ • 22,000 kg • 33 Pallets)",
    trailerType: "Reefer (Frigo ATP)",
    axleConfig: "4x2 + 3-Axle (40T)",
    maxVolumeM3: 86,
    maxWeightKg: 22000,
    maxPallets: 33,
    fuelTankCapacityL: 900,
    targetConsumptionL100km: 33.5,
  },
  {
    id: "semi-mega",
    label: "Mega Box Trailer High-Cube (100 m³ • 24,000 kg • 33 Pallets)",
    trailerType: "Mega Box Van",
    axleConfig: "4x2 + 3-Axle (40T)",
    maxVolumeM3: 100,
    maxWeightKg: 24000,
    maxPallets: 33,
    fuelTankCapacityL: 850,
    targetConsumptionL100km: 31.0,
  },
  {
    id: "container-40ft",
    label: "Container Chassis 40ft HC (76 m³ • 26,000 kg • 25 Pallets)",
    trailerType: "Container Chassis",
    axleConfig: "6x4 Heavy (44T)",
    maxVolumeM3: 76,
    maxWeightKg: 26000,
    maxPallets: 25,
    fuelTankCapacityL: 900,
    targetConsumptionL100km: 32.0,
  },
  {
    id: "rigid-19t",
    label: "Camion Porteur Rigid 19T (55 m³ • 10,000 kg • 18 Pallets)",
    trailerType: "Rigid 19T",
    axleConfig: "4x2 Rigid (19T)",
    maxVolumeM3: 55,
    maxWeightKg: 10000,
    maxPallets: 18,
    fuelTankCapacityL: 450,
    targetConsumptionL100km: 22.5,
  },
  {
    id: "medium-12t",
    label: "Distribution Truck 12T (40 m³ • 6,000 kg • 14 Pallets)",
    trailerType: "Medium Distribution 12T",
    axleConfig: "4x2 Distribution (12T)",
    maxVolumeM3: 40,
    maxWeightKg: 6000,
    maxPallets: 14,
    fuelTankCapacityL: 300,
    targetConsumptionL100km: 18.0,
  },
  {
    id: "light-van",
    label: "Light Urban Delivery 3.5T - 7.5T (22 m³ • 3,500 kg • 8 Pallets)",
    trailerType: "Light Urban Van 3.5T",
    axleConfig: "4x2 Light (3.5T-7.5T)",
    maxVolumeM3: 22,
    maxWeightKg: 3500,
    maxPallets: 8,
    fuelTankCapacityL: 140,
    targetConsumptionL100km: 12.5,
  },
];

export interface MapTruck {
  id: string;
  code: string;
  plate: string;
  model: string;
  driverName: Record<Locale, string>;
  status: "moving" | "idling" | "alert";
  origin: Record<Locale, string>;
  destination: Record<Locale, string>;
  originCityKey?: string;
  destinationCityKey?: string;
  currentLocation: Record<Locale, string>;
  corridor: string;
  lat: number;
  lng: number;
  speedKmh: number;
  idleMinutes: number;
  fuelRateLph: number;
  wastedFuelLiters: number;
  wastedFuelMad: number;
  cargoUtilizationPct: number;
  temperatureC?: number;
  trailerType?: TrailerType;
  axleConfig?: AxleConfig;
  maxPallets?: number;
  loadedPallets?: number;
  maxVolumeM3?: number;
  loadedVolumeM3?: number;
  maxWeightKg?: number;
  loadedWeightKg?: number;
  fuelTankCapacityL?: number;
  fuelLevelPct?: number;
  targetConsumptionL100km?: number;
  routeDistanceKm?: number;
  remainingDistanceKm?: number;
  // Optional compliance & maintenance dates
  insuranceExpiry?: string;
  visiteTechniqueExpiry?: string;
  notes?: string;
  // Live GPS & Engine Ignition Tracking
  gpsDeviceImei?: string;
  gpsProvider?: "traccar" | "teltonika" | "wialon" | "mobile_gps" | "manual";
  ignitionOn?: boolean;
  lastGpsPingAt?: string;
  ignoreReeferIdleAlert?: boolean;
}

export interface TelemetryAlert {
  id: string;
  truckCode: string;
  truckId: string;
  type: "idling" | "harsh_braking" | "overspeed" | "backhaul" | "geofence";
  severity: "warning" | "critical" | "info" | "success";
  timestamp: string;
  corridor: string;
  idleMinutes?: number;
  wastedFuelLiters?: number;
  wastedFuelMad?: number;
  text: Record<Locale, string>;
  detail: Record<Locale, string>;
  acknowledged: boolean;
}

export interface LtlShipment {
  id: string;
  code: string;
  origin: Record<Locale, string>;
  destination: Record<Locale, string>;
  corridor: string;
  pallets: number;
  volumeM3: number;
  weightKg: number;
  revenueMad: number;
  cargoType: Record<Locale, string>;
  isBackhaulMatch: boolean;
  recommendedTruckId: string;
  recommendedTruckCode: string;
  emptyKmSaved: number;
  fuelLitersSaved: number;
  fuelMadSaved: number;
  assignedTruckId: string | null;
}

export interface LtlTruck {
  id: string;
  code: string;
  name: Record<Locale, string>;
  plate: string;
  model: string;
  route: Record<Locale, string>;
  corridor: string;
  driverName: Record<Locale, string>;
  departureTime: string;
  maxVolumeM3: number;
  baseVolumeM3: number;
  maxWeightKg: number;
  baseWeightKg: number;
  maxPallets: number;
  basePallets: number;
  returnHub: Record<Locale, string>;
}

export interface DriverEcoRecord {
  id: string;
  rank: number;
  driverCode: string;
  name: Record<Locale, string>;
  avatarInitials: string;
  truckCode: string;
  truckModel: string;
  corridor: string;
  routeDescription: Record<Locale, string>;
  fuelEfficiencyL100km: number;
  targetEfficiencyL100km: number;
  totalIdleMinutes30d: number;
  idleWastedMad30d: number;
  safetyIncidents30d: number;
  harshBrakingCount: number;
  overspeedCount: number;
  kmDriven30d: number;
  ecoScore: number;
  badge: "green" | "yellow" | "red";
  // Full Editable Driver Profile Fields
  cinNumber?: string;
  phone?: string;
  whatsapp?: string;
  licenseNumber?: string;
  licenseCategory?: string;
  licenseExpiry?: string;
  medicalExpiry?: string;
  hireDate?: string;
  status?: "active" | "on_trip" | "on_leave" | "suspended";
  baseSalaryMad?: number;
  bonusMad?: number;
  fuelCardCode?: string;
  homeCity?: string;
  emergencyContact?: string;
  notes?: string;
}

export interface FuelPurchaseRecord {
  id: string;
  invoiceNo: string;
  dateIso: string;
  truckCode: string;
  driverName: string;
  stationName: string;
  city: string;
  liters: number;
  pricePerLiterMad: number;
  paymentMethod: "Fleet Card" | "Depot Bulk" | "Jawaz / Card";
}

export const MOROCCO_CITY_COORDS: Record<
  string,
  { lat: number; lng: number; label: Record<Locale, string>; corridor: string }
> = {
  "Tanger Med Port": {
    lat: 35.8844,
    lng: -5.5026,
    corridor: "A1 / A5",
    label: {
      en: "Tanger Med Port",
      fr: "Port Tanger Med",
      ar: "ميناء طنجة المتوسط",
    },
  },
  "Kenitra AFZ": {
    lat: 34.261,
    lng: -6.5802,
    corridor: "A1",
    label: {
      en: "Kenitra Atlantic Free Zone",
      fr: "Zone Franche Kénitra",
      ar: "المنطقة الحرة القنيطرة",
    },
  },
  Rabat: {
    lat: 34.0209,
    lng: -6.8416,
    corridor: "A1 / A3",
    label: {
      en: "Rabat Technopolis",
      fr: "Rabat Technopolis",
      ar: "الرباط تكنوبوليس",
    },
  },
  "Casablanca Zenata": {
    lat: 33.605,
    lng: -7.53,
    corridor: "A3 / A5",
    label: {
      en: "Casablanca Zenata Logistics Hub",
      fr: "Hub Logistique Casablanca Zenata",
      ar: "المحطة اللوجستية الدار البيضاء زناتة",
    },
  },
  "Jorf Lasfar": {
    lat: 33.12,
    lng: -8.62,
    corridor: "A5",
    label: {
      en: "Jorf Lasfar Industrial Port",
      fr: "Port Industriel Jorf Lasfar",
      ar: "الميناء الصناعي الجرف الأصفر",
    },
  },
  "Fès": {
    lat: 34.0331,
    lng: -5.0003,
    corridor: "A2",
    label: {
      en: "Fès Bensouda Logistics",
      fr: "Fès Bensouda Logistique",
      ar: "فاس بنسودة اللوجستية",
    },
  },
  Oujda: {
    lat: 34.6814,
    lng: -1.9086,
    corridor: "A2",
    label: {
      en: "Oujda Oriental Hub",
      fr: "Pôle Oriental Oujda",
      ar: "قطب وجدة الشرقي",
    },
  },
  Marrakech: {
    lat: 31.6295,
    lng: -7.9811,
    corridor: "A7",
    label: {
      en: "Marrakech Tamansourt Hub",
      fr: "Hub Marrakech Tamansourt",
      ar: "قطب مراكش تامنصورت",
    },
  },
  Agadir: {
    lat: 30.4278,
    lng: -9.5981,
    corridor: "A7 / N1",
    label: {
      en: "Agadir Ait Melloul Logistics",
      fr: "Parc Logistique Agadir Aït Melloul",
      ar: "المركب اللوجستي أكادير أيت ملول",
    },
  },
  "Laâyoune": {
    lat: 27.1536,
    lng: -13.2033,
    corridor: "N1 Sahara",
    label: {
      en: "Laâyoune Port Axis (N1)",
      fr: "Axe Port de Laâyoune (N1)",
      ar: "محور ميناء العيون (N1)",
    },
  },
  Dakhla: {
    lat: 23.7145,
    lng: -15.9368,
    corridor: "N1 South",
    label: {
      en: "Dakhla Atlantic Port (N1)",
      fr: "Port Atlantique Dakhla (N1)",
      ar: "ميناء الداخلة الأطلسي (N1)",
    },
  },
  "El Guerguerat": {
    lat: 21.33,
    lng: -16.95,
    corridor: "N1 South",
    label: {
      en: "El Guerguerat / Lagouira Terminal",
      fr: "Terminal El Guerguerat / Lagouira",
      ar: "معبر الكركرات / الكويرة",
    },
  },
};

export interface MoroccoRouteMetrics {
  originKey: string;
  destinationKey: string;
  distanceKm: number;
  durationHours: number;
  durationFormatted: string;
  corridor: string;
  admTollMad: number;
  estimatedFuelLiters: number;
  estimatedFuelCostMad: number;
  googleMapsDirectionsUrl: string;
  googleMapsEmbedUrl: string;
}

const EXACT_MOROCCO_ROAD_DISTANCES_KM: Record<string, number> = {
  "Tanger Med Port|Kenitra AFZ": 218,
  "Tanger Med Port|Rabat": 265,
  "Tanger Med Port|Casablanca Zenata": 348,
  "Tanger Med Port|Jorf Lasfar": 462,
  "Tanger Med Port|Fès": 312,
  "Tanger Med Port|Oujda": 635,
  "Tanger Med Port|Marrakech": 584,
  "Tanger Med Port|Agadir": 815,
  "Tanger Med Port|Laâyoune": 1465,
  "Tanger Med Port|Dakhla": 1995,
  "Tanger Med Port|El Guerguerat": 2365,
  "Casablanca Zenata|Rabat": 87,
  "Casablanca Zenata|Kenitra AFZ": 132,
  "Casablanca Zenata|Jorf Lasfar": 114,
  "Casablanca Zenata|Fès": 295,
  "Casablanca Zenata|Oujda": 618,
  "Casablanca Zenata|Marrakech": 242,
  "Casablanca Zenata|Agadir": 472,
  "Casablanca Zenata|Laâyoune": 1120,
  "Casablanca Zenata|Dakhla": 1650,
  "Casablanca Zenata|El Guerguerat": 2025,
  "Agadir|Marrakech": 235,
  "Agadir|Laâyoune": 648,
  "Agadir|Dakhla": 1178,
  "Agadir|El Guerguerat": 1552,
  "Laâyoune|Dakhla": 530,
  "Laâyoune|El Guerguerat": 904,
  "Dakhla|El Guerguerat": 374,
  "Rabat|Fès": 208,
  "Rabat|Oujda": 532,
  "Fès|Oujda": 325,
};

function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getGoogleMapsDirectionsUrl(
  originNameOrLatLng: string,
  destNameOrLatLng: string
): string {
  const o = encodeURIComponent(`${originNameOrLatLng}, Morocco`);
  const d = encodeURIComponent(`${destNameOrLatLng}, Morocco`);
  return `https://www.google.com/maps/dir/?api=1&origin=${o}&destination=${d}&travelmode=driving`;
}

export function getGoogleMapsEmbedUrl(
  originKey: string,
  destKey?: string,
  customCoords?: { lat: number; lng: number }
): string {
  const orig = MOROCCO_CITY_COORDS[originKey];
  const dest = destKey ? MOROCCO_CITY_COORDS[destKey] : undefined;

  if (customCoords && !dest) {
    return `https://maps.google.com/maps?q=${customCoords.lat},${customCoords.lng}&z=7&output=embed`;
  }
  if (orig && dest && originKey !== destKey) {
    return `https://maps.google.com/maps?saddr=${orig.lat},${orig.lng}&daddr=${dest.lat},${dest.lng}&output=embed`;
  }
  if (orig) {
    return `https://maps.google.com/maps?q=${orig.lat},${orig.lng}&z=7&output=embed`;
  }
  return `https://maps.google.com/maps?q=31.7917,-7.0926&z=5&output=embed`;
}

export function calculateMoroccoRoute(
  originKey: string,
  destinationKey: string,
  fuelPriceMad: number = DIESEL_PRICE_MAD_PER_LITER,
  consumptionL100km: number = 29.5
): MoroccoRouteMetrics {
  const orig =
    MOROCCO_CITY_COORDS[originKey] ?? MOROCCO_CITY_COORDS["Casablanca Zenata"];
  const dest =
    MOROCCO_CITY_COORDS[destinationKey] ?? MOROCCO_CITY_COORDS["Marrakech"];

  let distanceKm = 0;
  if (originKey === destinationKey) {
    distanceKm = 18;
  } else {
    const directKey = `${originKey}|${destinationKey}`;
    const reverseKey = `${destinationKey}|${originKey}`;
    if (EXACT_MOROCCO_ROAD_DISTANCES_KM[directKey]) {
      distanceKm = EXACT_MOROCCO_ROAD_DISTANCES_KM[directKey];
    } else if (EXACT_MOROCCO_ROAD_DISTANCES_KM[reverseKey]) {
      distanceKm = EXACT_MOROCCO_ROAD_DISTANCES_KM[reverseKey];
    } else {
      const airKm = haversineDistanceKm(orig.lat, orig.lng, dest.lat, dest.lng);
      distanceKm = Math.max(22, Math.round(airKm * 1.24));
    }
  }

  const durationHours = Math.round((distanceKm / 74) * 10) / 10;
  const hrs = Math.floor(durationHours);
  const mins = Math.round((durationHours - hrs) * 60);
  const durationFormatted = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

  const corridor =
    orig.corridor === dest.corridor
      ? orig.corridor
      : `${orig.corridor.split(" ")[0]} → ${dest.corridor.split(" ")[0]}`;

  const isSouthernTollFree =
    originKey === "Laâyoune" ||
    originKey === "Dakhla" ||
    originKey === "El Guerguerat" ||
    destinationKey === "Laâyoune" ||
    destinationKey === "Dakhla" ||
    destinationKey === "El Guerguerat";
  const admTollMad = isSouthernTollFree
    ? Math.round(Math.min(distanceKm, 450) * 0.45)
    : Math.round(distanceKm * 0.85);

  const estimatedFuelLiters =
    Math.round(((distanceKm * consumptionL100km) / 100) * 10) / 10;
  const estimatedFuelCostMad = Math.round(estimatedFuelLiters * fuelPriceMad);

  return {
    originKey,
    destinationKey,
    distanceKm,
    durationHours,
    durationFormatted,
    corridor,
    admTollMad,
    estimatedFuelLiters,
    estimatedFuelCostMad,
    googleMapsDirectionsUrl: getGoogleMapsDirectionsUrl(
      originKey,
      destinationKey
    ),
    googleMapsEmbedUrl: getGoogleMapsEmbedUrl(originKey, destinationKey),
  };
}

// =========================================================================
// ZERO RANDOM DEMO DATA — ALL INITIAL ARRAYS ARE 100% CLEAN ([])
// =========================================================================
export const INITIAL_FUEL_PURCHASES: FuelPurchaseRecord[] = [];
export const COMPANIES: CompanyProfile[] = [];
export const INITIAL_MAP_TRUCKS: MapTruck[] = [];
export const INITIAL_TELEMETRY_ALERTS: TelemetryAlert[] = [];
export const INITIAL_LTL_TRUCKS: LtlTruck[] = [];
export const INITIAL_LTL_SHIPMENTS: LtlShipment[] = [];
export const INITIAL_DRIVER_ECO_SCORES: DriverEcoRecord[] = [];

export const DAILY_FINANCIALS_30D: DailyFinancialPoint[] = Array.from(
  { length: 30 },
  (_, idx) => {
    const dayNum = idx + 1;
    const dateObj = new Date(2026, 10, dayNum);
    const monthShort = dateObj.toLocaleDateString("en-US", { month: "short" });
    const dateLabel = `${monthShort} ${String(dayNum).padStart(2, "0")}`;
    const dateIso = `2026-11-${String(dayNum).padStart(2, "0")}`;
    return {
      dayIndex: dayNum,
      dateLabel,
      dateIso,
      revenueMad: 0,
      fuelSpendMad: 0,
      fuelLiters: 0,
      wastedIdleMad: 0,
      utilizationPct: 0,
    };
  }
);

/**
 * Dynamically computes the 30-day financial & fuel timeline strictly from
 * the instance's actual entered Trucks, Routes/Shipments, and Fuel Purchases.
 * If the instance has 0 records, every day is 0 MAD (no fake data).
 */
export function computeInstanceFinancials30d(
  fleet: InstanceFleetData,
  fuelPriceMad: number
): DailyFinancialPoint[] {
  const hasAnyData =
    fleet.trucks.length > 0 ||
    fleet.shipments.length > 0 ||
    fleet.fuelPurchases.length > 0;

  // Base 30-day calendar ending today
  const today = new Date();
  const points: DailyFinancialPoint[] = Array.from({ length: 30 }, (_, idx) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (29 - idx));
    const iso = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
    });
    return {
      dayIndex: idx + 1,
      dateLabel: label,
      dateIso: iso,
      revenueMad: 0,
      fuelSpendMad: 0,
      fuelLiters: 0,
      wastedIdleMad: 0,
      utilizationPct: 0,
    };
  });

  if (!hasAnyData) {
    return points;
  }

  // Average utilization across entered trucks
  const avgTruckUtil =
    fleet.trucks.length > 0
      ? Math.round(
          (fleet.trucks.reduce(
            (sum, t) => sum + (t.cargoUtilizationPct || 0),
            0
          ) /
            fleet.trucks.length) *
            10
        ) / 10
      : 0;

  // Map actual logged fuel purchases to their exact dateIso (or latest day if outside 30d window)
  fleet.fuelPurchases.forEach((fp) => {
    const matched =
      points.find((p) => p.dateIso === fp.dateIso) || points[points.length - 1];
    if (matched) {
      matched.fuelLiters = Math.round((matched.fuelLiters + fp.liters) * 10) / 10;
      matched.fuelSpendMad += Math.round(fp.liters * fp.pricePerLiterMad);
    }
  });

  // Distribute shipment revenue and active truck activity across the recent active days
  const totalShipmentRevenue = fleet.shipments.reduce(
    (sum, s) => sum + (s.revenueMad || 0),
    0
  );
  const totalTruckWastedMad = fleet.trucks.reduce(
    (sum, t) => sum + Math.round((t.wastedFuelLiters || 0) * fuelPriceMad),
    0
  );

  // Put current live shipment & truck revenue/idle metrics on the latest day or spread across days with fuel logs
  const activePoints = points.filter((p) => p.fuelSpendMad > 0);
  if (activePoints.length > 0) {
    const revPerActiveDay = Math.round(
      totalShipmentRevenue / activePoints.length
    );
    const idlePerActiveDay = Math.round(
      totalTruckWastedMad / activePoints.length
    );
    activePoints.forEach((p) => {
      p.revenueMad += revPerActiveDay;
      p.wastedIdleMad += idlePerActiveDay;
      p.utilizationPct = avgTruckUtil;
    });
  } else {
    const latest = points[points.length - 1];
    latest.revenueMad = totalShipmentRevenue;
    latest.wastedIdleMad = totalTruckWastedMad;
    latest.utilizationPct = avgTruckUtil;
  }

  return points;
}
