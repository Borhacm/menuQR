"use client";

import Script from "next/script";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

/*
 * Google Analytics (propiedad común de bocal.online) + banner de cookies, solo en la web comercial.
 * El panel de clientes y las cartas públicas (/m/…) no se miden.
 *
 * El consentimiento se comparte con bocal.online y sus subdominios: cookie `bocalma_consent` en
 * .bocal.online (misma lógica que Bocalma-V0/lib/cookie-consent.ts). Con el consentimiento denegado,
 * GA solo recibe mediciones sin cookies (Consent Mode v2). `?internal=on` marca el tráfico propio.
 *
 * Embudo: cta_click (enlaces a /register o con data-analytics-cta), sign_up (/onboarding?new=1) y
 * onboarding_complete (formularios con data-analytics-submit). También se carga en /register y
 * /onboarding, que son páginas del embudo, no del panel.
 */

const GA_ID = "G-X1TPZH5MKQ";
const COOKIE = "bocalma_consent";
export const OPEN_COOKIE_SETTINGS_EVENT = "bocalma:open-cookie-settings";

type Consent = "granted" | "denied";

const COPY = {
  es: {
    message:
      "Usamos cookies propias necesarias y, si nos das tu consentimiento, cookies de Google Analytics para entender cómo se usa la web.",
    more: "Más información",
    reject: "Solo esenciales",
    accept: "Aceptar todas",
  },
  en: {
    message:
      "We use necessary cookies and, with your consent, Google Analytics cookies to understand how the site is used.",
    more: "More info",
    reject: "Essential only",
    accept: "Accept all",
  },
};

function readConsent(): Consent | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=(granted|denied)`));
  return m ? (m[1] as Consent) : null;
}

function writeConsent(value: Consent) {
  const host = window.location.hostname;
  const domain = host === "bocal.online" || host.endsWith(".bocal.online") ? "; domain=.bocal.online" : "";
  document.cookie = `${COOKIE}=${value}; path=/; max-age=${60 * 60 * 24 * 180}; SameSite=Lax; Secure${domain}`;
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/** Sends a GA event once gtag is ready (the bootstrap script loads after hydration). */
function track(name: string, params: Record<string, unknown> = {}) {
  let tries = 0;
  const send = () => {
    if (window.gtag) {
      window.gtag("event", name, params);
    } else if (tries++ < 50) {
      window.setTimeout(send, 100);
    }
  };
  send();
}

export function AnalyticsConsent({ locale }: { locale: string }) {
  const [open, setOpen] = useState(false);
  const t = locale === "es" ? COPY.es : COPY.en;

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.("a");
      if (!link) return;
      const ctaId = link.getAttribute("data-analytics-cta");
      const href = link.getAttribute("href") ?? "";
      if (ctaId) {
        track("cta_click", { cta_id: ctaId, page_path: window.location.pathname });
      } else if (/\/register(\?|$)/.test(href)) {
        const plan = new URL(href, window.location.origin).searchParams.get("plan") ?? undefined;
        track("cta_click", { cta_id: "register", plan, page_path: window.location.pathname });
      }
    };
    const onSubmit = (event: SubmitEvent) => {
      const name = (event.target as HTMLFormElement | null)?.getAttribute?.("data-analytics-submit");
      if (name) track(name);
    };
    document.addEventListener("click", onClick);
    document.addEventListener("submit", onSubmit);

    const url = new URL(window.location.href);
    if (url.pathname === "/onboarding" && url.searchParams.get("new") === "1") {
      track("sign_up", { method: "email" });
      url.searchParams.delete("new");
      window.history.replaceState(null, "", url.pathname + url.search);
    }
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("submit", onSubmit);
    };
  }, []);

  useEffect(() => {
    setOpen(readConsent() === null);
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, reopen);
  }, []);

  const decide = (value: Consent) => {
    writeConsent(value);
    window.gtag?.("consent", "update", { analytics_storage: value });
    setOpen(false);
  };

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="bocalma-ga" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          window.gtag = function(){window.dataLayer.push(arguments);};
          var m = document.cookie.match(/(?:^|; )${COOKIE}=(granted|denied)/);
          var consent = m ? m[1] : null, internal = false;
          try {
            var flag = new URLSearchParams(window.location.search).get('internal');
            if (flag === 'on') window.localStorage.setItem('bocalma_internal_traffic', '1');
            if (flag === 'off') window.localStorage.removeItem('bocalma_internal_traffic');
            internal = window.localStorage.getItem('bocalma_internal_traffic') === '1';
          } catch (e) {}
          window.gtag('consent', 'default', {
            analytics_storage: consent === 'granted' ? 'granted' : 'denied',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            wait_for_update: 500
          });
          window.gtag('js', new Date());
          if (internal) window.gtag('set', { traffic_type: 'internal' });
          window.gtag('config', '${GA_ID}');
        `}
      </Script>

      {open ? (
        <div
          role="region"
          aria-label="Cookies"
          className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 px-4 py-4 backdrop-blur sm:px-6"
        >
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <p className="text-center text-sm text-muted-foreground sm:text-left">
              {t.message}{" "}
              <Link href="/legal/privacy" className="underline hover:text-foreground">
                {t.more}
              </Link>
            </p>
            <div className="flex shrink-0 gap-3">
              <Button variant="outline" size="sm" onClick={() => decide("denied")}>
                {t.reject}
              </Button>
              <Button size="sm" onClick={() => decide("granted")}>
                {t.accept}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/** Botón para el pie: reabre el banner para cambiar o retirar el consentimiento. */
export function CookieSettingsButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT))}
      className="hover:text-foreground"
    >
      {label}
    </button>
  );
}
