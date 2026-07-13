import { expect, test } from '@playwright/test'

// Assumes a seeded database: `npm run db:seed`.

test('search by ingredient and browse explore filters', async ({ page }) => {
  await page.goto('/recipes')
  await expect(page.getByRole('heading', { name: 'Explore' })).toBeVisible()
  await expect(page.getByText('🔥 Trending')).toBeVisible()

  // Ingredient search: buttermilk appears only inside Æbleskiver-family
  // ingredient lists, never in titles or descriptions.
  await page.getByLabel('Search recipes').fill('buttermilk')
  await page.getByRole('button', { name: 'Search' }).click()
  await expect(page.getByText(/\d+ results? for/)).toBeVisible()
  await expect(
    page.getByRole('link', { name: /Grandma Ruth's Æbleskiver/ }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: /Midnight Ramen Hack/ }),
  ).toHaveCount(0)

  // Cuisine chip filters the grid.
  await page.goto('/recipes?cuisine=Danish')
  await expect(page.getByText(/results?$|results? for/)).toBeVisible()
  await expect(
    page.getByRole('link', { name: /Smørrebrød Three Ways/ }),
  ).toBeVisible()
})

test('cook mode steps through a recipe with a timer', async ({ page }) => {
  await page.goto('/recipes')
  await page
    .getByRole('link', { name: /Grandma Ruth's Æbleskiver/ })
    .first()
    .click()
  await page.waitForURL(/\/recipes\/[a-z0-9]+$/)

  await page.getByRole('link', { name: /Cook Mode/ }).click()
  await page.waitForURL(/\/cook$/)

  await expect(page.getByText('Step 1 of 6')).toBeVisible()
  await expect(page.getByText(/Whisk the flour, baking powder/)).toBeVisible()

  await page.getByRole('button', { name: 'Next →' }).click()
  await expect(page.getByText('Step 2 of 6')).toBeVisible()

  // Step 5 mentions "about 5 minutes" — a timer should be offered.
  await page.getByRole('button', { name: 'Next →' }).click()
  await page.getByRole('button', { name: 'Next →' }).click()
  await page.getByRole('button', { name: 'Next →' }).click()
  await expect(page.getByText('Step 5 of 6')).toBeVisible()
  await expect(page.getByText('5:00')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Start timer' })).toBeVisible()

  // Finish out and land back on the recipe.
  await page.getByRole('button', { name: 'Next →' }).click()
  await page.getByRole('link', { name: /Finished!/ }).click()
  await page.waitForURL(/\/recipes\/[a-z0-9]+$/)
})

test('shopping list collects and merges recipe ingredients', async ({
  page,
}) => {
  const stamp = Date.now()

  await page.goto('/signup')
  await page.getByLabel('Full name').fill(`Shopper ${stamp}`)
  await page.getByLabel('Username').fill(`shopper${stamp}`)
  await page.getByLabel('Email').fill(`shopper${stamp}@example.com`)
  await page.getByLabel('Password').fill('supersecret123')
  await page.getByRole('button', { name: 'Sign Up' }).click()
  await expect(page).toHaveURL(/\/recipes$/)

  // Add Æbleskiver's ingredients (2 cups flour at base 4 servings).
  await page
    .getByRole('link', { name: /Grandma Ruth's Æbleskiver/ })
    .first()
    .click()
  await page.waitForURL(/\/recipes\/[a-z0-9]+$/)
  const recipeUrl = page.url()
  await page.getByRole('button', { name: /Add to list/ }).click()
  await expect(page.getByText('✓ Added to list')).toBeVisible()

  await page.goto('/shopping')
  await expect(page.getByText(/2\s*cups all-purpose flour/)).toBeVisible()

  // Adding the same recipe again merges: flour doubles instead of duplicating.
  await page.goto(recipeUrl)
  await page.getByRole('button', { name: /Add to list/ }).click()
  await expect(page.getByText('✓ Added to list')).toBeVisible()
  await page.goto('/shopping')
  await expect(page.getByText(/4\s*cups all-purpose flour/)).toBeVisible()
  await expect(page.getByText(/all-purpose flour/)).toHaveCount(1)

  // Check an item off and clear it.
  await page.getByLabel(/Mark salt as bought/).check()
  await expect(
    page.getByRole('button', { name: /Clear checked/ }),
  ).toBeVisible()
  await page.getByRole('button', { name: /Clear checked/ }).click()
  await expect(page.getByText(/^salt/)).toHaveCount(0)
})
