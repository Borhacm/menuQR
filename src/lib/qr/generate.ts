import QRCode from "qrcode";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";

export type QrStyle = {
  dotsColor?: string;
  bgColor?: string;
  dotStyle?: string;
  cornerStyle?: string;
  logoUrl?: string;
  logoColor?: string;
};

const QR_SIZE = 800;
const PADDING = 24;
const FINDER_CELLS = 7;
const FINDER_MARGIN_CELLS = 1;

function toOptions(style?: QrStyle) {
  return {
    errorCorrectionLevel: "H" as const,
    margin: 1,
    width: QR_SIZE,
    color: {
      dark: style?.dotsColor || "#111111",
      light: style?.bgColor || "#ffffff",
    },
  };
}

function isInFinderZone(row: number, col: number, size: number) {
  const zone = FINDER_CELLS + FINDER_MARGIN_CELLS;
  const topLeft = row < zone && col < zone;
  const topRight = row < zone && col >= size - zone;
  const bottomLeft = row >= size - zone && col < zone;
  return topLeft || topRight || bottomLeft;
}

function drawFinder(
  x: number,
  y: number,
  cell: number,
  style: "square" | "rounded" | "dot" | "heart",
  dark: string,
  light: string
) {
  const outer = FINDER_CELLS * cell;
  const middle = 5 * cell;
  const inner = 3 * cell;
  const middleOffset = x + cell;
  const innerOffset = x + 2 * cell;
  const yMiddle = y + cell;
  const yInner = y + 2 * cell;

  if (style === "dot") {
    const cx = x + outer / 2;
    const cy = y + outer / 2;
    return [
      `<circle cx="${cx}" cy="${cy}" r="${outer / 2}" fill="${dark}" />`,
      `<circle cx="${cx}" cy="${cy}" r="${middle / 2}" fill="${light}" />`,
      `<circle cx="${cx}" cy="${cy}" r="${inner / 2}" fill="${dark}" />`,
    ].join("");
  }

  if (style === "heart") {
    const heartClassic = (cx: number, cy: number, size: number, fill: string) =>
      `<path d="M ${cx} ${cy + size * 0.42}
        C ${cx - size * 0.9} ${cy - size * 0.18}, ${cx - size * 0.95} ${cy - size * 0.95}, ${cx} ${cy - size * 0.52}
        C ${cx + size * 0.95} ${cy - size * 0.95}, ${cx + size * 0.9} ${cy - size * 0.18}, ${cx} ${cy + size * 0.42} Z"
        fill="${fill}" />`;
    const cx = x + outer / 2;
    const cy = y + outer / 2;
    const innerHeartSize = inner * 0.65;
    const innerHeartOffsetY = innerHeartSize * -0.06;
    return [
      `<circle cx="${cx}" cy="${cy}" r="${outer / 2}" fill="${dark}" />`,
      `<circle cx="${cx}" cy="${cy}" r="${middle / 2}" fill="${light}" />`,
      heartClassic(cx, cy + innerHeartOffsetY, innerHeartSize, dark),
    ].join("");
  }

  const rxOuter = style === "rounded" ? cell * 1.8 : 0;
  const rxMiddle = style === "rounded" ? cell * 1.2 : 0;
  const rxInner = style === "rounded" ? cell * 0.8 : 0;
  return [
    `<rect x="${x}" y="${y}" width="${outer}" height="${outer}" rx="${rxOuter}" fill="${dark}" />`,
    `<rect x="${middleOffset}" y="${yMiddle}" width="${middle}" height="${middle}" rx="${rxMiddle}" fill="${light}" />`,
    `<rect x="${innerOffset}" y="${yInner}" width="${inner}" height="${inner}" rx="${rxInner}" fill="${dark}" />`,
  ].join("");
}

