import { notFound } from 'next/navigation'
import CookMode from '@/components/CookMode'
import { currentUserId } from '@/lib/auth'
import { canViewRecipe } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

export default async function CookPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const userId = await currentUserId()

  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      ingredients: { orderBy: { sortOrder: 'asc' } },
      steps: { orderBy: { sortOrder: 'asc' } },
    },
  })
  if (
    !recipe ||
    recipe.steps.length === 0 ||
    !(await canViewRecipe(recipe, userId))
  ) {
    notFound()
  }

  return (
    <CookMode
      recipeId={recipe.id}
      title={recipe.title}
      servings={recipe.servings}
      ingredients={recipe.ingredients.map((ingredient) => ({
        id: ingredient.id,
        quantity: ingredient.quantity ? Number(ingredient.quantity) : null,
        unit: ingredient.unit,
        item: ingredient.item,
        note: ingredient.note,
      }))}
      steps={recipe.steps.map((step) => ({
        id: step.id,
        text: step.text,
        timerSeconds: step.timerSeconds,
      }))}
    />
  )
}
