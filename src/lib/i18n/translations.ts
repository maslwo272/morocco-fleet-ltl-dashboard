import { Locale } from "@/lib/supabase/database";

export interface TranslationDictionary {
  meta: {
    dir: "ltr" | "rtl";
    langName: string;
    appTitle: string;
    appSubtitle: string;
    supabaseStatus: string;
    fuelTariffLabel: string;
    companySelectorLabel: string;
    inspectDbButton: string;
  };
  nav: {
    overview: string;
    overviewDesc: string;
    liveMap: string;
    liveMapDesc: string;
    ltlOptimizer: string;
    ltlOptimizerDesc: string;
    driverEco: string;
    driverEcoDesc: string;
    fleetManager: string;
    fleetManagerDesc: string;
    corridorsTitle: string;
    dbConnectionTitle: string;
    dbTablesSynced: string;
  };
  kpi: {
    totalActiveTrucks: string;
    activeOfFleet: string;
    onMoroccanHighways: string;
    todaysWastedFuel: string;
    calculatedAtTariff: string;
    litersIdledToday: string;
    fleetCapacityUtilization: string;
    ltlVolumeWeightAvg: string;
    backhaulsActive: string;
    activeIdlingAlerts: string;
    criticalIdlingHubs: string;
    viewOnLiveMap: string;
  };
  overview: {
    chartTitle: string;
    chartSubtitle: string;
    revenueSeries: string;
    fuelSpendSeries: string;
    wastedIdleSeries: string;
    last7Days: string;
    last14Days: string;
    last30Days: string;
    total30dRevenue: string;
    total30dFuelSpend: string;
    fuelToRevenueRatio: string;
    estimatedBackhaulSavings: string;
    corridorPerformanceTitle: string;
    corridorPerformanceSub: string;
    liveAlertsPreviewTitle: string;
    openMapMonitor: string;
    openLtlOptimizer: string;
    litersUnit: string;
    netMargin: string;
  };
  liveMap: {
    title: string;
    subtitle: string;
    filterAll: string;
    filterMoving: string;
    filterIdling: string;
    filterAlert: string;
    simulateTelemetryBtn: string;
    liveStreamActive: string;
    liveStreamPaused: string;
    telemetryFeedTitle: string;
    telemetryFeedSubtitle: string;
    acknowledgeBtn: string;
    acknowledgedLabel: string;
    stopIdleCommandBtn: string;
    idleCommandSent: string;
    speedLabel: string;
    idleTimeLabel: string;
    fuelBurnLabel: string;
    wastedCostLabel: string;
    cargoLoadLabel: string;
    driverLabel: string;
    corridorLabel: string;
    selectTruckHint: string;
    totalLiveIdlingCost: string;
    moroccoCorridorsLegend: string;
  };
  ltl: {
    title: string;
    subtitle: string;
    autoMatchBackhaulsBtn: string;
    resetAssignmentsBtn: string;
    pendingShipmentsTitle: string;
    pendingShipmentsHint: string;
    allShipmentsAssigned: string;
    volumeUtilization: string;
    weightUtilization: string;
    palletsLoaded: string;
    backhaulMatchBadge: string;
    preventsEmptyMiles: string;
    assignToTruckLabel: string;
    unassignBtn: string;
    dragHereHint: string;
    overCapacityWarning: string;
    assignedShipmentsHeader: string;
    emptyKmSavedTotal: string;
    fuelSavedMadTotal: string;
    addedRevenueTotal: string;
    palletsUnit: string;
    departureLabel: string;
    returnHubLabel: string;
  };
  eco: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    filterAllTiers: string;
    filterGreen: string;
    filterYellow: string;
    filterRed: string;
    colRank: string;
    colDriver: string;
    colTruckCorridor: string;
    colFuelEfficiency: string;
    colTotalIdleTime: string;
    colSafetyIncidents: string;
    colEcoScore: string;
    colStatusBadge: string;
    colActions: string;
    badgeGreenLabel: string;
    badgeYellowLabel: string;
    badgeRedLabel: string;
    fleetTargetLabel: string;
    wastedLabel: string;
    harshBrakingShort: string;
    overspeedShort: string;
    zeroIncidents: string;
    sendEcoBonusBtn: string;
    scheduleCoachingBtn: string;
    coachingScheduledMsg: string;
    bonusSentMsg: string;
    fleetAvgEfficiency: string;
    monthlyIdleWasteTotal: string;
    topEcoDriver: string;
  };
  manager: {
    title: string;
    subtitle: string;
    tabFuel: string;
    tabTrucks: string;
    tabDrivers: string;
    // Fuel section
    activeTariffTitle: string;
    activeTariffSubtitle: string;
    manualTariffInputLabel: string;
    applyTariffBtn: string;
    syncWeightedAvgBtn: string;
    weightedAvgPurchasePrice: string;
    totalLoggedLiters: string;
    totalLoggedSpendMad: string;
    addFuelPurchaseTitle: string;
    editFuelPurchaseTitle: string;
    stationLabel: string;
    cityLabel: string;
    litersLabel: string;
    unitPriceMadLabel: string;
    paymentMethodLabel: string;
    dateLabel: string;
    savePurchaseBtn: string;
    updatePurchaseBtn: string;
    cancelEditBtn: string;
    purchasesLedgerTitle: string;
    colInvoice: string;
    colDate: string;
    colStationCity: string;
    colLiters: string;
    colUnitPrice: string;
    colTotalMad: string;
    // Trucks section
    addTruckTitle: string;
    editTruckTitle: string;
    truckCodeLabel: string;
    plateNumberLabel: string;
    modelLabel: string;
    statusLabel: string;
    hubLocationLabel: string;
    corridorLabel: string;
    cargoPctLabel: string;
    saveTruckBtn: string;
    updateTruckBtn: string;
    trucksRegistryTitle: string;
    // Drivers section
    addDriverTitle: string;
    editDriverTitle: string;
    driverNameLabel: string;
    driverCodeLabel: string;
    assignedTruckLabel: string;
    efficiencyLabel: string;
    idleMinsLabel: string;
    incidentsLabel: string;
    ecoScoreLabel: string;
    saveDriverBtn: string;
    updateDriverBtn: string;
    driversDirectoryTitle: string;
    editBtn: string;
    deleteBtn: string;
  };
  dbModal: {
    title: string;
    subtitle: string;
    schemaTab: string;
    livePayloadTab: string;
    closeBtn: string;
    rlsEnabledBadge: string;
  };
}

