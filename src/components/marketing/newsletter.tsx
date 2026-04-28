"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function Newsletter() {
  const t = useTranslations("Newsletter");
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setPending(true);
    try {
      await fetch("/api/newsletter", {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: { "content-type": "application/json" },
      });
      toast.success(t("success"));
      setEmail("");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="bg-primary/5 py-16">
      <div className="container mx-auto flex flex-col items-center gap-6 px-4 text-center sm:px-6 lg:px-8">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Mail className="h-5 w-5" />
        </div>
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">
          {t("title")}
        </h2>
        <form onSubmit={onSubmit} className="flex w-full max-w-md gap-2">
          <Input
            type="email"
            required
            placeholder={t("placeholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" disabled={pending}>
            {t("cta")}
          </Button>
        </form>
      </div>
    </section>
  );
}
