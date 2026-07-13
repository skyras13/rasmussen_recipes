import { prisma } from './prisma'

type RecipeVisibilityFields = {
  visibility: string
  authorId: string
  familyId: string | null
}

/**
 * Central visibility rule: PUBLIC is open, PRIVATE is author-only, FAMILY
 * is visible to members of the recipe's family — or, when no family is
 * set, to anyone who shares a family group with the author.
 */
export async function canViewRecipe(
  recipe: RecipeVisibilityFields,
  userId: string | null,
): Promise<boolean> {
  if (recipe.visibility === 'PUBLIC') return true
  if (!userId) return false
  if (recipe.authorId === userId) return true
  if (recipe.visibility === 'PRIVATE') return false

  if (recipe.familyId) {
    const membership = await prisma.familyMember.findUnique({
      where: { userId_familyId: { userId, familyId: recipe.familyId } },
    })
    return membership !== null
  }
  const shared = await prisma.familyMember.findFirst({
    where: {
      userId,
      family: { members: { some: { userId: recipe.authorId } } },
    },
  })
  return shared !== null
}

/** Ids of everyone who shares at least one family group with the user. */
export async function familyPeerIds(userId: string): Promise<string[]> {
  const rows = await prisma.familyMember.findMany({
    where: { family: { members: { some: { userId } } } },
    select: { userId: true },
  })
  return [...new Set(rows.map((row) => row.userId))].filter(
    (id) => id !== userId,
  )
}
