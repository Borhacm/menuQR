import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowUpRight } from "lucide-react";
import { brand } from "@/config/brand";

export const metadata = { title: "Contacts" };

export default async function ContactsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ContactsPage");

  return (
    <section className="container mx-auto px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-5 text-muted-foreground">
          {t("subtitle")}
        </p>
        <a
          href={brand.contactUrl(locale)}
          data-analytics-cta="menuly_contact"
          className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t("cta")} <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}
