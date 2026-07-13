import Link from 'next/link'
import { redirect } from 'next/navigation'
import RecipeCard, { type RecipeCardData } from '@/components/RecipeCard'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function UserProfile() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      recipes: {
        orderBy: { createdAt: 'desc' },
        include: { images: { where: { isCover: true }, take: 1 } },
      },
      _count: { select: { recipes: true, followers: true, following: true } },
    },
  })
  if (!user) redirect('/login')

  const cards: RecipeCardData[] = user.recipes.map((recipe) => ({
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    cuisine: recipe.cuisine,
    prepMin: recipe.prepMin,
    cookMin: recipe.cookMin,
    visibility: recipe.visibility,
    coverUrl: recipe.images[0]?.url ?? null,
    authorName: user.name,
    authorUsername: user.username,
  }))

  return (
    <div className='container mx-auto p-4'>
      <header className='flex items-center gap-6 mb-8'>
        <div className='avatar avatar-placeholder'>
          <div className='bg-primary text-primary-content w-20 rounded-full'>
            <span className='text-3xl'>
              {user.name.slice(0, 1).toUpperCase()}
            </span>
          </div>
        </div>
        <div className='flex-1'>
          <h1 className='text-3xl font-bold'>{user.name}</h1>
          <p className='text-base-content/60'>@{user.username}</p>
          {user.bio && <p className='mt-1'>{user.bio}</p>}
          <div className='flex gap-4 mt-2 text-sm text-base-content/70'>
            <span>
              <strong>{user._count.recipes}</strong> recipes
            </span>
            <span>
              <strong>{user._count.followers}</strong> followers
            </span>
            <span>
              <strong>{user._count.following}</strong> following
            </span>
          </div>
        </div>
        <Link href='/recipes/new' className='btn btn-primary'>
          + New recipe
        </Link>
      </header>

      {cards.length === 0 ? (
        <div className='hero py-24 bg-base-200 rounded-box'>
          <div className='hero-content text-center'>
            <div>
              <p className='text-lg mb-4'>
                Your kitchen is empty — add your first recipe!
              </p>
              <Link href='/recipes/new' className='btn btn-primary'>
                Add a recipe
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
          {cards.map((card) => (
            <RecipeCard key={card.id} recipe={card} showVisibility />
          ))}
        </div>
      )}
    </div>
  )
}
