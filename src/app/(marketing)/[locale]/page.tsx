import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/marketing/hero";
import { Features } from "@/components/marketing/features";
import { TemplatesCarousel } from "@/components/marketing/templates-carousel";
import { Trust } from "@/components/marketing/trust";
import { AdminPreview } from "@/components/marketing/admin-preview";
import { Steps } from "@/components/marketing/steps";
import { Pricing } from "@/components/marketing/pricing";
import { FAQ } from "@/components/marketing/faq";
import { Newsletter } from "@/components/marketing/newsletter";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <Features />
      <TemplatesCarousel />
      <Trust />
      <AdminPreview />
      <Steps />
      <Pricing />
      <FAQ />
      <Newsletter />
    </>
  );
}
