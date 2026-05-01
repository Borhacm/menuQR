import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "./logo";
import { brand } from "@/config/brand";
import { Mail, MapPin } from "lucide-react";

export function MarketingFooter() {
  const t = useTranslations("Footer");
  const tNav = useTranslations("Nav");

  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="container mx-auto grid grid-cols-1 gap-10 px-4 py-16 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="space-y-4">
          <Logo />
          <p className="text-sm text-muted-foreground max-w-xs">
            {t("description")}
          </p>
          <div className="space-y-1.5 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{brand.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <a href={`mailto:${brand.email}`} className="hover:text-foreground">
                {brand.email}
              </a>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-4">{t("links")}</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/" className="hover:text-foreground">{tNav("home")}</Link></li>
            <li><Link href="/pricing" className="hover:text-foreground">{tNav("pricing")}</Link></li>
            <li><Link href="/solutions" className="hover:text-foreground">{tNav("solutions")}</Link></li>
            <li><Link href="/faq" className="hover:text-foreground">{tNav("faq")}</Link></li>
            <li><Link href="/contacts" className="hover:text-foreground">{tNav("contacts")}</Link></li>
            <li><Link href="/blog" className="hover:text-foreground">{tNav("blog")}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-4">{t("solutions")}</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/solutions/personalized-domain" className="hover:text-foreground">{t("solutionLinks.personalizedDomain")}</Link></li>
            <li><Link href="/solutions/multilingual-menus" className="hover:text-foreground">{t("solutionLinks.multilingualMenu")}</Link></li>
            <li><Link href="/solutions/easy-menu-management" className="hover:text-foreground">{t("solutionLinks.menuManagement")}</Link></li>
            <li><Link href="/solutions/flexible-design" className="hover:text-foreground">{t("solutionLinks.flexibleDesign")}</Link></li>
            <li><Link href="/solutions/qr-code-generator" className="hover:text-foreground">{t("solutionLinks.qrGenerator")}</Link></li>
            <li><Link href="/solutions/analytics" className="hover:text-foreground">{t("solutionLinks.analytics")}</Link></li>
            <li><Link href="/solutions/multi-currency" className="hover:text-foreground">{t("solutionLinks.multiCurrency")}</Link></li>
            <li><Link href="/solutions/media-asset" className="hover:text-foreground">{t("solutionLinks.mediaCdn")}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-4">{t("company")}</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/legal/privacy" className="hover:text-foreground">{t("privacy")}</Link></li>
            <li><Link href="/legal/terms" className="hover:text-foreground">{t("terms")}</Link></li>
            <li><Link href="/legal" className="hover:text-foreground">{t("legal")}</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/60">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <span>
            © {new Date().getFullYear()} {brand.name}. {t("rights")}
          </span>
          <div className="flex gap-4">
            <Link href="/legal/privacy" className="hover:text-foreground">{t("privacy")}</Link>
            <Link href="/legal/terms" className="hover:text-foreground">{t("terms")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
