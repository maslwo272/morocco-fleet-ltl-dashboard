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
  | "fleet-manager";

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
};

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
}

export const INITIAL_DEMO_INSTANCES: ClientDemoInstance[] = [
  {
    id: "demo-sdtm-01",
    slug: "sdtm-maroc",
    clientName: {
      en: "SDTM Messagerie & LTL Maroc",
      fr: "SDTM Messagerie & LTL Maroc",
      ar: "شركة SDTM للإرساليات واللوجستيك المغرب",
    },
    city: {
      en: "Casablanca Zenata Hub",
      fr: "Hub Casablanca Zenata",
      ar: "قطب الدار البيضاء زناتة",
    },
    taxIce: "001592840000084",
    accessPin: "4820",
    requirePin: true,
    isInteractiveSandbox: true,
    allowedTabs: ["overview", "live-map", "ltl-optimizer", "driver-eco", "fleet-manager"],
    defaultLocale: "fr",
    defaultColorMode: "light",
    fuelPriceMad: 15.9,
    totalFleetCount: 64,
    activeTrucksCount: 58,
    themeConfig: {
      colorPresetId: "navy",
      primaryHex: "#2563EB",
      primaryHoverHex: "#1D4ED8",
      primaryLightHex: "#60A5FA",
      latinFont: "jakarta",
      arabicFont: "droid-naskh",
      monoFont: "jetbrains",
      surfaceStyle: "modern",
      brandMonogram: "SD",
      brandTagline: "Portail Exécutif LTL & Télémétrie Flotte",
    },
    contactCtaLabel: "Contact Ibrahim — Deploy Full Production Fleet",
    contactCtaUrl: "https://wa.me/212600000000",
    notesForClient: "Custom demo prepared by Ibrahim for SDTM national A1/A3/A7 LTL network.",
    createdAt: "2026-11-21",
  },
  {
    id: "demo-tanger-02",
    slug: "tanger-med-express",
    clientName: {
      en: "TangerMed Atlantic Freight S.A.",
      fr: "TangerMed Fret Atlantique S.A.",
      ar: "طنجة المتوسط للشحن الأطلسي ش.م",
    },
    city: {
      en: "Tanger Med Port Free Zone",
      fr: "Zone Franche Port Tanger Med",
      ar: "المنطقة الحرة ميناء طنجة المتوسط",
    },
    taxIce: "002849103000019",
    accessPin: "2026",
    requirePin: true,
    isInteractiveSandbox: true,
    allowedTabs: ["overview", "live-map", "ltl-optimizer", "driver-eco"],
    defaultLocale: "fr",
    defaultColorMode: "dark",
    fuelPriceMad: 15.75,
    totalFleetCount: 48,
    activeTrucksCount: 44,
    themeConfig: {
      colorPresetId: "emerald",
      primaryHex: "#059669",
      primaryHoverHex: "#047857",
      primaryLightHex: "#34D399",
      latinFont: "ibm-plex",
      arabicFont: "droid-naskh",
      monoFont: "ibm-mono",
      surfaceStyle: "sharp",
      brandMonogram: "TM",
      brandTagline: "Tanger Med Port & A1 Corridor Control",
    },
    contactCtaLabel: "Contact Ibrahim — Activate Tanger Med Integration",
    contactCtaUrl: "https://wa.me/212600000000",
    notesForClient: "Tailored for Tanger Med export customs idling control & Kenitra AFZ shuttles.",
    createdAt: "2026-11-21",
  },
  {
    id: "demo-sahara-03",
    slug: "al-maghribia-sahara",
    clientName: {
      en: "Al-Maghribia Sahara & Dakhla Cold-Chain",
      fr: "Al-Maghribia Chaîne du Froid Sahara & Dakhla",
      ar: "المغربية للنقل وسلسلة التبريد الصحراوية والداخلة",
    },
    city: {
      en: "Agadir, Laâyoune & Dakhla Hub",
      fr: "Pôle Agadir, Laâyoune & Dakhla",
      ar: "قطب أكادير والعيون والداخلة اللوجستي",
    },
    taxIce: "003109482000051",
    accessPin: "1100",
    requirePin: false,
    isInteractiveSandbox: true,
    allowedTabs: ["overview", "live-map", "ltl-optimizer", "driver-eco", "fleet-manager"],
    defaultLocale: "ar",
    defaultColorMode: "light",
    fuelPriceMad: 15.6,
    totalFleetCount: 42,
    activeTrucksCount: 39,
    themeConfig: {
      colorPresetId: "terracotta",
      primaryHex: "#D97706",
      primaryHoverHex: "#B45309",
      primaryLightHex: "#FBBF24",
      latinFont: "inter",
      arabicFont: "droid-naskh",
      monoFont: "jetbrains",
      surfaceStyle: "glass",
      brandMonogram: "MS",
      brandTagline: "منظومة تتبع الأسطول والشحن المبرد (طنجة - الكويرة)",
    },
    contactCtaLabel: "تواصل مع إبراهيم لتفعيل المنظومة الكاملة",
    contactCtaUrl: "https://wa.me/212600000000",
    notesForClient: "1-Click Arabic Naskh showcase for N1 Agadir-Laâyoune-Dakhla-El Guerguerat corridor.",
    createdAt: "2026-11-21",
  },
];

export interface PlatformSystemConfig {
  // Operational & Formula Thresholds
  idlingAlertThresholdMins: number;
  idleFuelBurnLitersPerHour: number;
  targetFleetConsumptionL100km: number;
  avgTruckCruiseSpeedKmh: number;
  admHighwayTollMadPerKm: number;
  ecoGreenMinScore: number;
  ecoYellowMinScore: number;
  // Default Truck & Trailer Capacity Presets
  defaultMaxPallets: number;
  defaultMaxVolumeM3: number;
  defaultMaxWeightKg: number;
  defaultFuelTankLiters: number;
  // Cloud, API & Handover Configuration (Supabase / Vercel / GitHub / Google Maps)
  supabaseUrl: string;
  supabaseAnonKey: string;
  googleMapsApiKey: string;
  githubRepoUrl: string;
  vercelProjectName: string;
  dataMode: "local_sandbox" | "supabase_live";
  telemetryRefreshSeconds: number;
  adminOwnerName: string;
  // Security & White-Label Theme Engine
  masterAdminPassword: string;
  requireGateOnRoot: boolean;
  activeTheme: BrandThemeConfig;
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
  | "Rigid 19T";

export type AxleConfig =
  | "4x2 + 3-Axle (40T)"
  | "6x4 Heavy (44T)"
  | "4x2 Rigid (19T)";

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
  // Full Truck Capacity, Pallets, Equipment & Distance Specs
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

// Calibrated Moroccan Highway Road Distances (in km) between primary logistics hubs
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
    distanceKm = 18; // Intra-city port/terminal shuttle distance
  } else {
    const directKey = `${originKey}|${destinationKey}`;
    const reverseKey = `${destinationKey}|${originKey}`;
    if (EXACT_MOROCCO_ROAD_DISTANCES_KM[directKey]) {
      distanceKm = EXACT_MOROCCO_ROAD_DISTANCES_KM[directKey];
    } else if (EXACT_MOROCCO_ROAD_DISTANCES_KM[reverseKey]) {
      distanceKm = EXACT_MOROCCO_ROAD_DISTANCES_KM[reverseKey];
    } else {
      // Haversine * 1.24 Moroccan highway tortuosity factor
      const airKm = haversineDistanceKm(orig.lat, orig.lng, dest.lat, dest.lng);
      distanceKm = Math.max(22, Math.round(airKm * 1.24));
    }
  }

  // Heavy truck average highway speed (74 km/h including toll gates & grades)
  const durationHours = Math.round((distanceKm / 74) * 10) / 10;
  const hrs = Math.floor(durationHours);
  const mins = Math.round((durationHours - hrs) * 60);
  const durationFormatted = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

  const corridor =
    orig.corridor === dest.corridor
      ? orig.corridor
      : `${orig.corridor.split(" ")[0]} → ${dest.corridor.split(" ")[0]}`;

  // ADM Autoroutes du Maroc Class-3 Heavy Truck Toll (~0.85 MAD/km on A1-A7; N1 Sahara is toll-free expressway)
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

