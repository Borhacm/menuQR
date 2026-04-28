import { setRequestLocale } from "next-intl/server";
import { FAQ } from "@/components/marketing/faq";

export const metadata = { title: "F.A.Q" };

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <FAQ />;
}
