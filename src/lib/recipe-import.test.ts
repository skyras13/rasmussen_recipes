import { describe, expect, it } from 'vitest'
import { durationToMinutes, parseJsonLdRecipe } from './recipe-import'

const FIXTURE = `
<html><head>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {"@type": "WebSite", "name": "Test Kitchen"},
    {
      "@type": "Recipe",
      "name": "Classic Pancakes",
      "description": "Fluffy weekend pancakes.",
      "recipeYield": "4 servings",
      "prepTime": "PT10M",
      "cookTime": "PT1H15M",
      "recipeCuisine": "American",
      "keywords": "breakfast, weekend",
      "recipeIngredient": [
        "2 cups all-purpose flour, sifted",
        "1 1/2 cups buttermilk",
        "3 eggs"
      ],
      "recipeInstructions": [
        {"@type": "HowToStep", "text": "Whisk the dry ingredients."},
        {"@type": "HowToStep", "text": "Fold in the buttermilk and eggs."}
      ]
    }
  ]
}
</script>
</head><body>Recipe page</body></html>
`

describe('parseJsonLdRecipe', () => {
  it('extracts a structured recipe from schema.org JSON-LD', () => {
    const recipe = parseJsonLdRecipe(FIXTURE)
    expect(recipe).not.toBeNull()
    expect(recipe!.title).toBe('Classic Pancakes')
    expect(recipe!.servings).toBe(4)
    expect(recipe!.prepMin).toBe(10)
    expect(recipe!.cookMin).toBe(75)
    expect(recipe!.cuisine).toBe('American')
    expect(recipe!.tags).toBe('breakfast, weekend')
    expect(recipe!.ingredients[0]).toEqual({
      quantity: '2',
      unit: 'cups',
      item: 'all-purpose flour',
      note: 'sifted',
    })
    expect(recipe!.steps).toEqual([
      'Whisk the dry ingredients.',
      'Fold in the buttermilk and eggs.',
    ])
  })

  it('returns null when no recipe JSON-LD is present', () => {
    expect(
      parseJsonLdRecipe('<html><body>No recipe here</body></html>'),
    ).toBeNull()
  })
})

describe('durationToMinutes', () => {
  it('parses ISO-8601 durations', () => {
    expect(durationToMinutes('PT10M')).toBe(10)
    expect(durationToMinutes('PT1H30M')).toBe(90)
    expect(durationToMinutes('P1DT2H')).toBe(1560)
    expect(durationToMinutes('nonsense')).toBeNull()
    expect(durationToMinutes(undefined)).toBeNull()
  })
})
