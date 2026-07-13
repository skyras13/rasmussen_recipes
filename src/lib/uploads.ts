import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

// Images are stored on local disk and served through /api/uploads/[name].
// The directory is configurable so production can mount a volume; swapping
// this module for a CDN-backed store (UploadThing/Cloudinary) later only
// changes saveUpload's implementation, not its callers.

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
}

const ALLOWED_AUDIO_TYPES: Record<string, string> = {
  'audio/mpeg': '.mp3',
  'audio/mp4': '.m4a',
  'audio/x-m4a': '.m4a',
  'audio/ogg': '.ogg',
  'audio/webm': '.weba',
  'audio/wav': '.wav',
}

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024
export const MAX_AUDIO_BYTES = 20 * 1024 * 1024

export function uploadDir(): string {
  return path.resolve(process.env.UPLOAD_DIR ?? './uploads')
}

export class UploadError extends Error {}

async function persist(file: File, ext: string): Promise<string> {
  const name = `${randomUUID()}${ext}`
  await mkdir(uploadDir(), { recursive: true })
  await writeFile(
    path.join(uploadDir(), name),
    Buffer.from(await file.arrayBuffer()),
  )
  return `/api/uploads/${name}`
}

/** Persist an uploaded image and return its public URL. */
export async function saveUpload(file: File): Promise<string> {
  const ext = ALLOWED_TYPES[file.type]
  if (!ext) {
    throw new UploadError('Images must be JPEG, PNG, WebP, or GIF')
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError('Images must be 8 MB or smaller')
  }
  return persist(file, ext)
}

/** Persist an uploaded voice note and return its public URL. */
export async function saveAudioUpload(file: File): Promise<string> {
  const ext = ALLOWED_AUDIO_TYPES[file.type]
  if (!ext) {
    throw new UploadError('Voice notes must be MP3, M4A, OGG, WebM, or WAV')
  }
  if (file.size > MAX_AUDIO_BYTES) {
    throw new UploadError('Voice notes must be 20 MB or smaller')
  }
  return persist(file, ext)
}
