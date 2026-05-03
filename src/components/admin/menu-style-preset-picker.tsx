"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

const PRESET_OPTIONS = [
  { id: "dark-gold", label: "Dark Gold" },
  { id: "minimal-light", label: "Minimal Light" },
  { id: "warm-bistro", label: "Warm Bistro" },
] as const;

export function MenuStylePresetPicker({
  initialActivePresetId,
}: {
  initialActivePresetId?: string | null;
}) {
  const [activePresetId, setActivePresetId] = React.useState<string | null>(initialActivePresetId ?? null);

  React.useEffect(() => {
    setActivePresetId(initialActivePresetId ?? null);
  }, [initialActivePresetId]);

  React.useEffect(() => {
    const onActivePresetChange = (event: Event) => {
      const custom = event as CustomEvent<{ presetId?: string | null }>;
      setActivePresetId(custom.detail?.presetId ?? null);
    };
    window.addEventListener("menu-style-active-preset-change", onActivePresetChange as EventListener);
    return () =>
      window.removeEventListener("menu-style-active-preset-change", onActivePresetChange as EventListener);
  }, []);

  function applyPreset(presetId: string) {
    setActivePresetId(presetId);
    window.dispatchEvent(new CustomEvent("menu-style-apply-preset", { detail: { presetId } }));
  }

  return (
    <div className="inline-flex flex-wrap items-center gap-2">
      {PRESET_OPTIONS.map((preset) => (
        <Button
          key={preset.id}
          type="button"
          size="sm"
          variant="outline"
          className={
            activePresetId === preset.id
              ? "border-primary/60 bg-primary/15 text-primary hover:bg-primary/20"
              : undefined
          }
          onClick={() => applyPreset(preset.id)}
        >
          {preset.label}
        </Button>
      ))}
    </div>
  );
}
