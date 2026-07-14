'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Prisma } from '@prisma/client'
import { currentUserId } from '@/lib/auth'
import { canViewRecipe } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { scaleQuantity } from '@/lib/recipe-utils'

function normalize(text: string | null | undefined): string {
  return (text ?? '').trim().toLowerCase()
}

/**
 * Add a recipe's ingredients to the shopping list, scaled to `servings`.
 * Items that match an unchecked entry (same item + unit, case-insensitive)
 * merge by summing quantities instead of duplicating rows.
 */
export async function addRecipeToShoppingList(
  recipeId: string,
  servings: number,
): Promise<number> {
  const userId = await currentUserId()
  if (!userId) redirect('/login')

  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: { ingredients: { orderBy: { sortOrder: 'asc' } } },
  })
  if (!recipe || !(await canViewRecipe(recipe, userId))) {
    throw new Error('Recipe not found')
  }

  const target =
    Number.isFinite(servings) && servings >= 1 && servings <= 100
      ? Math.round(servings)
      : recipe.servings

  const existing = await prisma.shoppingListItem.findMany({
    where: { userId, checked: false },
  })
  const byKey = new Map(
    existing.map((row) => [
      `${normalize(row.item)}|${normalize(row.unit)}`,
      row,
    ]),
  )

  for (const ingredient of recipe.ingredients) {
    const quantity =
      ingredient.quantity !== null
        ? scaleQuantity(Number(ingredient.quantity), recipe.servings, target)
        : null
    const match = byKey.get(
      `${normalize(ingredient.item)}|${normalize(ingredient.unit)}`,
    )

    if (match && quantity !== null && match.quantity !== null) {
      await prisma.shoppingListItem.update({
        where: { id: match.id },
        data: {
          quantity: new Prisma.Decimal(Number(match.quantity) + quantity),
        },
      })
    } else if (!match) {
      await prisma.shoppingListItem.create({
        data: {
          userId,
          recipeTitle: recipe.title,
          quantity: quantity !== null ? new Prisma.Decimal(quantity) : null,
          unit: ingredient.unit,
          item: ingredient.item,
        },
      })
    }
    // match with unit-less/quantity-less rows: already on the list, skip.
  }

  revalidatePath('/shopping')
  return recipe.ingredients.length
}

/** Meal plan helper: add several recipes' ingredients in one go. */
export async function addRecipesToShoppingList(recipeIds: string[]) {
  for (const recipeId of recipeIds.slice(0, 10)) {
    await addRecipeToShoppingList(recipeId, NaN)
  }
  redirect('/shopping')
}

export async function toggleShoppingItem(itemId: string) {
  const userId = await currentUserId()
  if (!userId) redirect('/login')

  const item = await prisma.shoppingListItem.findUnique({
    where: { id: itemId },
  })
  if (!item || item.userId !== userId) return

  await prisma.shoppingListItem.update({
    where: { id: itemId },
    data: { checked: !item.checked },
  })
  revalidatePath('/shopping')
}

export async function removeShoppingItem(itemId: string) {
  const userId = await currentUserId()
  if (!userId) redirect('/login')

  await prisma.shoppingListItem.deleteMany({
    where: { id: itemId, userId },
  })
  revalidatePath('/shopping')
}

export async function clearCheckedItems() {
  const userId = await currentUserId()
  if (!userId) redirect('/login')

  await prisma.shoppingListItem.deleteMany({
    where: { userId, checked: true },
  })
  revalidatePath('/shopping')
}
