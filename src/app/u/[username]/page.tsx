import { notFound } from 'next/navigation'
import RecipeCard, { type RecipeCardData } from '@/components/RecipeCard'
import { FollowButton } from '@/components/SocialButtons'
import { currentUserId } from '@/lib/auth'
import { familyPeerIds } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

export default async function PublicProfile({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const viewerId = await currentUserId()

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      _count: { select: { recipes: true, followers: true, following: true } },
    },
  })
  if (!user) notFound()

  const isSelf = viewerId === user.id
  const isFamilyPeer =
    viewerId && !isSelf
      ? (await familyPeerIds(viewerId)).includes(user.id)
      : false

  // Visitors see public recipes; family peers also see FAMILY ones; you
  // see everything of your own.
  const recipes = await prisma.recipe.findMany({
    where: {
      authorId: user.id,
      publishedAt: { not: null },
      ...(isSelf
        ? {}
        : isFamilyPeer
          ? { visibility: { in: ['PUBLIC', 'FAMILY'] } }
          : { visibility: 'PUBLIC' }),
    },
    orderBy: { publishedAt: 'desc' },
    include: { images: { where: { isCover: true }, take: 1 } },
  })

  const following = viewerId
    ? (await prisma.follow.findUnique({
        where: {
          followerId_followeeId: {
            followerId: viewerId,
            followeeId: user.id,
          },
        },
      })) !== null
    : false

  const cards: RecipeCardData[] = recipes.map((recipe) => ({
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
      <header className='flex items-center gap-6 mb-8 flex-wrap'>
        <div className='avatar avatar-placeholder'>
          <div className='bg-primary text-primary-content w-20 rounded-full'>
            <span className='text-3xl'>
              {user.name.slice(0, 1).toUpperCase()}
            </span>
          </div>
        </div>
        <div className='flex-1 min-w-48'>
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
        {viewerId && !isSelf && (
          <FollowButton username={user.username} initialFollowing={following} />
        )}
      </header>

      {cards.length === 0 ? (
        <p className='text-base-content/60 py-12 text-center'>
          No recipes to show yet.
        </p>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
          {cards.map((card) => (
            <RecipeCard key={card.id} recipe={card} showVisibility={isSelf} />
          ))}
        </div>
      )}
    </div>
  )
}
