import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import RecipeCard, { type RecipeCardData } from '@/components/RecipeCard'
import type { Prisma } from '@prisma/client'

function toCard(recipe: {
  id: string
  title: string
  description: string | null
  cuisine: string | null
  prepMin: number | null
  cookMin: number | null
  visibility: 'PUBLIC' | 'FAMILY' | 'PRIVATE'
  images: Array<{ url: string }>
  author: { name: string; username: string }
}): RecipeCardData {
  return {
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
  }
}

const CARD_INCLUDE = {
  author: { select: { name: true, username: true } },
  images: { where: { isCover: true }, take: 1 },
} satisfies Prisma.RecipeInclude

export default async function Explore({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cuisine?: string; tag?: string }>
}) {
  const session = await auth()
  const { q, cuisine, tag } = await searchParams
  const query = q?.trim()

  const visible: Prisma.RecipeWhereInput = {
    visibility: 'PUBLIC',
    publishedAt: { not: null },
  }

  // Search spans titles, descriptions, tags, cuisines, ingredients, and
  // authors — "what can I make with leeks?" is just q=leeks.
  const where: Prisma.RecipeWhereInput = {
    ...visible,
    ...(cuisine ? { cuisine: { equals: cuisine, mode: 'insensitive' } } : {}),
    ...(tag ? { tags: { has: tag } } : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { cuisine: { contains: query, mode: 'insensitive' } },
            { tags: { has: query.toLowerCase() } },
            {
              ingredients: {
                some: { item: { contains: query, mode: 'insensitive' } },
              },
            },
            {
              author: {
                OR: [
                  { name: { contains: query, mode: 'insensitive' } },
                  { username: { contains: query, mode: 'insensitive' } },
                ],
              },
            },
          ],
        }
      : {}),
  }

  const [recipes, cuisines, tagRows, trending] = await Promise.all([
    prisma.recipe.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: 48,
      include: CARD_INCLUDE,
    }),
    prisma.recipe.findMany({
      where: { ...visible, cuisine: { not: null } },
      select: { cuisine: true },
      distinct: ['cuisine'],
      take: 12,
    }),
    prisma.recipe.findMany({ where: visible, select: { tags: true } }),
    // Trending: most-liked public recipes, only shown on the unfiltered view.
    query || cuisine || tag
      ? Promise.resolve([])
      : prisma.recipe.findMany({
          where: visible,
          orderBy: { likes: { _count: 'desc' } },
          take: 4,
          include: CARD_INCLUDE,
        }),
  ])

  const allTags = [...new Set(tagRows.flatMap((row) => row.tags))]
    .sort()
    .slice(0, 12)

  const filtered = Boolean(query || cuisine || tag)

  return (
    <div className='container mx-auto p-4'>
      <div className='flex items-center justify-between mb-4'>
        <h1 className='text-4xl font-bold'>Explore</h1>
        {session?.user && (
          <Link href='/recipes/new' className='btn btn-primary'>
            + New recipe
          </Link>
        )}
      </div>

      <form method='GET' className='flex gap-2 mb-3 max-w-xl'>
        <input
          type='search'
          name='q'
          defaultValue={query}
          placeholder='Search recipes, ingredients, cooks… try "flour"'
          aria-label='Search recipes'
          className='input input-bordered flex-1'
        />
        <button type='submit' className='btn btn-primary'>
          Search
        </button>
      </form>

      <div className='flex flex-wrap gap-1 mb-6'>
        {(filtered ? [{ label: 'clear filters', href: '/recipes' }] : []).map(
          (chip) => (
            <Link
              key={chip.href}
              href={chip.href}
              className='badge badge-neutral'
            >
              ✕ {chip.label}
            </Link>
          ),
        )}
        {cuisines
          .map((row) => row.cuisine!)
          .sort()
          .map((name) => (
            <Link
              key={name}
              href={`/recipes?cuisine=${encodeURIComponent(name)}`}
              className={`badge ${cuisine === name ? 'badge-primary' : 'badge-outline'}`}
            >
              {name}
            </Link>
          ))}
        {allTags.map((name) => (
          <Link
            key={name}
            href={`/recipes?tag=${encodeURIComponent(name)}`}
            className={`badge ${tag === name ? 'badge-primary' : 'badge-outline'}`}
          >
            #{name}
          </Link>
        ))}
      </div>

      {trending.length > 0 && (
        <section className='mb-8'>
          <h2 className='text-xl font-semibold mb-3'>🔥 Trending</h2>
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
            {trending.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={toCard(recipe)} />
            ))}
          </div>
        </section>
      )}

      <section>
        {filtered && (
          <h2 className='text-xl font-semibold mb-3'>
            {recipes.length} {recipes.length === 1 ? 'result' : 'results'}
            {query && <> for “{query}”</>}
          </h2>
        )}
        {recipes.length === 0 ? (
          <div className='hero py-24 bg-base-200 rounded-box'>
            <div className='hero-content text-center'>
              <div>
                <p className='text-lg mb-4'>
                  {filtered
                    ? 'Nothing matched — try another ingredient or clear the filters.'
                    : 'No recipes yet — be the first!'}
                </p>
                <Link
                  href={
                    filtered
                      ? '/recipes'
                      : session?.user
                        ? '/recipes/new'
                        : '/signup'
                  }
                  className='btn btn-primary'
                >
                  {filtered
                    ? 'Clear search'
                    : session?.user
                      ? 'Add a recipe'
                      : 'Join to add one'}
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={toCard(recipe)} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
