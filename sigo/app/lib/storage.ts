/**
 * Local-disk file storage for uploads (justificantes, later Papeleo docs) —
 * the default from sigo/PLAN.md §2 until a real bucket is configured.
 * Files live outside `public/` and are only ever served through the
 * authenticated route handler at app/api/archivos/[id], never directly.
 */
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function saveUpload(buffer: Buffer, originalName: string): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = path.extname(originalName).slice(0, 20);
  const key = `${randomUUID()}${ext}`;
  await writeFile(path.join(UPLOAD_DIR, key), buffer);
  return key;
}

export async function readUpload(storageKey: string): Promise<Buffer> {
  return readFile(path.join(UPLOAD_DIR, storageKey));
}
