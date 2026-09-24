import { Clock, Instagram, MapPin, MessageCircle, Phone, Star, Wifi } from "lucide-react";
import { instagramLink, safeHttpUrl, whatsappLink, type VenueInfo } from "@/lib/venue/venue-info";

const labels = {
  es: { title: "Información del local", hours: "Horario", call: "Llamar", whatsapp: "WhatsApp", reviews: "Déjanos una reseña", wifi: "Wifi", password: "Contraseña", map: "Cómo llegar" },
  en: { title: "Venue info", hours: "Opening hours", call: "Call", whatsapp: "WhatsApp", reviews: "Leave us a review", wifi: "Wifi", password: "Password", map: "Directions" },
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
    "inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted";

  return (
    <section aria-labelledby="venue-info-title" className="mt-8 space-y-4 rounded-xl border border-border bg-card/60 p-4 text-sm">
      <h2 id="venue-info-title" className="text-base font-semibold text-foreground">{t.title}</h2>
      {venue.hours ? (
        <div className="flex gap-2 text-muted-foreground">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div>
            <p className="font-medium text-foreground">{t.hours}</p>
            <p className="whitespace-pre-line">{venue.hours}</p>
          </div>
        </div>
      ) : null}
      {address ? (
        <div className="flex gap-2 text-muted-foreground">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>{address}</p>
        </div>
      ) : null}
      {venue.wifiName ? (
        <div className="flex gap-2 text-muted-foreground">
          <Wifi className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            <span className="font-medium text-foreground">{t.wifi}:</span> {venue.wifiName}
            {venue.wifiPassword ? (
              <>
                {" · "}
                {t.password}: <span className="font-mono text-foreground select-all">{venue.wifiPassword}</span>
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
