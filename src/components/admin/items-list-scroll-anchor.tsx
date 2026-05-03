"use client";

import { useLayoutEffect } from "react";

type ItemsListScrollAnchorProps = {
  /** Valor actual de query `editItemId` desde el servidor (evita useSearchParams y fallos del client manifest en dev). */
  editingItemId: string | null;
  /** Re-ejecutar scroll tras guardar (query `updated`). */
  updatedNonce: string | null;
  /** Re-ejecutar scroll tras error de guardado. */
  updateErrorNonce: string | null;
};

/** Mantiene la vista en la fila del producto (#item-{id} o modo edición). */
export function ItemsListScrollAnchor({
  editingItemId,
  updatedNonce,
  updateErrorNonce,
}: ItemsListScrollAnchorProps) {
  useLayoutEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
    const fromHash = hash.startsWith("item-") ? hash : null;
    const fromEdit = editingItemId?.trim() ? `item-${editingItemId.trim()}` : null;
    const anchorId = fromHash ?? fromEdit;
    if (!anchorId) return;
    queueMicrotask(() => {
      document.getElementById(anchorId)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, [editingItemId, updatedNonce, updateErrorNonce]);

  return null;
}
