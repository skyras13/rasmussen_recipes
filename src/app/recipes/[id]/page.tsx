import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CommentForm, CommentItem } from '@/components/Comments'
import IngredientList from '@/components/IngredientList'
import MadeItForm from '@/components/MadeItForm'
import { LikeButton, SaveButton } from '@/components/SocialButtons'
import { currentUserId } from '@/lib/auth'
import { canViewRecipe } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { timeAgo } from '@/lib/time'

type Params = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    select: {
      title: true,
      description: true,
      visibility: true,
      images: { where: { isCover: true }, take: 1, select: { url: true } },
    },
  })
  // Only public recipes advertise themselves in link previews.
  if (!recipe || recipe.visibility !== 'PUBLIC') {
    return { title: 'Family Recipes' }
  }
  return {
    title: `${recipe.title} — Family Recipes`,
    description: recipe.description ?? 'A recipe on Family Recipes',
    openGraph: {
      title: recipe.title,
      description: recipe.description ?? undefined,
      images: recipe.images[0] ? [{ url: recipe.images[0].url }] : undefined,
    },
  }
}

export default async function RecipePage({ params }: Params) {
  const { id } = await params
  const userId = await currentUserId()

  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, username: true } },
      family: { select: { name: true, slug: true } },
      forkedFrom: {
        select: {
          id: true,
          title: true,
          author: { select: { name: true } },
        },
      },
      forks: {
        where: { publishedAt: { not: null }, visibility: 'PUBLIC' },
        select: {
          id: true,
          title: true,
          author: { select: { name: true } },
        },
      },
      ingredients: { orderBy: { sortOrder: 'asc' } },
      steps: { orderBy: { sortOrder: 'asc' } },
      images: { orderBy: [{ isCover: 'desc' }, { createdAt: 'asc' }] },
      comments: {
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { name: true, username: true } } },
      },
      madeIts: {
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, username: true } } },
      },
      likes: userId
        ? { where: { userId }, select: { userId: true } }
        : { take: 0 },
      saves: userId
        ? { where: { userId }, select: { userId: true } }
        : { take: 0 },
      _count: { select: { likes: true } },
    },
  })
  if (!recipe || !(await canViewRecipe(recipe, userId))) notFound()

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

  const comments = recipe.comments.map((comment) => ({
    id: comment.id,
    text: comment.text,
    createdAt: comment.createdAt.toISOString(),
    author: { name: comment.user.name, username: comment.user.username },
    mine: comment.userId === userId,
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
          <Link
            href={`/u/${recipe.author.username}`}
            className='font-medium hover:underline'
          >
            {recipe.author.name} (@{recipe.author.username})
          </Link>
          {recipe.family && (
            <>
              {' · '}
              <Link
                href={`/families/${recipe.family.slug}`}
                className='hover:underline'
              >
                {recipe.family.name} cookbook
              </Link>
            </>
          )}
        </p>
        {recipe.originalAuthor && (
          <p className='text-base-content/70 mt-1'>
            <span aria-hidden>📜</span> Originally by{' '}
            <span className='font-medium'>{recipe.originalAuthor}</span>
            {recipe.originEra && <> · {recipe.originEra}</>}
            {recipe.originPlace && <> · {recipe.originPlace}</>}
          </p>
        )}
        {recipe.forkedFrom && (
          <p className='text-base-content/70 mt-1'>
            <span aria-hidden>🍴</span> Remixed from{' '}
            <Link
              href={`/recipes/${recipe.forkedFrom.id}`}
              className='link link-primary'
            >
              {recipe.forkedFrom.title}
            </Link>{' '}
            by {recipe.forkedFrom.author.name}
          </p>
        )}
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
        {userId && (
          <div className='flex flex-wrap items-center gap-2 mt-4'>
            <LikeButton
              recipeId={recipe.id}
              initialLiked={recipe.likes.length > 0}
              initialCount={recipe._count.likes}
            />
            <SaveButton
              recipeId={recipe.id}
              initialSaved={recipe.saves.length > 0}
            />
            <Link
              href={`/recipes/new?fork=${recipe.id}`}
              className='btn btn-ghost btn-sm'
            >
              🍴 Remix
            </Link>
            <MadeItForm recipeId={recipe.id} />
          </div>
        )}
      </header>

      {recipe.audioUrl && (
        <section className='mb-8 p-4 bg-base-200 rounded-box'>
          <h2 className='text-sm font-semibold uppercase tracking-wide text-base-content/60 mb-2'>
            🎙 Voice note
          </h2>
          <audio
            controls
            preload='none'
            src={recipe.audioUrl}
            className='w-full'
          />
        </section>
      )}

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

      {recipe.forks.length > 0 && (
        <section className='mt-10'>
          <h2 className='text-xl font-semibold mb-4'>
            Variations ({recipe.forks.length})
          </h2>
          <ul className='space-y-1'>
            {recipe.forks.map((fork) => (
              <li key={fork.id}>
                🍴{' '}
                <Link
                  href={`/recipes/${fork.id}`}
                  className='link link-primary'
                >
                  {fork.title}
                </Link>{' '}
                <span className='text-base-content/60'>
                  by {fork.author.name}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {recipe.madeIts.length > 0 && (
        <section className='mt-10'>
          <h2 className='text-xl font-semibold mb-4'>
            Made it ({recipe.madeIts.length})
          </h2>
          <ul className='space-y-4'>
            {recipe.madeIts.map((madeIt) => (
              <li key={madeIt.id} className='flex gap-3'>
                {madeIt.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={madeIt.imageUrl}
                    alt={`Made by ${madeIt.user.name}`}
                    className='w-20 h-20 object-cover rounded-box'
                  />
                )}
                <div>
                  <p className='text-sm'>
                    <Link
                      href={`/u/${madeIt.user.username}`}
                      className='font-medium hover:underline'
                    >
                      {madeIt.user.name}
                    </Link>{' '}
                    {madeIt.rating && (
                      <span className='text-warning'>
                        {'★'.repeat(madeIt.rating)}
                      </span>
                    )}{' '}
                    <span className='text-base-content/50'>
                      · {timeAgo(madeIt.createdAt)}
                    </span>
                  </p>
                  {madeIt.notes && (
                    <p className='whitespace-pre-line'>{madeIt.notes}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section id='comments' className='mt-10 max-w-2xl'>
        <h2 className='text-xl font-semibold mb-4'>
          Comments ({comments.length})
        </h2>
        {comments.length > 0 && (
          <ul className='space-y-4 mb-4'>
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </ul>
        )}
        {userId ? (
          <CommentForm recipeId={recipe.id} />
        ) : (
          <p className='text-sm text-base-content/60'>
            <Link href='/login' className='link link-primary'>
              Log in
            </Link>{' '}
            to join the conversation.
          </p>
        )}
      </section>

      <div className='mt-10'>
        <Link href='/recipes' className='btn btn-ghost'>
          ← All recipes
        </Link>
      </div>
    </article>
  )
}
