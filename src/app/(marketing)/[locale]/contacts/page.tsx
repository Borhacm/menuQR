import { setRequestLocale } from "next-intl/server";
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

  return (
    <section className="container mx-auto px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Get in touch
        </h1>
        <p className="mt-5 text-muted-foreground">
          Questions about plans, integrations or migrating your menu? We'd love to
          help.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
        <ContactCard Icon={Mail} title="Email" body={brand.email} href={`mailto:${brand.email}`} />
        <ContactCard Icon={MapPin} title="Address" body={brand.address} />
        <ContactCard Icon={Phone} title="Phone" body="+34 900 000 000" />
      </div>

      <Card className="mx-auto mt-10 max-w-2xl">
        <CardContent className="pt-6">
          <form className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                placeholder="Name"
              />
              <input
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                type="email"
                placeholder="Email"
              />
            </div>
            <input
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              placeholder="Subject"
            />
            <textarea
              className="min-h-[140px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Message"
            />
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Send message
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
