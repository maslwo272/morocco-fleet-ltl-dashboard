"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Building2,
  Truck,
  ArrowRight,
  Globe,
  Sun,
  Moon,
  Sparkles,
  Eye,
} from "lucide-react";
import { ClientDemoInstance, Locale } from "@/lib/supabase/database";

interface PortalAccessGateProps {
  locale: Locale;
  onChangeLocale: (loc: Locale) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  adminOwnerName: string;
  masterAdminPassword: string;
  demoInstances: ClientDemoInstance[];
  initialSlugFromUrl: string | null;
  onUnlockAdmin: () => void;
  onUnlockClientDemo: (instance: ClientDemoInstance) => void;
}

export function PortalAccessGate({
  locale,
  onChangeLocale,
  theme,
  onToggleTheme,
  adminOwnerName,
  masterAdminPassword,
  demoInstances,
  initialSlugFromUrl,
  onUnlockAdmin,
  onUnlockClientDemo,
}: PortalAccessGateProps) {
  const [gateMode, setGateMode] = useState<"client" | "admin">(() =>
    demoInstances.length === 0 ? "admin" : "client"
  );
  const [selectedSlug, setSelectedSlug] = useState<string>(
    initialSlugFromUrl || demoInstances[0]?.slug || ""
  );
  const [pinInput, setPinInput] = useState<string>("");
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (demoInstances.length > 0 && !selectedSlug) {
      setSelectedSlug(demoInstances[0].slug);
    }
    if (initialSlugFromUrl) {
      const exists = demoInstances.find(
        (d) => d.slug.toLowerCase() === initialSlugFromUrl.toLowerCase()
      );
      if (exists) {
        setSelectedSlug(exists.slug);
        setGateMode("client");
      }
    }
  }, [initialSlugFromUrl, demoInstances, selectedSlug]);

  const activeDemo =
    demoInstances.find((d) => d.slug === selectedSlug) || demoInstances[0];

  const handleClientLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!activeDemo) return;

    if (!activeDemo.requirePin || pinInput.trim() === activeDemo.accessPin) {
      onUnlockClientDemo(activeDemo);
    } else {
      setErrorMsg(
        locale === "ar"
          ? "رمز الدخول الخاص بالعرض التجريبي غير صحيح."
          : locale === "fr"
          ? "Code PIN de démonstration client incorrect."
          : "Invalid Client Demo Access PIN. Please check with Ibrahim."
      );
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (adminPasswordInput.trim() === masterAdminPassword) {
      onUnlockAdmin();
    } else {
      setErrorMsg(
        locale === "ar"
          ? "كلمة مرور مدير النظام غير صحيحة."
          : locale === "fr"
          ? "Mot de passe Administrateur Master incorrect."
          : "Invalid Master Admin Password."
      );
    }
  };

  const isRtl = locale === "ar";

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div
        dir={isRtl ? "rtl" : "ltr"}
        className={`min-h-screen bg-[#F8FAFC] dark:bg-[#090A0F] text-slate-900 dark:text-zinc-100 flex flex-col justify-between p-4 sm:p-6 transition-colors ${
          isRtl ? "font-arabic" : "font-sans"
        }`}
      >
        {/* Top Bar: Brand + Language & Theme Switcher */}
        <header className="max-w-5xl w-full mx-auto flex flex-wrap items-center justify-between gap-3 py-2">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-mono font-bold text-sm shadow-sm"
              style={{
                backgroundColor: activeDemo?.themeConfig.primaryHex || "#2563EB",
              }}
            >
              {activeDemo?.themeConfig.brandMonogram || "MA"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-slate-900 dark:text-zinc-100">
                  AtlasLogix Maroc
                </span>
                <span className="rounded bg-slate-200/80 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-700 dark:text-zinc-300">
                  B2B Fleet & LTL Suite
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {locale === "ar"
                  ? `منصة العروض التجريبية المخصصة وإدارة الأسطول — بإشراف ${adminOwnerName}`
                  : locale === "fr"
                  ? `Portail Exécutif & Instances de Démonstration Client — Géré par ${adminOwnerName}`
                  : `Executive Fleet & LTL Demo Instance Portal — Managed by ${adminOwnerName}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleTheme}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-200 shadow-sm"
            >
              {theme === "light" ? (
                <>
                  <Moon className="h-3.5 w-3.5" />
                  <span>Dark</span>
                </>
              ) : (
                <>
                  <Sun className="h-3.5 w-3.5 text-amber-400" />
                  <span>Light</span>
                </>
              )}
            </button>

            <div className="inline-flex items-center rounded-lg bg-white dark:bg-zinc-900 p-1 border border-slate-200 dark:border-zinc-800 shadow-sm">
              <Globe className="h-3.5 w-3.5 text-slate-400 ms-2 me-1" />
              {(
                [
                  { code: "en", label: "EN" },
                  { code: "fr", label: "FR" },
                  { code: "ar", label: "عربي" },
                ] as const
              ).map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => onChangeLocale(l.code)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                    l.code === "ar" ? "font-arabic" : ""
                  } ${
                    locale === l.code
                      ? "bg-slate-900 dark:bg-zinc-800 text-white"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Main Center Portal Card */}
        <main className="max-w-4xl w-full mx-auto my-auto py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-xl overflow-hidden">
            {/* Left Column: Instance Showcase & Security Info (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900 dark:bg-zinc-950 text-white p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-e border-slate-800">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[11px] font-mono text-slate-200 mb-5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Protected Multi-Tenant SaaS</span>
                </div>

                <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-snug">
                  {gateMode === "client"
                    ? activeDemo?.clientName[locale] || "Client Demo Portal"
                    : locale === "ar"
                    ? `بوابة الإدارة الرئيسية (${adminOwnerName})`
                    : locale === "fr"
                    ? `Portail Master Admin (${adminOwnerName})`
                    : `${adminOwnerName}'s Master Admin Studio`}
                </h1>

                <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
                  {gateMode === "client"
                    ? activeDemo?.notesForClient
                    : locale === "ar"
                    ? "قم بتسجيل الدخول لإنشاء عروض تجريبية جديدة لشركات النقل، وتخصيص الألوان والخطوط، وإدارة ربط Supabase وVercel."
                    : locale === "fr"
                    ? "Connectez-vous pour créer des instances de démonstration personnalisées pour vos clients transporteurs, configurer les thèmes/polices et gérer Supabase/Vercel."
                    : "Sign in to provision custom white-label demo instances for transport prospects, customize fonts/colors/styles, and manage Supabase & Vercel."}
                </p>

                {gateMode === "client" && activeDemo && (
                  <div className="mt-6 space-y-2.5 rounded-xl bg-white/5 border border-white/10 p-4 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Instance Slug:</span>
                      <span className="text-white font-bold">?demo={activeDemo.slug}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Headquarters:</span>
                      <span className="text-slate-200">{activeDemo.city[locale]}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Active Fleet:</span>
                      <span className="text-emerald-400 font-bold">
                        {activeDemo.activeTrucksCount} / {activeDemo.totalFleetCount} Trucks
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Brand Theme:</span>
                      <span className="inline-flex items-center gap-1.5 text-slate-200">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: activeDemo.themeConfig.primaryHex }}
                        />
                        {activeDemo.themeConfig.colorPresetId.toUpperCase()} •{" "}
                        {activeDemo.themeConfig.surfaceStyle}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                <span>Tangier to Lagouira Coverage</span>
                <span className="font-mono">EN • FR • AR (Naskh)</span>
              </div>
            </div>

            {/* Right Column: Dual-Gate Login Form (7 cols) */}
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                {/* Mode Switcher Tabs: Client Demo Access vs Master Admin Studio */}
                <div className="grid grid-cols-2 rounded-xl bg-slate-100 dark:bg-zinc-950 p-1 border border-slate-200 dark:border-zinc-800 mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setGateMode("client");
                      setErrorMsg(null);
                    }}
                    className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
                      gateMode === "client"
                        ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-sm"
                        : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                    }`}
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    <span>
                      {locale === "ar"
                        ? "دخول العرض التجريبي للعميل"
                        : locale === "fr"
                        ? "Accès Démo Client"
                        : "Client Demo Access"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setGateMode("admin");
                      setErrorMsg(null);
                    }}
                    className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
                      gateMode === "admin"
                        ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-sm"
                        : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                    }`}
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    <span>
                      {locale === "ar"
                        ? `إدارة النظام (${adminOwnerName})`
                        : locale === "fr"
                        ? `Master Admin (${adminOwnerName})`
                        : `${adminOwnerName} Admin Portal`}
                    </span>
                  </button>
                </div>

                {errorMsg && (
                  <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/70 px-3.5 py-2.5 text-xs font-semibold text-red-700 dark:text-red-300">
                    {errorMsg}
                  </div>
                )}

                {gateMode === "client" ? (
                  demoInstances.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 dark:border-zinc-800 p-8 text-center space-y-3">
                      <Building2 className="h-9 w-9 text-blue-600 mx-auto" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                        0 Client Instances Configured Yet
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
                        The platform has been reset to 0 with no random demo data. Sign in to {adminOwnerName}&apos;s Master Admin Portal to create your first real client instance.
                      </p>
                      <button
                        type="button"
                        onClick={() => setGateMode("admin")}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-xs font-bold shadow-sm"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                        <span>Open {adminOwnerName} Admin Portal Login →</span>
                      </button>
                    </div>
                  ) : (
                  <form onSubmit={handleClientLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                        {locale === "ar"
                          ? "اختر نسخة العرض التجريبي للشركة"
                          : locale === "fr"
                          ? "Sélectionner l'Instance de Démonstration Entreprise"
                          : "Select Prospect Company Demo Instance"}
                      </label>
                      <div className="space-y-2 max-h-48 overflow-y-auto pe-1">
                        {demoInstances.map((inst) => {
                          const isSelected = inst.slug === selectedSlug;
                          return (
                            <div
                              key={inst.id}
                              onClick={() => {
                                setSelectedSlug(inst.slug);
                                setErrorMsg(null);
                              }}
                              className={`cursor-pointer rounded-xl p-3 border transition-all flex items-center justify-between ${
                                isSelected
                                  ? "bg-slate-50 dark:bg-zinc-800/80 border-slate-900 dark:border-zinc-500 ring-1 ring-slate-900/10"
                                  : "bg-white dark:bg-zinc-950/50 border-slate-200 dark:border-zinc-800 hover:border-slate-300"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {inst.themeConfig.logoDataUrl ? (
                                  <img
                                    src={inst.themeConfig.logoDataUrl}
                                    alt={inst.clientName[locale]}
                                    className="h-8 w-8 rounded-lg object-contain bg-white border border-slate-200 p-0.5 shrink-0"
                                  />
                                ) : (
                                  <span
                                    className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-mono font-bold text-xs shrink-0"
                                    style={{
                                      backgroundColor: inst.themeConfig.primaryHex,
                                    }}
                                  >
                                    {inst.themeConfig.brandMonogram}
                                  </span>
                                )}
                                <div>
                                  <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 block">
                                    {inst.clientName[locale]}
                                  </span>
                                  <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                                    ?demo={inst.slug} • {inst.city[locale]}
                                  </span>
                                </div>
                              </div>

                              <span
                                className={`rounded-md px-2 py-0.5 text-[10px] font-mono font-semibold border ${
                                  inst.requirePin
                                    ? "bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300"
                                    : "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                                }`}
                              >
                                {inst.requirePin
                                  ? `PIN: ${inst.accessPin}`
                                  : "1-Click Showcase"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {activeDemo?.requirePin ? (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                            {locale === "ar"
                              ? "رمز الدخول للعرض (Client Access PIN)"
                              : locale === "fr"
                              ? "Code PIN d'Accès Client"
                              : "Client Demo Access PIN"}
                          </label>
                          <button
                            type="button"
                            onClick={() => setPinInput(activeDemo.accessPin)}
                            className="text-[11px] font-mono text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Auto-fill Demo PIN ({activeDemo.accessPin})
                          </button>
                        </div>
                        <div className="relative">
                          <Lock className="h-4 w-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="password"
                            placeholder={`Enter PIN (e.g. ${activeDemo.accessPin})`}
                            value={pinInput}
                            onChange={(e) => setPinInput(e.target.value)}
                            className="w-full rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 ps-10 pe-4 py-2.5 text-sm font-mono text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-slate-900"
                            required
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                        <Eye className="h-4 w-4 shrink-0" />
                        <span>
                          This instance is configured as an open showcase demo — no PIN required.
                        </span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl text-white py-3 text-xs sm:text-sm font-bold shadow-md transition-opacity hover:opacity-95"
                      style={{
                        backgroundColor:
                          activeDemo?.themeConfig.primaryHex || "#2563EB",
                      }}
                    >
                      <span>
                        {locale === "ar"
                          ? `دخول عرض ${activeDemo?.clientName.ar}`
                          : locale === "fr"
                          ? `Lancer l'Instance ${activeDemo?.clientName.fr}`
                          : `Launch ${activeDemo?.clientName.en} Demo`}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>
                  )
                ) : (
                  <form onSubmit={handleAdminLogin} className="space-y-4">
                    <div className="rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 p-4 text-xs text-slate-600 dark:text-zinc-400 space-y-1.5">
                      <div className="font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Master Admin Capabilities ({adminOwnerName})</span>
                      </div>
                      <p>
                        Unlocking Master Admin grants access to the{" "}
                        <strong>White-Label Theme & Font Studio</strong>,{" "}
                        <strong>Prospect Demo Generator (?demo=&lt;slug&gt;)</strong>,{" "}
                        <strong>Formula & Threshold Controls</strong>, and{" "}
                        <strong>Supabase / Vercel Cloud Sync</strong>.
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                          {locale === "ar"
                            ? "كلمة مرور المدير الرئيسي (Master Admin Password)"
                            : locale === "fr"
                            ? "Mot de Passe Master Admin"
                            : "Master Admin Password"}
                        </label>
                        <button
                          type="button"
                          onClick={() => setAdminPasswordInput(masterAdminPassword)}
                          className="text-[11px] font-mono text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Auto-fill ({masterAdminPassword})
                        </button>
                      </div>
                      <div className="relative">
                        <KeyRound className="h-4 w-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          placeholder="Enter Master Admin Password"
                          value={adminPasswordInput}
                          onChange={(e) => setAdminPasswordInput(e.target.value)}
                          className="w-full rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 ps-10 pe-4 py-2.5 text-sm font-mono text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-slate-900"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white py-3 text-xs sm:text-sm font-bold shadow-md transition-colors"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      <span>
                        {locale === "ar"
                          ? "فتح استوديو الإدارة والإعدادات"
                          : locale === "fr"
                          ? "Déverrouiller le Studio Master Admin"
                          : "Unlock Master Admin & Demo Studio"}
                      </span>
                    </button>
                  </form>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Protected by Dual-Gate Access Control</span>
                <span>Supabase PostgreSQL + LocalStorage Sync</span>
              </div>
            </div>
          </div>
        </main>

        <footer className="max-w-5xl w-full mx-auto text-center text-xs text-slate-400 py-2">
          AtlasLogix Maroc • Prepared for {adminOwnerName}
        </footer>
      </div>
    </div>
  );
}
