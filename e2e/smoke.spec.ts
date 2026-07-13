import { expect, test } from '@playwright/test'

// Assumes a seeded database: `npm run db:seed`.

test('browse the feed and scale a seeded recipe', async ({ page }) => {
  await page.goto('/recipes')
  await expect(
    page.getByRole('heading', { name: 'Explore', exact: true }),
  ).toBeVisible()

  const card = page
    .getByRole('link', { name: /Grandma Ruth's Æbleskiver/ })
    .first()
  await expect(card).toBeVisible()

  // Cover images are served by the uploads route.
  const coverSrc = await card.locator('img').getAttribute('src')
  expect(coverSrc).toMatch(/^\/api\/uploads\//)
  const image = await page.request.get(coverSrc!)
  expect(image.status()).toBe(200)
  expect(image.headers()['content-type']).toContain('image/')

  await card.click()
  await page.waitForURL(/\/recipes\/[a-z0-9]+$/)
  await expect(
    page.getByRole('heading', { name: "Grandma Ruth's Æbleskiver", level: 1 }),
  ).toBeVisible()
  await expect(page.getByText('The story')).toBeVisible()

  // Base: 4 servings, 2 cups flour. Doubling should show 4 cups.
  await expect(page.getByText(/2\s*cups all-purpose flour/)).toBeVisible()
  const more = page.getByRole('button', { name: 'More servings' })
  await more.click()
  await more.click()
  await more.click()
  await more.click()
  await expect(page.getByText('8 servings')).toBeVisible()
  await expect(page.getByText(/4\s*cups all-purpose flour/)).toBeVisible()
})

test('sign up, create a recipe, and see it on the profile', async ({
  page,
}) => {
  const stamp = Date.now()

  await page.goto('/signup')
  await page.getByLabel('Full name').fill('Test Cook')
  await page.getByLabel('Username').fill(`testcook${stamp}`)
  await page.getByLabel('Email').fill(`testcook${stamp}@example.com`)
  await page.getByLabel('Password').fill('supersecret123')
  await page.getByRole('button', { name: 'Sign Up' }).click()

  // Signup signs in and lands on the feed.
  await expect(page).toHaveURL(/\/recipes$/)
  await expect(
    page.getByRole('link', { name: '+ New recipe' }).first(),
  ).toBeVisible()

  await page.goto('/recipes/new')
  await page.getByLabel('Title *').fill(`Test Toast ${stamp}`)
  await page
    .getByLabel('Short description')
    .fill('Bread, but warmer and better.')
  await page.getByLabel('Ingredient 1 quantity').fill('2')
  await page.getByLabel('Ingredient 1 unit').fill('slices')
  await page.getByLabel('Ingredient 1 name').fill('sourdough bread')
  await page.getByLabel('Ingredient 2 quantity').fill('1')
  await page.getByLabel('Ingredient 2 unit').fill('tbsp')
  await page.getByLabel('Ingredient 2 name').fill('salted butter')
  await page
    .getByLabel('Step 1', { exact: true })
    .fill('Toast the bread until golden.')
  await page
    .getByLabel('Step 2', { exact: true })
    .fill('Butter generously while hot.')
  await page.getByRole('button', { name: 'Publish recipe' }).click()

  await expect(page).toHaveURL(/\/recipes\/[a-z0-9]+$/)
  await expect(
    page.getByRole('heading', { name: `Test Toast ${stamp}` }),
  ).toBeVisible()
  await expect(page.getByText(/2\s*slices sourdough bread/)).toBeVisible()
  await expect(page.getByText('Toast the bread until golden.')).toBeVisible()

  await page.goto('/user-profile')
  await expect(page.getByRole('heading', { name: 'Test Cook' })).toBeVisible()
  await expect(
    page.getByRole('link', { name: new RegExp(`Test Toast ${stamp}`) }),
  ).toBeVisible()
})

test('private recipes are hidden from other visitors', async ({ page }) => {
  // Seeded private recipe must not appear in the public feed.
  await page.goto('/recipes')
  await expect(page.getByText('Secret-Ingredient Chili')).toHaveCount(0)
})
