import { expect, test } from '@playwright/test'

// Assumes a seeded database: `npm run db:seed`.

async function signup(
  page: import('@playwright/test').Page,
  name: string,
  handle: string,
) {
  await page.goto('/signup')
  await page.getByLabel('Full name').fill(name)
  await page.getByLabel('Username').fill(handle)
  await page.getByLabel('Email').fill(`${handle}@example.com`)
  await page.getByLabel('Password').fill('supersecret123')
  await page.getByRole('button', { name: 'Sign Up' }).click()
  await expect(page).toHaveURL(/\/recipes$/)
}

test('create a family, invite someone, and grow the cookbook', async ({
  page,
  context,
}) => {
  const stamp = Date.now()

  // Founder creates the family group.
  await signup(page, `Founder ${stamp}`, `founder${stamp}`)
  await page.goto('/families')
  await page.getByLabel('Family name').fill(`Testersens ${stamp}`)
  await page.getByLabel(/About/).fill('A family of test cooks.')
  await page.getByRole('button', { name: 'Create family group' }).click()
  await expect(
    page.getByRole('heading', { name: `Testersens ${stamp}` }),
  ).toBeVisible()
  await expect(page.getByText('Members (1)')).toBeVisible()

  // Grab the invite link shown on the family page.
  const inviteUrl = await page.locator('code').textContent()
  expect(inviteUrl).toContain('/families/join/')

  // A relative accepts the invite from a separate browser session.
  const relativePage = await context.browser()!.newPage()
  await signup(relativePage, `Relative ${stamp}`, `relative${stamp}`)
  await relativePage.goto(inviteUrl!)
  await expect(relativePage.getByText(`Testersens ${stamp}`)).toBeVisible()
  await relativePage.getByRole('button', { name: 'Join the family' }).click()
  await expect(
    relativePage.getByRole('heading', { name: `Testersens ${stamp}` }),
  ).toBeVisible()
  await expect(relativePage.getByText('Members (2)')).toBeVisible()

  // The relative posts a family-visibility recipe into the cookbook.
  await relativePage.goto('/recipes/new')
  await relativePage.getByLabel('Title *').fill(`Family Gravy ${stamp}`)
  await relativePage.getByLabel('Original cook').fill('Grandpa Test')
  await relativePage.getByLabel('Era').fill('1970s')
  await relativePage
    .getByLabel('Family cookbook')
    .selectOption({ label: `Testersens ${stamp}` })
  await relativePage.getByLabel('Ingredient 1 quantity').fill('2')
  await relativePage.getByLabel('Ingredient 1 unit').fill('cups')
  await relativePage.getByLabel('Ingredient 1 name').fill('pan drippings')
  await relativePage
    .getByLabel('Step 1', { exact: true })
    .fill('Whisk everything over low heat until it coats a spoon.')
  await relativePage
    .getByLabel('Who can see it?')
    .or(relativePage.locator('select[name="visibility"]'))
    .first()
    .selectOption('FAMILY')
  await relativePage.getByRole('button', { name: 'Publish recipe' }).click()
  await relativePage.waitForURL(/\/recipes\/[a-z0-9]+$/)
  await expect(
    relativePage.getByText('Originally by Grandpa Test'),
  ).toBeVisible()

  // The founder sees it in the family cookbook and in the printable book.
  await page.reload()
  await expect(page.getByText(`Family Gravy ${stamp}`)).toBeVisible()
  await page.getByRole('link', { name: /Printable cookbook/ }).click()
  await expect(
    page.getByRole('heading', { name: `Family Gravy ${stamp}` }),
  ).toBeVisible()
  await expect(
    page.getByText(/originally by Grandpa Test, 1970s/),
  ).toBeVisible()

  await relativePage.close()
})

test('remix a public recipe and show the lineage', async ({ page }) => {
  const stamp = Date.now()
  await signup(page, `Remixer ${stamp}`, `remixer${stamp}`)

  // Fork the seeded Æbleskiver recipe.
  await page.goto('/recipes')
  await page
    .getByRole('link', { name: /Grandma Ruth's Æbleskiver/ })
    .first()
    .click()
  await page.waitForURL(/\/recipes\/[a-z0-9]+$/)
  await page.getByRole('link', { name: /Remix/ }).click()
  await page.waitForURL(/\/recipes\/new\?fork=/)

  // The form is prefilled from the original.
  await expect(page.getByLabel('Title *')).toHaveValue(
    /Æbleskiver \(my version\)/,
  )
  await page.getByLabel('Title *').fill(`Vegan Æbleskiver ${stamp}`)
  await page.getByRole('button', { name: 'Publish recipe' }).click()
  await page.waitForURL(/\/recipes\/[a-z0-9]+$/)

  // Lineage points back at the original…
  await expect(page.getByText(/Remixed from/)).toBeVisible()
  await page.getByRole('link', { name: "Grandma Ruth's Æbleskiver" }).click()
  await page.waitForURL(/\/recipes\/[a-z0-9]+$/)

  // …and the original lists the new variation.
  await expect(page.getByText(/Variations \(\d+\)/)).toBeVisible()
  await expect(
    page.getByRole('link', { name: `Vegan Æbleskiver ${stamp}` }),
  ).toBeVisible()
})
