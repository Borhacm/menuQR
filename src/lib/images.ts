const OPTIMIZED_HOSTS = [
  "images.unsplash.com",
  "source.unsplash.com",
  "lh3.googleusercontent.com",
  "avatars.githubusercontent.com",
  "res.cloudinary.com",
  "images.pexels.com",
  "cdn.pixabay.com",
] as const;

function isHttpUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}

export function shouldOptimizeImageSrc(src: string): boolean {
  if (!src || !isHttpUrl(src)) return true;

  try {
    const hostname = new URL(src).hostname.toLowerCase();
    const cdnBase = process.env.IMAGE_CDN_BASE_URL;
    if (cdnBase) {
      try {
        const cdnHost = new URL(cdnBase).hostname.toLowerCase();
        if (hostname === cdnHost || hostname.endsWith(`.${cdnHost}`)) return true;
      } catch {
        // Ignore malformed IMAGE_CDN_BASE_URL and continue with host list fallback.
      }
    }
    return OPTIMIZED_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

