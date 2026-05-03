"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type ThemeValues = {
  primaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  borderColor: string;
};

const DEFAULT_THEME: ThemeValues = {
  primaryColor: "#ffd400",
  backgroundColor: "#0d0d0d",
  surfaceColor: "#1a1a1a",
  textColor: "#f5f5f5",
  borderColor: "#333333",
};

const PRESETS: Array<{ id: string; label: string; values: ThemeValues }> = [
  { id: "dark-gold", label: "Dark Gold", values: DEFAULT_THEME },
  {
    id: "minimal-light",
    label: "Minimal Light",
    values: {
      primaryColor: "#111827",
      backgroundColor: "#f8fafc",
      surfaceColor: "#ffffff",
      textColor: "#0f172a",
      borderColor: "#d1d5db",
    },
  },
  {
    id: "warm-bistro",
    label: "Warm Bistro",
    values: {
      primaryColor: "#f59e0b",
      backgroundColor: "#1c1917",
      surfaceColor: "#292524",
      textColor: "#fef3c7",
      borderColor: "#57534e",
    },
  },
];

export function ThemeControls({
  initialValues,
  initialFontFamily,
  initialDensity,
  templateId,
  labels,
  hints,
  formLabels,
  sectionLabels: sectionLabelsProp,
  showPresetControls = true,
  showInlinePreview = true,
}: {
  initialValues: ThemeValues;
  initialFontFamily: string;
  initialDensity: string;
  templateId: "classic" | "modern" | "grid";
  labels: {
    restoreDefault: string;
    primaryColor: string;
    backgroundColor: string;
    surfaceColor: string;
    textColor: string;
    borderColor: string;
    livePreview: string;
    categoryA: string;
    categoryB: string;
    dishName: string;
    popular: string;
    dishDescription: string;
    dietaryTag: string;
  };
  hints: {
    stylePresets: string;
    colorControls: string;
  };
  formLabels: {
    fontFamily: string;
    density: string;
    densityComfortable: string;
    densityCompact: string;
  };
  sectionLabels?: {
    baseStructure: string;
    presets: string;
  };
  showPresetControls?: boolean;
  showInlinePreview?: boolean;
}) {
  function detectPresetId(themeValues: ThemeValues): string | null {
    const match = PRESETS.find(
      (preset) =>
        preset.values.primaryColor === themeValues.primaryColor &&
        preset.values.backgroundColor === themeValues.backgroundColor &&
        preset.values.surfaceColor === themeValues.surfaceColor &&
        preset.values.textColor === themeValues.textColor &&
        preset.values.borderColor === themeValues.borderColor
    );
    return match?.id ?? null;
  }

  const [values, setValues] = useState<ThemeValues>(initialValues);
  const [fontFamily, setFontFamily] = useState(initialFontFamily);
  const [density, setDensity] = useState(initialDensity);
  const [activePresetId, setActivePresetId] = useState<string | null>(detectPresetId(initialValues));
  const isCompact = density === "compact";
  const fontOptions = [
    "Inter",
    "system-ui",
    "Arial",
    "Helvetica",
    "Verdana",
    "Trebuchet MS",
    "Segoe UI",
    "Roboto",
    "Open Sans",
    "Lato",
    "Montserrat",
    "Poppins",
    "Merriweather",
    "Playfair Display",
    "Georgia",
    "Times New Roman",
  ];
  const densityOptions = [
    { value: "comfortable", label: formLabels.densityComfortable },
    { value: "compact", label: formLabels.densityCompact },
  ];
  const cssFontFamily = `'${fontFamily.replace(/'/g, "\\'")}', sans-serif`;
  const sectionLabels = {
    baseStructure: "Base structure",
    presets: "Presets",
    ...(sectionLabelsProp ?? {}),
  };
  const hasUnsavedChanges = useMemo(
    () =>
      values.primaryColor !== initialValues.primaryColor ||
      values.backgroundColor !== initialValues.backgroundColor ||
      values.surfaceColor !== initialValues.surfaceColor ||
      values.textColor !== initialValues.textColor ||
      values.borderColor !== initialValues.borderColor ||
      fontFamily !== initialFontFamily ||
      density !== initialDensity,
    [density, fontFamily, initialDensity, initialFontFamily, initialValues, values]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("menuStylesDirty", hasUnsavedChanges ? "1" : "0");
    window.dispatchEvent(
      new CustomEvent("menu-styles-dirty-change", { detail: { dirty: hasUnsavedChanges } })
    );
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent("menu-style-active-preset-change", { detail: { presetId: activePresetId } })
    );
  }, [activePresetId]);

  // Keep local editor state aligned with server-updated values
  // (e.g. when applying presets via server action and redirecting back).
  useEffect(() => {
    setValues(initialValues);
    setFontFamily(initialFontFamily);
    setDensity(initialDensity);
    setActivePresetId(detectPresetId(initialValues));
  }, [initialValues, initialFontFamily, initialDensity]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnloadHandler);
    return () => window.removeEventListener("beforeunload", beforeUnloadHandler);
  }, [hasUnsavedChanges]);

  function setPreset(presetId: string) {
    const preset = PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    setValues(preset.values);
    setActivePresetId(preset.id);
  }

  useEffect(() => {
    const onApplyPreset = (event: Event) => {
      const custom = event as CustomEvent<{ presetId?: string }>;
      const presetId = custom.detail?.presetId;
      if (!presetId) return;
      setPreset(presetId);
    };
    window.addEventListener("menu-style-apply-preset", onApplyPreset as EventListener);
    return () => window.removeEventListener("menu-style-apply-preset", onApplyPreset as EventListener);
  }, []);

  return (
    <>
      {showPresetControls ? (
      <div className={cn("md:col-span-2 grid gap-4", showPresetControls ? "lg:grid-cols-2" : "lg:grid-cols-2")}>
        <div className="space-y-3 rounded-lg border border-border/70 bg-card/45 p-3">
          <p className="text-sm font-medium">{sectionLabels.baseStructure}</p>
          <p className="text-xs text-muted-foreground">{hints.colorControls}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{formLabels.fontFamily}</Label>
              <select
                name="fontFamily"
                value={fontFamily}
                aria-label={formLabels.fontFamily}
                onChange={(event) => setFontFamily(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {fontOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>{formLabels.density}</Label>
              <select
                name="density"
                value={density}
                aria-label={formLabels.density}
                onChange={(event) => setDensity(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {densityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
          <div className="space-y-3 rounded-lg border border-border/70 bg-card/45 p-3">
            <p className="text-sm font-medium">{sectionLabels.presets}</p>
            <p className="text-xs text-muted-foreground">{hints.stylePresets}</p>
            <div className="flex flex-wrap items-center gap-2">
              {PRESETS.map((preset) => (
                <Button
                  key={preset.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  className={
                    activePresetId === preset.id
                      ? "border-primary/60 bg-primary/15 text-primary hover:bg-primary/20"
                      : undefined
                  }
                  onClick={() => setPreset(preset.id)}
                >
                  {preset.label}
                </Button>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setValues(DEFAULT_THEME);
                  setActivePresetId("dark-gold");
                }}
              >
                {labels.restoreDefault}
              </Button>
            </div>
          </div>
      </div>
      ) : (
      <div className="md:col-span-2 grid gap-4 lg:grid-cols-[minmax(200px,20%)_minmax(0,1fr)]">
        <div className="space-y-3 rounded-lg border border-border/70 bg-card/45 p-3">
          <div className="space-y-2">
            <Label>{formLabels.fontFamily}</Label>
            <select
              name="fontFamily"
              value={fontFamily}
              aria-label={formLabels.fontFamily}
              onChange={(event) => setFontFamily(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {fontOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>{formLabels.density}</Label>
            <select
              name="density"
              value={density}
              aria-label={formLabels.density}
              onChange={(event) => setDensity(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {densityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-3 rounded-lg border border-border/70 bg-card/45 p-3">
          <p className="text-sm font-medium">{labels.primaryColor}</p>
          <p className="text-xs text-muted-foreground">{hints.colorControls}</p>
          <div className="flex flex-wrap items-end justify-center gap-3">
            <div className="w-[10.5rem] space-y-1.5 text-center">
              <Label className="block text-center text-xs">{labels.primaryColor}</Label>
              <Input
                name="primaryColor"
                type="color"
                className="mx-auto h-8 w-full p-1"
                value={values.primaryColor}
                onChange={(event) => {
                  setActivePresetId(null);
                  setValues((current) => ({ ...current, primaryColor: event.target.value }));
                }}
              />
            </div>
            <div className="w-[10.5rem] space-y-1.5 text-center">
              <Label className="block text-center text-xs">{labels.backgroundColor}</Label>
              <Input
                name="backgroundColor"
                type="color"
                className="mx-auto h-8 w-full p-1"
                value={values.backgroundColor}
                onChange={(event) => {
                  setActivePresetId(null);
                  setValues((current) => ({ ...current, backgroundColor: event.target.value }));
                }}
              />
            </div>
            <div className="w-[10.5rem] space-y-1.5 text-center">
              <Label className="block text-center text-xs">{labels.surfaceColor}</Label>
              <Input
                name="surfaceColor"
                type="color"
                className="mx-auto h-8 w-full p-1"
                value={values.surfaceColor}
                onChange={(event) => {
                  setActivePresetId(null);
                  setValues((current) => ({ ...current, surfaceColor: event.target.value }));
                }}
              />
            </div>
            <div className="w-[10.5rem] space-y-1.5 text-center">
              <Label className="block text-center text-xs">{labels.textColor}</Label>
              <Input
                name="textColor"
                type="color"
                className="mx-auto h-8 w-full p-1"
                value={values.textColor}
                onChange={(event) => {
                  setActivePresetId(null);
                  setValues((current) => ({ ...current, textColor: event.target.value }));
                }}
              />
            </div>
            <div className="w-[10.5rem] space-y-1.5 text-center">
              <Label className="block text-center text-xs">{labels.borderColor}</Label>
              <Input
                name="borderColor"
                type="color"
                className="mx-auto h-8 w-full p-1"
                value={values.borderColor}
                onChange={(event) => {
                  setActivePresetId(null);
                  setValues((current) => ({ ...current, borderColor: event.target.value }));
                }}
              />
            </div>
          </div>
        </div>
      </div>
      )}

      {showInlinePreview ? (
        <div className="md:col-span-2">
          <div className="preview-shell rounded-xl border p-4">
            <p className="text-xs uppercase tracking-[0.2em] opacity-70">{labels.livePreview}</p>
            {templateId === "modern" ? (
              <div className={`preview-card mt-3 rounded-lg border ${isCompact ? "p-2" : "p-3"}`}>
                <div className={`mb-2 flex ${isCompact ? "gap-1.5" : "gap-2"}`}>
                  <div
                    className={`rounded-full border ${isCompact ? "px-2 py-0.5 text-[10px]" : "px-2 py-0.5 text-[10.5px]"} font-semibold`}
                  >
                    {labels.categoryA}
                  </div>
                  <div
                    className={`rounded-full border ${isCompact ? "px-2 py-0.5 text-[10px]" : "px-2 py-0.5 text-[10.5px]"} font-semibold`}
                  >
                    {labels.categoryB}
                  </div>
                </div>
                <div className={`rounded-md border ${isCompact ? "p-1.5" : "p-2"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`${isCompact ? "text-[0.86rem]" : "text-[0.95rem]"} font-semibold leading-[1.2] tracking-[-0.003em]`}
                    >
                      {labels.dishName}
                    </p>
                    <span
                      className={`rounded-full border ${isCompact ? "px-1.5 py-0.5 text-[9.5px]" : "px-2 py-0.5 text-[10.5px]"} font-semibold opacity-80`}
                    >
                      {labels.popular}
                    </span>
                  </div>
                  <p className={`mt-1 ${isCompact ? "text-[11px]" : "text-[12.5px]"} leading-[1.48] opacity-80`}>
                    {labels.dishDescription}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span
                      className={`preview-pill rounded-full ${isCompact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]"} font-semibold`}
                    >
                      {labels.dietaryTag}
                    </span>
                    <span
                      className={`preview-pill rounded-full ${isCompact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]"} font-semibold`}
                    >
                      €14.50
                    </span>
                  </div>
                </div>
              </div>
            ) : templateId === "classic" ? (
              <div className={`preview-card mt-3 rounded-lg border ${isCompact ? "p-2" : "p-3"}`}>
                <p className="font-semibold">{labels.dishName}</p>
                <p className={`mt-1 ${isCompact ? "text-xs" : "text-sm"} opacity-80`}>{labels.dishDescription}</p>
                <div className={`mt-2 flex flex-wrap ${isCompact ? "gap-1.5" : "gap-2"}`}>
                  <span className={`preview-pill rounded-full ${isCompact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs"} font-semibold`}>
                    €14.50
                  </span>
                  <span className={`preview-pill rounded-full ${isCompact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs"} font-semibold`}>
                    {labels.popular}
                  </span>
                </div>
              </div>
            ) : (
              <div className={`mt-3 grid ${isCompact ? "gap-1.5" : "gap-2"} sm:grid-cols-2`}>
                <div className={`preview-card rounded-lg border ${isCompact ? "p-2" : "p-3"}`}>
                  <p className="font-semibold">Tagliatelle</p>
                  <p className={`preview-price ${isCompact ? "mt-1 text-xs" : "mt-2 text-sm"} font-bold`}>€14.50</p>
                </div>
                <div className={`preview-card rounded-lg border ${isCompact ? "p-2" : "p-3"}`}>
                  <p className="font-semibold">Pizza Trufa</p>
                  <p className={`preview-price ${isCompact ? "mt-1 text-xs" : "mt-2 text-sm"} font-bold`}>€15.90</p>
                </div>
              </div>
            )}
          </div>
          <style jsx>{`
            .preview-shell {
              font-family: ${cssFontFamily};
              background-color: ${values.backgroundColor};
              border-color: ${values.borderColor};
              color: ${values.textColor};
            }
            .preview-card {
              background-color: ${values.surfaceColor};
              border-color: ${values.borderColor};
            }
            .preview-price {
              color: ${values.primaryColor};
            }
            .preview-pill {
              color: ${values.primaryColor};
              background-color: ${values.primaryColor}1a;
            }
          `}</style>
        </div>
      ) : null}
    </>
  );
}