export const INITIAL_FUEL_PURCHASES: FuelPurchaseRecord[] = [
  {
    id: "fp-101",
    invoiceNo: "INV-MA-8841",
    dateIso: "2026-11-15",
    truckCode: "Truck 12",
    driverName: "Youssef El Amrani",
    stationName: "Afriquia Tanger Med ZL",
    city: "Tanger Med Port",
    liters: 420,
    pricePerLiterMad: 15.9,
    paymentMethod: "Fleet Card",
  },
  {
    id: "fp-102",
    invoiceNo: "INV-MA-8839",
    dateIso: "2026-11-15",
    truckCode: "Truck 04",
    driverName: "Hassan Ait Brahim",
    stationName: "Shell Autoroute A7 Chichaoua",
    city: "Marrakech",
    liters: 380,
    pricePerLiterMad: 15.75,
    paymentMethod: "Fleet Card",
  },
  {
    id: "fp-103",
    invoiceNo: "INV-MA-8834",
    dateIso: "2026-11-14",
    truckCode: "Truck 19",
    driverName: "Omar Berrada",
    stationName: "Depot Zenata Bulk Tank",
    city: "Casablanca Zenata",
    liters: 510,
    pricePerLiterMad: 15.4,
    paymentMethod: "Depot Bulk",
  },
  {
    id: "fp-104",
    invoiceNo: "INV-MA-8828",
    dateIso: "2026-11-14",
    truckCode: "Truck 36",
    driverName: "Moulay Ahmed Maalainine",
    stationName: "TotalEnergies N1 Laâyoune",
    city: "Laâyoune",
    liters: 460,
    pricePerLiterMad: 15.6,
    paymentMethod: "Fleet Card",
  },
  {
    id: "fp-105",
    invoiceNo: "INV-MA-8821",
    dateIso: "2026-11-13",
    truckCode: "Truck 15",
    driverName: "Driss Tazi",
    stationName: "Winxo Autoroute A2 Fès",
    city: "Fès",
    liters: 350,
    pricePerLiterMad: 16.05,
    paymentMethod: "Jawaz / Card",
  },
];

export const COMPANIES: CompanyProfile[] = [
  {
    id: "comp-atlas-01",
    code: "ATLAS-MA",
    name: {
      en: "AtlasLogix Maroc S.A.",
      fr: "AtlasLogix Maroc S.A.",
      ar: "أطلس لوجيكس المغرب ش.م",
    },
    city: {
      en: "Casablanca Zenata",
      fr: "Casablanca Zenata",
      ar: "الدار البيضاء زناتة",
    },
    defaultLocale: "en",
    taxIce: "001592840000084",
    totalFleetCount: 48,
    activeTrucksCount: 44,
  },
  {
    id: "comp-tanger-02",
    code: "DETROIT-TM",
    name: {
      en: "TangerMed Corridor Express",
      fr: "TangerMed Corridor Express",
      ar: "طنجة ميد كوريدور إكسبريس",
    },
    city: {
      en: "Tanger Med Port Zone",
      fr: "Zone Franche Tanger Med",
      ar: "المنطقة الحرة ميناء طنجة المتوسط",
    },
    defaultLocale: "fr",
    taxIce: "002849103000019",
    totalFleetCount: 64,
    activeTrucksCount: 58,
  },
  {
    id: "comp-maghreb-03",
    code: "MAGHREB-AR",
    name: {
      en: "Al-Maghribia Atlantic & Sahara Freight",
      fr: "Al-Maghribia Fret Atlantique & Sahara",
      ar: "المغربية للنقل واللوجستيك الأطلسي والصحراوي",
    },
    city: {
      en: "Agadir, Laâyoune & Dakhla Hub",
      fr: "Pôle Agadir, Laâyoune & Dakhla",
      ar: "قطب أكادير والعيون والداخلة اللوجستي",
    },
    defaultLocale: "ar",
    taxIce: "003109482000051",
    totalFleetCount: 40,
    activeTrucksCount: 37,
  },
];

export const DAILY_FINANCIALS_30D: DailyFinancialPoint[] = Array.from(
  { length: 30 },
  (_, idx) => {
    const dayNum = idx + 1;
    const wave = Math.sin(idx * 0.45) * 14500 + Math.cos(idx * 0.25) * 8200;
    const trend = idx * 1450;
    const revenueMad = Math.round(168000 + trend + wave);

    const baseLiters = 3850 - idx * 18 + Math.sin(idx * 0.5) * 260;
    const fuelLiters = Math.round(baseLiters * 10) / 10;
    const fuelSpendMad = Math.round(fuelLiters * DIESEL_PRICE_MAD_PER_LITER);

    const wastedIdleLiters = Math.max(95, Math.round(240 - idx * 2.1 + Math.cos(idx) * 24));
    const wastedIdleMad = Math.round(wastedIdleLiters * DIESEL_PRICE_MAD_PER_LITER);
    const utilizationPct =
      Math.min(94, Math.round((71 + idx * 0.45 + Math.sin(idx * 0.4) * 3) * 10) / 10);

    const dateObj = new Date(2026, 10, dayNum);
    const monthShort = dateObj.toLocaleDateString("en-US", { month: "short" });
    const dateLabel = `${monthShort} ${String(dayNum).padStart(2, "0")}`;
    const dateIso = `2026-11-${String(dayNum).padStart(2, "0")}`;

    return {
      dayIndex: dayNum,
      dateLabel,
      dateIso,
      revenueMad,
      fuelSpendMad,
      fuelLiters,
      wastedIdleMad,
      utilizationPct,
    };
  }
);

