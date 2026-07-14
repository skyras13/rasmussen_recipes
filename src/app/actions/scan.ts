'use server'

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { redirect } from 'next/navigation'
import { aiEnabled, extractRecipeFromImage } from '@/lib/ai'
import { currentUserId } from '@/lib/auth'
import { saveUpload, UploadError, uploadDir } from '@/lib/uploads'
import type { RecipeFormInitial } from '@/components/RecipeForm'

export type ScanResult =
  { ok: true; initial: RecipeFormInitial } | { ok: false; error: string }

const MEDIA_TYPES: Record<
  string,
  'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
> = {
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
}

export async function scanRecipeCard(formData: FormData): Promise<ScanResult> {
  const userId = await currentUserId()
  if (!userId) redirect('/login')

  if (!aiEnabled()) {
    return {
      ok: false,
      error:
        'AI scanning is not configured. Set ANTHROPIC_API_KEY on the server to enable it.',
    }
  }

  const photo = formData.get('photo')
  if (!(photo instanceof File) || photo.size === 0) {
    return { ok: false, error: 'Choose a photo of the recipe first.' }
  }

  // Persist first so the original card survives as an heirloom artifact.
  let cardUrl: string
  try {
    cardUrl = await saveUpload(photo)
  } catch (error) {
    if (error instanceof UploadError) return { ok: false, error: error.message }
    throw error
  }

  const fileName = cardUrl.split('/').pop()!
  const mediaType = MEDIA_TYPES[path.extname(fileName)]
  const bytes = await readFile(path.join(uploadDir(), fileName))

  try {
    const recipe = await extractRecipeFromImage(
      bytes.toString('base64'),
      mediaType,
    )
    return {
      ok: true,
      initial: {
        banner:
          'Read from your photo — double-check everything before publishing.',
        originalCardUrl: cardUrl,
        title: recipe.title,
        description: recipe.description,
        story: recipe.story,
        originalAuthor: '',
        originEra: '',
        originPlace: '',
        servings: recipe.servings,
        prepMin: recipe.prepMin,
        cookMin: recipe.cookMin,
        difficulty: 'MEDIUM',
        cuisine: recipe.cuisine,
        tags: recipe.tags,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
      },
    }
  } catch {
    return {
      ok: false,
      error:
        'Could not read a recipe from that photo. Try a sharper, straight-on shot.',
    }
  }
}
