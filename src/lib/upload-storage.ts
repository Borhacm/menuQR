import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

type UploadStorageMode = "local" | "external";

function getUploadStorageMode(): UploadStorageMode {
  const raw = (process.env.UPLOAD_STORAGE_MODE ?? "local").trim().toLowerCase();
  return raw === "external" ? "external" : "local";
}

function getExternalUploadBaseUrl() {
  return (process.env.UPLOAD_EXTERNAL_BASE_URL ?? "").trim().replace(/\/+$/, "");
}

function getExternalUploadToken() {
  return (process.env.UPLOAD_EXTERNAL_WRITE_TOKEN ?? "").trim();
}

async function saveToLocal(fileName: string, buffer: Buffer) {
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, fileName), buffer);
}

async function saveToExternal(fileName: string, buffer: Buffer, mime: string) {
  const baseUrl = getExternalUploadBaseUrl();
  if (!baseUrl) {
    throw new Error("UPLOAD_EXTERNAL_BASE_URL is required when UPLOAD_STORAGE_MODE=external");
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
}

export async function saveUpload(fileName: string, buffer: Buffer, mime: string) {
  if (getUploadStorageMode() === "external") {
    await saveToExternal(fileName, buffer, mime);
    return;
  }
  await saveToLocal(fileName, buffer);
}

