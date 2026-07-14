import Link from 'next/link'
import { redirect } from 'next/navigation'
import { addRecipesToShoppingList } from '@/app/actions/shopping'
import RecipeCard, { type RecipeCardData } from '@/components/RecipeCard'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

function isoWeek(date: Date): number {
  const utc = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  )
  const day = utc.getUTCDay() || 7
  utc.setUTCDate(utc.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1))
  return Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

export default async function MealPlan() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  // Saved recipes first; top up with trending public recipes. The week
  // number rotates the starting point so the plan changes weekly.
  const saves = await prisma.save.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      recipe: {
        include: {
          author: { select: { name: true, username: true } },
          images: { where: { isCover: true }, take: 1 },
        },
      },
    },
  })

  let pool = saves.map((save) => save.recipe)
  if (pool.length < WEEKDAYS.length) {
    const fill = await prisma.recipe.findMany({
      where: {
        visibility: 'PUBLIC',
        publishedAt: { not: null },
        id: { notIn: pool.map((recipe) => recipe.id) },
        authorId: { not: session.user.id },
      },
      orderBy: { likes: { _count: 'desc' } },
      take: WEEKDAYS.length - pool.length + 3,
      include: {
        author: { select: { name: true, username: true } },
        images: { where: { isCover: true }, take: 1 },
      },
    })
    pool = [...pool, ...fill]
  }

  const offset = pool.length > 0 ? isoWeek(new Date()) % pool.length : 0
  const plan = Array.from(
    { length: Math.min(WEEKDAYS.length, pool.length) },
    (_, i) => pool[(offset + i) % pool.length],
  )
  // Dedupe in case the rotation wrapped a small pool.
  const seen = new Set<string>()
  const planned = plan.filter((recipe) => {
    if (seen.has(recipe.id)) return false
    seen.add(recipe.id)
    return true
  })

  const cards: Array<{ day: string; card: RecipeCardData }> = planned.map(
    (recipe, i) => ({
      day: WEEKDAYS[i],
      card: {
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        cuisine: recipe.cuisine,
        prepMin: recipe.prepMin,
        cookMin: recipe.cookMin,
        visibility: recipe.visibility,
        coverUrl: recipe.images[0]?.url ?? null,
        authorName: recipe.author.name,
        authorUsername: recipe.author.username,
      },
    }),
  )

  return (
    <div className='container mx-auto p-4'>
      <div className='flex flex-wrap items-center justify-between gap-3 mb-2'>
        <h1 className='text-4xl font-bold'>This week&apos;s plan</h1>
        {cards.length > 0 && (
          <form
            action={addRecipesToShoppingList.bind(
              null,
              cards.map(({ card }) => card.id),
            )}
          >
            <button type='submit' className='btn btn-primary'>
              🛒 Add the week to my shopping list
            </button>
          </form>
        )}
      </div>
      <p className='text-base-content/70 mb-8'>
        Built from your saved recipes (topped up with trending ones). It rotates
        every week — save more recipes to shape it.
      </p>

      {cards.length === 0 ? (
        <div className='hero py-24 bg-base-200 rounded-box'>
          <div className='hero-content text-center'>
            <div>
              <p className='text-lg mb-4'>
                Nothing to plan with yet — save a few recipes first.
              </p>
              <Link href='/recipes' className='btn btn-primary'>
                Explore recipes
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4'>
          {cards.map(({ day, card }) => (
            <div key={card.id}>
              <p className='font-semibold mb-2'>{day}</p>
              <RecipeCard recipe={card} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
