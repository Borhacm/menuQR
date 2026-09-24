import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

export type PrintableItem = { name: string; description: string; price: string; allergens: string[]; soldOut?: boolean };
export type PrintableSection = { name: string; details: string; items: PrintableItem[] };

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 56;
const INK = rgb(0.08, 0.09, 0.15);
const MUTED = rgb(0.35, 0.37, 0.45);
const LINE = rgb(0.86, 0.87, 0.9);

/** Standard PDF fonts only cover WinAnsi; swap anything else for a safe character instead of crashing. */
function makeSanitizer(font: PDFFont) {
  const cache = new Map<string, string>();
  return (text: string) =>
    Array.from(text.replace(/[   ]/g, " "))
      .map((ch) => {
        const hit = cache.get(ch);
        if (hit !== undefined) return hit;
        let out = ch;
        try {
          font.encodeText(ch);
        } catch {
          out = ch.normalize("NFD").replace(/\p{Diacritic}/gu, "");
          try {
            font.encodeText(out);
          } catch {
            out = "";
          }
        }
        cache.set(ch, out);
        return out;
      })
      .join("");
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !line) {
        line = candidate;
      } else {
        lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

export async function generateMenuPdf(input: {
  title: string;
  sections: PrintableSection[];
  footer: string;
  labels: { allergens: string; soldOut: string };
  qrPng?: Buffer;
}) {
  const doc = await PDFDocument.create();
  doc.setTitle(input.title);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const oblique = await doc.embedFont(StandardFonts.HelveticaOblique);
  const safe = makeSanitizer(regular);
  const width = A4[0] - MARGIN * 2;

  let page: PDFPage = doc.addPage(A4);
  let y = A4[1] - MARGIN;
  const ensure = (needed: number) => {
    if (y - needed < MARGIN + 30) {
      page = doc.addPage(A4);
      y = A4[1] - MARGIN;
    }
  };

  // Title
  const title = safe(input.title);
  page.drawText(title, { x: MARGIN, y: y - 26, size: 26, font: bold, color: INK });
  y -= 44;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: A4[0] - MARGIN, y }, thickness: 1, color: INK });
  y -= 26;

  for (const section of input.sections) {
    ensure(60);
    page.drawText(safe(section.name).toUpperCase(), { x: MARGIN, y, size: 13, font: bold, color: INK });
    y -= 16;
    if (section.details) {
      for (const line of wrap(safe(section.details), oblique, 10, width)) {
        ensure(14);
        page.drawText(line, { x: MARGIN, y, size: 10, font: oblique, color: MUTED });
        y -= 13;
      }
    }
    y -= 6;

    for (const item of section.items) {
      const price = safe(item.price);
      const priceWidth = bold.widthOfTextAtSize(price, 11);
      const nameText = safe(item.name) + (item.soldOut ? ` (${safe(input.labels.soldOut)})` : "");
      const nameLines = wrap(nameText, bold, 11, width - priceWidth - 16);
      const descLines = item.description ? wrap(safe(item.description), regular, 9.5, width - priceWidth - 16) : [];
      const allergenLine = item.allergens.length
        ? wrap(`${safe(input.labels.allergens)}: ${safe(item.allergens.join(", "))}`, oblique, 8.5, width - priceWidth - 16)
        : [];
      ensure(nameLines.length * 14 + descLines.length * 12 + allergenLine.length * 11 + 8);

      nameLines.forEach((line, i) => {
        page.drawText(line, { x: MARGIN, y, size: 11, font: bold, color: INK });
        if (i === 0 && price) {
          page.drawText(price, { x: A4[0] - MARGIN - priceWidth, y, size: 11, font: bold, color: INK });
        }
        y -= 14;
      });
      for (const line of descLines) {
        page.drawText(line, { x: MARGIN, y, size: 9.5, font: regular, color: MUTED });
        y -= 12;
      }
      for (const line of allergenLine) {
        page.drawText(line, { x: MARGIN, y, size: 8.5, font: oblique, color: MUTED });
        y -= 11;
      }
      y -= 7;
    }
    y -= 4;
    ensure(20);
    page.drawLine({ start: { x: MARGIN, y }, end: { x: A4[0] - MARGIN, y }, thickness: 0.5, color: LINE });
    y -= 20;
  }

  const qr = input.qrPng ? await doc.embedPng(input.qrPng) : null;
  const pages = doc.getPages();
  pages.forEach((p, index) => {
    const footer = safe(`${input.footer}   ${index + 1}/${pages.length}`);
    p.drawText(footer, { x: MARGIN, y: MARGIN - 20, size: 8, font: regular, color: MUTED });
  });
  if (qr) {
    const last = pages[pages.length - 1]!;
    last.drawImage(qr, { x: A4[0] - MARGIN - 64, y: MARGIN - 28, width: 64, height: 64 });
  }
  return doc.save();
}

/** One A4 sheet with four A6 table cards (cut along the dashed lines). */
export async function generateTableTentsPdf(input: { venueName: string; qrPng: Buffer; headline: string; url: string }) {
  const doc = await PDFDocument.create();
  doc.setTitle(input.venueName);
  const page = doc.addPage(A4);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const safe = makeSanitizer(regular);
  const qr = await doc.embedPng(input.qrPng);
  const [w, h] = A4;
  const cellW = w / 2;
  const cellH = h / 2;

  page.drawLine({ start: { x: cellW, y: 0 }, end: { x: cellW, y: h }, thickness: 0.5, color: LINE, dashArray: [4, 4] });
  page.drawLine({ start: { x: 0, y: cellH }, end: { x: w, y: cellH }, thickness: 0.5, color: LINE, dashArray: [4, 4] });

  const name = safe(input.venueName);
  const headline = safe(input.headline);
  const url = safe(input.url.replace(/^https?:\/\//, ""));
  for (const [col, row] of [[0, 0], [1, 0], [0, 1], [1, 1]] as const) {
    const x0 = col * cellW;
    const y0 = row * cellH;
    const center = (text: string, font: PDFFont, size: number, y: number) => {
      let s = size;
      while (font.widthOfTextAtSize(text, s) > cellW - 40 && s > 7) s -= 0.5;
      page.drawText(text, { x: x0 + (cellW - font.widthOfTextAtSize(text, s)) / 2, y, size: s, font, color: INK });
    };
    center(name, bold, 18, y0 + cellH - 60);
    const qrSize = 190;
    page.drawImage(qr, { x: x0 + (cellW - qrSize) / 2, y: y0 + cellH - 90 - qrSize, width: qrSize, height: qrSize });
    center(headline, bold, 13, y0 + 110);
    center(url, regular, 8.5, y0 + 88);
  }
  return doc.save();
}