export const INITIAL_MAP_TRUCKS: MapTruck[] = [
  {
    id: "trk-12",
    code: "Truck 12",
    plate: "48291-A-1",
    model: "Volvo FH16 540",
    driverName: {
      en: "Youssef El Amrani",
      fr: "Youssef El Amrani",
      ar: "يوسف العمراني",
    },
    status: "idling",
    originCityKey: "Tanger Med Port",
    destinationCityKey: "Casablanca Zenata",
    origin: {
      en: "Tanger Med Port",
      fr: "Port Tanger Med",
      ar: "ميناء طنجة المتوسط",
    },
    destination: {
      en: "Casablanca Zenata",
      fr: "Casablanca Zenata",
      ar: "الدار البيضاء زناتة",
    },
    currentLocation: {
      en: "Tanger Med Port (Gate 4 Export Customs)",
      fr: "Port Tanger Med (Douane Export Porte 4)",
      ar: "ميناء طنجة المتوسط (بوابة الجمارك 4)",
    },
    corridor: "A1 / A5",
    lat: 35.8844,
    lng: -5.5026,
    speedKmh: 0,
    idleMinutes: 15,
    fuelRateLph: 3.6,
    wastedFuelLiters: 4.8,
    wastedFuelMad: Math.round(4.8 * DIESEL_PRICE_MAD_PER_LITER * 100) / 100,
    cargoUtilizationPct: 84,
    trailerType: "Tautliner 13.6m",
    axleConfig: "4x2 + 3-Axle (40T)",
    maxPallets: 33,
    loadedPallets: 28,
    maxVolumeM3: 90,
    loadedVolumeM3: 75.6,
    maxWeightKg: 24000,
    loadedWeightKg: 20160,
    fuelTankCapacityL: 850,
    fuelLevelPct: 78,
    targetConsumptionL100km: 28.5,
    routeDistanceKm: 348,
    remainingDistanceKm: 342,
  },
  {
    id: "trk-08",
    code: "Truck 08",
    plate: "71904-B-6",
    model: "Scania R500 V8",
    driverName: {
      en: "Karim Benjelloun",
      fr: "Karim Benjelloun",
      ar: "كريم بنجلون",
    },
    status: "alert",
    originCityKey: "Casablanca Zenata",
    destinationCityKey: "Rabat",
    origin: {
      en: "Casablanca Port",
      fr: "Port de Casablanca",
      ar: "ميناء الدار البيضاء",
    },
    destination: {
      en: "Rabat Technopolis",
      fr: "Rabat Technopolis",
      ar: "الرباط تكنوبوليس",
    },
    currentLocation: {
      en: "A3 Highway (Mohammedia - Bouznika PK 41)",
      fr: "Autoroute A3 (Mohammédia - Bouznika PK 41)",
      ar: "الطريق السيار A3 (المحمدية - بوزنيقة ن.ك 41)",
    },
    corridor: "A3",
    lat: 33.7412,
    lng: -7.2485,
    speedKmh: 64,
    idleMinutes: 0,
    fuelRateLph: 28.4,
    wastedFuelLiters: 2.1,
    wastedFuelMad: Math.round(2.1 * DIESEL_PRICE_MAD_PER_LITER * 100) / 100,
    cargoUtilizationPct: 91,
    trailerType: "Container Chassis",
    axleConfig: "6x4 Heavy (44T)",
    maxPallets: 33,
    loadedPallets: 30,
    maxVolumeM3: 88,
    loadedVolumeM3: 80.1,
    maxWeightKg: 26000,
    loadedWeightKg: 23660,
    fuelTankCapacityL: 900,
    fuelLevelPct: 64,
    targetConsumptionL100km: 31.2,
    routeDistanceKm: 87,
    remainingDistanceKm: 46,
  },
  {
    id: "trk-04",
    code: "Truck 04",
    plate: "19402-D-33",
    model: "Mercedes-Benz Actros MP5",
    driverName: {
      en: "Hassan Ait Brahim",
      fr: "Hassan Ait Brahim",
      ar: "حسن آيت إبراهيم",
    },
    status: "moving",
    originCityKey: "Agadir",
    destinationCityKey: "Marrakech",
    origin: {
      en: "Agadir Chtouka Hub",
      fr: "Pôle Agadir Chtouka",
      ar: "قطب أكادير شتوكة",
    },
    destination: {
      en: "Marrakech Tamansourt",
      fr: "Marrakech Tamansourt",
      ar: "مراكش تامنصورت",
    },
    currentLocation: {
      en: "A7 Highway (Argana Pass - Chichaoua)",
      fr: "Autoroute A7 (Col d'Argana - Chichaoua)",
      ar: "الطريق السيار A7 (ممر أركانة - شيشاوة)",
    },
    corridor: "A7",
    lat: 31.148,
    lng: -8.842,
    speedKmh: 85,
    idleMinutes: 0,
    fuelRateLph: 24.8,
    wastedFuelLiters: 0.4,
    wastedFuelMad: Math.round(0.4 * DIESEL_PRICE_MAD_PER_LITER * 100) / 100,
    cargoUtilizationPct: 94,
    temperatureC: 4.2,
    trailerType: "Reefer (Frigo ATP)",
    axleConfig: "4x2 + 3-Axle (40T)",
    maxPallets: 33,
    loadedPallets: 31,
    maxVolumeM3: 86,
    loadedVolumeM3: 80.8,
    maxWeightKg: 24000,
    loadedWeightKg: 22560,
    fuelTankCapacityL: 800,
    fuelLevelPct: 72,
    targetConsumptionL100km: 27.4,
    routeDistanceKm: 235,
    remainingDistanceKm: 112,
  },
  {
    id: "trk-19",
    code: "Truck 19",
    plate: "63812-A-6",
    model: "MAN TGX 18.510",
    driverName: {
      en: "Omar Berrada",
      fr: "Omar Berrada",
      ar: "عمر برادة",
    },
    status: "idling",
    originCityKey: "Casablanca Zenata",
    destinationCityKey: "Jorf Lasfar",
    origin: {
      en: "Casablanca Ain Sebaâ",
      fr: "Casablanca Aïn Sebaâ",
      ar: "الدار البيضاء عين السبع",
    },
    destination: {
      en: "Jorf Lasfar Industrial Port",
      fr: "Port Industriel Jorf Lasfar",
      ar: "الميناء الصناعي الجرف الأصفر",
    },
    currentLocation: {
      en: "Casablanca Zenata Logistics Terminal (Dock 9)",
      fr: "Terminal Logistique Casablanca Zenata (Quai 9)",
      ar: "المحطة اللوجستية الدار البيضاء زناتة (رصيف 9)",
    },
    corridor: "A5 / A3",
    lat: 33.42,
    lng: -7.85,
    speedKmh: 0,
    idleMinutes: 22,
    fuelRateLph: 3.8,
    wastedFuelLiters: 6.2,
    wastedFuelMad: Math.round(6.2 * DIESEL_PRICE_MAD_PER_LITER * 100) / 100,
    cargoUtilizationPct: 68,
    trailerType: "Tautliner 13.6m",
    axleConfig: "4x2 + 3-Axle (40T)",
    maxPallets: 33,
    loadedPallets: 22,
    maxVolumeM3: 90,
    loadedVolumeM3: 61.2,
    maxWeightKg: 24000,
    loadedWeightKg: 16320,
    fuelTankCapacityL: 780,
    fuelLevelPct: 58,
    targetConsumptionL100km: 30.8,
    routeDistanceKm: 114,
    remainingDistanceKm: 98,
  },
  {
    id: "trk-15",
    code: "Truck 15",
    plate: "88410-B-15",
    model: "DAF XF 480 FT",
    driverName: {
      en: "Driss Tazi",
      fr: "Driss Tazi",
      ar: "إدريس التازي",
    },
    status: "moving",
    originCityKey: "Rabat",
    destinationCityKey: "Oujda",
    origin: {
      en: "Rabat Salé",
      fr: "Rabat Salé",
      ar: "الرباط سلا",
    },
    destination: {
      en: "Fès & Oujda Oriental Hub",
      fr: "Pôle Fès & Oujda Oriental",
      ar: "قطب فاس ووجدة الشرقي",
    },
    currentLocation: {
      en: "A2 Highway (Fès - Taza East Axis)",
      fr: "Autoroute A2 (Axe Est Fès - Taza)",
      ar: "الطريق السيار A2 (محور فاس - تازة)",
    },
    corridor: "A2",
    lat: 34.15,
    lng: -4.25,
    speedKmh: 82,
    idleMinutes: 0,
    fuelRateLph: 25.1,
    wastedFuelLiters: 0.8,
    wastedFuelMad: Math.round(0.8 * DIESEL_PRICE_MAD_PER_LITER * 100) / 100,
    cargoUtilizationPct: 79,
    trailerType: "Mega Box Van",
    axleConfig: "4x2 + 3-Axle (40T)",
    maxPallets: 34,
    loadedPallets: 27,
    maxVolumeM3: 96,
    loadedVolumeM3: 75.8,
    maxWeightKg: 24000,
    loadedWeightKg: 18960,
    fuelTankCapacityL: 850,
    fuelLevelPct: 69,
    targetConsumptionL100km: 27.9,
    routeDistanceKm: 532,
    remainingDistanceKm: 245,
  },
  {
    id: "trk-27",
    code: "Truck 27",
    plate: "55209-A-40",
    model: "Iveco S-Way 490",
    driverName: {
      en: "Rachid El Fassi",
      fr: "Rachid El Fassi",
      ar: "رشيد الفاسي",
    },
    status: "moving",
    originCityKey: "Tanger Med Port",
    destinationCityKey: "Kenitra AFZ",
    origin: {
      en: "Tanger Automotive City",
      fr: "Tanger Automotive City",
      ar: "مدينة طنجة لصناعة السيارات",
    },
    destination: {
      en: "Kenitra Atlantic Free Zone",
      fr: "Zone Franche Atlantique Kénitra",
      ar: "المنطقة الحرة الأطلسية القنيطرة",
    },
    currentLocation: {
      en: "A1 Highway (Larache - Kenitra)",
      fr: "Autoroute A1 (Larache - Kénitra)",
      ar: "الطريق السيار A1 (العرائش - القنيطرة)",
    },
    corridor: "A1",
    lat: 34.86,
    lng: -6.15,
    speedKmh: 84,
    idleMinutes: 0,
    fuelRateLph: 24.1,
    wastedFuelLiters: 0.3,
    wastedFuelMad: Math.round(0.3 * DIESEL_PRICE_MAD_PER_LITER * 100) / 100,
    cargoUtilizationPct: 92,
    trailerType: "Mega Box Van",
    axleConfig: "4x2 + 3-Axle (40T)",
    maxPallets: 34,
    loadedPallets: 31,
    maxVolumeM3: 100,
    loadedVolumeM3: 92.0,
    maxWeightKg: 24000,
    loadedWeightKg: 22080,
    fuelTankCapacityL: 800,
    fuelLevelPct: 83,
    targetConsumptionL100km: 26.8,
    routeDistanceKm: 218,
    remainingDistanceKm: 78,
  },
  {
    id: "trk-31",
    code: "Truck 31",
    plate: "91204-B-7",
    model: "Volvo FH 460 Globetrotter",
    driverName: {
      en: "Nabil Ouali",
      fr: "Nabil Ouali",
      ar: "نبيل الوالي",
    },
    status: "idling",
    originCityKey: "Agadir",
    destinationCityKey: "Casablanca Zenata",
    origin: {
      en: "Agadir Port Cold Chain",
      fr: "Port d'Agadir Chaîne du Froid",
      ar: "ميناء أكادير سلسلة التبريد",
    },
    destination: {
      en: "Casablanca Marche de Gros",
      fr: "Marché de Gros Casablanca",
      ar: "سوق الجملة الدار البيضاء",
    },
    currentLocation: {
      en: "Agadir Ait Melloul Logistics Park",
      fr: "Parc Logistique Agadir Aït Melloul",
      ar: "المركب اللوجستي أكادير أيت ملول",
    },
    corridor: "A7 / N1",
    lat: 30.356,
    lng: -9.498,
    speedKmh: 0,
    idleMinutes: 11,
    fuelRateLph: 3.2,
    wastedFuelLiters: 3.1,
    wastedFuelMad: Math.round(3.1 * DIESEL_PRICE_MAD_PER_LITER * 100) / 100,
    cargoUtilizationPct: 76,
    temperatureC: 3.8,
    trailerType: "Reefer (Frigo ATP)",
    axleConfig: "4x2 + 3-Axle (40T)",
    maxPallets: 33,
    loadedPallets: 25,
    maxVolumeM3: 86,
    loadedVolumeM3: 65.4,
    maxWeightKg: 24000,
    loadedWeightKg: 18240,
    fuelTankCapacityL: 820,
    fuelLevelPct: 75,
    targetConsumptionL100km: 29.1,
    routeDistanceKm: 472,
    remainingDistanceKm: 465,
  },
  {
    id: "trk-36",
    code: "Truck 36",
    plate: "64018-S-81",
    model: "Scania R540 Longline • Reefer",
    driverName: {
      en: "Moulay Ahmed Maalainine",
      fr: "Moulay Ahmed Maalainine",
      ar: "مولاي أحمد ماء العينين",
    },
    status: "moving",
    originCityKey: "Agadir",
    destinationCityKey: "Dakhla",
    origin: {
      en: "Agadir Industrial Hub",
      fr: "Pôle Industriel d'Agadir",
      ar: "القطب الصناعي أكادير",
    },
    destination: {
      en: "Laâyoune & Dakhla Port",
      fr: "Laâyoune & Port de Dakhla",
      ar: "العيون وميناء الداخلة الأطلسي",
    },
    currentLocation: {
      en: "N1 Tiznit-Dakhla Expressway (Laâyoune Port Axis)",
      fr: "Voie Express Tiznit-Dakhla N1 (Axe Port de Laâyoune)",
      ar: "الطريق السريع تيزنيت-الداخلة N1 (محور ميناء العيون)",
    },
    corridor: "N1 Sahara",
    lat: 27.1536,
    lng: -13.2033,
    speedKmh: 86,
    idleMinutes: 0,
    fuelRateLph: 24.4,
    wastedFuelLiters: 0.2,
    wastedFuelMad: Math.round(0.2 * DIESEL_PRICE_MAD_PER_LITER * 100) / 100,
    cargoUtilizationPct: 95,
    temperatureC: -18.0,
    trailerType: "Reefer (Frigo ATP)",
    axleConfig: "6x4 Heavy (44T)",
    maxPallets: 33,
    loadedPallets: 31,
    maxVolumeM3: 88,
    loadedVolumeM3: 83.6,
    maxWeightKg: 26000,
    loadedWeightKg: 24700,
    fuelTankCapacityL: 1100,
    fuelLevelPct: 68,
    targetConsumptionL100km: 27.2,
    routeDistanceKm: 1178,
    remainingDistanceKm: 530,
  },
  {
    id: "trk-40",
    code: "Truck 40",
    plate: "82910-D-85",
    model: "Mercedes-Benz Actros 2653",
    driverName: {
      en: "Sidi Mohamed El Filali",
      fr: "Sidi Mohamed El Filali",
      ar: "سيدي محمد الفيلالي",
    },
    status: "moving",
    originCityKey: "Agadir",
    destinationCityKey: "El Guerguerat",
    origin: {
      en: "Casablanca & Agadir",
      fr: "Casablanca & Agadir",
      ar: "الدار البيضاء وأكادير",
    },
    destination: {
      en: "Dakhla & El Guerguerat Terminal",
      fr: "Dakhla & Terminal El Guerguerat",
      ar: "الداخلة ومعبر الكركرات",
    },
    currentLocation: {
      en: "N1 Atlantic Axis (Dakhla - El Guerguerat Corridor)",
      fr: "Axe Atlantique N1 (Corridor Dakhla - El Guerguerat)",
      ar: "المحور الأطلسي N1 (ممر الداخلة - الكركرات)",
    },
    corridor: "N1 South",
    lat: 23.7145,
    lng: -15.9368,
    speedKmh: 83,
    idleMinutes: 0,
    fuelRateLph: 25.6,
    wastedFuelLiters: 0.5,
    wastedFuelMad: Math.round(0.5 * DIESEL_PRICE_MAD_PER_LITER * 100) / 100,
    cargoUtilizationPct: 91,
    trailerType: "Tautliner 13.6m",
    axleConfig: "6x4 Heavy (44T)",
    maxPallets: 33,
    loadedPallets: 30,
    maxVolumeM3: 90,
    loadedVolumeM3: 81.9,
    maxWeightKg: 26000,
    loadedWeightKg: 23660,
    fuelTankCapacityL: 1200,
    fuelLevelPct: 62,
    targetConsumptionL100km: 27.6,
    routeDistanceKm: 1552,
    remainingDistanceKm: 374,
  },
];

