"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

function shouldShowErrorDetail() {
  if (process.env.NODE_ENV === "development") return true;
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h === "[::1]";
}

export default function RootErrorFallback({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    setShowDetail(shouldShowErrorDetail());
    if (typeof window !== "undefined") {
      console.error("[RootErrorFallback]", error);
    }
  }, [error]);

  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div>
        <p className="font-display text-lg font-semibold">Something went wrong</p>
        {showDetail ? (
          <p className="mt-2 max-w-xl text-left font-mono text-xs text-muted-foreground break-all">
            {error.message}
            {error.digest ? (
              <span className="mt-2 block font-sans text-[11px] text-muted-foreground">
                Digest: {error.digest}
              </span>
            ) : null}
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Try again in a moment.</p>
        )}
      </div>
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
