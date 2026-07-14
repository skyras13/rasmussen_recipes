import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
// The SDK's zod helper expects Zod v4 types; zod@3.25+ ships them here.
import { z } from 'zod/v4'
import type { ImportedRecipe } from './recipe-import'

// All AI features are gated on ANTHROPIC_API_KEY being configured; every
// caller must offer a non-AI fallback (or a clear "not configured" state).

export function aiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

const MODEL = 'claude-opus-4-8'

function client(): Anthropic {
  return new Anthropic()
}

const extractedRecipeSchema = z.object({
  title: z.string(),
  description: z.string(),
  story: z
    .string()
    .describe(
      'Any personal or historical note on the card/page, verbatim where possible. Empty string if none.',
    ),
  servings: z.number().int(),
  prepMin: z.number().int().nullable(),
  cookMin: z.number().int().nullable(),
  cuisine: z.string(),
  tags: z.array(z.string()).describe('2-5 short lowercase tags'),
  ingredients: z.array(
    z.object({
      quantity: z
        .string()
        .describe('Amount as written, e.g. "2", "1 1/2", "½". Empty if none.'),
      unit: z.string().describe('Unit like cups/tbsp/g. Empty if none.'),
      item: z.string(),
      note: z.string().describe('Prep note like "sifted". Empty if none.'),
    }),
  ),
  steps: z.array(z.string()),
})

const EXTRACTION_GUIDANCE = `Extract the recipe as faithfully as possible.
- Keep quantities exactly as written (fractions like "1 1/2" stay fractions).
- Steps are imperative sentences in cooking order.
- If handwriting is ambiguous, make the most reasonable culinary reading.
- servings defaults to 4 when not stated. prepMin/cookMin are minutes or null.`

function toImported(
  parsed: z.infer<typeof extractedRecipeSchema>,
): ImportedRecipe {
  return {
    title: parsed.title || 'Untitled recipe',
    description: parsed.description,
    story: parsed.story,
    servings:
      parsed.servings >= 1 && parsed.servings <= 100 ? parsed.servings : 4,
    prepMin: parsed.prepMin,
    cookMin: parsed.cookMin,
    cuisine: parsed.cuisine,
    tags: parsed.tags.slice(0, 8).join(', '),
    ingredients: parsed.ingredients,
    steps: parsed.steps,
  }
}

type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'

/**
 * The heirloom feature: photograph a handwritten recipe card and get a
 * fully structured recipe back.
 */
export async function extractRecipeFromImage(
  imageBase64: string,
  mediaType: ImageMediaType,
): Promise<ImportedRecipe> {
  const response = await client().messages.parse({
    model: MODEL,
    max_tokens: 16000,
    output_config: { format: zodOutputFormat(extractedRecipeSchema) },
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: `This is a photo of a recipe (possibly a handwritten family recipe card).\n${EXTRACTION_GUIDANCE}`,
          },
        ],
      },
    ],
  })
  if (!response.parsed_output) {
    throw new Error('Could not read a recipe from that photo')
  }
  return toImported(response.parsed_output)
}

/** AI fallback for URL import when a page has no schema.org JSON-LD. */
export async function extractRecipeFromText(
  pageText: string,
): Promise<ImportedRecipe> {
  const response = await client().messages.parse({
    model: MODEL,
    max_tokens: 16000,
    output_config: { format: zodOutputFormat(extractedRecipeSchema) },
    messages: [
      {
        role: 'user',
        content: `Below is text extracted from a web page that contains a recipe.\n${EXTRACTION_GUIDANCE}\n\n<page>\n${pageText.slice(0, 100_000)}\n</page>`,
      },
    ],
  })
  if (!response.parsed_output) {
    throw new Error('Could not find a recipe on that page')
  }
  return toImported(response.parsed_output)
}

const searchIntentSchema = z.object({
  terms: z
    .array(z.string())
    .describe('1-3 concrete ingredient or dish words to search for'),
  cuisine: z
    .string()
    .describe('A cuisine filter if clearly implied, else empty'),
  maxTotalMin: z
    .number()
    .int()
    .nullable()
    .describe('Max total minutes if the query implies a time limit'),
})

export type SearchIntent = z.infer<typeof searchIntentSchema>

/**
 * Natural-language search: "cozy fall dinner under 45 minutes" →
 * structured terms + filters. Callers fall back to plain search on error.
 */
export async function interpretSearchQuery(
  query: string,
): Promise<SearchIntent> {
  const response = await client().messages.parse({
    model: MODEL,
    max_tokens: 2000,
    output_config: { format: zodOutputFormat(searchIntentSchema) },
    messages: [
      {
        role: 'user',
        content: `Turn this recipe search query into structured search intent: "${query.slice(0, 200)}"`,
      },
    ],
  })
  if (!response.parsed_output) throw new Error('Could not interpret query')
  return response.parsed_output
}
