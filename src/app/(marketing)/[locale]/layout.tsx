import type { Metadata } from "next";
import { brand } from "@/config/brand";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { AnalyticsConsent } from "@/components/marketing/analytics-consent";

const localizedTagline: Record<string, string> = {
  es: "Menús QR multilingües para restaurantes",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tagline = localizedTagline[locale];
  if (!tagline) return {};
  const title = `${brand.name}: ${tagline}`;
  return { title: { absolute: title, template: `%s · ${brand.name}` }, openGraph: { title } };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function MarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = (await import(`../../../../messages/${locale}.json`)).default;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="flex min-h-screen flex-col">
        <MarketingHeader />
        <main className="flex-1">{children}</main>
        <MarketingFooter />
      </div>
      <AnalyticsConsent locale={locale} />
    </NextIntlClientProvider>
  );
}
