import { QrMenuTemplate } from "@/components/menu-templates/qr-menu";
import type { MenuCategory, MenuTheme } from "@/components/menu-templates/types";

export function ModernTemplate({
  title,
  categories,
  locale,
  locales,
  theme,
  canShowAllergens,
  analytics,
  initialCurrency,
}: {
  title: string;
  categories: ReadonlyArray<MenuCategory>;
  locale: string;
  locales: ReadonlyArray<string>;
  theme?: MenuTheme;
  canShowAllergens?: boolean;
  analytics?: {
    resourceId: string;
    enableItemTracking?: boolean;
  };
  initialCurrency?: string;
}) {
  return (
    <QrMenuTemplate
      title={title}
      categories={categories}
      locale={locale}
      locales={locales}
      theme={theme}
      canShowAllergens={canShowAllergens}
      analytics={analytics}
      initialCurrency={initialCurrency}
    />
  );
}
