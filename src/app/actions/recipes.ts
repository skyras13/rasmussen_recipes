'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { currentUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseQuantity } from '@/lib/recipe-utils'
import { saveUpload, UploadError } from '@/lib/uploads'
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

  const images = formData
    .getAll('images')
    .filter((entry): entry is File => entry instanceof File && entry.size > 0)

  let imageUrls: string[]
  try {
    imageUrls = await Promise.all(images.map((file) => saveUpload(file)))
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
        create: imageUrls.map((url, i) => ({ url, isCover: i === 0 })),
      },
    },
    select: { id: true },
  })

  revalidatePath('/recipes')
  redirect(`/recipes/${recipe.id}`)
}
