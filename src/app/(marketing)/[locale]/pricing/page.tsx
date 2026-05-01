import { getTranslations, setRequestLocale } from "next-intl/server";
import { Pricing } from "@/components/marketing/pricing";
import { FAQ } from "@/components/marketing/faq";

export const metadata = { title: "Pricing" };

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("PricingPage");

  return (
    <>
      <div className="container mx-auto px-4 pt-16 sm:px-6 lg:px-8 lg:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-5 text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
      </div>
      <Pricing />
      <FAQ />
    </>
  );
}
