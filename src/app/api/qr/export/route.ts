import { NextResponse } from "next/server";
import { generateQrPdf, generateQrPngBuffer, generateQrSvg } from "@/lib/qr/generate";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const resourceId = searchParams.get("resourceId");
  const format = searchParams.get("format") ?? "png";
  const designId = searchParams.get("designId");
  const dotsColor = searchParams.get("dotsColor");
  const bgColor = searchParams.get("bgColor");
  const logoUrl = searchParams.get("logoUrl");
  const logoColor = searchParams.get("logoColor");
  const dotStyle = searchParams.get("dotStyle");
  const cornerStyle = searchParams.get("cornerStyle");
  if (!resourceId) return NextResponse.json({ error: "resourceId is required" }, { status: 400 });
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const membership = await db.membership.findFirst({
    where: {
      userId: session.user.id,
      organization: { resources: { some: { id: resourceId } } },
    },
    select: { organization: { select: { resources: { where: { id: resourceId }, take: 1 } } } },
  });
  const resource = membership?.organization.resources[0];
  if (!resource) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }
  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/m/${resource.slug}`;
  const style = designId
    ? await db.qrDesign.findFirst({
        where: { id: designId, resourceId },
        select: { configJson: true },
      })
    : null;
  const styleConfig = (style?.configJson ?? {}) as {
    dotsColor?: string;
    bgColor?: string;
    logoUrl?: string;
    logoColor?: string;
    dotStyle?: string;
    cornerStyle?: string;
  };
  const styleOverrides = {
    dotsColor: dotsColor || styleConfig.dotsColor,
    bgColor: bgColor || styleConfig.bgColor,
    logoUrl: logoUrl || styleConfig.logoUrl,
    logoColor: logoColor || styleConfig.logoColor,
    dotStyle: dotStyle || styleConfig.dotStyle,
    cornerStyle: cornerStyle || styleConfig.cornerStyle,
  };

  if (format === "svg") {
    const svg = await generateQrSvg(url, styleOverrides);
    return new NextResponse(svg, {
      headers: {
        "content-type": "image/svg+xml",
        "content-disposition": 'attachment; filename="menu-qr.svg"',
      },
    });
  }

  if (format === "pdf") {
    const pdf = await generateQrPdf(url, styleOverrides);
    return new NextResponse(pdf, {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": 'attachment; filename="menu-qr.pdf"',
      },
    });
  }

  const png = await generateQrPngBuffer(url, styleOverrides);
  return new NextResponse(new Uint8Array(png), {
    headers: {
      "content-type": "image/png",
      "content-disposition": 'attachment; filename="menu-qr.png"',
    },
  });
}
