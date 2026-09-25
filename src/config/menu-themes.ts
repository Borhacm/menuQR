/**
 * Public menu color presets. "paper" is the default for new menus: warm paper and dark ink read
 * best in daylight, on terraces and at low screen brightness (where most menus are scanned).
 */
export type MenuThemeColors = {
  primaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  borderColor: string;
};

export const MENU_THEME_PRESETS: Array<{ id: string; label: string; values: MenuThemeColors }> = [
  {
    id: "paper",
    label: "Papel",
    values: {
      primaryColor: "#a4431b",
      backgroundColor: "#f6f1e7",
      surfaceColor: "#fffdf8",
      textColor: "#1f1b16",
      borderColor: "#e3dacb",
    },
  },
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
    id: "dark-gold",
    label: "Dark Gold",
    values: {
      primaryColor: "#ffd400",
      backgroundColor: "#0d0d0d",
      surfaceColor: "#1a1a1a",
      textColor: "#f5f5f5",
      borderColor: "#333333",
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

export const DEFAULT_MENU_THEME: MenuThemeColors = MENU_THEME_PRESETS[0]!.values;

export function matchMenuThemePreset(values: MenuThemeColors): string | null {
  const norm = (v: string) => v.trim().toLowerCase();
  return (
    MENU_THEME_PRESETS.find((preset) =>
      (Object.keys(preset.values) as Array<keyof MenuThemeColors>).every(
        (key) => norm(preset.values[key]) === norm(values[key])
      )
    )?.id ?? null
  );
}
