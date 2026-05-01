export function getCdnBaseUrl() {
  return (process.env.IMAGE_CDN_BASE_URL || "").replace(/\/+$/, "");
}

export function getPublicUploadUrl(fileName: string) {
  const base = getCdnBaseUrl();
  if (!base) return `/uploads/${fileName}`;
  return `${base}/uploads/${fileName}`;
}

export function buildVariantUrl(src: string, width: number, format: "webp" | "original" = "webp") {
  const separator = src.includes("?") ? "&" : "?";
  return `${src}${separator}w=${width}&fm=${format}`;
}
