import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import RecipeCard, { type RecipeCardData } from '@/components/RecipeCard'

export default async function Recipes() {
  const session = await auth()

  const recipes = await prisma.recipe.findMany({
    where: { visibility: 'PUBLIC', publishedAt: { not: null } },
    orderBy: { publishedAt: 'desc' },
    take: 48,
    include: {
      author: { select: { name: true, username: true } },
      images: { where: { isCover: true }, take: 1 },
    },
  })

  const cards: RecipeCardData[] = recipes.map((recipe) => ({
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
  }))

  return (
    <div className='container mx-auto p-4'>
      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-4xl font-bold'>Recipes</h1>
        {session?.user && (
          <Link href='/recipes/new' className='btn btn-primary'>
            + New recipe
          </Link>
        )}
      </div>
      {cards.length === 0 ? (
        <div className='hero py-24 bg-base-200 rounded-box'>
          <div className='hero-content text-center'>
            <div>
              <p className='text-lg mb-4'>No recipes yet — be the first!</p>
              <Link
                href={session?.user ? '/recipes/new' : '/signup'}
                className='btn btn-primary'
              >
                {session?.user ? 'Add a recipe' : 'Join to add one'}
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
          {cards.map((card) => (
            <RecipeCard key={card.id} recipe={card} />
          ))}
        </div>
      )}
    </div>
  )
}
