import { Clock, Instagram, MapPin, MessageCircle, Phone, Star, Wifi } from "lucide-react";
import { instagramLink, safeHttpUrl, whatsappLink, type VenueInfo } from "@/lib/venue/venue-info";

const labels = {
  es: { title: "Visítanos", hours: "Horario", call: "Llamar", whatsapp: "WhatsApp", reviews: "Déjanos una reseña", wifi: "Wifi", password: "Contraseña", map: "Cómo llegar" },
  en: { title: "Visit us", hours: "Opening hours", call: "Call", whatsapp: "WhatsApp", reviews: "Leave us a review", wifi: "Wifi", password: "Password", map: "Directions" },
};

export function VenueInfoCard({
  venue,
  phone,
  address,
  locale,
}: {
  venue: VenueInfo;
  phone: string | null;
  address: string | null;
  locale: string;
}) {
  const t = locale === "es" ? labels.es : labels.en;
  const wa = whatsappLink(venue.whatsapp);
  const reviews = safeHttpUrl(venue.reviewsUrl);
  const ig = instagramLink(venue.instagram);
  const tel = phone ? phone.replace(/[^\d+]/g, "") : "";
  const mapUrl = address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : null;
  const hasAnything = venue.hours || wa || reviews || ig || tel || address || venue.wifiName;
  if (!hasAnything) return null;

  const linkClass =
    "inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[var(--menu-border,currentColor)] px-3.5 py-2 text-sm font-medium hover:bg-[var(--menu-surface)]";

  return (
    <section aria-labelledby="venue-info-title" className="mt-10 space-y-4 rounded-[14px] border border-[var(--menu-border)] bg-[var(--menu-surface)] p-5 text-[0.95rem]">
      <h2 id="venue-info-title" className="font-display text-xl font-bold tracking-[-0.015em]">{t.title}</h2>
      {venue.hours ? (
        <div className="flex gap-2 text-[var(--menu-muted)]">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div>
            <p className="font-medium text-[var(--menu-text)]">{t.hours}</p>
            <p className="whitespace-pre-line">{venue.hours}</p>
          </div>
        </div>
      ) : null}
      {address ? (
        <div className="flex gap-2 text-[var(--menu-muted)]">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>{address}</p>
        </div>
      ) : null}
      {venue.wifiName ? (
        <div className="flex gap-2 text-[var(--menu-muted)]">
          <Wifi className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            <span className="font-medium text-[var(--menu-text)]">{t.wifi}:</span> {venue.wifiName}
            {venue.wifiPassword ? (
              <>
                {" · "}
                {t.password}: <span className="font-mono text-[var(--menu-text)] select-all">{venue.wifiPassword}</span>
              </>
            ) : null}
          </p>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {tel ? (
          <a href={`tel:${tel}`} className={linkClass}>
            <Phone className="h-4 w-4" aria-hidden /> {t.call}
          </a>
        ) : null}
        {wa ? (
          <a href={wa} target="_blank" rel="noopener noreferrer" className={linkClass}>
            <MessageCircle className="h-4 w-4" aria-hidden /> {t.whatsapp}
          </a>
        ) : null}
        {mapUrl ? (
          <a href={mapUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
            <MapPin className="h-4 w-4" aria-hidden /> {t.map}
          </a>
        ) : null}
        {reviews ? (
          <a href={reviews} target="_blank" rel="noopener noreferrer" className={linkClass}>
            <Star className="h-4 w-4" aria-hidden /> {t.reviews}
          </a>
        ) : null}
        {ig ? (
          <a href={ig} target="_blank" rel="noopener noreferrer" className={linkClass}>
            <Instagram className="h-4 w-4" aria-hidden /> Instagram
          </a>
        ) : null}
      </div>
    </section>
  );
}
