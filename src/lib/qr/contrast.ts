// Shared by the QR generator (server) and the QR editor (browser).

export function isHexColor(value: string | undefined) {
  return parseHex(value) !== null;
}

function parseHex(value: string | undefined): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(value?.trim() ?? "");
  if (!m) return null;
  const n = parseInt(m[1]!, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance([r, g, b]: [number, number, number]) {
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Below this ratio (or with light dots on a dark background) phones often fail to scan. */
export const MIN_QR_CONTRAST = 4;

/** Contrast ratio of dots vs background, or 0 when dots are lighter than the background (inverted QR). */
export function qrContrast(dotsColor?: string, bgColor?: string) {
  const dark = parseHex(dotsColor);
  const light = parseHex(bgColor);
  if (!dark || !light) return 0;
  const ld = luminance(dark);
  const ll = luminance(light);
  if (ld >= ll) return 0;
  return (ll + 0.05) / (ld + 0.05);
}

