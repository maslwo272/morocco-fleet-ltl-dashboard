"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Building2,
  Palette,
  Upload,
  Trash2,
  Save,
  RotateCcw,
  CheckCircle2,
  Image as ImageIcon,
  LayoutTemplate,
  Phone,
  Megaphone,
  FileText,
  Lock,
  Fuel,
  Sparkles,
} from "lucide-react";
import {
  ARABIC_FONT_OPTIONS,
  ArabicFontId,
  BRAND_COLOR_PRESETS,
  BrandColorPresetId,
  ClientDemoInstance,
  DEFAULT_BRAND_THEME,
  LATIN_FONT_OPTIONS,
  LatinFontId,
  Locale,
  MONO_FONT_OPTIONS,
  MonoFontId,
  SurfaceStyleId,
} from "@/lib/supabase/database";

interface ClientBrandingStudioPageProps {
  instance: ClientDemoInstance;
  locale: Locale;
  onSaveInstance: (updated: ClientDemoInstance) => Promise<void> | void;
}

export function ClientBrandingStudioPage({
  instance,
  locale,
  onSaveInstance,
}: ClientBrandingStudioPageProps) {
  const [draft, setDraft] = useState<ClientDemoInstance>(() =>
    JSON.parse(JSON.stringify(instance))
  );
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDraft(JSON.parse(JSON.stringify(instance)));
    setIsDirty(false);
  }, [instance]);

  const updateDraft = (
    updater: (prev: ClientDemoInstance) => ClientDemoInstance
  ) => {
    setDraft((prev) => updater(prev));
    setIsDirty(true);
  };

  const updateTheme = (
    patch: Partial<ClientDemoInstance["themeConfig"]>
  ) => {
    updateDraft((prev) => ({
      ...prev,
      themeConfig: {
        ...DEFAULT_BRAND_THEME,
        ...prev.themeConfig,
        ...patch,
      },
    }));
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateTheme({ logoDataUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveInstance(draft);
      setIsDirty(false);
      setSaveToast(
        `Saved Company Profile, Logo, Header & Footer for "${draft.clientName.en}" to Supabase!`
      );
      setTimeout(() => setSaveToast(null), 4500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setDraft(JSON.parse(JSON.stringify(instance)));
    setIsDirty(false);
    setSaveToast("Discarded unsaved edits and restored last saved configuration.");
    setTimeout(() => setSaveToast(null), 3500);
  };

  const tCfg = { ...DEFAULT_BRAND_THEME, ...draft.themeConfig };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Top Action Header with Explicit Save & Discard */}
      <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-blue-700 dark:text-blue-300">
            <LayoutTemplate className="h-3.5 w-3.5" />
            COMPANY IDENTITY, LOGO, HEADER & FOOTER STUDIO
          </span>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-zinc-100 mt-1">
            {draft.clientName[locale] || draft.clientName.en} — Branding & Layout Settings
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Customize company profile, upload client logo, configure header and footer text, and choose brand colors & fonts. Click Save when ready.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isDirty && (
            <button
              type="button"
              onClick={handleDiscard}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 px-3.5 py-2 text-xs font-bold transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Discard Unsaved Edits</span>
            </button>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all ${
              isDirty
                ? "bg-emerald-600 hover:bg-emerald-700 ring-2 ring-emerald-500/30"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            <Save className="h-4 w-4" />
            <span>
              {isSaving
                ? "Saving to Supabase..."
                : isDirty
                ? "Save All Changes to Supabase *"
                : "Save Company & Branding to Supabase"}
            </span>
          </button>
        </div>
      </div>

      {saveToast && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 px-4 py-3 flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-200 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{saveToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveToast(null)}
            className="text-[11px] underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Company Profile & Logo Upload */}
        <div className="xl:col-span-6 space-y-6">
          {/* 1. Company Profile & Operations Info */}
          <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span>1. Company Profile & Moroccan Tax Identity</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">
                  Company Name (FR / EN) *
                </label>
                <input
                  type="text"
                  required
                  value={draft.clientName.en}
                  onChange={(e) =>
                    updateDraft((p) => ({
                      ...p,
                      clientName: {
                        ...p.clientName,
                        en: e.target.value,
                        fr: e.target.value,
                      },
                    }))
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-semibold"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Company Name (Arabic)
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={draft.clientName.ar}
                  onChange={(e) =>
                    updateDraft((p) => ({
                      ...p,
                      clientName: { ...p.clientName, ar: e.target.value },
                    }))
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-arabic"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Primary Hub City
                </label>
                <input
                  type="text"
                  value={draft.city.en}
                  onChange={(e) =>
                    updateDraft((p) => ({
                      ...p,
                      city: {
                        en: e.target.value,
                        fr: e.target.value,
                        ar: p.city.ar || e.target.value,
                      },
                    }))
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">
                  Moroccan ICE Tax ID
                </label>
                <input
                  type="text"
                  value={draft.taxIce}
                  onChange={(e) =>
                    updateDraft((p) => ({ ...p, taxIce: e.target.value }))
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 flex items-center gap-1">
                  <Fuel className="h-3.5 w-3.5 text-blue-600" />
                  <span>Gasoil Tariff (MAD/L)</span>
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={draft.fuelPriceMad}
                  onChange={(e) =>
                    updateDraft((p) => ({
                      ...p,
                      fuelPriceMad: parseFloat(e.target.value) || 15.9,
                    }))
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 flex items-center gap-1">
                  <Lock className="h-3.5 w-3.5 text-amber-600" />
                  <span>Instance Access PIN</span>
                </label>
                <input
                  type="text"
                  value={draft.accessPin}
                  onChange={(e) =>
                    updateDraft((p) => ({ ...p, accessPin: e.target.value }))
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2 font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* 2. Client Logo Upload & Monogram */}
          <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-blue-600" />
              <span>2. Client Company Logo & Monogram Badge</span>
            </h3>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Live Logo Preview Box */}
              <div className="h-20 w-20 rounded-xl border-2 border-dashed border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 flex items-center justify-center overflow-hidden shrink-0">
                {tCfg.logoDataUrl ? (
                  <img
                    src={tCfg.logoDataUrl}
                    alt="Client Logo"
                    className="h-full w-full object-contain p-1.5"
                  />
                ) : (
                  <div
                    style={{ backgroundColor: tCfg.primaryHex }}
                    className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-mono font-bold text-base shadow-sm"
                  >
                    {tCfg.brandMonogram || "MA"}
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2.5 text-xs w-full">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    onChange={handleLogoFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 font-bold shadow-sm transition-colors"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload Logo Image (PNG / JPG / SVG)</span>
                  </button>

                  {tCfg.logoDataUrl && (
                    <button
                      type="button"
                      onClick={() => updateTheme({ logoDataUrl: "" })}
                      className="inline-flex items-center gap-1 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-300 px-3 py-2 font-semibold"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove Logo</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="block font-medium text-slate-500 mb-1">
                      Or Paste Direct Logo Image URL
                    </label>
                    <input
                      type="text"
                      placeholder="https://example.com/client-logo.png"
                      value={
                        tCfg.logoDataUrl?.startsWith("data:")
                          ? ""
                          : tCfg.logoDataUrl || ""
                      }
                      onChange={(e) =>
                        updateTheme({ logoDataUrl: e.target.value })
                      }
                      className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-500 mb-1">
                      2-Letter Monogram
                    </label>
                    <input
                      type="text"
                      maxLength={3}
                      value={tCfg.brandMonogram}
                      onChange={(e) =>
                        updateTheme({
                          brandMonogram: e.target.value.toUpperCase(),
                        })
                      }
                      className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 font-mono font-bold uppercase"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Custom Client Header Configuration */}
          <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-blue-600" />
              <span>3. Custom Client Header Configuration</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">
                  Custom Header Brand Title
                </label>
                <input
                  type="text"
                  placeholder={draft.clientName.en}
                  value={tCfg.headerTitle || ""}
                  onChange={(e) => updateTheme({ headerTitle: e.target.value })}
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Header Subtitle / Tagline
                </label>
                <input
                  type="text"
                  placeholder="Portail Exécutif Flotte & LTL Maroc"
                  value={tCfg.headerSubtitle || tCfg.brandTagline || ""}
                  onChange={(e) =>
                    updateTheme({
                      headerSubtitle: e.target.value,
                      brandTagline: e.target.value,
                    })
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Header Dispatch / Support Phone</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. +212 5 22 00 00 00 • 24/7 Dispatch"
                  value={tCfg.headerContactPhone || ""}
                  onChange={(e) =>
                    updateTheme({ headerContactPhone: e.target.value })
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Top Header Announcement Bar (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tanger Med — Casablanca — Agadir Live Fleet Control"
                  value={tCfg.headerAnnouncement || ""}
                  onChange={(e) =>
                    updateTheme({ headerAnnouncement: e.target.value })
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Custom Client Footer + Theme Palette & Fonts */}
        <div className="xl:col-span-6 space-y-6">
          {/* 4. Custom Client Footer Configuration */}
          <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span>4. Custom Client Footer Configuration</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">
                  Footer Legal Entity Name
                </label>
                <input
                  type="text"
                  placeholder={`${draft.clientName.en} S.A.R.L. / S.A.`}
                  value={tCfg.footerCompanyLegal || ""}
                  onChange={(e) =>
                    updateTheme({ footerCompanyLegal: e.target.value })
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  HQ / Terminal Physical Address
                </label>
                <input
                  type="text"
                  placeholder="Zone Logistique Zenata, Casablanca, Maroc"
                  value={tCfg.footerAddress || ""}
                  onChange={(e) =>
                    updateTheme({ footerAddress: e.target.value })
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">
                  Custom Footer Copyright / Note
                </label>
                <input
                  type="text"
                  placeholder={`© ${new Date().getFullYear()} ${draft.clientName.en}. All rights reserved.`}
                  value={tCfg.footerCopyright || ""}
                  onChange={(e) =>
                    updateTheme({ footerCopyright: e.target.value })
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-3 py-2"
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={tCfg.footerShowPoweredBy ?? true}
                    onChange={(e) =>
                      updateTheme({ footerShowPoweredBy: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">
                    Show &ldquo;Powered by AtlasLogix / Ibrahim&rdquo; badge in footer
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* 5. Color Palette, Fonts & Surface Style */}
          <div className="rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <Palette className="h-4 w-4 text-blue-600" />
              <span>5. Brand Color Palette & Typography</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              {(
                Object.keys(BRAND_COLOR_PRESETS) as Exclude<
                  BrandColorPresetId,
                  "custom"
                >[]
              ).map((presetKey) => {
                const p = BRAND_COLOR_PRESETS[presetKey];
                const active = tCfg.colorPresetId === presetKey;
                return (
                  <button
                    key={presetKey}
                    type="button"
                    onClick={() =>
                      updateTheme({
                        colorPresetId: presetKey,
                        primaryHex: p.primaryHex,
                        primaryHoverHex: p.primaryHoverHex,
                        primaryLightHex: p.primaryLightHex,
                      })
                    }
                    className={`flex items-center gap-2.5 rounded-lg border p-2.5 text-start transition-all ${
                      active
                        ? "border-slate-900 dark:border-white bg-slate-50 dark:bg-zinc-800 font-bold"
                        : "border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-950"
                    }`}
                  >
                    <span
                      style={{ backgroundColor: p.primaryHex }}
                      className="h-5 w-5 rounded-full shrink-0 border border-white/40 shadow-sm"
                    />
                    <span className="truncate text-[11px]">{p.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div>
                <label className="block font-semibold mb-1">
                  Custom Primary Hex
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={tCfg.primaryHex}
                    onChange={(e) =>
                      updateTheme({
                        colorPresetId: "custom",
                        primaryHex: e.target.value,
                        primaryHoverHex: e.target.value,
                        primaryLightHex: e.target.value,
                      })
                    }
                    className="h-8 w-10 rounded cursor-pointer border border-slate-200"
                  />
                  <input
                    type="text"
                    value={tCfg.primaryHex}
                    onChange={(e) =>
                      updateTheme({
                        colorPresetId: "custom",
                        primaryHex: e.target.value,
                      })
                    }
                    className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-1.5 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Latin Font Family
                </label>
                <select
                  value={tCfg.latinFont}
                  onChange={(e) =>
                    updateTheme({ latinFont: e.target.value as LatinFontId })
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-2"
                >
                  {LATIN_FONT_OPTIONS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Arabic Font Family
                </label>
                <select
                  value={tCfg.arabicFont}
                  onChange={(e) =>
                    updateTheme({ arabicFont: e.target.value as ArabicFontId })
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-2"
                >
                  {ARABIC_FONT_OPTIONS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">
                  Monospace Font
                </label>
                <select
                  value={tCfg.monoFont}
                  onChange={(e) =>
                    updateTheme({ monoFont: e.target.value as MonoFontId })
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-2"
                >
                  {MONO_FONT_OPTIONS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Card Surface Style
                </label>
                <select
                  value={tCfg.surfaceStyle}
                  onChange={(e) =>
                    updateTheme({
                      surfaceStyle: e.target.value as SurfaceStyleId,
                    })
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-2"
                >
                  <option value="modern">Modern Rounded (Default)</option>
                  <option value="sharp">Sharp Technical Grid</option>
                  <option value="glass">Executive Translucent Glass</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Default Color Mode
                </label>
                <select
                  value={draft.defaultColorMode}
                  onChange={(e) =>
                    updateDraft((p) => ({
                      ...p,
                      defaultColorMode: e.target.value as "light" | "dark",
                    }))
                  }
                  className="w-full rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-2.5 py-2"
                >
                  <option value="light">Light Executive Mode</option>
                  <option value="dark">Dark Command Center Mode</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bottom Explicit Save Button */}
          <div className="rounded-xl bg-slate-900 dark:bg-zinc-900 border border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-2.5 text-xs">
              <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>
                {isDirty
                  ? "You have unsaved branding/header/footer changes ready to commit."
                  : "All company branding, logo, header, and footer settings are synced."}
              </span>
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 text-xs font-bold shadow-sm transition-colors"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Company Branding, Header & Footer to Supabase</span>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
