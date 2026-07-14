import { redirect } from 'next/navigation'
import RecipeForm, { type RecipeFormInitial } from '@/components/RecipeForm'
import { aiEnabled, extractRecipeFromText } from '@/lib/ai'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  fetchImportSource,
  ImportError,
  parseJsonLdRecipe,
  type ImportedRecipe,
} from '@/lib/recipe-import'

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
}

export default async function ImportRecipe({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const { url } = await searchParams

  const families = (
    await prisma.familyMember.findMany({
      where: { userId: session.user.id },
      include: { family: { select: { id: true, name: true } } },
    })
  ).map((membership) => membership.family)

  let initial: RecipeFormInitial | undefined
  let error: string | null = null

  if (url) {
    try {
      const html = await fetchImportSource(url)
      let imported: ImportedRecipe | null = parseJsonLdRecipe(html)
      let banner = 'Imported — double-check everything before publishing.'

      if (!imported && aiEnabled()) {
        imported = await extractRecipeFromText(stripHtml(html))
        banner =
          'Extracted with AI — double-check everything before publishing.'
      }

      if (imported) {
        initial = {
          banner,
          title: imported.title,
          description: imported.description,
          story: imported.story,
          originalAuthor: '',
          originEra: '',
          originPlace: '',
          servings: imported.servings,
          prepMin: imported.prepMin,
          cookMin: imported.cookMin,
          difficulty: 'MEDIUM',
          cuisine: imported.cuisine,
          tags: imported.tags,
          ingredients: imported.ingredients,
          steps: imported.steps,
        }
      } else {
        error = aiEnabled()
          ? 'No recipe could be found on that page.'
          : 'That page has no structured recipe data. AI extraction is not configured (set ANTHROPIC_API_KEY to enable it).'
      }
    } catch (cause) {
      error =
        cause instanceof ImportError
          ? cause.message
          : 'The page could not be imported.'
    }
  }

  return (
    <div className='container mx-auto p-4 max-w-3xl'>
      <h1 className='text-4xl font-bold mb-2'>Import a recipe</h1>
      <p className='text-base-content/70 mb-6'>
        Paste a link to any recipe page. Sites with structured recipe data
        import instantly{aiEnabled() ? '; anything else is read by AI' : ''}.
      </p>

      <form method='GET' className='flex gap-2 mb-8 max-w-xl'>
        <input
          type='url'
          name='url'
          required
          defaultValue={url}
          placeholder='https://example.com/best-cinnamon-rolls'
          aria-label='Recipe URL'
          className='input input-bordered flex-1'
        />
        <button type='submit' className='btn btn-primary'>
          Import
        </button>
      </form>

      {error && (
        <div role='alert' className='alert alert-error mb-6'>
          {error}
        </div>
      )}

      {initial && <RecipeForm families={families} initial={initial} />}
    </div>
  )
}
