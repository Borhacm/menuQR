"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function MenuTracker({ resourceId, locale }: { resourceId: string; locale: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const source = searchParams.get("source");
    const payload = {
      resourceId,
      locale,
    };

    void fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...payload, type: "VIEW" }),
    });

    const fromQr = pathname.startsWith("/m/") || source === "qr";
    if (fromQr) {
      void fetch("/api/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...payload, type: "SCAN" }),
      });
    }
  }, [locale, pathname, resourceId, searchParams]);

  return null;
}
