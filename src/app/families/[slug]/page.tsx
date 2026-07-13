import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { leaveFamily } from '@/app/actions/families'
import { InviteLink } from '@/components/FamilyForms'
import RecipeCard, { type RecipeCardData } from '@/components/RecipeCard'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function FamilyPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ member?: string; tag?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const { slug } = await params
  const { member, tag } = await searchParams

  const family = await prisma.family.findUnique({
    where: { slug },
    include: {
      members: {
        orderBy: { joinedAt: 'asc' },
        include: {
          user: { select: { id: true, name: true, username: true } },
        },
      },
    },
  })
  if (!family) notFound()

  const myMembership = family.members.find(
    (membership) => membership.user.id === session.user.id,
  )
  // The family cookbook is for family only.
  if (!myMembership) notFound()

  const recipes = await prisma.recipe.findMany({
    where: {
      familyId: family.id,
      publishedAt: { not: null },
      ...(member ? { author: { username: member } } : {}),
      ...(tag ? { tags: { has: tag } } : {}),
    },
    orderBy: { publishedAt: 'desc' },
    include: {
      author: { select: { name: true, username: true } },
      images: { where: { isCover: true }, take: 1 },
    },
  })

  const allTags = [
    ...new Set(
      (
        await prisma.recipe.findMany({
          where: { familyId: family.id, publishedAt: { not: null } },
          select: { tags: true },
        })
      ).flatMap((recipe) => recipe.tags),
    ),
  ].sort()

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

  const inviteUrl = `${process.env.APP_URL ?? 'http://localhost:3000'}/families/join/${family.inviteCode}`

  return (
    <div className='container mx-auto p-4'>
      <header className='mb-8'>
        <div className='flex flex-wrap items-center gap-3 mb-1'>
          <h1 className='text-4xl font-bold flex-1'>{family.name}</h1>
          <Link
            href={`/families/${family.slug}/cookbook`}
            className='btn btn-outline btn-sm'
          >
            🖨 Printable cookbook
          </Link>
          <form action={leaveFamily.bind(null, family.id)}>
            <button type='submit' className='btn btn-ghost btn-sm'>
              Leave
            </button>
          </form>
        </div>
        {family.about && <p className='text-base-content/70'>{family.about}</p>}
      </header>

      <section className='mb-8'>
        <h2 className='text-lg font-semibold mb-3'>
          Members ({family.members.length})
        </h2>
        <ul className='flex flex-wrap gap-2 mb-4'>
          {family.members.map((membership) => (
            <li key={membership.id}>
              <Link
                href={`/u/${membership.user.username}`}
                className='badge badge-lg badge-outline hover:badge-primary'
              >
                {membership.user.name}
                {membership.role === 'ADMIN' && ' ★'}
              </Link>
            </li>
          ))}
        </ul>
        <div>
          <p className='text-sm text-base-content/60 mb-1'>
            Invite family with this link:
          </p>
          <InviteLink url={inviteUrl} />
        </div>
      </section>

      <section>
        <div className='flex flex-wrap items-center gap-2 mb-4'>
          <h2 className='text-lg font-semibold flex-1'>
            Family cookbook ({cards.length})
          </h2>
          <div className='flex flex-wrap gap-1'>
            <Link
              href={`/families/${family.slug}`}
              className={`badge ${!member && !tag ? 'badge-primary' : 'badge-outline'}`}
            >
              all
            </Link>
            {family.members.map((membership) => (
              <Link
                key={membership.id}
                href={`/families/${family.slug}?member=${membership.user.username}`}
                className={`badge ${member === membership.user.username ? 'badge-primary' : 'badge-outline'}`}
              >
                {membership.user.name.split(' ')[0]}
              </Link>
            ))}
            {allTags.map((tagName) => (
              <Link
                key={tagName}
                href={`/families/${family.slug}?tag=${encodeURIComponent(tagName)}`}
                className={`badge ${tag === tagName ? 'badge-primary' : 'badge-outline'}`}
              >
                #{tagName}
              </Link>
            ))}
          </div>
        </div>

        {cards.length === 0 ? (
          <div className='hero py-16 bg-base-200 rounded-box'>
            <div className='hero-content text-center'>
              <div>
                <p className='text-lg mb-4'>
                  No recipes in the cookbook yet. Attribute a recipe to this
                  family when you post it.
                </p>
                <Link href='/recipes/new' className='btn btn-primary'>
                  Add the first one
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
      </section>
    </div>
  )
}
