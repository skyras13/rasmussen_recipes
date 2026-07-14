'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { currentUserId } from '@/lib/auth'
import { canViewRecipe } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { parseQuantity } from '@/lib/recipe-utils'
import { saveAudioUpload, saveUpload, UploadError } from '@/lib/uploads'
import { recipeSchema } from '@/lib/validation'

export type RecipeFormState = { error: string | null }

function collectRows(formData: FormData, field: string): string[] {
  return formData.getAll(field).map((value) => String(value))
}

export async function createRecipe(
  _prev: RecipeFormState,
  formData: FormData,
): Promise<RecipeFormState> {
  const userId = await currentUserId()
  if (!userId) redirect('/login')

  const items = collectRows(formData, 'ingredient-item')
  const ingredients = items
    .map((item, i) => ({
      quantity: collectRows(formData, 'ingredient-quantity')[i] ?? '',
      unit: collectRows(formData, 'ingredient-unit')[i] ?? '',
      item,
      note: collectRows(formData, 'ingredient-note')[i] ?? '',
    }))
    .filter((row) => row.item.trim().length > 0)

  const steps = collectRows(formData, 'step-text')
    .map((text) => ({ text }))
    .filter((row) => row.text.trim().length > 0)

  const tags = String(formData.get('tags') ?? '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)

  const parsed = recipeSchema.safeParse({
    title: formData.get('title'),
    description: String(formData.get('description') ?? '') || undefined,
    story: String(formData.get('story') ?? '') || undefined,
    originalAuthor: String(formData.get('originalAuthor') ?? '') || undefined,
    originEra: String(formData.get('originEra') ?? '') || undefined,
    originPlace: String(formData.get('originPlace') ?? '') || undefined,
    familyId: String(formData.get('familyId') ?? '') || undefined,
    forkedFromId: String(formData.get('forkedFromId') ?? '') || undefined,
    servings: formData.get('servings'),
    prepMin: String(formData.get('prepMin') ?? '') || undefined,
    cookMin: String(formData.get('cookMin') ?? '') || undefined,
    difficulty: formData.get('difficulty'),
    cuisine: String(formData.get('cuisine') ?? '') || undefined,
    tags,
    visibility: formData.get('visibility'),
    ingredients,
    steps,
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }
  const data = parsed.data

  // Family attribution requires membership in that family.
  if (data.familyId) {
    const membership = await prisma.familyMember.findUnique({
      where: {
        userId_familyId: { userId, familyId: data.familyId },
      },
    })
    if (!membership) return { error: 'You are not in that family group' }
  }

  // Forks must point at a recipe the author can actually see.
  if (data.forkedFromId) {
    const original = await prisma.recipe.findUnique({
      where: { id: data.forkedFromId },
      select: { visibility: true, authorId: true, familyId: true },
    })
    if (!original || !(await canViewRecipe(original, userId))) {
      return { error: 'Original recipe not found' }
    }
  }

  const images = formData
    .getAll('images')
    .filter((entry): entry is File => entry instanceof File && entry.size > 0)

  // Scanned recipe card (already uploaded by the scan action). Only our own
  // uploads route is accepted, so arbitrary URLs can't be attached.
  const originalCardUrl = String(formData.get('originalCardUrl') ?? '')
  const validCardUrl =
    /^\/api\/uploads\/[0-9a-f-]{36}\.(jpg|png|webp|gif)$/.test(originalCardUrl)
      ? originalCardUrl
      : null

  const voiceNote = formData.get('voiceNote')

  let imageUrls: string[]
  let audioUrl: string | null = null
  try {
    imageUrls = await Promise.all(images.map((file) => saveUpload(file)))
    if (voiceNote instanceof File && voiceNote.size > 0) {
      audioUrl = await saveAudioUpload(voiceNote)
    }
  } catch (error) {
    if (error instanceof UploadError) return { error: error.message }
    throw error
  }

  const recipe = await prisma.recipe.create({
    data: {
      authorId: userId,
      title: data.title,
      description: data.description,
      story: data.story,
      originalAuthor: data.originalAuthor,
      originEra: data.originEra,
      originPlace: data.originPlace,
      familyId: data.familyId,
      forkedFromId: data.forkedFromId,
      audioUrl,
      servings: data.servings,
      prepMin: data.prepMin,
      cookMin: data.cookMin,
      difficulty: data.difficulty,
      cuisine: data.cuisine,
      tags: data.tags,
      visibility: data.visibility,
      publishedAt: data.visibility === 'PRIVATE' ? null : new Date(),
      ingredients: {
        create: data.ingredients.map((row, i) => ({
          quantity: row.quantity ? parseQuantity(row.quantity) : null,
          unit: row.unit || null,
          item: row.item,
          note: row.note || null,
          sortOrder: i,
        })),
      },
      steps: {
        create: data.steps.map((row, i) => ({
          text: row.text,
          sortOrder: i,
        })),
      },
      images: {
        create: [
          ...imageUrls.map((url, i) => ({ url, isCover: i === 0 })),
          ...(validCardUrl
            ? [
                {
                  url: validCardUrl,
                  isCover: imageUrls.length === 0,
                  isOriginalCard: true,
                },
              ]
            : []),
        ],
      },
    },
    select: { id: true },
  })

  revalidatePath('/recipes')
  redirect(`/recipes/${recipe.id}`)
}
