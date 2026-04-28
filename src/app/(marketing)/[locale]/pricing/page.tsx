import { setRequestLocale } from "next-intl/server";
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

  return (
    <>
      <div className="container mx-auto px-4 pt-16 sm:px-6 lg:px-8 lg:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Simple pricing for every restaurant
          </h1>
          <p className="mt-5 text-muted-foreground">
            Start with the Free plan and upgrade only when you need more capacity.
            No hidden fees, no traffic limits.
          </p>
        </div>
      </div>
      <Pricing />
      <FAQ />
    </>
  );
}
