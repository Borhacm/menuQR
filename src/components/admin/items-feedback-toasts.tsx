"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

type ItemsFeedbackToastsProps = {
  locale: "en" | "es";
  updated: boolean;
  deleted: boolean;
  updateError: boolean;
};

export function ItemsFeedbackToasts({
  locale,
  updated,
  deleted,
  updateError,
}: ItemsFeedbackToastsProps) {
  const lastSignatureRef = useRef("");

  useEffect(() => {
    const signature = `${locale}:${updated}:${deleted}:${updateError}`;
    if (signature === lastSignatureRef.current) return;
    lastSignatureRef.current = signature;

    if (updated) {
      toast.success(
        locale === "es" ? "Producto guardado correctamente." : "Product saved successfully."
      );
    }
    if (deleted) {
      toast.success(
        locale === "es"
          ? "Producto eliminado correctamente."
          : "Product deleted successfully."
      );
    }
    if (updateError) {
      toast.error(
        locale === "es"
          ? "No se pudo guardar el producto. Inténtalo de nuevo."
          : "Could not save product. Please try again."
      );
    }
  }, [deleted, locale, updateError, updated]);

  return null;
}
