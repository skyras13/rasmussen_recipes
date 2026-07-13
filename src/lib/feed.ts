import { prisma } from './prisma'
import { familyPeerIds } from './permissions'

export type FeedPost = {
  id: string
  title: string
  description: string | null
  coverUrl: string | null
  publishedAt: string
  visibility: 'PUBLIC' | 'FAMILY' | 'PRIVATE'
  author: { name: string; username: string }
  likeCount: number
  commentCount: number
  likedByMe: boolean
  savedByMe: boolean
}

export type FeedPage = {
  posts: FeedPost[]
  nextCursor: string | null
}

export const FEED_PAGE_SIZE = 12

/**
 * The home feed: published recipes from people you follow, your family
 * peers, and yourself. FAMILY-visibility posts only surface from family
 * peers; your own posts always show.
 */
export async function getFeedPage(
  userId: string,
  cursor?: string,
): Promise<FeedPage> {
  const [followed, peers] = await Promise.all([
    prisma.follow.findMany({
      where: { followerId: userId },
      select: { followeeId: true },
    }),
    familyPeerIds(userId),
  ])
  const followedIds = followed.map((row) => row.followeeId)

  const recipes = await prisma.recipe.findMany({
    where: {
      publishedAt: { not: null },
      OR: [
        {
          authorId: { in: [...new Set([...followedIds, ...peers])] },
          visibility: 'PUBLIC',
        },
        { authorId: { in: peers }, visibility: 'FAMILY' },
        { authorId: userId },
      ],
    },
    orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
    take: FEED_PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      author: { select: { name: true, username: true } },
      images: { where: { isCover: true }, take: 1 },
      likes: { where: { userId }, select: { userId: true } },
      saves: { where: { userId }, select: { userId: true } },
      _count: { select: { likes: true, comments: true } },
    },
  })

  const hasMore = recipes.length > FEED_PAGE_SIZE
  const page = hasMore ? recipes.slice(0, FEED_PAGE_SIZE) : recipes

  return {
    posts: page.map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      coverUrl: recipe.images[0]?.url ?? null,
      publishedAt: recipe.publishedAt!.toISOString(),
      visibility: recipe.visibility,
      author: {
        name: recipe.author.name,
        username: recipe.author.username,
      },
      likeCount: recipe._count.likes,
      commentCount: recipe._count.comments,
      likedByMe: recipe.likes.length > 0,
      savedByMe: recipe.saves.length > 0,
    })),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  }
}
