import { redirect } from 'next/navigation'
import RecipeForm, { type RecipeFormInitial } from '@/components/RecipeForm'
import { auth } from '@/lib/auth'
import { canViewRecipe } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { formatQuantity } from '@/lib/recipe-utils'

export default async function NewRecipe({
  searchParams,
}: {
  searchParams: Promise<{ fork?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const { fork } = await searchParams

  const families = (
    await prisma.familyMember.findMany({
      where: { userId: session.user.id },
      include: { family: { select: { id: true, name: true } } },
    })
  ).map((membership) => membership.family)

  // Forking prefills the form with the original recipe.
  let initial: RecipeFormInitial | undefined
  if (fork) {
    const original = await prisma.recipe.findUnique({
      where: { id: fork },
      include: {
        ingredients: { orderBy: { sortOrder: 'asc' } },
        steps: { orderBy: { sortOrder: 'asc' } },
      },
    })
    if (original && (await canViewRecipe(original, session.user.id))) {
      initial = {
        forkedFromId: original.id,
        forkedFromTitle: original.title,
        title: `${original.title} (my version)`,
        description: original.description ?? '',
        story: original.story ?? '',
        originalAuthor: original.originalAuthor ?? '',
        originEra: original.originEra ?? '',
        originPlace: original.originPlace ?? '',
        servings: original.servings,
        prepMin: original.prepMin,
        cookMin: original.cookMin,
        difficulty: original.difficulty,
        cuisine: original.cuisine ?? '',
        tags: original.tags.join(', '),
        ingredients: original.ingredients.map((ingredient) => ({
          quantity: ingredient.quantity
            ? formatQuantity(Number(ingredient.quantity))
            : '',
          unit: ingredient.unit ?? '',
          item: ingredient.item,
          note: ingredient.note ?? '',
        })),
        steps: original.steps.map((step) => step.text),
      }
    }
  }

  return (
    <div className='container mx-auto p-4 max-w-3xl'>
      <h1 className='text-4xl font-bold mb-6'>
        {initial ? 'Remix recipe' : 'New recipe'}
      </h1>
      <RecipeForm families={families} initial={initial} />
    </div>
  )
}
