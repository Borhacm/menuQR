import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/rate-limit";
import { logEvent, metricIncr } from "@/lib/observability";
import { getPublicUploadUrl } from "@/lib/media-cdn";
import { isTrustedRequestOrigin } from "@/lib/security/request-origin";
import { saveUpload } from "@/lib/upload-storage";
import sharp from "sharp";

const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function hasValidFileSignature(buffer: Buffer, mime: string) {
  if (mime === "image/jpeg") {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mime === "image/png") {
    return (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }
  if (mime === "image/gif") {
    if (buffer.length < 6) return false;
    const signature = buffer.subarray(0, 6).toString("ascii");
    return signature === "GIF87a" || signature === "GIF89a";
  }
  if (mime === "image/webp") {
    if (buffer.length < 12) return false;
    const riff = buffer.subarray(0, 4).toString("ascii");
    const webp = buffer.subarray(8, 12).toString("ascii");
    return riff === "RIFF" && webp === "WEBP";
  }
  return false;
}

async function normalizeQrLogo(buffer: Buffer) {
  return sharp(buffer)
    .rotate()
    .resize(512, 512, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();
}

export async function POST(req: Request) {
  if (!isTrustedRequestOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ip = getClientIpFromHeaders(req.headers);
  const rl = checkRateLimit({
    key: `upload:${session.user.id}:${ip}`,
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });
  if (!rl.allowed) {
    metricIncr("upload_rate_limited_total");
    return NextResponse.json({ error: "Too many upload requests" }, { status: 429 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const purpose = String(formData.get("purpose") ?? "").trim().toLowerCase();
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }
  if (!(file.type in MIME_EXT)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const originalBuffer = Buffer.from(bytes);
  if (!hasValidFileSignature(originalBuffer, file.type)) {
    return NextResponse.json({ error: "Invalid file signature" }, { status: 400 });
  }
  const isQrLogoUpload = purpose === "qr-logo";
  const storedBuffer = isQrLogoUpload ? await normalizeQrLogo(originalBuffer) : originalBuffer;
  const storedMime = isQrLogoUpload ? "image/png" : file.type;
  const ext = isQrLogoUpload ? "png" : MIME_EXT[file.type];
  const fileName = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
  await saveUpload(fileName, storedBuffer, storedMime);
  metricIncr("upload_success_total");
  logEvent("info", "upload.success", {
    userId: session.user.id,
    fileName,
    mime: storedMime,
    originalMime: file.type,
    purpose: purpose || "generic",
    size: file.size,
  });

  return NextResponse.json({ url: getPublicUploadUrl(fileName) });
}
