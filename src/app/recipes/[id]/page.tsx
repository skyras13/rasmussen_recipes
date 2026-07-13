import Link from 'next/link'
import { notFound } from 'next/navigation'
import IngredientList from '@/components/IngredientList'
import { currentUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function canView(
  recipe: { visibility: string; authorId: string; familyId: string | null },
  userId: string | null,
): Promise<boolean> {
  if (recipe.visibility === 'PUBLIC') return true
  if (!userId) return false
  if (recipe.authorId === userId) return true
  if (recipe.visibility === 'PRIVATE') return false

  // FAMILY: visible to members of the recipe's family, or (when no family
  // is set) anyone who shares a family group with the author.
  if (recipe.familyId) {
    const membership = await prisma.familyMember.findUnique({
      where: { userId_familyId: { userId, familyId: recipe.familyId } },
    })
    return membership !== null
  }
  const shared = await prisma.familyMember.findFirst({
    where: {
      userId,
      family: { members: { some: { userId: recipe.authorId } } },
    },
  })
  return shared !== null
}

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const userId = await currentUserId()

  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, username: true } },
      ingredients: { orderBy: { sortOrder: 'asc' } },
      steps: { orderBy: { sortOrder: 'asc' } },
      images: { orderBy: [{ isCover: 'desc' }, { createdAt: 'asc' }] },
    },
  })
  if (!recipe || !(await canView(recipe, userId))) notFound()

  const cover = recipe.images[0]
  const totalMin = (recipe.prepMin ?? 0) + (recipe.cookMin ?? 0)

  // Decimal isn't serializable across the server/client boundary.
  const ingredients = recipe.ingredients.map((ingredient) => ({
    id: ingredient.id,
    quantity: ingredient.quantity ? Number(ingredient.quantity) : null,
    unit: ingredient.unit,
    item: ingredient.item,
    note: ingredient.note,
  }))

  return (
    <article className='container mx-auto p-4 max-w-4xl'>
      {cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cover.url}
          alt={recipe.title}
          className='w-full max-h-[28rem] object-cover rounded-box mb-6'
        />
      )}

      <header className='mb-6'>
        <div className='flex flex-wrap items-center gap-2 mb-2'>
          <h1 className='text-4xl font-bold flex-1'>{recipe.title}</h1>
          {recipe.visibility !== 'PUBLIC' && (
            <span className='badge badge-ghost'>
              {recipe.visibility === 'FAMILY' ? 'Family only' : 'Private'}
            </span>
          )}
        </div>
        <p className='text-base-content/70'>
          by{' '}
          <span className='font-medium'>
            {recipe.author.name} (@{recipe.author.username})
          </span>
        </p>
        {recipe.description && (
          <p className='mt-3 text-lg'>{recipe.description}</p>
        )}
        <div className='flex flex-wrap gap-2 mt-4'>
          {totalMin > 0 && (
            <span className='badge badge-outline'>{totalMin} min total</span>
          )}
          {recipe.prepMin != null && (
            <span className='badge badge-outline'>
              {recipe.prepMin} min prep
            </span>
          )}
          {recipe.cookMin != null && (
            <span className='badge badge-outline'>
              {recipe.cookMin} min cook
            </span>
          )}
          <span className='badge badge-outline capitalize'>
            {recipe.difficulty.toLowerCase()}
          </span>
          {recipe.cuisine && (
            <span className='badge badge-outline'>{recipe.cuisine}</span>
          )}
          {recipe.tags.map((tag) => (
            <span key={tag} className='badge badge-ghost'>
              #{tag}
            </span>
          ))}
        </div>
      </header>

      {recipe.story && (
        <section className='mb-8 p-4 bg-base-200 rounded-box'>
          <h2 className='text-sm font-semibold uppercase tracking-wide text-base-content/60 mb-2'>
            The story
          </h2>
          <p className='whitespace-pre-line'>{recipe.story}</p>
        </section>
      )}

      <div className='grid grid-cols-1 md:grid-cols-[minmax(16rem,1fr)_2fr] gap-8'>
        <section>
          <IngredientList
            ingredients={ingredients}
            baseServings={recipe.servings}
          />
        </section>

        <section>
          <h2 className='text-xl font-semibold mb-4'>Steps</h2>
          <ol className='space-y-4'>
            {recipe.steps.map((step, i) => (
              <li key={step.id} className='flex gap-3'>
                <span className='badge badge-neutral mt-0.5'>{i + 1}</span>
                <p className='whitespace-pre-line'>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {recipe.images.length > 1 && (
        <section className='mt-10'>
          <h2 className='text-xl font-semibold mb-4'>Photos</h2>
          <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
            {recipe.images.slice(1).map((image) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={image.id}
                src={image.url}
                alt={recipe.title}
                className='aspect-square object-cover rounded-box'
              />
            ))}
          </div>
        </section>
      )}

      <div className='mt-10'>
        <Link href='/recipes' className='btn btn-ghost'>
          ← All recipes
        </Link>
      </div>
    </article>
  )
}