export const INITIAL_TELEMETRY_ALERTS: TelemetryAlert[] = [
  {
    id: "alt-01",
    truckCode: "Truck 12",
    truckId: "trk-12",
    type: "idling",
    severity: "warning",
    timestamp: "20:21:14",
    corridor: "Tanger Med Port",
    idleMinutes: 15,
    wastedFuelLiters: 4.8,
    wastedFuelMad: 76.32,
    text: {
      en: "⚠️ Truck 12 - Idling for 15 mins at Tanger Med Port",
      fr: "⚠️ Camion 12 - Ralenti moteur depuis 15 min au Port Tanger Med",
      ar: "⚠️ شاحنة 12 - توقف بمحرك مشتغل لمدة 15 دقيقة بميناء طنجة المتوسط",
    },
    detail: {
      en: "Gate 4 Export Customs • 4.8 L wasted",
      fr: "Douane Export Porte 4 • 4,8 L gaspillés",
      ar: "بوابة الجمارك 4 • هدر 4.8 لتر",
    },
    acknowledged: false,
  },
  {
    id: "alt-02",
    truckCode: "Truck 08",
    truckId: "trk-08",
    type: "harsh_braking",
    severity: "critical",
    timestamp: "20:19:48",
    corridor: "A3",
    text: {
      en: "🚨 Truck 08 - Harsh Braking on A3",
      fr: "🚨 Camion 08 - Freinage brusque sur l'Autoroute A3",
      ar: "🚨 شاحنة 08 - فرملة مفاجئة وقوية على الطريق السيار A3",
    },
    detail: {
      en: "Deceleration -0.68g near Mohammedia PK 41 (86 → 42 km/h in 3.2s)",
      fr: "Décélération -0,68g près de Mohammédia PK 41 (86 → 42 km/h en 3,2s)",
      ar: "تباطؤ حاد -0.68g قرب المحمدية ن.ك 41 (من 86 إلى 42 كم/س في 3.2 ثانية)",
    },
    acknowledged: false,
  },
  {
    id: "alt-03",
    truckCode: "Truck 19",
    truckId: "trk-19",
    type: "idling",
    severity: "warning",
    timestamp: "20:16:05",
    corridor: "Casablanca Zenata",
    idleMinutes: 22,
    wastedFuelLiters: 6.2,
    wastedFuelMad: 98.58,
    text: {
      en: "⚠️ Truck 19 - Idling for 22 mins at Casablanca Zenata Hub",
      fr: "⚠️ Camion 19 - Ralenti moteur depuis 22 min au Hub Casablanca Zenata",
      ar: "⚠️ شاحنة 19 - محرك في حالة خمول لمدة 22 دقيقة بمحطة الدار البيضاء زناتة",
    },
    detail: {
      en: "Unloading Bay 9 • 6.2 L wasted",
      fr: "Quai de déchargement 9 • 6,2 L gaspillés",
      ar: "رصيف التفريغ 9 • هدر 6.2 لتر",
    },
    acknowledged: false,
  },
  {
    id: "alt-04",
    truckCode: "Truck 36",
    truckId: "trk-36",
    type: "backhaul",
    severity: "info",
    timestamp: "20:14:12",
    corridor: "N1 Laâyoune-Dakhla",
    text: {
      en: "🔄 Truck 36 - Backhaul Match on N1 Expressway (Dakhla → Laâyoune → Agadir)",
      fr: "🔄 Camion 36 - Fret retour sur Voie Express N1 (Dakhla → Laâyoune → Agadir)",
      ar: "🔄 شاحنة 36 - تطابق شحنة عودة على الطريق السريع N1 (الداخلة ← العيون ← أكادير)",
    },
    detail: {
      en: "6 Reefer Pallets at Dakhla Port • Prevents 520 empty km",
      fr: "6 palettes frigo au Port de Dakhla • Évite 520 km à vide",
      ar: "6 طبليات مبردة بميناء الداخلة • يمنع 520 كم فارغة",
    },
    acknowledged: false,
  },
  {
    id: "alt-05",
    truckCode: "Truck 31",
    truckId: "trk-31",
    type: "idling",
    severity: "warning",
    timestamp: "20:12:30",
    corridor: "Agadir Ait Melloul",
    idleMinutes: 11,
    wastedFuelLiters: 3.1,
    wastedFuelMad: 49.29,
    text: {
      en: "⚠️ Truck 31 - Idling for 11 mins at Agadir Cold Terminal",
      fr: "⚠️ Camion 31 - Ralenti depuis 11 min au Terminal Frigo d'Agadir",
      ar: "⚠️ شاحنة 31 - توقف بمحرك مشتغل لمدة 11 دقيقة بمحطة التبريد أكادير",
    },
    detail: {
      en: "Main engine running during dock wait • 3.1 L wasted",
      fr: "Moteur principal actif en attente quai • 3,1 L gaspillés",
      ar: "المحرك الرئيسي مشتغل أثناء انتظار الرصيف • هدر 3.1 لتر",
    },
    acknowledged: false,
  },
  {
    id: "alt-06",
    truckCode: "Truck 40",
    truckId: "trk-40",
    type: "geofence",
    severity: "success",
    timestamp: "20:06:19",
    corridor: "N1 Dakhla-Guerguerat",
    text: {
      en: "✅ Truck 40 - Cleared Dakhla Logistics Checkpoint Towards El Guerguerat",
      fr: "✅ Camion 40 - Passage Hub Logistique Dakhla vers El Guerguerat à l'heure",
      ar: "✅ شاحنة 40 - عبور المحطة اللوجستية الداخلة في اتجاه معبر الكركرات",
    },
    detail: {
      en: "Eco-Cruise 83 km/h on N1 Southern Corridor • 91% LTL Load",
      fr: "Eco-Cruise 83 km/h sur le Corridor Sud N1 • Chargement LTL 91%",
      ar: "قيادة اقتصادية 83 كم/س على المحور الجنوبي N1 • حمولة 91%",
    },
    acknowledged: true,
  },
];

