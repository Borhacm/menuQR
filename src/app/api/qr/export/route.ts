import { NextResponse } from "next/server";
import { generateQrPdf, generateQrPngDataUrl, generateQrSvg } from "@/lib/qr/generate";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const format = searchParams.get("format") ?? "png";
  if (!url) return NextResponse.json({ error: "url is required" }, { status: 400 });

  if (format === "svg") {
    const svg = await generateQrSvg(url);
    return new NextResponse(svg, {
      headers: {
        "content-type": "image/svg+xml",
        "content-disposition": 'attachment; filename="menu-qr.svg"',
      },
    });
  }

  if (format === "pdf") {
    const pdf = await generateQrPdf(url);
    return new NextResponse(pdf, {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": 'attachment; filename="menu-qr.pdf"',
      },
    });
  }

  const pngDataUrl = await generateQrPngDataUrl(url);
  return NextResponse.json({ dataUrl: pngDataUrl });
}
