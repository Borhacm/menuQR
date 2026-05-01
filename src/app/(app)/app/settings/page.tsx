import { requireTenantContext } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import {
  changePasswordAction,
  closeOtherSessionsAction,
  updateAccountEmailAction,
  updateNotificationsAction,
  updateResourceAnalyticsAction,
} from "@/lib/admin/settings-actions";
import { updateResourceAction } from "@/lib/admin/resource-actions";
import { getUserSettings } from "@/lib/admin/user-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAdminLocale, getAdminMessages } from "@/lib/admin/i18n";
import { menuLocales } from "@/config/locales";
import { currencies } from "@/config/currencies";
import { canUseMultiCurrency } from "@/config/plans";
import { isTranslationLocaleConfigured } from "@/lib/translation/locales";
import { readResourceAnalyticsSettings } from "@/lib/analytics/settings";

type SettingsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readStringParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return typeof value === "string" ? value : undefined;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const ctx = await requireTenantContext();
  const locale = await getAdminLocale();
  const t = getAdminMessages(locale).settings;
  const resourceT = getAdminMessages(locale).resource;
  const params = (await searchParams) ?? {};
  const saved = readStringParam(params, "saved");
  const error = readStringParam(params, "error");
  const canConfigureMultiCurrency = canUseMultiCurrency(ctx.organization.planId);

  const user = await db.user.findUnique({
    where: { id: ctx.user.id },
    select: { name: true, email: true, passwordHash: true },
  });
  const userSettings = await getUserSettings(ctx.user.id);
  const analyticsSettings = readResourceAnalyticsSettings(ctx.resource?.socialJson);

  const notifInvites = userSettings.notifications.invites;
  const notifBilling = userSettings.notifications.billing;
  const notifWeekly = userSettings.notifications.weekly;

  const saveMessage = saved ? t.savedByCode[saved] ?? t.saved : null;
  const errorMessage = error ? t.errorByCode[error] ?? t.error : null;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">{t.title}</h1>

      {saveMessage ? (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {saveMessage}
        </div>
      ) : null}
      {errorMessage ? (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {errorMessage}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{resourceT.brandDomain}</CardTitle>
          <p className="text-sm text-muted-foreground">{resourceT.whatIsResource}</p>
        </CardHeader>
        <CardContent>
          {!ctx.resource ? (
            <p className="text-sm text-muted-foreground">{resourceT.noResource}</p>
          ) : (
            <form action={updateResourceAction} className="grid gap-4 md:grid-cols-2">
              <input type="hidden" name="returnTo" value="settings" />
              <div className="space-y-2">
                <Label>{t.restaurantName}</Label>
                <Input name="name" defaultValue={ctx.resource.name} />
              </div>
              <div className="space-y-2">
                <Label>{resourceT.slug}</Label>
                <Input name="slug" defaultValue={ctx.resource.slug} />
              </div>
              <div className="space-y-2">
                <Label>{resourceT.defaultLocale}</Label>
                <select
                  name="defaultLocale"
                  defaultValue={ctx.resource.defaultLocale}
                  aria-label={resourceT.defaultLocale}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {menuLocales.map((menuLocale) => (
                    <option key={menuLocale.code} value={menuLocale.code}>
                      {menuLocale.flag} {menuLocale.name} ({menuLocale.code.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>{resourceT.defaultCurrency}</Label>
                <select
                  name="defaultCurrency"
                  defaultValue={ctx.resource.defaultCurrency}
                  aria-label={resourceT.defaultCurrency}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {currencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} ({currency.symbol})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>{resourceT.enabledLocales}</Label>
                <div className="grid gap-2 rounded-md border p-3 sm:grid-cols-3">
                  {menuLocales.map((menuLocale) => (
                    <label key={menuLocale.code} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="enabledLocales"
                        value={menuLocale.code}
                        defaultChecked={ctx.resource.enabledLocales.includes(menuLocale.code)}
                        disabled={!isTranslationLocaleConfigured(menuLocale.code)}
                      />
                      <span>
                        {menuLocale.flag} {menuLocale.name}
                        {!isTranslationLocaleConfigured(menuLocale.code) ? " (no disponible en el motor actual)" : ""}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {locale === "es"
                    ? "Solo se pueden activar idiomas compatibles con los motores de traducción configurados."
                    : "Only locales supported by the configured translation engines can be enabled."}
                </p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>{resourceT.enabledCurrencies}</Label>
                <div className="grid gap-2 rounded-md border p-3 sm:grid-cols-3">
                  {currencies.slice(0, 12).map((currency) => (
                    <label key={currency.code} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="enabledCurrencies"
                        value={currency.code}
                        defaultChecked={ctx.resource.enabledCurrencies.includes(currency.code)}
                        disabled={!canConfigureMultiCurrency}
                      />
                      <span>{currency.code} ({currency.symbol})</span>
                    </label>
                  ))}
                </div>
                {!canConfigureMultiCurrency ? (
                  <p className="text-xs text-muted-foreground">{resourceT.multiCurrencyPaidOnly}</p>
                ) : null}
              </div>
              <div className="md:col-span-2">
                <Button type="submit">{t.save}</Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.notificationsTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={updateNotificationsAction} className="space-y-3 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="notifInvites" defaultChecked={notifInvites} />
              <span>{t.notifInvites}</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="notifBilling" defaultChecked={notifBilling} />
              <span>{t.notifBilling}</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="notifWeekly" defaultChecked={notifWeekly} />
              <span>{t.notifWeekly}</span>
            </label>
            <Button type="submit">{t.save}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{locale === "es" ? "Analíticas de menú público" : "Public menu analytics"}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {locale === "es"
              ? "Configura tracking de interacción y parámetros de ranking para top productos."
              : "Configure interaction tracking and ranking parameters for top products."}
          </p>
        </CardHeader>
        <CardContent>
          <form action={updateResourceAnalyticsAction} className="grid gap-4 md:grid-cols-2">
            <label className="md:col-span-2 flex items-center gap-2 text-sm">
              <input type="checkbox" name="itemTrackingEnabled" defaultChecked={analyticsSettings.itemTrackingEnabled} />
              <span>{locale === "es" ? "Activar tracking por producto" : "Enable item-level tracking"}</span>
            </label>
            <div className="space-y-2">
              <Label>{locale === "es" ? "Ventana de ranking (días)" : "Ranking window (days)"}</Label>
              <Input
                name="bestSellerDays"
                type="number"
                min={7}
                max={365}
                defaultValue={analyticsSettings.bestSellerDays}
              />
            </div>
            <div className="space-y-2">
              <Label>{locale === "es" ? "Interacciones mínimas" : "Minimum interactions"}</Label>
              <Input
                name="bestSellerMinInteractions"
                type="number"
                min={1}
                max={100}
                defaultValue={analyticsSettings.bestSellerMinInteractions}
              />
            </div>
            <div className="space-y-2">
              <Label>{locale === "es" ? "Peso de vistas" : "View weight"}</Label>
              <Input
                name="bestSellerViewWeight"
                type="number"
                min={1}
                max={10}
                defaultValue={analyticsSettings.bestSellerViewWeight}
              />
            </div>
            <div className="space-y-2">
              <Label>{locale === "es" ? "Peso de clicks" : "Click weight"}</Label>
              <Input
                name="bestSellerClickWeight"
                type="number"
                min={1}
                max={10}
                defaultValue={analyticsSettings.bestSellerClickWeight}
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit">{t.save}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.securityTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <form action={updateAccountEmailAction} className="space-y-2">
            <Label>{t.email}</Label>
            <div className="flex max-w-xl flex-col gap-2 sm:flex-row sm:items-center">
              <Input name="email" type="email" required defaultValue={user?.email ?? ""} className="sm:flex-1" />
              <Button type="submit">{t.save}</Button>
            </div>
            <p className="text-xs text-muted-foreground">{t.emailConfirmHint}</p>
          </form>

          <form action={changePasswordAction} className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label>{t.currentPassword}</Label>
              <Input name="currentPassword" type="password" required />
            </div>
            <div className="space-y-2">
              <Label>{t.newPassword}</Label>
              <Input name="newPassword" type="password" required minLength={8} />
            </div>
            <div className="space-y-2">
              <Label>{t.confirmPassword}</Label>
              <Input name="confirmPassword" type="password" required minLength={8} />
            </div>
            <div className="md:col-span-3">
              <Button type="submit" disabled={!user?.passwordHash}>
                {t.changePassword}
              </Button>
            </div>
            {!user?.passwordHash ? (
              <p className="md:col-span-3 text-xs text-muted-foreground">{t.oauthPasswordHelp}</p>
            ) : null}
          </form>
        </CardContent>
      </Card>
      <div className="flex justify-end border-t border-border/60 pt-1">
        <form action={closeOtherSessionsAction}>
          <Button type="submit" variant="destructive">
            {t.closeOtherSessions}
          </Button>
        </form>
      </div>
    </div>
  );
}
