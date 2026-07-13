import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { NextRequest, NextResponse } from 'next/server'
import { uploadDir } from '@/lib/uploads'

const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params

  // Uploaded names are always "<uuid><ext>"; anything else is rejected,
  // which also rules out path traversal.
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp|gif)$/.test(name)) {
    return new NextResponse('Not found', { status: 404 })
  }

  const contentType = CONTENT_TYPES[path.extname(name)]
  try {
    const data = await readFile(path.join(uploadDir(), name))
    return new NextResponse(new Uint8Array(data), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}
