"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { ActionSubmitButton } from "@/components/admin/action-submit-button";
import { shouldOptimizeImageSrc } from "@/lib/images";

type StockPickerLabels = {
  uploading: string;
  uploadFailedRetry: string;
  invalidUploadUrl: string;
  uploadReady: string;
  uploadFailedConnection: string;
  uploadImage: string;
  searchUnsplash: string;
  searchPexels: string;
  inputPlaceholder: string;
  helper: string;
  defaultQuery: string;
  unsplashAdjustedNotice: string;
  invalidUrlHelp: string;
  unsupportedStockPageHelp: string;
};

export type ItemEditPhotosPanelProps = {
  itemId: string;
  itemName: string;
  images: { id: string; url: string; alt: string | null }[];
  photosTitle: string;
  imageUrlFieldLabel: string;
  addPhotoLabel: string;
  maxPhotosReachedLabel: string;
  deletePhotoAria: string;
  deletePhotoConfirm: string;
  imagePickerLabels: StockPickerLabels;
  deleteImageAction: (formData: FormData) => void | Promise<void>;
  appendImageAction: (formData: FormData) => void | Promise<void>;
};

const ItemImagePickerClient = dynamic(
  () =>
    import("@/components/admin/item-image-picker").then((m) => ({
      default: m.ItemImagePicker,
    })),
  { ssr: false },
);

export function ItemEditPhotosPanel({
  itemId,
  itemName,
  images,
  photosTitle,
  imageUrlFieldLabel,
  addPhotoLabel,
  maxPhotosReachedLabel,
  deletePhotoAria,
  deletePhotoConfirm,
  imagePickerLabels,
  deleteImageAction,
  appendImageAction,
}: ItemEditPhotosPanelProps) {
  const canAddPhoto = images.length < 5;
  const appendFormId = `append-item-image-${itemId}`;
  return (
    <div className="space-y-3 border-t border-border pt-3">
      <p className="text-xs font-medium text-muted-foreground">{photosTitle}</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {images.map((img) => (
          <div
            key={img.id}
            className="relative aspect-square overflow-hidden rounded-md border bg-muted"
          >
            <Image
              src={img.url}
              alt={img.alt ?? itemName}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 28vw, 120px"
              unoptimized={!shouldOptimizeImageSrc(img.url)}
            />
            <form id={`del-img-${img.id}`} action={deleteImageAction} className="absolute right-0.5 top-0.5">
              <input type="hidden" name="itemId" value={itemId} />
              <input type="hidden" name="imageId" value={img.id} />
            </form>
            <ActionSubmitButton
              type="button"
              form={`del-img-${img.id}`}
              size="sm"
              variant="destructive"
              className="absolute right-0.5 top-0.5 h-7 w-7 p-0 shadow-sm"
              idleLabel="×"
              pendingLabel="…"
              confirmMessage={deletePhotoConfirm}
              aria-label={deletePhotoAria}
            />
          </div>
        ))}
      </div>
      {canAddPhoto ? (
        <form
          id={appendFormId}
          action={appendImageAction}
          className="space-y-2 rounded-md border border-dashed border-border p-2"
        >
          <input type="hidden" name="itemId" value={itemId} />
          <p className="text-xs font-medium text-muted-foreground">{imageUrlFieldLabel}</p>
          <ItemImagePickerClient
            dishName={itemName}
            labels={imagePickerLabels}
            uploadOnly
            uploadButtonLabel={addPhotoLabel}
            autoSubmitFormId={appendFormId}
          />
        </form>
      ) : (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-xs text-amber-300">
          {maxPhotosReachedLabel}
        </p>
      )}
    </div>
  );
}
