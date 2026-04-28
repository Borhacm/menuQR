import { defineRouting } from "next-intl/routing";
import { locales, defaultLocale } from "@/config/locales";

export const routing = defineRouting({
  locales: [...locales],
  defaultLocale,
  localePrefix: "as-needed",
});
