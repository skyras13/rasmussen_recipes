import { parseIngredientLine } from './ingredient-parser'

// URL recipe import. Most recipe sites embed schema.org/Recipe JSON-LD;
// that path needs no AI. When it's missing, callers can fall back to AI
// extraction (see lib/ai.ts).

export type ImportedRecipe = {
  title: string
  description: string
  story: string
  servings: number
  prepMin: number | null
  cookMin: number | null
  cuisine: string
  tags: string
  ingredients: Array<{
    quantity: string
    unit: string
    item: string
    note: string
  }>
  steps: string[]
}

export class ImportError extends Error {}

const BLOCKED_HOST_PATTERN =
  /^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)|(\.local|\.internal)$/i

/** Fetch a page for import. Blocks private/internal hosts (SSRF guard). */
export async function fetchImportSource(url: string): Promise<string> {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new ImportError('That does not look like a valid URL')
  }

  // data: URLs carry their own content — used by tests and pasted snippets.
  if (parsed.protocol !== 'data:') {
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new ImportError('Only http(s) links can be imported')
    }
    if (BLOCKED_HOST_PATTERN.test(parsed.hostname)) {
      throw new ImportError('That host cannot be imported')
    }
  }

  const response = await fetch(url, {
    headers: { 'User-Agent': 'FamilyRecipes/1.0 (+recipe importer)' },
    signal: AbortSignal.timeout(15_000),
    redirect: 'follow',
  })
  if (!response.ok) {
    throw new ImportError(`The page could not be fetched (${response.status})`)
  }
  const text = await response.text()
  return text.slice(0, 2_000_000)
}

/** ISO-8601 duration ("PT1H30M") → minutes. */
export function durationToMinutes(value: unknown): number | null {
  if (typeof value !== 'string') return null
  const match = value.match(/^P(?:([\d.]+)D)?T?(?:([\d.]+)H)?(?:([\d.]+)M)?/i)
  if (!match || (!match[1] && !match[2] && !match[3])) return null
  const days = Number(match[1] ?? 0)
  const hours = Number(match[2] ?? 0)
  const minutes = Number(match[3] ?? 0)
  const total = Math.round(days * 1440 + hours * 60 + minutes)
  return total > 0 ? total : null
}

function firstString(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = firstString(entry)
      if (found) return found
    }
  }
  if (value && typeof value === 'object' && 'name' in value) {
    return firstString((value as { name: unknown }).name)
  }
  return ''
}

function instructionsToSteps(value: unknown): string[] {
  if (typeof value === 'string') {
    return value
      .split(/\r?\n+/)
      .map((step) => step.trim())
      .filter(Boolean)
  }
  if (!Array.isArray(value)) return []
  const steps: string[] = []
  for (const entry of value) {
    if (typeof entry === 'string') {
      steps.push(entry.trim())
    } else if (entry && typeof entry === 'object') {
      const node = entry as {
        '@type'?: string
        text?: unknown
        itemListElement?: unknown
      }
      if (node.itemListElement) {
        steps.push(...instructionsToSteps(node.itemListElement))
      } else if (typeof node.text === 'string') {
        steps.push(node.text.trim())
      }
    }
  }
  return steps.filter(Boolean)
}

function findRecipeNode(node: unknown): Record<string, unknown> | null {
  if (!node || typeof node !== 'object') return null
  if (Array.isArray(node)) {
    for (const entry of node) {
      const found = findRecipeNode(entry)
      if (found) return found
    }
    return null
  }
  const obj = node as Record<string, unknown>
  const type = obj['@type']
  const types = Array.isArray(type) ? type : [type]
  if (
    types.some((t) => typeof t === 'string' && t.toLowerCase() === 'recipe')
  ) {
    return obj
  }
  if (obj['@graph']) return findRecipeNode(obj['@graph'])
  return null
}

/** Extract a schema.org/Recipe from page HTML. Returns null when absent. */
export function parseJsonLdRecipe(html: string): ImportedRecipe | null {
  const scripts = html.matchAll(
    /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )

  for (const match of scripts) {
    let data: unknown
    try {
      data = JSON.parse(match[1])
    } catch {
      continue
    }
    const recipe = findRecipeNode(data)
    if (!recipe) continue

    const ingredientLines = Array.isArray(recipe.recipeIngredient)
      ? recipe.recipeIngredient.filter(
          (line): line is string => typeof line === 'string',
        )
      : []
    const steps = instructionsToSteps(recipe.recipeInstructions)
    if (ingredientLines.length === 0 && steps.length === 0) continue

    const servingsRaw = firstString(recipe.recipeYield)
    const servings = Number(servingsRaw.match(/\d+/)?.[0] ?? 4)

    const keywords = firstString(recipe.keywords)

    return {
      title: firstString(recipe.name) || 'Imported recipe',
      description: firstString(recipe.description),
      story: '',
      servings: servings >= 1 && servings <= 100 ? servings : 4,
      prepMin: durationToMinutes(recipe.prepTime),
      cookMin: durationToMinutes(recipe.cookTime),
      cuisine: firstString(recipe.recipeCuisine),
      tags: keywords
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 8)
        .join(', '),
      ingredients: ingredientLines.map(parseIngredientLine),
      steps,
    }
  }
  return null
}