export const TRANSLATIONS: Record<Locale, TranslationDictionary> = {
  en: {
    meta: {
      dir: "ltr",
      langName: "English",
      appTitle: "AtlasLogix Maroc",
      appSubtitle: "Fleet Telemetry & LTL Backhaul Intelligence",
      supabaseStatus: "Supabase PostgreSQL • Realtime Sync",
      fuelTariffLabel: "Gasoil Tariff:",
      companySelectorLabel: "Company Profile",
      inspectDbButton: "Supabase Schema & State",
    },
    nav: {
      overview: "Overview",
      overviewDesc: "KPIs & 30-Day Financials",
      liveMap: "Live Map",
      liveMapDesc: "GPS & Idling Monitor",
      ltlOptimizer: "LTL Optimizer",
      ltlOptimizerDesc: "Cargo & Backhaul Match",
      driverEco: "Driver Eco-Scores",
      driverEcoDesc: "Efficiency & Safety Rank",
      fleetManager: "Fleet & Fuel Manager",
      fleetManagerDesc: "Trucks, Drivers & Fuel Prices",
      corridorsTitle: "Active Moroccan Corridors",
      dbConnectionTitle: "Supabase pg_realtime",
      dbTablesSynced: "7 tables • RLS enforced",
    },
    kpi: {
      totalActiveTrucks: "Total Active Trucks",
      activeOfFleet: "Active across national corridors",
      onMoroccanHighways: "A1, A2, A3, A5, A7 & N1 Express",
      todaysWastedFuel: "Today's Wasted Fuel",
      calculatedAtTariff: "Active Tariff",
      litersIdledToday: "idled at ports & customs docks",
      fleetCapacityUtilization: "Fleet Capacity Utilization",
      ltlVolumeWeightAvg: "Weighted LTL Volume & Tonnage",
      backhaulsActive: "Dynamic backhaul matching active",
      activeIdlingAlerts: "Active Idling Alerts",
      criticalIdlingHubs: "Tanger Med, Casa Zenata, Agadir",
      viewOnLiveMap: "Inspect on Live Map →",
    },
    overview: {
      chartTitle: "Fuel Spend vs. Revenue (Last 30 Days)",
      chartSubtitle:
        "Daily gross freight revenue vs. fleet diesel expenditure in MAD (dynamically scaled to active fuel tariff)",
      revenueSeries: "Freight Revenue (MAD)",
      fuelSpendSeries: "Fuel Spend (MAD)",
      wastedIdleSeries: "Wasted Idle Fuel (MAD)",
      last7Days: "7 Days",
      last14Days: "14 Days",
      last30Days: "30 Days",
      total30dRevenue: "30-Day Gross Revenue",
      total30dFuelSpend: "30-Day Fuel Spend",
      fuelToRevenueRatio: "Fuel-to-Revenue Ratio",
      estimatedBackhaulSavings: "Backhaul Empty-Mile Savings",
      corridorPerformanceTitle: "Moroccan Autoroute & Expressway Utilization",
      corridorPerformanceSub: "Live freight density & fuel burn by highway axis",
      liveAlertsPreviewTitle: "Priority Telemetry & Idling Stream",
      openMapMonitor: "Open Full Map",
      openLtlOptimizer: "Optimize LTL Pallets",
      litersUnit: "L",
      netMargin: "Operating Spread",
    },
    liveMap: {
      title: "Live Map & Idling Monitor",
      subtitle:
        "Real-time GPS telemetry across Moroccan ports, customs hubs, and highways from Tanger Med to Lagouira",
      filterAll: "All Trucks",
      filterMoving: "Moving",
      filterIdling: "Idling",
      filterAlert: "Safety Alerts",
      simulateTelemetryBtn: "+ Simulate GPS Event",
      liveStreamActive: "Live GPS Stream Active",
      liveStreamPaused: "Stream Paused",
      telemetryFeedTitle: "Real-Time GPS Telemetry Feed",
      telemetryFeedSubtitle: "Instant idling & harsh driving events from onboard CAN-bus",
      acknowledgeBtn: "Acknowledge",
      acknowledgedLabel: "Acknowledged",
      stopIdleCommandBtn: "Send Auto-Shutoff Alert",
      idleCommandSent: "Cabin Shutoff Sent ✓",
      speedLabel: "Current Speed",
      idleTimeLabel: "Idle Duration",
      fuelBurnLabel: "Fuel Burn Rate",
      wastedCostLabel: "Wasted Fuel Cost",
      cargoLoadLabel: "Cargo Load",
      driverLabel: "Assigned Driver",
      corridorLabel: "Highway Axis",
      selectTruckHint:
        "Click any truck marker on the Morocco map or alert card to inspect telemetry",
      totalLiveIdlingCost: "Active Idling Burn",
      moroccoCorridorsLegend: "Autoroutes du Maroc (ADM) & N1 Network",
    },
    ltl: {
      title: "LTL Capacity & Backhaul Optimizer",
      subtitle:
        "Drag and drop pending pallet shipments onto active trucks or click to assign and eliminate empty return miles",
      autoMatchBackhaulsBtn: "Auto-Assign Best Backhauls",
      resetAssignmentsBtn: "Reset Demo",
      pendingShipmentsTitle: "Pending Shipments Queue",
      pendingShipmentsHint: "Drag a shipment card onto a truck or use quick-assign buttons",
      allShipmentsAssigned: "All pending LTL shipments have been consolidated onto trucks!",
      volumeUtilization: "Volume Utilization",
      weightUtilization: "Weight Utilization",
      palletsLoaded: "Pallet Slots",
      backhaulMatchBadge: "Backhaul Match",
      preventsEmptyMiles: "Prevents Empty Miles",
      assignToTruckLabel: "Assign to:",
      unassignBtn: "Remove",
      dragHereHint: "Drop shipment here to load pallets",
      overCapacityWarning: "Exceeds truck capacity limit!",
      assignedShipmentsHeader: "Consolidated LTL Manifest",
      emptyKmSavedTotal: "Empty Kilometers Prevented",
      fuelSavedMadTotal: "Fuel Saved (MAD)",
      addedRevenueTotal: "Consolidated LTL Revenue",
      palletsUnit: "Pallets",
      departureLabel: "Departure",
      returnHubLabel: "Return Base",
    },
    eco: {
      title: "Driver Eco-Scoring & Safety Leaderboard",
      subtitle:
        "30-day ranking by fuel consumption (L/100km), port/hub idling time, and CAN-bus safety telemetry",
      searchPlaceholder: "Search driver name, truck, or corridor (e.g., A7, Tanger)...",
      filterAllTiers: "All Badges",
      filterGreen: "Optimal (Green)",
      filterYellow: "Monitor (Yellow)",
      filterRed: "Action Needed (Red)",
      colRank: "Rank",
      colDriver: "Driver",
      colTruckCorridor: "Truck & Corridor",
      colFuelEfficiency: "Fuel Efficiency (L/100km)",
      colTotalIdleTime: "Total Idle Time (30d)",
      colSafetyIncidents: "Safety Incidents",
      colEcoScore: "Eco-Score",
      colStatusBadge: "Rating Badge",
      colActions: "Action",
      badgeGreenLabel: "Eco Champion",
      badgeYellowLabel: "Needs Coaching",
      badgeRedLabel: "High Fuel Risk",
      fleetTargetLabel: "Target: 29.5 L/100km",
      wastedLabel: "wasted",
      harshBrakingShort: "Braking",
      overspeedShort: "Speeding",
      zeroIncidents: "0 Incidents • Clean Record",
      sendEcoBonusBtn: "Award Eco Bonus",
      scheduleCoachingBtn: "Assign Coaching",
      coachingScheduledMsg: "Coaching Assigned ✓",
      bonusSentMsg: "Eco Bonus Approved ✓",
      fleetAvgEfficiency: "Fleet Avg Consumption",
      monthlyIdleWasteTotal: "30d Fleet Idle Cost",
      topEcoDriver: "Top Eco-Driver (Month)",
    },
    manager: {
      title: "Fleet, Driver & Fuel Price Administration",
      subtitle:
        "Manually adjust active diesel tariff (MAD/L), log & edit fuel purchases, and add, edit, or remove trucks and drivers",
      tabFuel: "Fuel Prices & Purchases",
      tabTrucks: "Trucks Registry",
      tabDrivers: "Drivers Directory",
      activeTariffTitle: "Company Benchmark Diesel Tariff (MAD / Liter)",
      activeTariffSubtitle:
        "Updating this price immediately recalculates all dashboard KPIs, 30-day fuel spend charts, idling costs, and backhaul savings",
      manualTariffInputLabel: "Manual Diesel Price (MAD/L)",
      applyTariffBtn: "Apply Tariff Across Dashboard",
      syncWeightedAvgBtn: "Use Weighted Purchase Avg",
      weightedAvgPurchasePrice: "Weighted Avg Purchase Price",
      totalLoggedLiters: "Total Logged Volume",
      totalLoggedSpendMad: "Total Fuel Purchases",
      addFuelPurchaseTitle: "Record New Fuel Purchase",
      editFuelPurchaseTitle: "Edit Fuel Purchase Entry",
      stationLabel: "Fuel Station / Depot",
      cityLabel: "City / Hub",
      litersLabel: "Volume (Liters)",
      unitPriceMadLabel: "Unit Price (MAD/L)",
      paymentMethodLabel: "Payment Method",
      dateLabel: "Purchase Date",
      savePurchaseBtn: "Add Fuel Purchase",
      updatePurchaseBtn: "Save Purchase Changes",
      cancelEditBtn: "Cancel",
      purchasesLedgerTitle: "Fuel Purchases & Price Ledger",
      colInvoice: "Invoice #",
      colDate: "Date",
      colStationCity: "Station & Hub",
      colLiters: "Liters",
      colUnitPrice: "Price (MAD/L)",
      colTotalMad: "Total Cost (MAD)",
      addTruckTitle: "Add New Truck to Fleet",
      editTruckTitle: "Edit Truck Details",
      truckCodeLabel: "Truck ID / Code",
      plateNumberLabel: "Moroccan Plate #",
      modelLabel: "Tractor Model",
      statusLabel: "Operational Status",
      hubLocationLabel: "Current Moroccan Hub",
      corridorLabel: "Assigned Corridor",
      cargoPctLabel: "Cargo Load (%)",
      saveTruckBtn: "Add Truck",
      updateTruckBtn: "Update Truck",
      trucksRegistryTitle: "Active Fleet Trucks Registry",
      addDriverTitle: "Register New Driver",
      editDriverTitle: "Edit Driver Profile",
      driverNameLabel: "Driver Full Name",
      driverCodeLabel: "Driver Code",
      assignedTruckLabel: "Assigned Truck",
      efficiencyLabel: "Fuel Consumption (L/100km)",
      idleMinsLabel: "30d Idle Time (mins)",
      incidentsLabel: "Safety Incidents (30d)",
      ecoScoreLabel: "Eco-Score (0–100)",
      saveDriverBtn: "Add Driver",
      updateDriverBtn: "Update Driver",
      driversDirectoryTitle: "Fleet Drivers Directory",
      editBtn: "Edit",
      deleteBtn: "Remove",
    },
    dbModal: {
      title: "Supabase PostgreSQL Architecture & Live State",
      subtitle: "Mocked @supabase/supabase-js client state & production SQL schema with RLS",
      schemaTab: "PostgreSQL Schema (RLS)",
      livePayloadTab: "Live JSON Table State",
      closeBtn: "Close Inspector",
      rlsEnabledBadge: "Row-Level Security Enabled",
    },
  },
  fr: {
    meta: {
      dir: "ltr",
      langName: "Français",
      appTitle: "AtlasLogix Maroc",
      appSubtitle: "Télémétrie de Flotte & Optimisation Groupage LTL",
      supabaseStatus: "Supabase PostgreSQL • Synchro Temps Réel",
      fuelTariffLabel: "Tarif Gasoil :",
      companySelectorLabel: "Société de Transport",
      inspectDbButton: "Schéma & État Supabase",
    },
    nav: {
      overview: "Vue d'ensemble",
      overviewDesc: "KPIs & Finances 30 Jours",
      liveMap: "Carte Temps Réel",
      liveMapDesc: "GPS & Moniteur Ralenti",
      ltlOptimizer: "Optimiseur LTL",
      ltlOptimizerDesc: "Capacité & Fret Retour",
      driverEco: "Éco-Score Chauffeurs",
      driverEcoDesc: "Consommation & Sécurité",
      fleetManager: "Gestion Flotte & Gasoil",
      fleetManagerDesc: "Camions, Chauffeurs & Prix",
      corridorsTitle: "Corridors Autoroutiers Actifs",
      dbConnectionTitle: "Supabase pg_realtime",
      dbTablesSynced: "7 tables • RLS activé",
    },
    kpi: {
      totalActiveTrucks: "Camions Actifs Totaux",
      activeOfFleet: "En circulation sur le réseau national",
      onMoroccanHighways: "Autoroutes A1, A2, A3, A5, A7 & N1",
      todaysWastedFuel: "Carburant Gaspillé (Aujourd'hui)",
      calculatedAtTariff: "Tarif Actif",
      litersIdledToday: "en ralenti aux ports & douanes",
      fleetCapacityUtilization: "Taux de Remplissage Flotte",
      ltlVolumeWeightAvg: "Moyenne Volume & Tonnage LTL",
      backhaulsActive: "Appariement fret retour actif",
      activeIdlingAlerts: "Alertes de Ralenti Actives",
      criticalIdlingHubs: "Tanger Med, Casa Zenata, Agadir",
      viewOnLiveMap: "Voir sur la Carte Live →",
    },
    overview: {
      chartTitle: "Dépenses Carburant vs Chiffre d'Affaires (30 derniers jours)",
      chartSubtitle:
        "Revenu fret quotidien vs dépenses gasoil en MAD (indexé sur le tarif gasoil actif)",
      revenueSeries: "Chiffre d'Affaires Fret (MAD)",
      fuelSpendSeries: "Dépenses Gasoil (MAD)",
      wastedIdleSeries: "Coût Ralenti Gaspillé (MAD)",
      last7Days: "7 Jours",
      last14Days: "14 Jours",
      last30Days: "30 Jours",
      total30dRevenue: "Revenu Brut (30j)",
      total30dFuelSpend: "Dépenses Gasoil (30j)",
      fuelToRevenueRatio: "Ratio Carburant / CA",
      estimatedBackhaulSavings: "Économies Retour à Vide",
      corridorPerformanceTitle: "Performance par Axe Autoroutier Marocain",
      corridorPerformanceSub: "Densité de chargement et consommation par corridor ADM & N1",
      liveAlertsPreviewTitle: "Flux Prioritaire Télémétrie & Ralenti",
      openMapMonitor: "Ouvrir la Carte",
      openLtlOptimizer: "Optimiser Palettes LTL",
      litersUnit: "L",
      netMargin: "Marge Opérationnelle",
    },
    liveMap: {
      title: "Carte Live & Moniteur de Ralenti",
      subtitle:
        "Télémétrie GPS en direct sur les ports marocains, zones logistiques et axes de Tanger Med à Lagouira",
      filterAll: "Tous",
      filterMoving: "En route",
      filterIdling: "Au ralenti",
      filterAlert: "Alertes Sécurité",
      simulateTelemetryBtn: "+ Simuler Alerte GPS",
      liveStreamActive: "Flux GPS Direct Actif",
      liveStreamPaused: "Flux en Pause",
      telemetryFeedTitle: "Flux Télémétrique GPS en Temps Réel",
      telemetryFeedSubtitle: "Détection instantanée des ralentis prolongés et freinages brusques",
      acknowledgeBtn: "Acquitter",
      acknowledgedLabel: "Acquittée",
      stopIdleCommandBtn: "Envoyer Ordre Coupure Moteur",
      idleCommandSent: "Alerte Cabine Envoyée ✓",
      speedLabel: "Vitesse Actuelle",
      idleTimeLabel: "Durée Ralenti",
      fuelBurnLabel: "Débit Carburant",
      wastedCostLabel: "Coût Gasoil Perdu",
      cargoLoadLabel: "Taux de Charge",
      driverLabel: "Chauffeur Assigné",
      corridorLabel: "Axe Autoroutier",
      selectTruckHint:
        "Cliquez sur un camion sur la carte du Maroc ou sur une alerte pour inspecter la télémétrie",
      totalLiveIdlingCost: "Perte Ralenti Actuel",
      moroccoCorridorsLegend: "Réseau Autoroutes du Maroc (ADM) & N1",
    },
    ltl: {
      title: "Optimiseur de Capacité LTL & Fret de Retour",
      subtitle:
        "Glissez-déposez les expéditions en attente sur les camions pour maximiser le remplissage et éviter les retours à vide",
      autoMatchBackhaulsBtn: "Auto-Affecter les Retours Optimaux",
      resetAssignmentsBtn: "Réinitialiser",
      pendingShipmentsTitle: "Expéditions en Attente (Palettes)",
      pendingShipmentsHint: "Glissez une carte vers un camion ou cliquez sur un bouton d'affectation",
      allShipmentsAssigned: "Toutes les expéditions LTL en attente ont été consolidées !",
      volumeUtilization: "Utilisation Volume",
      weightUtilization: "Utilisation Poids",
      palletsLoaded: "Emplacements Palettes",
      backhaulMatchBadge: "Match Fret Retour",
      preventsEmptyMiles: "Évite les Km à Vide",
      assignToTruckLabel: "Affecter à :",
      unassignBtn: "Retirer",
      dragHereHint: "Déposez l'expédition ici pour charger les palettes",
      overCapacityWarning: "Dépasse la capacité maximale du camion !",
      assignedShipmentsHeader: "Manifeste de Groupage LTL",
      emptyKmSavedTotal: "Kilomètres à Vide Évités",
      fuelSavedMadTotal: "Gasoil Économisé (MAD)",
      addedRevenueTotal: "Revenu LTL Consolidé",
      palletsUnit: "Palettes",
      departureLabel: "Départ",
      returnHubLabel: "Base Retour",
    },
    eco: {
      title: "Éco-Score Chauffeurs & Classement Sécurité",
      subtitle:
        "Classement sur 30 jours selon la consommation (L/100km), le temps de ralenti et les incidents de conduite",
      searchPlaceholder: "Rechercher un chauffeur, camion ou corridor (ex: A7, Tanger)...",
      filterAllTiers: "Tous les Badges",
      filterGreen: "Optimal (Vert)",
      filterYellow: "À surveiller (Jaune)",
      filterRed: "Action Requise (Rouge)",
      colRank: "Rang",
      colDriver: "Chauffeur",
      colTruckCorridor: "Camion & Corridor",
      colFuelEfficiency: "Consommation (L/100km)",
      colTotalIdleTime: "Temps Ralenti (30j)",
      colSafetyIncidents: "Incidents Sécurité",
      colEcoScore: "Éco-Score",
      colStatusBadge: "Badge Statut",
      colActions: "Action",
      badgeGreenLabel: "Éco-Champion",
      badgeYellowLabel: "Coaching Conseillé",
      badgeRedLabel: "Risque Surconso",
      fleetTargetLabel: "Cible : 29,5 L/100km",
      wastedLabel: "gaspillés",
      harshBrakingShort: "Freinages",
      overspeedShort: "Excès vit.",
      zeroIncidents: "0 Incident • Conduite Sûre",
      sendEcoBonusBtn: "Prime Éco",
      scheduleCoachingBtn: "Planifier Coaching",
      coachingScheduledMsg: "Coaching Planifié ✓",
      bonusSentMsg: "Prime Validée ✓",
      fleetAvgEfficiency: "Conso Moyenne Flotte",
      monthlyIdleWasteTotal: "Coût Ralenti 30j",
      topEcoDriver: "Meilleur Éco-Chauffeur",
    },
    manager: {
      title: "Administration Flotte, Chauffeurs & Prix du Gasoil",
      subtitle:
        "Saisissez manuellement le prix du gasoil (MAD/L), gérez les achats de carburant et ajoutez, modifiez ou supprimez des camions et chauffeurs",
      tabFuel: "Prix Gasoil & Achats",
      tabTrucks: "Parc Camions",
      tabDrivers: "Répertoire Chauffeurs",
      activeTariffTitle: "Tarif Gasoil de Référence de l'Entreprise (MAD / Litre)",
      activeTariffSubtitle:
        "Toute modification met immédiatement à jour les KPIs, le graphique 30 jours, le coût de ralenti et les économies LTL",
      manualTariffInputLabel: "Prix Manuel Gasoil (MAD/L)",
      applyTariffBtn: "Appliquer le Tarif au Tableau de Bord",
      syncWeightedAvgBtn: "Utiliser le Prix Moyen Pondéré",
      weightedAvgPurchasePrice: "Prix d'Achat Moyen Pondéré",
      totalLoggedLiters: "Volume Total Enregistré",
      totalLoggedSpendMad: "Montant Total Achats Gasoil",
      addFuelPurchaseTitle: "Enregistrer un Achat de Carburant",
      editFuelPurchaseTitle: "Modifier l'Achat de Carburant",
      stationLabel: "Station-Service / Dépôt",
      cityLabel: "Ville / Hub",
      litersLabel: "Volume (Litres)",
      unitPriceMadLabel: "Prix Unitaire (MAD/L)",
      paymentMethodLabel: "Mode de Paiement",
      dateLabel: "Date d'Achat",
      savePurchaseBtn: "Ajouter l'Achat",
      updatePurchaseBtn: "Enregistrer les Modifications",
      cancelEditBtn: "Annuler",
      purchasesLedgerTitle: "Journal des Achats de Carburant",
      colInvoice: "N° Facture",
      colDate: "Date",
      colStationCity: "Station & Ville",
      colLiters: "Litres",
      colUnitPrice: "Prix (MAD/L)",
      colTotalMad: "Total (MAD)",
      addTruckTitle: "Ajouter un Camion à la Flotte",
      editTruckTitle: "Modifier le Camion",
      truckCodeLabel: "Code Camion",
      plateNumberLabel: "Immatriculation Maroc",
      modelLabel: "Modèle Tracteur",
      statusLabel: "Statut Opérationnel",
      hubLocationLabel: "Hub Actuel (Maroc)",
      corridorLabel: "Corridor Assigné",
      cargoPctLabel: "Taux de Charge (%)",
      saveTruckBtn: "Ajouter Camion",
      updateTruckBtn: "Mettre à jour",
      trucksRegistryTitle: "Registre des Camions de la Flotte",
      addDriverTitle: "Ajouter un Nouveau Chauffeur",
      editDriverTitle: "Modifier le Profil Chauffeur",
      driverNameLabel: "Nom Complet du Chauffeur",
      driverCodeLabel: "Matricule Chauffeur",
      assignedTruckLabel: "Camion Assigné",
      efficiencyLabel: "Consommation (L/100km)",
      idleMinsLabel: "Temps Ralenti 30j (min)",
      incidentsLabel: "Incidents Sécurité (30j)",
      ecoScoreLabel: "Éco-Score (0–100)",
      saveDriverBtn: "Ajouter Chauffeur",
      updateDriverBtn: "Mettre à jour",
      driversDirectoryTitle: "Répertoire des Chauffeurs",
      editBtn: "Modifier",
      deleteBtn: "Supprimer",
    },
    dbModal: {
      title: "Architecture Supabase PostgreSQL & État Temps Réel",
      subtitle: "Simulation client @supabase/supabase-js et schéma SQL avec politiques RLS",
      schemaTab: "Schéma PostgreSQL (RLS)",
      livePayloadTab: "État JSON des Tables",
      closeBtn: "Fermer l'inspecteur",
      rlsEnabledBadge: "Sécurité RLS Activée",
    },
  },
  ar: {
    meta: {
      dir: "rtl",
      langName: "العربية",
      appTitle: "أطلس لوجيكس المغرب",
      appSubtitle: "إدارة الأسطول وتحسين الحمولة الجزئية (LTL)",
      supabaseStatus: "قاعدة بيانات Supabase PostgreSQL • متزامن لحظياً",
      fuelTariffLabel: "سعر الكازوال:",
      companySelectorLabel: "شركة النقل",
      inspectDbButton: "هيكل وبيانات Supabase",
    },
    nav: {
      overview: "نظرة عامة",
      overviewDesc: "المؤشرات والأداء المالي",
      liveMap: "الخريطة المباشرة",
      liveMapDesc: "التتبع وتنبيهات الخمول",
      ltlOptimizer: "مُحسِّن الحمولة LTL",
      ltlOptimizerDesc: "تعبئة الشاحنات وشحنات العودة",
      driverEco: "تقييم السائقين البيئي",
      driverEcoDesc: "كفاءة الوقود والسلامة",
      fleetManager: "إدارة الأسطول والوقود",
      fleetManagerDesc: "الشاحنات، السائقون وأسعار الكازوال",
      corridorsTitle: "المحاور الطرقية النشطة بالمغرب",
      dbConnectionTitle: "مزامنة Supabase الفورية",
      dbTablesSynced: "7 جداول • حماية RLS مفعلة",
    },
    kpi: {
      totalActiveTrucks: "إجمالي الشاحنات النشطة",
      activeOfFleet: "تعمل حالياً عبر المحاور الوطنية",
      onMoroccanHighways: "الطرق السيارة A1 و A2 و A3 و A5 و A7 و N1",
      todaysWastedFuel: "الوقود المهدر اليوم",
      calculatedAtTariff: "السعر المعتمد",
      litersIdledToday: "بسبب التوقف بمحرك مشتغل بالموانئ",
      fleetCapacityUtilization: "نسبة استغلال سعة الأسطول",
      ltlVolumeWeightAvg: "متوسط استغلال الحجم والوزن",
      backhaulsActive: "مطابقة شحنات العودة مفعلة",
      activeIdlingAlerts: "تنبيهات الخمول النشطة",
      criticalIdlingHubs: "طنجة المتوسط، الدار البيضاء زناتة، أكادير",
      viewOnLiveMap: "عرض على الخريطة المباشرة ←",
    },
    overview: {
      chartTitle: "إنفاق الوقود مقابل الإيرادات (آخر 30 يوماً)",
      chartSubtitle:
        "مقارنة الإيرادات اليومية للشحن بتكلفة الكازوال بالدرهم المغربي (حسب تسعيرة الوقود المعتمدة)",
      revenueSeries: "إيرادات الشحن (درهم)",
      fuelSpendSeries: "تكلفة الوقود (درهم)",
      wastedIdleSeries: "هدر التوقف بالمحرك (درهم)",
      last7Days: "7 أيام",
      last14Days: "14 يوماً",
      last30Days: "30 يوماً",
      total30dRevenue: "إجمالي إيرادات 30 يوماً",
      total30dFuelSpend: "إنفاق الوقود (30 يوماً)",
      fuelToRevenueRatio: "نسبة الوقود إلى الإيرادات",
      estimatedBackhaulSavings: "وفورات منع الكيلومترات الفارغة",
      corridorPerformanceTitle: "أداء المحاور الطرقية بالمغرب",
      corridorPerformanceSub: "كثافة الشحن واستهلاك الوقود حسب كل محور طرقي",
      liveAlertsPreviewTitle: "البث الفوري لتنبيهات التتبع والخمول",
      openMapMonitor: "فتح الخريطة الكاملة",
      openLtlOptimizer: "تحسين طبليات الشحن",
      litersUnit: "لتر",
      netMargin: "هامش التشغيل",
    },
    liveMap: {
      title: "الخريطة المباشرة ومراقبة خمول المحركات",
      subtitle:
        "بيانات التتبع اللحظي GPS عبر الموانئ المغربية والطرق الوطنية من طنجة المتوسط إلى الكويرة",
      filterAll: "كل الشاحنات",
      filterMoving: "قيد السير",
      filterIdling: "في حالة خمول",
      filterAlert: "تنبيهات السلامة",
      simulateTelemetryBtn: "+ محاكاة تنبيه GPS",
      liveStreamActive: "بث GPS المباشر نشط",
      liveStreamPaused: "البث متوقف مؤقتاً",
      telemetryFeedTitle: "سجل تنبيهات GPS المباشر",
      telemetryFeedSubtitle: "رصد فوري لتوقف الشاحنات بمحرك مشتغل والفرملة المفاجئة",
      acknowledgeBtn: "تأكيد الاستلام",
      acknowledgedLabel: "تم التأكيد",
      stopIdleCommandBtn: "إرسال تنبيه إيقاف المحرك",
      idleCommandSent: "تم إرسال التنبيه للسائق ✓",
      speedLabel: "السرعة الحالية",
      idleTimeLabel: "مدة الخمول",
      fuelBurnLabel: "معدل استهلاك الوقود",
      wastedCostLabel: "تكلفة الوقود المهدر",
      cargoLoadLabel: "نسبة الحمولة",
      driverLabel: "السائق المسؤول",
      corridorLabel: "المحور الطرقي",
      selectTruckHint:
        "انقر على أي شاحنة في خريطة المغرب أو بطاقة تنبيه لعرض تفاصيل القياس عن بُعد",
      totalLiveIdlingCost: "تكلفة الخمول الحالي",
      moroccoCorridorsLegend: "شبكة الطرق السيارة بالمغرب (ADM) و N1",
    },
    ltl: {
      title: "مُحسِّن سعة الحمولة الجزئية (LTL) وشحنات العودة",
      subtitle:
        "اسحب وأفلت الشحنات المعلقة نحو الشاحنات أو انقر لتعيينها لمنع رحلات العودة الفارغة",
      autoMatchBackhaulsBtn: "التعيين الذكي لشحنات العودة",
      resetAssignmentsBtn: "إعادة الضبط",
      pendingShipmentsTitle: "قائمة الشحنات المعلقة (سحب وإفلات)",
      pendingShipmentsHint: "اسحب بطاقة الشحنة إلى الشاحنة المناسبة أو اضغط على زر التعيين السريع",
      allShipmentsAssigned: "تم تجميع وتعيين جميع الشحنات المعلقة بنجاح!",
      volumeUtilization: "استغلال الحجم",
      weightUtilization: "استغلال الوزن",
      palletsLoaded: "الطبليات المحملة",
      backhaulMatchBadge: "تطابق شحنة عودة",
      preventsEmptyMiles: "يمنع السير الفارغ",
      assignToTruckLabel: "تعيين إلى:",
      unassignBtn: "إلغاء",
      dragHereHint: "أفلت الشحنة هنا لتحميل الطبليات",
      overCapacityWarning: "يتجاوز السعة القصوى للشاحنة!",
      assignedShipmentsHeader: "قائمة الشحنات المدمجة بالشاحنة",
      emptyKmSavedTotal: "الكيلومترات الفارغة الموفرة",
      fuelSavedMadTotal: "الوقود الموفر (درهم)",
      addedRevenueTotal: "إيرادات الشحن المضافة",
      palletsUnit: "طبليات",
      departureLabel: "الانطلاق",
      returnHubLabel: "قاعدة العودة",
    },
    eco: {
      title: "تصنيف السائقين البيئي وكفاءة القيادة",
      subtitle:
        "ترتيب السائقين خلال 30 يوماً حسب كفاءة استهلاك الوقود (لتر/100كم)، وقت الخمول، وحوادث السلامة",
      searchPlaceholder: "ابحث باسم السائق، رقم الشاحنة أو المحور الطرقي...",
      filterAllTiers: "جميع الفئات",
      filterGreen: "ممتاز (أخضر)",
      filterYellow: "متوسط (أصفر)",
      filterRed: "يتطلب تدخلاً (أحمر)",
      colRank: "الترتيب",
      colDriver: "السائق",
      colTruckCorridor: "الشاحنة والمحور",
      colFuelEfficiency: "كفاءة الوقود (لتر/100كم)",
      colTotalIdleTime: "إجمالي وقت الخمول (30ي)",
      colSafetyIncidents: "حوادث السلامة",
      colEcoScore: "النقطة البيئية",
      colStatusBadge: "الشارة",
      colActions: "إجراء",
      badgeGreenLabel: "قيادة مثالية",
      badgeYellowLabel: "يحتاج لتوجيه",
      badgeRedLabel: "استهلاك مرتفع",
      fleetTargetLabel: "الهدف: 29.5 لتر/100كم",
      wastedLabel: "مهدرة",
      harshBrakingShort: "فرملة حادة",
      overspeedShort: "تجاوز سرعة",
      zeroIncidents: "0 حوادث • سجل نظيف",
      sendEcoBonusBtn: "منح مكافأة بيئية",
      scheduleCoachingBtn: "برمجة تدريب",
      coachingScheduledMsg: "تمت برمجة التدريب ✓",
      bonusSentMsg: "تم اعتماد المكافأة ✓",
      fleetAvgEfficiency: "متوسط استهلاك الأسطول",
      monthlyIdleWasteTotal: "تكلفة الخمول (30 يوماً)",
      topEcoDriver: "أفضل سائق اقتصادي",
    },
    manager: {
      title: "إدارة الأسطول والسائقين وأسعار الوقود",
      subtitle:
        "إدخال وتعديل سعر الكازوال يدوياً (درهم/لتر)، تسجيل فواتير شراء الوقود، وإضافة أو تعديل أو حذف الشاحنات والسائقين",
      tabFuel: "أسعار ومشتريات الوقود",
      tabTrucks: "سجل الشاحنات",
      tabDrivers: "دليل السائقين",
      activeTariffTitle: "التسعيرة المرجعية للكازوال المعتمدة بالشركة (درهم / لتر)",
      activeTariffSubtitle:
        "تعديل هذا السعر يقوم فوراً بإعادة احتساب جميع المؤشرات المالية وتكلفة الخمول ووفورات الشحن عبر لوحة القيادة",
      manualTariffInputLabel: "السعر اليدوي للكازوال (درهم/لتر)",
      applyTariffBtn: "اعتماد السعر في لوحة القيادة",
      syncWeightedAvgBtn: "اعتماد متوسط سعر الفواتير",
      weightedAvgPurchasePrice: "متوسط سعر الشراء المرجح",
      totalLoggedLiters: "إجمالي اللترات المسجلة",
      totalLoggedSpendMad: "إجمالي نفقات شراء الوقود",
      addFuelPurchaseTitle: "إضافة عملية شراء وقود جديدة",
      editFuelPurchaseTitle: "تعديل عملية شراء الوقود",
      stationLabel: "محطة الوقود / الخزان",
      cityLabel: "المدينة / المحور",
      litersLabel: "الكمية (لتر)",
      unitPriceMadLabel: "سعر اللتر (درهم/لتر)",
      paymentMethodLabel: "طريقة الأداء",
      dateLabel: "تاريخ الشراء",
      savePurchaseBtn: "إضافة فاتورة الوقود",
      updatePurchaseBtn: "حفظ التعديلات",
      cancelEditBtn: "إلغاء",
      purchasesLedgerTitle: "سجل فواتير ومشتريات الكازوال",
      colInvoice: "رقم الفاتورة",
      colDate: "التاريخ",
      colStationCity: "المحطة والمدينة",
      colLiters: "اللترات",
      colUnitPrice: "سعر اللتر (درهم)",
      colTotalMad: "الإجمالي (درهم)",
      addTruckTitle: "إضافة شاحنة جديدة للأسطول",
      editTruckTitle: "تعديل بيانات الشاحنة",
      truckCodeLabel: "رمز الشاحنة",
      plateNumberLabel: "رقـم اللوحة (المغرب)",
      modelLabel: "طراز الشاحنة",
      statusLabel: "الحالة التشغيلية",
      hubLocationLabel: "المركز اللوجستي الحالي",
      corridorLabel: "المحور الطرقي",
      cargoPctLabel: "نسبة الحمولة (%)",
      saveTruckBtn: "إضافة الشاحنة",
      updateTruckBtn: "حفظ التعديلات",
      trucksRegistryTitle: "قائمة شاحنات الأسطول النشطة",
      addDriverTitle: "تسجيل سائق جديد",
      editDriverTitle: "تعديل بيانات السائق",
      driverNameLabel: "الاسم الكامل للسائق",
      driverCodeLabel: "رمز السائق",
      assignedTruckLabel: "الشاحنة المخصصة",
      efficiencyLabel: "معدل الاستهلاك (لتر/100كم)",
      idleMinsLabel: "وقت الخمول 30ي (دقيقة)",
      incidentsLabel: "حوادث السلامة (30ي)",
      ecoScoreLabel: "النقطة البيئية (0–100)",
      saveDriverBtn: "إضافة السائق",
      updateDriverBtn: "تحديث السائق",
      driversDirectoryTitle: "سجل سائقي الشركة",
      editBtn: "تعديل",
      deleteBtn: "حذف",
    },
    dbModal: {
      title: "بنية قاعدة بيانات Supabase PostgreSQL والبيانات الحية",
      subtitle: "محاكاة اتصال @supabase/supabase-js وهيكل الجداول مع سياسات الأمان RLS",
      schemaTab: "مخطط PostgreSQL (RLS)",
      livePayloadTab: "حالة الجداول الحية (JSON)",
      closeBtn: "إغلاق النافذة",
      rlsEnabledBadge: "حماية الصفوف RLS مفعلة",
    },
  },
};
