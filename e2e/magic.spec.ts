import { expect, test } from '@playwright/test'

// Assumes a seeded database: `npm run db:seed`.

const FIXTURE_HTML = `<html><head><script type="application/ld+json">
{"@context":"https://schema.org","@type":"Recipe","name":"Fixture Flatbread",
"description":"A simple flatbread for import testing.","recipeYield":"6",
"prepTime":"PT15M","cookTime":"PT10M","recipeCuisine":"Levantine",
"keywords":"bread, quick",
"recipeIngredient":["2 cups bread flour","1 cup warm water, not hot","1 tsp salt"],
"recipeInstructions":[{"@type":"HowToStep","text":"Knead everything into a smooth dough."},
{"@type":"HowToStep","text":"Rest 30 minutes, then griddle each round."}]}
</script></head><body>fixture</body></html>`

async function login(page: import('@playwright/test').Page, email: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: 'Login' }).click()
  await expect(page).toHaveURL(/\/recipes$/)
}

test('import a recipe from a URL with schema.org data', async ({ page }) => {
  await login(page, 'astrid@example.com')

  const dataUrl = `data:text/html;base64,${Buffer.from(FIXTURE_HTML).toString('base64')}`
  await page.goto(`/recipes/import?url=${encodeURIComponent(dataUrl)}`)

  // The form arrives prefilled from the JSON-LD.
  await expect(page.getByText(/Imported — double-check/)).toBeVisible()
  await expect(page.getByLabel('Title *')).toHaveValue('Fixture Flatbread')
  await expect(page.getByLabel('Ingredient 1 quantity')).toHaveValue('2')
  await expect(page.getByLabel('Ingredient 1 unit')).toHaveValue('cups')
  await expect(page.getByLabel('Ingredient 1 name')).toHaveValue('bread flour')
  await expect(page.getByLabel('Step 1', { exact: true })).toHaveValue(
    'Knead everything into a smooth dough.',
  )

  // Publish it and land on the recipe.
  const title = `Fixture Flatbread ${Date.now()}`
  await page.getByLabel('Title *').fill(title)
  await page.getByRole('button', { name: 'Publish recipe' }).click()
  await page.waitForURL(/\/recipes\/[a-z0-9]+$/)
  await expect(
    page.getByRole('heading', { name: title, level: 1 }),
  ).toBeVisible()
  await expect(page.getByText(/2\s*cups bread flour/)).toBeVisible()
})

test('import handles pages without recipe data', async ({ page }) => {
  await login(page, 'astrid@example.com')
  const dataUrl = `data:text/html;base64,${Buffer.from('<html><body>Nothing here</body></html>').toString('base64')}`
  await page.goto(`/recipes/import?url=${encodeURIComponent(dataUrl)}`)
  await expect(page.getByRole('alert')).toBeVisible()
})

test('scan page degrades gracefully without an AI key', async ({ page }) => {
  test.skip(Boolean(process.env.ANTHROPIC_API_KEY), 'AI key configured')
  await login(page, 'astrid@example.com')
  await page.goto('/recipes/scan')
  await expect(page.getByText(/AI scanning is not configured/)).toBeVisible()
  await expect(
    page.getByRole('button', { name: /Read this recipe/ }),
  ).toBeDisabled()
})

test('meal plan fills a week and stocks the shopping list', async ({
  page,
}) => {
  await login(page, 'soren@example.com')
  await page.goto('/meal-plan')

  await expect(
    page.getByRole('heading', { name: "This week's plan" }),
  ).toBeVisible()
  await expect(page.getByText('Monday')).toBeVisible()

  await page
    .getByRole('button', { name: /Add the week to my shopping list/ })
    .click()
  await page.waitForURL(/\/shopping$/)
  // The list now holds merged ingredients from the planned recipes.
  await expect(page.getByRole('checkbox').first()).toBeVisible()
})

test('PWA assets are served', async ({ page }) => {
  const manifest = await page.request.get('/manifest.webmanifest')
  expect(manifest.status()).toBe(200)
  expect(await manifest.json()).toMatchObject({ name: 'Family Recipes' })

  const sw = await page.request.get('/sw.js')
  expect(sw.status()).toBe(200)

  await page.goto('/offline')
  await expect(page.getByText(/You're offline/)).toBeVisible()
})
