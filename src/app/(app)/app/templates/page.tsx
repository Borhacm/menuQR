import { redirect } from "next/navigation";
import { appHref } from "@/lib/routes";

type TemplatesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TemplatesPage({ searchParams }: TemplatesPageProps) {
  const params = (await searchParams) ?? {};
  const rawLocale = typeof params.locale === "string" ? params.locale : Array.isArray(params.locale) ? params.locale[0] : undefined;
  const rawTab = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const tab =
    rawTab === "mobile-preview"
      ? "mobile-preview"
      : "style-editor";
  const savedStyles = params.saved === "styles" ? "styles" : undefined;
  redirect(
    appHref("items", {
      tab,
      ...(typeof rawLocale === "string" ? { locale: rawLocale } : {}),
      ...(savedStyles ? { saved: savedStyles } : {}),
    })
  );
}
