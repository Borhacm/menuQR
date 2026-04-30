import { requireTenantContext } from "@/lib/auth/guards";
import { updateResourceAction } from "@/lib/admin/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { menuLocales } from "@/config/locales";
import { currencies } from "@/config/currencies";
import { canUseCustomDomain, canUseMultiCurrency } from "@/config/plans";
import { brand } from "@/config/brand";
import { getAdminLocale, getAdminMessages } from "@/lib/admin/i18n";
import { ResourceSubmitButton } from "@/app/(app)/app/resource/resource-submit-button";

type ResourcePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ResourcePage({ searchParams }: ResourcePageProps) {
  const ctx = await requireTenantContext();
  const locale = await getAdminLocale();
  const t = getAdminMessages(locale).resource;
  const params = (await searchParams) ?? {};
  const saved = params.saved === "1";
  const errorCode = typeof params.error === "string" ? params.error : undefined;
  const hasError = Boolean(errorCode);
  const resource = ctx.resource;
  const canConfigureMultiCurrency = canUseMultiCurrency(ctx.organization.planId);
  const canConfigureCustomDomain = canUseCustomDomain(ctx.organization.planId);

  if (!resource) {
    return <p className="text-sm text-muted-foreground">{t.noResource}</p>;
  }

  const social = (resource.socialJson && typeof resource.socialJson === "object"
    ? resource.socialJson
    : {}) as Record<string, unknown>;
  const rootDomain = typeof social.rootDomain === "string" && social.rootDomain ? social.rootDomain : brand.shortDomains[0];

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">{t.title}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t.brandDomain}</CardTitle>
          <p className="text-sm text-muted-foreground">{t.whatIsResource}</p>
        </CardHeader>
        <CardContent>
          {saved ? (
            <div className="mb-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
              {t.saveSuccess}
            </div>
          ) : null}
          {hasError ? (
            <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {errorCode === "slug" ? t.saveErrorSlug : t.saveError}
            </div>
          ) : null}
          <form action={updateResourceAction} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t.name}</Label>
              <Input name="name" defaultValue={resource.name} />
            </div>
            <div className="space-y-2">
              <Label>{t.slug}</Label>
              <Input name="slug" defaultValue={resource.slug} />
            </div>
            <div className="space-y-2">
              <Label>{t.defaultLocale}</Label>
              <Input name="defaultLocale" defaultValue={resource.defaultLocale} />
            </div>
            <div className="space-y-2">
              <Label>{t.defaultCurrency}</Label>
              <Input name="defaultCurrency" defaultValue={resource.defaultCurrency} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>{t.enabledLocales}</Label>
              <div className="grid gap-2 rounded-md border p-3 sm:grid-cols-3">
                {menuLocales.slice(0, 12).map((locale) => (
                  <label key={locale.code} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="enabledLocales"
                      value={locale.code}
                      defaultChecked={resource.enabledLocales.includes(locale.code)}
                    />
                    <span>{locale.flag} {locale.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>{t.enabledCurrencies}</Label>
              <div className="grid gap-2 rounded-md border p-3 sm:grid-cols-3">
                {currencies.slice(0, 12).map((currency) => (
                  <label key={currency.code} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="enabledCurrencies"
                      value={currency.code}
                      defaultChecked={resource.enabledCurrencies.includes(currency.code)}
                      disabled={!canConfigureMultiCurrency}
                    />
                    <span>{currency.code} ({currency.symbol})</span>
                  </label>
                ))}
              </div>
              {!canConfigureMultiCurrency ? (
                <p className="text-xs text-muted-foreground">
                  {t.multiCurrencyPaidOnly}
                </p>
              ) : null}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>{t.rootDomain}</Label>
              <select
                name="rootDomain"
                defaultValue={rootDomain}
                aria-label={t.rootDomain}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {brand.shortDomains.map((domain) => (
                  <option key={domain} value={domain}>
                    {domain}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>{t.customDomain}</Label>
              <Input
                name="customDomain"
                placeholder={t.customDomainPlaceholder}
                disabled={!canConfigureCustomDomain}
                defaultValue={
                  resource.description?.startsWith("custom-domain:")
                    ? resource.description.replace("custom-domain:", "")
                    : ""
                }
              />
              {!canConfigureCustomDomain ? (
                <p className="text-xs text-muted-foreground">
                  {t.customDomainProOnly}
                </p>
              ) : null}
            </div>
            <div className="md:col-span-2">
              <ResourceSubmitButton idleLabel={t.save} pendingLabel={t.saving} />
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
