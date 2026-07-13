import { notFound, redirect } from 'next/navigation'
import PrintButton from '@/components/PrintButton'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatQuantity } from '@/lib/recipe-utils'

// A print-optimized edition of the family cookbook: open it, hit print,
// choose "Save as PDF", give it to someone for the holidays.
export default async function FamilyCookbook({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const { slug } = await params

  const family = await prisma.family.findUnique({
    where: { slug },
    include: {
      members: { where: { userId: session.user.id } },
      recipes: {
        where: { publishedAt: { not: null } },
        orderBy: { title: 'asc' },
        include: {
          author: { select: { name: true } },
          ingredients: { orderBy: { sortOrder: 'asc' } },
          steps: { orderBy: { sortOrder: 'asc' } },
        },
      },
    },
  })
  if (!family || family.members.length === 0) notFound()

  return (
    <div className='container mx-auto p-8 max-w-3xl'>
      <div className='flex justify-end mb-6 print:hidden'>
        <PrintButton />
      </div>

      <header className='text-center mb-12 break-after-page'>
        <p className='uppercase tracking-widest text-sm text-base-content/60 mb-4'>
          The Family Cookbook of
        </p>
        <h1 className='text-5xl font-bold mb-4'>{family.name}</h1>
        {family.about && (
          <p className='text-lg text-base-content/70'>{family.about}</p>
        )}
        <p className='mt-8 text-base-content/60'>
          {family.recipes.length}{' '}
          {family.recipes.length === 1 ? 'recipe' : 'recipes'}, collected with
          love.
        </p>
      </header>

      {family.recipes.map((recipe) => (
        <article key={recipe.id} className='mb-12 break-inside-avoid'>
          <h2 className='text-3xl font-bold border-b pb-2 mb-2'>
            {recipe.title}
          </h2>
          <p className='text-sm text-base-content/60 mb-4'>
            by {recipe.author.name}
            {recipe.originalAuthor && (
              <>
                {' '}
                · originally by {recipe.originalAuthor}
                {recipe.originEra && `, ${recipe.originEra}`}
                {recipe.originPlace && `, ${recipe.originPlace}`}
              </>
            )}
            {' · '}serves {recipe.servings}
            {recipe.prepMin != null && ` · ${recipe.prepMin} min prep`}
            {recipe.cookMin != null && ` · ${recipe.cookMin} min cook`}
          </p>
          {recipe.story && (
            <p className='italic text-base-content/80 mb-4'>{recipe.story}</p>
          )}
          <div className='grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6'>
            <ul className='space-y-1 text-sm'>
              {recipe.ingredients.map((ingredient) => (
                <li key={ingredient.id}>
                  {ingredient.quantity && (
                    <strong>
                      {formatQuantity(Number(ingredient.quantity))}{' '}
                    </strong>
                  )}
                  {ingredient.unit && `${ingredient.unit} `}
                  {ingredient.item}
                  {ingredient.note && ` (${ingredient.note})`}
                </li>
              ))}
            </ul>
            <ol className='space-y-2 text-sm list-decimal list-inside'>
              {recipe.steps.map((step) => (
                <li key={step.id}>{step.text}</li>
              ))}
            </ol>
          </div>
        </article>
      ))}
    </div>
  )
}