export const INITIAL_LTL_TRUCKS: LtlTruck[] = [
  {
    id: "ltl-trk-1",
    code: "TRK-101",
    name: {
      en: "Atlantic & Sahara Liner (A7 / N1)",
      fr: "Ligne Atlantique & Sahara (A7 / N1)",
      ar: "خط الأطلسي والصحراء السريع (A7 / N1)",
    },
    plate: "44812-A-1",
    model: "Volvo FH 500 • 13.6m Tautliner",
    route: {
      en: "Casablanca → Marrakech → Agadir → Laâyoune → Dakhla",
      fr: "Casablanca → Marrakech → Agadir → Laâyoune → Dakhla",
      ar: "الدار البيضاء ← مراكش ← أكادير ← العيون ← الداخلة",
    },
    corridor: "A7 / N1",
    driverName: {
      en: "Hassan Ait Brahim",
      fr: "Hassan Ait Brahim",
      ar: "حسن آيت إبراهيم",
    },
    departureTime: "21:30",
    maxVolumeM3: 90,
    baseVolumeM3: 52,
    maxWeightKg: 24000,
    baseWeightKg: 13800,
    maxPallets: 33,
    basePallets: 18,
    returnHub: {
      en: "Casablanca Zenata",
      fr: "Casablanca Zenata",
      ar: "الدار البيضاء زناتة",
    },
  },
  {
    id: "ltl-trk-2",
    code: "TRK-104",
    name: {
      en: "Tanger Med Atlantic Shuttle (A1)",
      fr: "Navette Atlantique Tanger Med (A1)",
      ar: "مكوك طنجة المتوسط الأطلسي (A1)",
    },
    plate: "55209-A-40",
    model: "Mercedes Actros 1848 • Mega Trailer",
    route: {
      en: "Tanger Med → Kenitra AFZ → Casablanca",
      fr: "Tanger Med → Kénitra ZFA → Casablanca",
      ar: "طنجة المتوسط ← القنيطرة ← الدار البيضاء",
    },
    corridor: "A1",
    driverName: {
      en: "Rachid El Fassi",
      fr: "Rachid El Fassi",
      ar: "رشيد الفاسي",
    },
    departureTime: "22:00",
    maxVolumeM3: 96,
    baseVolumeM3: 62,
    maxWeightKg: 24000,
    baseWeightKg: 15900,
    maxPallets: 34,
    basePallets: 21,
    returnHub: {
      en: "Tanger Med Port",
      fr: "Port Tanger Med",
      ar: "ميناء طنجة المتوسط",
    },
  },
  {
    id: "ltl-trk-3",
    code: "TRK-109",
    name: {
      en: "Maghreb East Corridor (A3/A2)",
      fr: "Corridor Est Maghreb (A3/A2)",
      ar: "ممر المغرب الشرقي (A3/A2)",
    },
    plate: "88410-B-15",
    model: "DAF XF 480 • Euro-Box",
    route: {
      en: "Casablanca → Rabat → Meknès → Fès → Oujda",
      fr: "Casablanca → Rabat → Meknès → Fès → Oujda",
      ar: "الدار البيضاء ← الرباط ← مكناس ← فاس ← وجدة",
    },
    corridor: "A2",
    driverName: {
      en: "Driss Tazi",
      fr: "Driss Tazi",
      ar: "إدريس التازي",
    },
    departureTime: "22:45",
    maxVolumeM3: 86,
    baseVolumeM3: 38,
    maxWeightKg: 22000,
    baseWeightKg: 9800,
    maxPallets: 30,
    basePallets: 13,
    returnHub: {
      en: "Casablanca Ain Sebaâ",
      fr: "Casablanca Aïn Sebaâ",
      ar: "الدار البيضاء عين السبع",
    },
  },
];

