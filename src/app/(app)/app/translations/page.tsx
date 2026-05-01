import { redirect } from "next/navigation";
import { appHref } from "@/lib/routes";

export default async function TranslationsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const rawStatus = Array.isArray(params?.status) ? params.status[0] : params?.status;
  const rawLocale = Array.isArray(params?.locale) ? params.locale[0] : params?.locale;
  redirect(
    appHref("items", {
      tab: "translations",
      status: typeof rawStatus === "string" ? rawStatus : undefined,
      locale: typeof rawLocale === "string" ? rawLocale : undefined,
    })
  );
}
