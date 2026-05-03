import Link from "next/link";
import { brand } from "@/config/brand";
import { Button } from "@/components/ui/button";

export default function GlobalNotFound() {
  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div>
        <p className="font-display text-lg font-semibold">404</p>
        <p className="mt-2 text-sm text-muted-foreground">
          This page does not exist or may have been moved.
        </p>
      </div>
      <Button asChild>
        <Link href="/">{brand.name} home</Link>
      </Button>
    </main>
  );
}