export const INITIAL_LTL_SHIPMENTS: LtlShipment[] = [
  {
    id: "shp-901",
    code: "SHP-901",
    origin: {
      en: "Casablanca",
      fr: "Casablanca",
      ar: "الدار البيضاء",
    },
    destination: {
      en: "Marrakech",
      fr: "Marrakech",
      ar: "مراكش",
    },
    corridor: "A7",
    pallets: 4,
    volumeM3: 11.5,
    weightKg: 3200,
    revenueMad: 4850,
    cargoType: {
      en: "FMCG & Retail Goods",
      fr: "Biens de consommation & Retail",
      ar: "سلع استهلاكية وتوزيع",
    },
    isBackhaulMatch: true,
    recommendedTruckId: "ltl-trk-1",
    recommendedTruckCode: "TRK-101",
    emptyKmSaved: 242,
    fuelLitersSaved: 72.3,
    fuelMadSaved: Math.round(72.3 * DIESEL_PRICE_MAD_PER_LITER),
    assignedTruckId: null,
  },
  {
    id: "shp-902",
    code: "SHP-902",
    origin: {
      en: "Agadir",
      fr: "Agadir",
      ar: "أكادير",
    },
    destination: {
      en: "Laâyoune & Dakhla",
      fr: "Laâyoune & Dakhla",
      ar: "العيون والداخلة",
    },
    corridor: "N1 South",
    pallets: 5,
    volumeM3: 14.2,
    weightKg: 3900,
    revenueMad: 8400,
    cargoType: {
      en: "Cold-Chain Agri & Marine Supplies",
      fr: "Approvisionnement Frigo & Maritime",
      ar: "مستلزمات التبريد والصيد البحري",
    },
    isBackhaulMatch: true,
    recommendedTruckId: "ltl-trk-1",
    recommendedTruckCode: "TRK-101",
    emptyKmSaved: 480,
    fuelLitersSaved: 138.0,
    fuelMadSaved: Math.round(138.0 * DIESEL_PRICE_MAD_PER_LITER),
    assignedTruckId: null,
  },
  {
    id: "shp-903",
    code: "SHP-903",
    origin: {
      en: "Tanger Med",
      fr: "Tanger Med",
      ar: "طنجة المتوسط",
    },
    destination: {
      en: "Kenitra",
      fr: "Kénitra",
      ar: "القنيطرة",
    },
    corridor: "A1",
    pallets: 6,
    volumeM3: 16.8,
    weightKg: 4400,
    revenueMad: 6350,
    cargoType: {
      en: "Automotive Wire Harnesses",
      fr: "Faisceaux Câbles Automobiles",
      ar: "حزم الكابلات لصناعة السيارات",
    },
    isBackhaulMatch: true,
    recommendedTruckId: "ltl-trk-2",
    recommendedTruckCode: "TRK-104",
    emptyKmSaved: 215,
    fuelLitersSaved: 63.4,
    fuelMadSaved: Math.round(63.4 * DIESEL_PRICE_MAD_PER_LITER),
    assignedTruckId: null,
  },
  {
    id: "shp-904",
    code: "SHP-904",
    origin: {
      en: "Rabat",
      fr: "Rabat",
      ar: "الرباط",
    },
    destination: {
      en: "Fès",
      fr: "Fès",
      ar: "فاس",
    },
    corridor: "A2",
    pallets: 6,
    volumeM3: 17.5,
    weightKg: 4750,
    revenueMad: 5900,
    cargoType: {
      en: "Pharmaceutical & Medical Supplies",
      fr: "Produits Pharmaceutiques & Médicaux",
      ar: "مستلزمات صيدلانية وطبية",
    },
    isBackhaulMatch: true,
    recommendedTruckId: "ltl-trk-3",
    recommendedTruckCode: "TRK-109",
    emptyKmSaved: 208,
    fuelLitersSaved: 61.5,
    fuelMadSaved: Math.round(61.5 * DIESEL_PRICE_MAD_PER_LITER),
    assignedTruckId: null,
  },
  {
    id: "shp-905",
    code: "SHP-905",
    origin: {
      en: "Kenitra",
      fr: "Kénitra",
      ar: "القنيطرة",
    },
    destination: {
      en: "Casablanca",
      fr: "Casablanca",
      ar: "الدار البيضاء",
    },
    corridor: "A1",
    pallets: 4,
    volumeM3: 11.0,
    weightKg: 2800,
    revenueMad: 3950,
    cargoType: {
      en: "Industrial Electronics",
      fr: "Électronique Industrielle",
      ar: "معدات إلكترونية صناعية",
    },
    isBackhaulMatch: false,
    recommendedTruckId: "ltl-trk-2",
    recommendedTruckCode: "TRK-104",
    emptyKmSaved: 138,
    fuelLitersSaved: 40.7,
    fuelMadSaved: Math.round(40.7 * DIESEL_PRICE_MAD_PER_LITER),
    assignedTruckId: null,
  },
  {
    id: "shp-906",
    code: "SHP-906",
    origin: {
      en: "Fès",
      fr: "Fès",
      ar: "فاس",
    },
    destination: {
      en: "Oujda",
      fr: "Oujda",
      ar: "وجدة",
    },
    corridor: "A2",
    pallets: 5,
    volumeM3: 14.5,
    weightKg: 3850,
    revenueMad: 5100,
    cargoType: {
      en: "Textile & Apparel Pallets",
      fr: "Palettes Textile & Confection",
      ar: "طبليات النسيج والألبسة",
    },
    isBackhaulMatch: true,
    recommendedTruckId: "ltl-trk-3",
    recommendedTruckCode: "TRK-109",
    emptyKmSaved: 315,
    fuelLitersSaved: 89.0,
    fuelMadSaved: Math.round(89.0 * DIESEL_PRICE_MAD_PER_LITER),
    assignedTruckId: null,
  },
];

