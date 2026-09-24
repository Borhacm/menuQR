import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { getPublicUploadUrl } from "@/lib/media-cdn";

type UploadStorageMode = "blob" | "local" | "external";

export class UploadStorageUnavailableError extends Error {}

function getUploadStorageMode(): UploadStorageMode {
  const raw = (process.env.UPLOAD_STORAGE_MODE ?? "").trim().toLowerCase();
  if (raw === "external") return "external";
  if (raw === "local") return "local";
  // Vercel Blob is used whenever its token is present (it is injected when a Blob store is linked).
  if (process.env.BLOB_READ_WRITE_TOKEN) return "blob";
  return "local";
}

function getExternalUploadBaseUrl() {
  return (process.env.UPLOAD_EXTERNAL_BASE_URL ?? "").trim().replace(/\/+$/, "");
}

function getExternalUploadToken() {
  return (process.env.UPLOAD_EXTERNAL_WRITE_TOKEN ?? "").trim();
}

async function saveToLocal(fileName: string, buffer: Buffer) {
  // Serverless filesystems (Vercel) are read-only and not served from /public: fail clearly instead.
  if (process.env.VERCEL) {
    throw new UploadStorageUnavailableError("No durable upload storage configured (link a Vercel Blob store)");
  }
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, fileName), buffer);
  return getPublicUploadUrl(fileName);
}

async function saveToBlob(fileName: string, buffer: Buffer, mime: string) {
  const blob = await put(`uploads/${fileName}`, buffer, {
    access: "public",
    contentType: mime,
    addRandomSuffix: false,
  });
  return blob.url;
}

async function saveToExternal(fileName: string, buffer: Buffer, mime: string) {
  const baseUrl = getExternalUploadBaseUrl();
  if (!baseUrl) {
    throw new UploadStorageUnavailableError("UPLOAD_EXTERNAL_BASE_URL is required when UPLOAD_STORAGE_MODE=external");
  }
  const token = getExternalUploadToken();
  const target = `${baseUrl}/uploads/${encodeURIComponent(fileName)}`;
  const response = await fetch(target, {
    method: "PUT",
    headers: {
      "content-type": mime,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: new Uint8Array(buffer),
  });
  if (!response.ok) {
    throw new Error(`External upload failed with status ${response.status}`);
  }
  return getPublicUploadUrl(fileName);
}

/** Stores the file and returns the public URL to reference it. */
export async function saveUpload(fileName: string, buffer: Buffer, mime: string): Promise<string> {
  const mode = getUploadStorageMode();
  if (mode === "blob") return saveToBlob(fileName, buffer, mime);
  if (mode === "external") return saveToExternal(fileName, buffer, mime);
  return saveToLocal(fileName, buffer);
}
