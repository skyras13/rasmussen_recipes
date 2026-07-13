import { expect, test } from '@playwright/test'

// Assumes a seeded database: `npm run db:seed`.

test('follow, feed, like, comment, save, and notifications', async ({
  page,
}) => {
  const stamp = Date.now()
  const name = `Social Tester ${stamp}`

  // A fresh account starts with an empty feed.
  await page.goto('/signup')
  await page.getByLabel('Full name').fill(name)
  await page.getByLabel('Username').fill(`social${stamp}`)
  await page.getByLabel('Email').fill(`social${stamp}@example.com`)
  await page.getByLabel('Password').fill('supersecret123')
  await page.getByRole('button', { name: 'Sign Up' }).click()
  await expect(page).toHaveURL(/\/recipes$/)

  await page.goto('/')
  await expect(page.getByText('Your feed is quiet')).toBeVisible()

  // Follow sky; their public recipes appear in the feed.
  await page.goto('/u/sky')
  await page.getByRole('button', { name: 'Follow', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Following' })).toBeVisible()

  await page.goto('/')
  await expect(page.getByText("Grandma Ruth's Æbleskiver")).toBeVisible()

  // Open the recipe: like it, save it, comment on it.
  await page
    .getByRole('link', { name: "Grandma Ruth's Æbleskiver" })
    .first()
    .click()
  await page.waitForURL(/\/recipes\/[a-z0-9]+$/)
  await expect(
    page.getByRole('heading', { name: "Grandma Ruth's Æbleskiver" }),
  ).toBeVisible()

  const like = page.getByRole('button', { name: 'Like', exact: true })
  const before = Number((await like.textContent())?.replace(/\D/g, ''))
  await like.click()
  await expect(
    page.getByRole('button', { name: 'Unlike', exact: true }),
  ).toContainText(String(before + 1))

  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Unsave', exact: true }),
  ).toBeVisible()

  const commentText = `Looks delicious! (${stamp})`
  await page.getByLabel('Add a comment').fill(commentText)
  await page.getByRole('button', { name: 'Post', exact: true }).click()
  await expect(page.getByText(commentText)).toBeVisible()

  // Saved page has it.
  await page.goto('/saved')
  await expect(page.getByText("Grandma Ruth's Æbleskiver")).toBeVisible()

  // Sign out, sign back in as sky: the activity shows up as notifications.
  await page.goto('/api/auth/signout')
  await page.getByRole('button', { name: /sign out/i }).click()
  await expect(page.getByRole('link', { name: 'Login' })).toBeVisible()

  await page.goto('/login')
  await page.getByLabel('Email').fill('sky@example.com')
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: 'Login' }).click()
  await expect(page).toHaveURL(/\/recipes$/)

  await page.goto('/notifications')
  await expect(
    page.getByText(name).and(page.getByRole('link')).first(),
  ).toBeVisible()
  await expect(page.getByText('started following you').first()).toBeVisible()
  await expect(page.getByText('liked your recipe').first()).toBeVisible()
  await expect(page.getByText('commented on your recipe').first()).toBeVisible()
})
