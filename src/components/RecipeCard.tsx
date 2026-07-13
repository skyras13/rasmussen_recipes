import Link from 'next/link'

export type RecipeCardData = {
  id: string
  title: string
  description: string | null
  cuisine: string | null
  prepMin: number | null
  cookMin: number | null
  visibility: 'PUBLIC' | 'FAMILY' | 'PRIVATE'
  coverUrl: string | null
  authorName: string
  authorUsername: string
}

const VISIBILITY_BADGES: Record<string, string | null> = {
  PUBLIC: null,
  FAMILY: 'Family',
  PRIVATE: 'Private',
}

export default function RecipeCard({
  recipe,
  showVisibility = false,
}: {
  recipe: RecipeCardData
  showVisibility?: boolean
}) {
  const totalMin = (recipe.prepMin ?? 0) + (recipe.cookMin ?? 0)
  const badge = showVisibility ? VISIBILITY_BADGES[recipe.visibility] : null

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className='card bg-base-100 shadow-sm hover:shadow-lg transition-shadow'
    >
      <figure className='aspect-square bg-base-200'>
        {recipe.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={recipe.coverUrl}
            alt={recipe.title}
            className='h-full w-full object-cover'
          />
        ) : (
          <span className='text-5xl' aria-hidden>
            🍽️
          </span>
        )}
      </figure>
      <div className='card-body p-4'>
        <h2 className='card-title text-base'>
          {recipe.title}
          {badge && <span className='badge badge-ghost badge-sm'>{badge}</span>}
        </h2>
        {recipe.description && (
          <p className='text-sm text-base-content/70 line-clamp-2'>
            {recipe.description}
          </p>
        )}
        <div className='text-xs text-base-content/60 flex gap-2'>
          <span>@{recipe.authorUsername}</span>
          {totalMin > 0 && <span>· {totalMin} min</span>}
          {recipe.cuisine && <span>· {recipe.cuisine}</span>}
        </div>
      </div>
    </Link>
  )
}