async function renderStyledQrPng(url: string, style?: QrStyle) {
  const dark = style?.dotsColor || "#111111";
  const light = style?.bgColor || "#ffffff";
  const dotStyle = (style?.dotStyle ?? "square") as "square" | "rounded" | "dots" | "heart";
  const cornerStyle = (style?.cornerStyle ?? "square") as "square" | "rounded" | "dot" | "heart";

  const qr = QRCode.create(url, { errorCorrectionLevel: "H" });
  const size = qr.modules.size;
  const data = qr.modules.data;
  const drawSize = QR_SIZE - PADDING * 2;
  const cell = drawSize / size;

  const modules: string[] = [];
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (!data[row * size + col]) continue;
      if (isInFinderZone(row, col, size)) continue;
      const x = PADDING + col * cell;
      const y = PADDING + row * cell;
      if (dotStyle === "dots") {
        modules.push(
          `<circle cx="${x + cell / 2}" cy="${y + cell / 2}" r="${cell * 0.34}" fill="${dark}" />`
        );
      } else if (dotStyle === "heart") {
        const cx = x + cell / 2;
        const cy = y + cell / 2;
        const s = cell * 0.55;
        modules.push(
          `<path d="M ${cx} ${cy + s * 0.42}
            C ${cx - s * 0.9} ${cy - s * 0.18}, ${cx - s * 0.95} ${cy - s * 0.95}, ${cx} ${cy - s * 0.52}
            C ${cx + s * 0.95} ${cy - s * 0.95}, ${cx + s * 0.9} ${cy - s * 0.18}, ${cx} ${cy + s * 0.42} Z"
            fill="${dark}" />`
        );
      } else if (dotStyle === "rounded") {
        modules.push(
          `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="${cell * 0.32}" fill="${dark}" />`
        );
      } else {
        modules.push(`<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${dark}" />`);
      }
    }
  }

  const finderTopLeft = drawFinder(PADDING, PADDING, cell, cornerStyle, dark, light);
  const finderTopRight = drawFinder(
    PADDING + (size - FINDER_CELLS) * cell,
    PADDING,
    cell,
    cornerStyle,
    dark,
    light
  );
  const finderBottomLeft = drawFinder(
    PADDING,
    PADDING + (size - FINDER_CELLS) * cell,
    cell,
    cornerStyle,
    dark,
    light
  );

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${QR_SIZE}" height="${QR_SIZE}" viewBox="0 0 ${QR_SIZE} ${QR_SIZE}">
    <rect width="${QR_SIZE}" height="${QR_SIZE}" fill="${light}" />
    ${modules.join("")}
    ${finderTopLeft}
    ${finderTopRight}
    ${finderBottomLeft}
  </svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

export async function generateQrPngDataUrl(url: string, style?: QrStyle) {
  const png = await generateQrPngBuffer(url, style);
  return `data:image/png;base64,${png.toString("base64")}`;
}

export async function generateQrPngBuffer(url: string, style?: QrStyle) {
  const withCorners = await renderStyledQrPng(url, style);

  const logoUrl = style?.logoUrl?.trim();
  if (!logoUrl) return withCorners;
  const resolvedLogoUrl = logoUrl.startsWith("/")
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}${logoUrl}`
    : logoUrl;
  if (!(resolvedLogoUrl.startsWith("https://") || resolvedLogoUrl.startsWith("http://"))) return withCorners;

  try {
    const response = await fetch(resolvedLogoUrl);
    if (!response.ok) return withCorners;
    const rawLogo = Buffer.from(await response.arrayBuffer());
    const logoColor = style?.logoColor?.trim() || "#111111";
    const safeLogoColor = /^#([0-9a-fA-F]{6})$/.test(logoColor) ? logoColor : "#111111";
    const isPresetSvg = resolvedLogoUrl.includes("/qr-icons/") && resolvedLogoUrl.endsWith(".svg");

    let sourceLogo = rawLogo;
    if (isPresetSvg) {
      const svgText = rawLogo.toString("utf8");
      sourceLogo = Buffer.from(svgText.replaceAll("#111827", safeLogoColor), "utf8");
    }

    const logo = isPresetSvg
      ? await sharp(sourceLogo).resize(170, 170, { fit: "inside", withoutEnlargement: true }).png().toBuffer()
      : await sharp(sourceLogo)
          .resize(170, 170, { fit: "inside", withoutEnlargement: true })
          .tint(safeLogoColor)
          .png()
          .toBuffer();
    const logoBg = await sharp({
      create: {
        width: 220,
        height: 220,
        channels: 4,
        background: style?.bgColor || "#ffffff",
      },
    })
      .composite([
        {
          input: Buffer.from(
            `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><rect x="0" y="0" width="220" height="220" rx="46" fill="${style?.bgColor || "#ffffff"}"/></svg>`
          ),
        },
      ])
      .png()
      .toBuffer();

    return await sharp(withCorners)
      .composite([
        { input: logoBg, gravity: "center" },
        { input: logo, gravity: "center" },
      ])
      .png()
      .toBuffer();
  } catch {
    return withCorners;
  }
}

export async function generateQrSvg(url: string, style?: QrStyle) {
  // SVG export keeps visual style parity by encoding from styled PNG.
  const png = await generateQrPngBuffer(url, style);
  const b64 = png.toString("base64");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${QR_SIZE}" height="${QR_SIZE}" viewBox="0 0 ${QR_SIZE} ${QR_SIZE}">
    <image href="data:image/png;base64,${b64}" width="${QR_SIZE}" height="${QR_SIZE}" />
  </svg>`;
}

export async function generateQrPdf(url: string, style?: QrStyle) {
  const raw = await generateQrPngBuffer(url, style);
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const img = await pdf.embedPng(raw);
  page.drawImage(img, { x: 122, y: 250, width: 350, height: 350 });
  return Buffer.from(await pdf.save());
}
