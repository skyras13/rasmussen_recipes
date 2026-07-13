import Link from 'next/link'
import { redirect } from 'next/navigation'
import RecipeCard, { type RecipeCardData } from '@/components/RecipeCard'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function SavedRecipes() {
  const session = await auth()
  if (!session?.user) redirect('/login')

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

  const cards: RecipeCardData[] = saves.map(({ recipe }) => ({
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
      <h1 className='text-4xl font-bold mb-6'>Saved recipes</h1>
      {cards.length === 0 ? (
        <div className='hero py-24 bg-base-200 rounded-box'>
          <div className='hero-content text-center'>
            <div>
              <p className='text-lg mb-4'>
                Nothing saved yet — tap 🔖 on any recipe to keep it here.
              </p>
              <Link href='/recipes' className='btn btn-primary'>
                Browse recipes
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
