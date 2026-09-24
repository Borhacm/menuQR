import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirectToAuth } from "@/lib/auth/redirects";
import { completeOnboardingAction } from "@/lib/auth/actions";
import { getAdminLocale } from "@/lib/admin/i18n";
import { AnalyticsConsent } from "@/components/marketing/analytics-consent";
import { menuLocales } from "@/config/locales";
import { currencies } from "@/config/currencies";
import { getMenuQrBaseUrl } from "@/lib/menu-qr-public-url";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const copy = {
  es: {
    title: "Configura tu local",
    intro: "Con estos datos tendrás tu carta lista para añadir platos. Podrás cambiarlos después en Ajustes.",
    card: "Datos del local",
    name: "Nombre del local",
    namePlaceholder: "Bar La Plaza",
    slug: "Dirección de tu carta (opcional)",
    slugHelp: (base: string) => `Tu carta estará en ${base}/m/<dirección>. Si lo dejas vacío, la creamos a partir del nombre.`,
    locale: "Idioma en el que escribes la carta",
    localeHelp: "Después podrás traducirla a otros idiomas.",
    currency: "Moneda",
    submit: "Crear mi carta",
    errors: {
      name_required: "Escribe el nombre del local.",
    },
  },
  en: {
    title: "Set up your venue",
    intro: "With these details your menu is ready for dishes. You can change them later in Settings.",
    card: "Venue details",
    name: "Venue name",
    namePlaceholder: "The Plaza Bar",
    slug: "Menu address (optional)",
    slugHelp: (base: string) => `Your menu will live at ${base}/m/<address>. Leave it empty and we'll build it from the name.`,
    locale: "Language your menu is written in",
    localeHelp: "You can translate it into other languages later.",
    currency: "Currency",
    submit: "Create my menu",
    errors: {
      name_required: "Enter the venue name.",
    },
  },
} as const;

const selectClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirectToAuth("/login");

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
  });
  if (membership) redirect("/app");

  const locale = await getAdminLocale();
  const lang = locale === "es" ? "es" : "en";
  const t = copy[lang];
  const { error } = await searchParams;
  const errorMessage = error && error in t.errors ? t.errors[error as keyof typeof t.errors] : null;
  const menuBase = getMenuQrBaseUrl().replace(/^https?:\/\//, "");

  return (
    <main className="container mx-auto max-w-xl space-y-6 px-4 py-16">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.intro}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{t.card}</CardTitle>
        </CardHeader>
        <CardContent>
          {errorMessage ? (
            <p role="alert" className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </p>
          ) : null}
          <form action={completeOnboardingAction} data-analytics-submit="onboarding_complete" className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">{t.name}</Label>
              <Input id="name" name="name" placeholder={t.namePlaceholder} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">{t.slug}</Label>
              <Input id="slug" name="slug" placeholder="bar-la-plaza" pattern="[a-zA-Z0-9-]*" />
              <p className="text-xs text-muted-foreground">{t.slugHelp(menuBase)}</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="defaultLocale">{t.locale}</Label>
                <select id="defaultLocale" name="defaultLocale" defaultValue={lang} className={selectClass}>
                  {menuLocales.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.flag} {option.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">{t.localeHelp}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultCurrency">{t.currency}</Label>
                <select id="defaultCurrency" name="defaultCurrency" defaultValue="EUR" className={selectClass}>
                  {currencies.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.code} ({option.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button type="submit" className="w-full">
              {t.submit}
            </Button>
          </form>
        </CardContent>
      </Card>
      <AnalyticsConsent locale={lang} />
    </main>
  );
}
