import { getTranslations, setRequestLocale } from "next-intl/server";
import { Mail, MapPin, Phone } from "lucide-react";
import { brand } from "@/config/brand";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Contacts" };

export default async function ContactsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ContactsPage");

  return (
    <section className="container mx-auto px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-5 text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
        <ContactCard Icon={Mail} title={t("contact.email")} body={brand.email} href={`mailto:${brand.email}`} />
        <ContactCard Icon={MapPin} title={t("contact.address")} body={brand.address} />
        <ContactCard Icon={Phone} title={t("contact.phone")} body="+34 900 000 000" />
      </div>

      <Card className="mx-auto mt-10 max-w-2xl">
        <CardContent className="pt-6">
          <form className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                placeholder={t("form.name")}
              />
              <input
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                type="email"
                placeholder={t("form.email")}
              />
            </div>
            <input
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              placeholder={t("form.subject")}
            />
            <textarea
              className="min-h-[140px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder={t("form.message")}
            />
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {t("form.send")}
            </button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

function ContactCard({
  Icon,
  title,
  body,
  href,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  href?: string;
}) {
  const content = (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 p-7 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-sm text-muted-foreground">{body}</div>
      </CardContent>
    </Card>
  );
  return href ? <a href={href}>{content}</a> : content;
}
