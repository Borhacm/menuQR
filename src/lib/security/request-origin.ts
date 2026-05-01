function readSourceOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (origin) return origin;

  const referer = req.headers.get("referer");
  if (!referer) return null;
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

export function isTrustedRequestOrigin(req: Request) {
  const sourceOrigin = readSourceOrigin(req);
  if (!sourceOrigin) {
    return process.env.NODE_ENV !== "production";
  }
  try {
    return sourceOrigin === new URL(req.url).origin;
  } catch {
    return false;
  }
}
