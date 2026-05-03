"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MenuTab = "categories" | "products" | "translations" | "style-editor" | "mobile-preview" | "qr";

type StepItem = {
  tab: MenuTab;
  label: string;
  href: string;
  unlocked: boolean;
};

export function MenuProcessStepper({
  steps,
  activeTab,
  locale,
}: {
  steps: ReadonlyArray<StepItem>;
  activeTab: MenuTab;
  locale: "es" | "en";
}) {
  const [stylesDirty, setStylesDirty] = useState(false);
  const activeStepIndex = steps.findIndex((step) => step.tab === activeTab);
  const prevStep = activeStepIndex > 0 ? steps[activeStepIndex - 1] : null;
  const rawNextStep =
    activeStepIndex >= 0 && activeStepIndex < steps.length - 1 ? steps[activeStepIndex + 1] : null;
  const nextStep = rawNextStep && rawNextStep.unlocked ? rawNextStep : null;
  const dirtyWarning =
    locale === "es"
      ? "Tienes cambios sin guardar en Estilos. Si continúas, esos cambios se perderán."
      : "You have unsaved changes in Styles. If you continue, those changes will be lost.";

  useEffect(() => {
    const onDirtyChange = (event: Event) => {
      const custom = event as CustomEvent<{ dirty?: boolean }>;
      setStylesDirty(Boolean(custom.detail?.dirty));
    };
    const stored = window.localStorage.getItem("menuStylesDirty");
    setStylesDirty(stored === "1");
    window.addEventListener("menu-styles-dirty-change", onDirtyChange as EventListener);
    return () => window.removeEventListener("menu-styles-dirty-change", onDirtyChange as EventListener);
  }, []);

  const showUnsavedWarning = activeTab === "style-editor" && stylesDirty;

  function allowNavigation(targetTab: MenuTab) {
    if (!showUnsavedWarning) return true;
    if (targetTab === "style-editor") return true;
    return window.confirm(dirtyWarning);
  }

  return (
    <>
      <nav
        className="overflow-x-auto rounded-xl border border-border/70 bg-card/60 p-2"
        aria-label={locale === "es" ? "Pasos para crear el menú QR" : "QR menu creation steps"}
      >
        <ol className="flex min-w-max items-center gap-2">
          {steps.map((step, index) => {
            const isActive = activeTab === step.tab;
            const isCompleted = activeStepIndex > index;
            return (
              <li key={step.tab} className="flex items-center gap-2">
                <Link
                  scroll={false}
                  href={step.unlocked || isActive ? step.href : steps[activeStepIndex]?.href ?? step.href}
                  data-state={isActive ? "active" : isCompleted ? "completed" : "inactive"}
                  aria-disabled={!step.unlocked && !isActive}
                  title={
                    !step.unlocked && !isActive
                      ? locale === "es"
                        ? "Completa los pasos previos y acepta traducciones para desbloquear este paso."
                        : "Complete previous steps and accept translations to unlock this step."
                      : undefined
                  }
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                    isActive
                      ? "border-primary bg-primary/12 text-foreground shadow-sm"
                      : isCompleted
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                        : "border-border bg-background/70 text-muted-foreground hover:text-foreground",
                    !step.unlocked &&
                      !isActive &&
                      "pointer-events-none cursor-not-allowed opacity-55 hover:text-muted-foreground"
                  )}
                  onClick={(event) => {
                    if (!step.unlocked && !isActive) {
                      event.preventDefault();
                      return;
                    }
                    if (!allowNavigation(step.tab)) {
                      event.preventDefault();
                    }
                  }}
                >
                  <span
                    className={cn(
                      "inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : isCompleted
                          ? "bg-emerald-500/80 text-emerald-950"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="whitespace-nowrap">{step.label}</span>
                </Link>
                {index < steps.length - 1 ? (
                  <span className="text-muted-foreground/70" aria-hidden="true">
                    →
                  </span>
                ) : null}
              </li>
            );
          })}
        </ol>
      </nav>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex flex-col gap-1">
          <p className="text-muted-foreground">
            {locale === "es"
              ? `Paso ${Math.max(activeStepIndex + 1, 1)} de ${steps.length}`
              : `Step ${Math.max(activeStepIndex + 1, 1)} of ${steps.length}`}
          </p>
          {showUnsavedWarning ? (
            <p className="text-amber-600 dark:text-amber-300">
              {locale === "es" ? "Hay cambios sin guardar en Estilos." : "There are unsaved changes in Styles."}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {prevStep ? (
            <Button asChild type="button" variant="outline" size="sm">
              <Link
                scroll={false}
                href={prevStep.href}
                onClick={(event) => {
                  if (!allowNavigation(prevStep.tab)) event.preventDefault();
                }}
              >
                {locale === "es" ? "Anterior" : "Previous"}
              </Link>
            </Button>
          ) : (
            <Button type="button" variant="outline" size="sm" disabled>
              {locale === "es" ? "Anterior" : "Previous"}
            </Button>
          )}
          {nextStep ? (
            <Button asChild type="button" size="sm" disabled={showUnsavedWarning}>
              <Link
                scroll={false}
                href={nextStep.href}
                onClick={(event) => {
                  if (showUnsavedWarning || !allowNavigation(nextStep.tab)) event.preventDefault();
                }}
              >
                {locale === "es" ? "Siguiente" : "Next"}
              </Link>
            </Button>
          ) : (
            <Button type="button" size="sm" disabled>
              {rawNextStep
                ? locale === "es"
                  ? "Completa pasos previos"
                  : "Complete previous steps"
                : locale === "es"
                  ? "Finalizado"
                  : "Completed"}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
