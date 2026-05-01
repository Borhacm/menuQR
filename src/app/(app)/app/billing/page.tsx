import { requireTenantContext } from "@/lib/auth/guards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAdminLocale, getAdminMessages } from "@/lib/admin/i18n";
import { billingStatus } from "@/lib/routes";
import { getPlan, plans, type PlanId } from "@/config/plans";
import { db } from "@/lib/db";

type BillingPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const ctx = await requireTenantContext();
  const locale = await getAdminLocale();
  const t = getAdminMessages(locale).billing;
  const params = (await searchParams) ?? {};
  const status = typeof params.status === "string" ? params.status : undefined;
  const localeTag = locale === "es" ? "es-ES" : "en-US";
  const currentPlanId = (ctx.organization.planId as PlanId) ?? "free";
  const currentPlan = getPlan(currentPlanId);
  const planOrder: PlanId[] = ["free", "starter", "pro"];
  const currentPlanRank = planOrder.indexOf(currentPlan.id);
  const upgradePlans = plans.filter((plan) => planOrder.indexOf(plan.id) > currentPlanRank);
  const tierSinceDate =
    ctx.organization.subscription && ctx.organization.subscription.planId === currentPlan.id
      ? ctx.organization.subscription.updatedAt
      : ctx.organization.createdAt;
  const tierSince = new Date(tierSinceDate).toLocaleDateString(localeTag, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const currentPrice =
    currentPlan.priceMonthly === 0
      ? t.freePrice
      : `${currentPlan.priceMonthly.toFixed(2)} ${currentPlan.currency}/${t.monthlySuffix}`;
  const metrics = ctx.resource
    ? await Promise.all([
        db.menu.count({ where: { resourceId: ctx.resource.id } }),
        db.item.count({ where: { category: { menu: { resourceId: ctx.resource.id } } } }),
        db.membership.count({ where: { organizationId: ctx.organization.id } }),
      ])
    : [0, 0, 1];
  const [menusUsed, itemsUsed, seatsUsed] = metrics;
  const languagesUsed = ctx.resource?.enabledLocales.length ?? 1;

  const copy =
    locale === "es"
      ? {
          usageTitle: "Uso actual del plan",
          usageSubtitle: "Esto te ayuda a decidir si mantener, subir o bajar de plan.",
          items: "Ítems",
          languages: "Idiomas",
          seats: "Usuarios del equipo",
          prioritySupport: "Soporte prioritario",
          supportPhonePlaceholder: "+34 900 000 000",
          supportEnabled: "Disponible en tu plan",
          supportUpgradeOnly: "Disponible a partir de Pro",
          downgradeTitle: "Gestionar suscripción",
          downgradeHelp:
            "Para bajar de plan o cancelar la suscripción, usa el portal de cliente. Esta opción se deja aquí con menor prioridad.",
          planBenefitsTitle: "Beneficios de tu plan",
          activeBadge: "Plan activo",
        }
      : {
          usageTitle: "Current plan usage",
          usageSubtitle: "Use this to decide whether to keep, upgrade, or downgrade.",
          items: "Items",
          languages: "Languages",
          seats: "Team seats",
          prioritySupport: "Priority support",
          supportPhonePlaceholder: "+1 (555) 010-0000",
          supportEnabled: "Available in your plan",
          supportUpgradeOnly: "Available from Pro",
          downgradeTitle: "Manage subscription",
          downgradeHelp:
            "To downgrade or cancel your subscription, use the customer portal. This option is intentionally lower priority.",
          planBenefitsTitle: "Plan benefits",
          activeBadge: "Active plan",
        };

  function localizeFeature(feature: string) {
    if (locale !== "es") return feature;
    const map: Record<string, string> = {
      "Everything in Free": "Todo lo incluido en Free",
      "Everything in Starter": "Todo lo incluido en Starter",
      "Launch-ready setup wizard": "Asistente de configuración listo para lanzar",
      "1 subdomain with menu": "1 subdominio con menú",
      "Up to 25 items per menu": "Hasta 25 ítems por menú",
      "Up to 150 items per menu": "Hasta 150 ítems por menú",
      "Up to 999 items per menu": "Hasta 999 ítems por menú",
      "1 photo per item": "1 foto por ítem",
      "5 photos per item": "5 fotos por ítem",
      "10 photos per item": "10 fotos por ítem",
      "Single-language menu": "Menú en un idioma",
      "Single currency pricing": "Precios en una sola moneda",
      "Classic template": "Plantilla Classic",
      "Classic/Modern/Grid templates": "Plantillas Classic/Modern/Grid",
      "Basic QR export (PNG/SVG/PDF)": "Exportación QR básica (PNG/SVG/PDF)",
      "Basic analytics summary": "Resumen básico de analíticas",
      "Full AI translation": "Traducción completa con IA",
      "Full AI menu extraction from photos": "Extracción completa del menú desde fotos con IA",
      "Multi-currency prices": "Precios en múltiples monedas",
      "QR branding and saved designs": "Branding QR y diseños guardados",
      "Analytics charts and rankings": "Gráficos y rankings de analíticas",
      "Manual translation overrides": "Sobrescrituras manuales de traducciones",
      "Locale and currency selectors on menu": "Selector de idioma y moneda en el menú",
      "Allergen labels": "Etiquetas de alérgenos",
      "CDN image transforms": "Transformaciones de imagen con CDN",
      "Custom domain support": "Soporte de dominio personalizado",
      "Advanced analytics": "Analíticas avanzadas",
      "Up to 10 manager accounts": "Hasta 10 cuentas de gestor",
      "Priority support": "Soporte prioritario",
      "Menu digitization help": "Ayuda para digitalizar el menú",
    };
    return map[feature] ?? feature;
  }

  function localizePlanDescription(description: string) {
    if (locale !== "es") return description;
    const map: Record<string, string> = {
      "Perfect to try out Menuly with a small menu.":
        "Perfecto para probar Menuly con un menú pequeño.",
      "For growing restaurants that need more capacity.":
        "Para restaurantes en crecimiento que necesitan más capacidad.",
      "For chains and large menus with maximum flexibility.":
        "Para cadenas y menús grandes con máxima flexibilidad.",
    };
    return map[description] ?? description;
  }

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold">{t.title}</h1>
      {status === billingStatus.missingConfig ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
          {t.statusMissingConfig}
        </div>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>{t.currentTier}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-semibold text-foreground">
              {currentPlan.name} · {currentPrice}
            </p>
            <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {copy.activeBadge}
            </span>
          </div>
          <p className="text-muted-foreground">
            {t.tierSince}: <strong>{tierSince}</strong>
          </p>
          <p className="text-muted-foreground">
            {localizePlanDescription(currentPlan.description)}
          </p>
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
              {copy.planBenefitsTitle}
            </p>
            <ul className="grid gap-1 sm:grid-cols-2 text-sm text-muted-foreground">
              {currentPlan.features.map((feature) => (
                <li key={feature}>- {localizeFeature(feature)}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{copy.usageTitle}</CardTitle>
          <p className="text-sm text-muted-foreground">{copy.usageSubtitle}</p>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <UsageStat
            label={copy.items}
            used={itemsUsed}
            limit={currentPlan.limits.maxItems}
          />
          <UsageStat
            label={copy.languages}
            used={languagesUsed}
            limit={currentPlan.limits.maxLanguages}
          />
          <UsageStat
            label={copy.seats}
            used={seatsUsed}
            limit={currentPlan.limits.maxManagerSeats}
          />
          <SupportStat
            label={copy.prioritySupport}
            enabled={currentPlan.limits.prioritySupport}
            phone={copy.supportPhonePlaceholder}
            enabledText={copy.supportEnabled}
            disabledText={copy.supportUpgradeOnly}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.availableUpgrades}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {upgradePlans.length ? (
            upgradePlans.map((plan) => (
              <form
                key={plan.id}
                action="/api/stripe/checkout"
                method="post"
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <input type="hidden" name="planId" value={plan.id} />
                <div>
                  <p className="font-medium text-foreground">
                    {plan.name} ·{" "}
                    {plan.priceMonthly === 0
                      ? t.freePrice
                      : `${plan.priceMonthly.toFixed(2)} ${plan.currency}/${t.monthlySuffix}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {localizePlanDescription(plan.description)}
                  </p>
                </div>
                <Button type="submit">
                  {t.upgradeTo} {plan.name}
                </Button>
              </form>
            ))
          ) : (
            <p className="text-muted-foreground">{t.alreadyTopTier}</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="text-base">{copy.downgradeTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">{copy.downgradeHelp}</p>
          <form action="/api/stripe/portal" method="post">
            <Button type="submit" variant="outline" size="sm">
              {t.openPortal}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function UsageStat({
  label,
  used,
  limit,
  unlimitedLabel,
}: {
  label: string;
  used: number;
  limit?: number;
  unlimitedLabel?: string;
}) {
  const hasLimit = typeof limit === "number";
  const safeLimit = hasLimit ? Math.max(limit, 1) : 1;
  const ratio = hasLimit ? Math.min(used / safeLimit, 1) : 0;
  const pct = Math.round(ratio * 100);
  return (
    <div className="rounded-lg border p-3">
      <div className="mb-1 flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {hasLimit ? `${used}/${limit}` : `${used} · ${unlimitedLabel ?? "Unlimited"}`}
        </span>
      </div>
      {hasLimit ? (
        <>
          <progress
            className="h-2 w-full overflow-hidden rounded bg-muted"
            value={used}
            max={safeLimit}
          />
          <p className="mt-1 text-xs text-muted-foreground">{pct}%</p>
        </>
      ) : null}
    </div>
  );
}

function SupportStat({
  label,
  enabled,
  phone,
  enabledText,
  disabledText,
}: {
  label: string;
  enabled: boolean;
  phone: string;
  enabledText: string;
  disabledText: string;
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="mb-1 flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className={enabled ? "text-emerald-400" : "text-muted-foreground"}>
          {enabled ? enabledText : disabledText}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{phone}</p>
    </div>
  );
}
