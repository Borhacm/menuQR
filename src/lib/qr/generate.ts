import QRCode from "qrcode";
import { PDFDocument } from "pdf-lib";

export async function generateQrPngDataUrl(url: string) {
  return QRCode.toDataURL(url, { errorCorrectionLevel: "H", margin: 1, width: 800 });
}

export async function generateQrSvg(url: string) {
  return QRCode.toString(url, { type: "svg", errorCorrectionLevel: "H", margin: 1 });
}

export async function generateQrPdf(url: string) {
  const png = await QRCode.toDataURL(url, { width: 1000, margin: 1 });
  const raw = Buffer.from(png.split(",")[1]!, "base64");
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const img = await pdf.embedPng(raw);
  page.drawImage(img, { x: 122, y: 250, width: 350, height: 350 });
  return Buffer.from(await pdf.save());
}
