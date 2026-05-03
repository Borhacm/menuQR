"use client";

import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";

type UploadState = "idle" | "uploading" | "error" | "success";

function normalizeExternalImageUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();
    const pathSegments = url.pathname.split("/").filter(Boolean);

    // If user pastes an Unsplash page URL, convert it to a direct image redirect URL.
    if (host === "unsplash.com" || host.endsWith(".unsplash.com")) {
      const photosIdx = pathSegments.findIndex((segment) => segment === "photos");
      const photoId = photosIdx >= 0 ? pathSegments[photosIdx + 1] : undefined;
      if (photoId && !photoId.startsWith("download")) {
        return `https://unsplash.com/photos/${photoId}/download?force=true&w=1600`;
      }
      const lastSegment = pathSegments[pathSegments.length - 1];
      const guessedId = lastSegment?.split("-").pop();
      if (guessedId && guessedId.length >= 8) {
        return `https://unsplash.com/photos/${guessedId}/download?force=true&w=1600`;
      }
    }

    // If user pastes a Pexels page URL, convert it to a direct images.pexels URL.
    if (host === "pexels.com" || host === "www.pexels.com") {
      const numericSegment = [...pathSegments].reverse().find((segment) => /^\d+$/.test(segment));
      if (numericSegment) {
        return `https://images.pexels.com/photos/${numericSegment}/pexels-photo-${numericSegment}.jpeg?auto=compress&cs=tinysrgb&w=1600`;
      }
    }
  } catch {
    return trimmed;
  }

  return trimmed;
}

function validateImageUrl(urlValue: string): "invalid_url" | "unsupported_page_url" | null {
  const trimmed = urlValue.trim();
  if (!trimmed) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return "invalid_url";
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return "invalid_url";
  }

  const host = url.hostname.toLowerCase();
  const pathname = url.pathname.toLowerCase();
  if (host === "unsplash.com" || host.endsWith(".unsplash.com")) {
    if (!pathname.includes("/download")) return "unsupported_page_url";
  }
  if (host === "pexels.com" || host === "www.pexels.com") {
    return "unsupported_page_url";
  }
  return null;
}

export function ItemImagePicker({
  name = "imageUrl",
  dishName,
  onImageUrlChange,
  uploadOnly = false,
  uploadButtonLabel,
  autoSubmitFormId,
  labels,
}: {
  name?: string;
  dishName?: string;
  onImageUrlChange?: (url: string) => void;
  uploadOnly?: boolean;
  uploadButtonLabel?: string;
  autoSubmitFormId?: string;
  labels: {
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
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [message, setMessage] = useState("");
  const [showAdjustedNotice, setShowAdjustedNotice] = useState(false);
  const [urlValidationMessage, setUrlValidationMessage] = useState("");

  async function onPickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadState("uploading");
    setMessage(labels.uploading);

    const body = new FormData();
    body.append("file", file);

    try {
      const res = await fetch("/api/uploads", {
        method: "POST",
        body,
      });

      if (!res.ok) {
        setUploadState("error");
        setMessage(labels.uploadFailedRetry);
        return;
      }

      const data = (await res.json()) as { url?: string };
      if (!data.url) {
        setUploadState("error");
        setMessage(labels.invalidUploadUrl);
        return;
      }

      setImageUrl(data.url);
      onImageUrlChange?.(data.url);
      setUploadState("success");
      setMessage(labels.uploadReady);
      if (autoSubmitFormId) {
        const form = document.getElementById(autoSubmitFormId);
        if (form instanceof HTMLFormElement) {
          form.requestSubmit();
        }
      }
    } catch {
      setUploadState("error");
      setMessage(labels.uploadFailedConnection);
    }
  }

  function getSuggestedQuery() {
    return dishName?.trim() || labels.defaultQuery;
  }

  function openStockSearch(provider: "unsplash" | "pexels") {
    const query = encodeURIComponent(getSuggestedQuery());
    const url =
      provider === "unsplash"
        ? `https://unsplash.com/s/photos/${query}`
        : `https://www.pexels.com/search/${query}/`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={imageUrl} />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent/10"
        >
          {uploadButtonLabel ?? labels.uploadImage}
        </button>
        {!uploadOnly ? (
          <button
            type="button"
            onClick={() => openStockSearch("unsplash")}
            className="rounded-md border px-3 py-2 text-sm hover:bg-accent/10"
          >
            {labels.searchUnsplash}
          </button>
        ) : null}
        {!uploadOnly ? (
          <button
            type="button"
            onClick={() => openStockSearch("pexels")}
            className="rounded-md border px-3 py-2 text-sm hover:bg-accent/10"
          >
            {labels.searchPexels}
          </button>
        ) : null}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        aria-label={labels.uploadImage}
        title={labels.uploadImage}
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={onPickFile}
      />

      {!uploadOnly ? (
        <Input
          aria-label={labels.inputPlaceholder}
          value={imageUrl}
          onChange={(event) => {
            const rawValue = event.target.value;
            const normalizedUrl = normalizeExternalImageUrl(rawValue);
            setShowAdjustedNotice(Boolean(rawValue.trim()) && normalizedUrl !== rawValue.trim());
            setImageUrl(normalizedUrl);
            onImageUrlChange?.(normalizedUrl);
            const issue = validateImageUrl(normalizedUrl);
            if (issue === "invalid_url") {
              setUrlValidationMessage(labels.invalidUrlHelp);
            } else if (issue === "unsupported_page_url") {
              setUrlValidationMessage(labels.unsupportedStockPageHelp);
            } else {
              setUrlValidationMessage("");
            }
          }}
          placeholder={labels.inputPlaceholder}
        />
      ) : null}

      {!uploadOnly && showAdjustedNotice ? (
        <p className="text-xs text-muted-foreground">{labels.unsplashAdjustedNotice}</p>
      ) : null}

      {!uploadOnly ? (
        <p className="text-xs text-muted-foreground">
        {labels.helper}
        </p>
      ) : null}

      {!uploadOnly && urlValidationMessage ? (
        <p className="text-xs text-amber-400">{urlValidationMessage}</p>
      ) : null}

      {uploadState !== "idle" ? (
        <p
          className={`text-xs ${
            uploadState === "error"
              ? "text-destructive"
              : uploadState === "success"
                ? "text-emerald-400"
                : "text-muted-foreground"
          }`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

