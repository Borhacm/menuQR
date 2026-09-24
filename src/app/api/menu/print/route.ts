import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/config/currencies";
import { localizeAllergenName } from "@/lib/allergens";
import { getMenuQrBaseUrl } from "@/lib/menu-qr-public-url";
import { generateQrPngBuffer } from "@/lib/qr/generate";
import { generateMenuPdf, generateTableTentsPdf, type PrintableSection } from "@/lib/print/menu-pdf";
import { describeSectionSchedule, readSectionSettings } from "@/lib/venue/venue-info";

const copy = {
  es: { allergens: "Alérgenos", soldOut: "agotado", headline: "Escanea para ver la carta" },
  en: { allergens: "Allergens", soldOut: "sold out", headline: "Scan to see the menu" },
};

function slugForFile(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "") || "menu";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const resourceId = searchParams.get("resourceId");
  const kind = searchParams.get("kind") === "tents" ? "tents" : "menu";
  if (!resourceId) return NextResponse.json({ error: "resourceId is required" }, { status: 400 });

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const membership = await db.membership.findFirst({
    where: { userId: session.user.id, organization: { resources: { some: { id: resourceId } } } },
    select: { id: true },
  });
  if (!membership) return NextResponse.json({ error: "Resource not found" }, { status: 404 });

  const resource = await db.resource.findUnique({
    where: { id: resourceId },
    include: {
      qrDesigns: { orderBy: { createdAt: "desc" }, take: 1 },
      menus: {
        orderBy: { position: "asc" },
        include: {
          categories: {
            where: { isActive: true },
            orderBy: { position: "asc" },
            include: {
              items: {
                where: { isActive: true },
                orderBy: { position: "asc" },
                include: { prices: { orderBy: { position: "asc" } }, allergens: { include: { allergen: true } } },
              },
            },
          },
        },
      },
    },
  });
  if (!resource) return NextResponse.json({ error: "Resource not found" }, { status: 404 });

  const lang = resource.defaultLocale === "es" ? "es" : "en";
  const t = copy[lang];
  const url = `${getMenuQrBaseUrl()}/m/${resource.slug}`;
  const qrStyle = (resource.qrDesigns[0]?.configJson ?? {}) as Record<string, string | undefined>;
  const qrPng = await generateQrPngBuffer(url, {
    dotsColor: qrStyle.dotsColor,
    bgColor: qrStyle.bgColor,
    logoUrl: qrStyle.logoUrl,
    logoColor: qrStyle.logoColor,
    dotStyle: qrStyle.dotStyle,
    cornerStyle: qrStyle.cornerStyle,
  });
  const fileBase = slugForFile(resource.name);

  if (kind === "tents") {
    const pdf = await generateTableTentsPdf({ venueName: resource.name, qrPng, headline: t.headline, url });
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${fileBase}-cartelitos-mesa.pdf"`,
      },
    });
  }

  const settings = readSectionSettings(resource.socialJson);
  const sections: PrintableSection[] = resource.menus.flatMap((menu) =>
    menu.categories
      .filter((category) => category.items.length > 0)
      .map((category) => {
        const s = settings[menu.id];
        const details = s
          ? [
              s.fixedPrice ? formatPrice(Number(s.fixedPrice), resource.defaultCurrency, lang) : "",
              s.note,
              describeSectionSchedule(s, lang),
            ]
              .filter(Boolean)
              .join(" · ")
          : "";
        return {
          name: category.name,
          details: [category.description, details].filter(Boolean).join("\n"),
          items: category.items.map((item) => {
            const price =
              item.prices.find((p) => p.currency === resource.defaultCurrency) ?? item.prices[0];
            return {
              name: item.name,
              description: item.description ?? "",
              price: price ? formatPrice(Number(price.amount), price.currency, lang) : "",
              allergens: item.allergens.map(({ allergen }) =>
                localizeAllergenName(allergen.code, lang, allergen.name).toLowerCase()
              ),
            };
          }),
        };
      })
  );

  const pdf = await generateMenuPdf({
    title: resource.name,
    sections,
    footer: url.replace(/^https?:\/\//, ""),
    labels: { allergens: t.allergens, soldOut: t.soldOut },
    qrPng,
  });
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${fileBase}-carta.pdf"`,
    },
  });
}