export const INITIAL_DRIVER_ECO_SCORES: DriverEcoRecord[] = [
  {
    id: "drv-01",
    rank: 1,
    driverCode: "DRV-401",
    name: {
      en: "Hassan Ait Brahim",
      fr: "Hassan Ait Brahim",
      ar: "حسن آيت إبراهيم",
    },
    avatarInitials: "HA",
    truckCode: "Truck 04",
    truckModel: "Mercedes-Benz Actros MP5",
    corridor: "A7",
    routeDescription: {
      en: "Agadir ↔ Marrakech ↔ Casablanca",
      fr: "Agadir ↔ Marrakech ↔ Casablanca",
      ar: "أكادير ↔ مراكش ↔ الدار البيضاء",
    },
    fuelEfficiencyL100km: 24.8,
    targetEfficiencyL100km: 29.5,
    totalIdleMinutes30d: 85,
    idleWastedMad30d: Math.round((85 / 60) * 3.2 * DIESEL_PRICE_MAD_PER_LITER),
    safetyIncidents30d: 0,
    harshBrakingCount: 0,
    overspeedCount: 0,
    kmDriven30d: 11420,
    ecoScore: 96,
    badge: "green",
  },
  {
    id: "drv-02",
    rank: 2,
    driverCode: "DRV-405",
    name: {
      en: "Moulay Ahmed Maalainine",
      fr: "Moulay Ahmed Maalainine",
      ar: "مولاي أحمد ماء العينين",
    },
    avatarInitials: "MM",
    truckCode: "Truck 36",
    truckModel: "Scania R540 Longline",
    corridor: "N1 Sahara",
    routeDescription: {
      en: "Agadir ↔ Laâyoune ↔ Dakhla ↔ El Guerguerat",
      fr: "Agadir ↔ Laâyoune ↔ Dakhla ↔ El Guerguerat",
      ar: "أكادير ↔ العيون ↔ الداخلة ↔ الكركرات",
    },
    fuelEfficiencyL100km: 25.1,
    targetEfficiencyL100km: 29.5,
    totalIdleMinutes30d: 92,
    idleWastedMad30d: Math.round((92 / 60) * 3.2 * DIESEL_PRICE_MAD_PER_LITER),
    safetyIncidents30d: 0,
    harshBrakingCount: 0,
    overspeedCount: 0,
    kmDriven30d: 14280,
    ecoScore: 95,
    badge: "green",
  },
  {
    id: "drv-03",
    rank: 3,
    driverCode: "DRV-408",
    name: {
      en: "Rachid El Fassi",
      fr: "Rachid El Fassi",
      ar: "رشيد الفاسي",
    },
    avatarInitials: "RF",
    truckCode: "Truck 27",
    truckModel: "Iveco S-Way 490",
    corridor: "A1",
    routeDescription: {
      en: "Tanger Med ↔ Kenitra AFZ",
      fr: "Tanger Med ↔ Kénitra ZFA",
      ar: "طنجة المتوسط ↔ القنيطرة",
    },
    fuelEfficiencyL100km: 25.4,
    targetEfficiencyL100km: 29.5,
    totalIdleMinutes30d: 110,
    idleWastedMad30d: Math.round((110 / 60) * 3.2 * DIESEL_PRICE_MAD_PER_LITER),
    safetyIncidents30d: 0,
    harshBrakingCount: 0,
    overspeedCount: 0,
    kmDriven30d: 10890,
    ecoScore: 93,
    badge: "green",
  },
  {
    id: "drv-04",
    rank: 4,
    driverCode: "DRV-412",
    name: {
      en: "Driss Tazi",
      fr: "Driss Tazi",
      ar: "إدريس التازي",
    },
    avatarInitials: "DT",
    truckCode: "Truck 15",
    truckModel: "DAF XF 480 FT",
    corridor: "A2",
    routeDescription: {
      en: "Rabat ↔ Meknès ↔ Fès ↔ Oujda",
      fr: "Rabat ↔ Meknès ↔ Fès ↔ Oujda",
      ar: "الرباط ↔ مكناس ↔ فاس ↔ وجدة",
    },
    fuelEfficiencyL100km: 26.2,
    targetEfficiencyL100km: 29.5,
    totalIdleMinutes30d: 145,
    idleWastedMad30d: Math.round((145 / 60) * 3.3 * DIESEL_PRICE_MAD_PER_LITER),
    safetyIncidents30d: 1,
    harshBrakingCount: 1,
    overspeedCount: 0,
    kmDriven30d: 9750,
    ecoScore: 88,
    badge: "green",
  },
  {
    id: "drv-05",
    rank: 5,
    driverCode: "DRV-423",
    name: {
      en: "Nabil Ouali",
      fr: "Nabil Ouali",
      ar: "نبيل الوالي",
    },
    avatarInitials: "NO",
    truckCode: "Truck 31",
    truckModel: "Volvo FH 460 Globetrotter",
    corridor: "A7 / A5",
    routeDescription: {
      en: "Agadir ↔ Jorf Lasfar ↔ Casa",
      fr: "Agadir ↔ Jorf Lasfar ↔ Casa",
      ar: "أكادير ↔ الجرف الأصفر ↔ البيضاء",
    },
    fuelEfficiencyL100km: 29.8,
    targetEfficiencyL100km: 29.5,
    totalIdleMinutes30d: 320,
    idleWastedMad30d: Math.round((320 / 60) * 3.5 * DIESEL_PRICE_MAD_PER_LITER),
    safetyIncidents30d: 2,
    harshBrakingCount: 1,
    overspeedCount: 1,
    kmDriven30d: 9120,
    ecoScore: 74,
    badge: "yellow",
  },
  {
    id: "drv-06",
    rank: 6,
    driverCode: "DRV-429",
    name: {
      en: "Youssef El Amrani",
      fr: "Youssef El Amrani",
      ar: "يوسف العمراني",
    },
    avatarInitials: "YA",
    truckCode: "Truck 12",
    truckModel: "Volvo FH16 540",
    corridor: "A1 / A5",
    routeDescription: {
      en: "Tanger Med Port ↔ Casablanca",
      fr: "Port Tanger Med ↔ Casablanca",
      ar: "ميناء طنجة المتوسط ↔ الدار البيضاء",
    },
    fuelEfficiencyL100km: 31.4,
    targetEfficiencyL100km: 29.5,
    totalIdleMinutes30d: 485,
    idleWastedMad30d: Math.round((485 / 60) * 3.6 * DIESEL_PRICE_MAD_PER_LITER),
    safetyIncidents30d: 2,
    harshBrakingCount: 2,
    overspeedCount: 0,
    kmDriven30d: 10600,
    ecoScore: 67,
    badge: "yellow",
  },
  {
    id: "drv-07",
    rank: 7,
    driverCode: "DRV-434",
    name: {
      en: "Omar Berrada",
      fr: "Omar Berrada",
      ar: "عمر برادة",
    },
    avatarInitials: "OB",
    truckCode: "Truck 19",
    truckModel: "MAN TGX 18.510",
    corridor: "A3 / A5",
    routeDescription: {
      en: "Casablanca Zenata ↔ El Jadida",
      fr: "Casablanca Zenata ↔ El Jadida",
      ar: "الدار البيضاء زناتة ↔ الجديدة",
    },
    fuelEfficiencyL100km: 33.9,
    targetEfficiencyL100km: 29.5,
    totalIdleMinutes30d: 640,
    idleWastedMad30d: Math.round((640 / 60) * 3.8 * DIESEL_PRICE_MAD_PER_LITER),
    safetyIncidents30d: 4,
    harshBrakingCount: 2,
    overspeedCount: 2,
    kmDriven30d: 8340,
    ecoScore: 54,
    badge: "red",
  },
  {
    id: "drv-08",
    rank: 8,
    driverCode: "DRV-441",
    name: {
      en: "Karim Benjelloun",
      fr: "Karim Benjelloun",
      ar: "كريم بنجلون",
    },
    avatarInitials: "KB",
    truckCode: "Truck 08",
    truckModel: "Scania R500 V8",
    corridor: "A3",
    routeDescription: {
      en: "Casablanca Port ↔ Rabat",
      fr: "Port de Casablanca ↔ Rabat",
      ar: "ميناء الدار البيضاء ↔ الرباط",
    },
    fuelEfficiencyL100km: 35.2,
    targetEfficiencyL100km: 29.5,
    totalIdleMinutes30d: 590,
    idleWastedMad30d: Math.round((590 / 60) * 3.7 * DIESEL_PRICE_MAD_PER_LITER),
    safetyIncidents30d: 6,
    harshBrakingCount: 4,
    overspeedCount: 2,
    kmDriven30d: 8910,
    ecoScore: 46,
    badge: "red",
  },
];
