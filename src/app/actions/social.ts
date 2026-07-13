'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { NotificationType } from '@prisma/client'
import { currentUserId } from '@/lib/auth'
import { getFeedPage, type FeedPage } from '@/lib/feed'
import { canViewRecipe } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { saveUpload, UploadError } from '@/lib/uploads'
import { z } from 'zod'

async function notify(
  recipientId: string,
  actorId: string,
  type: NotificationType,
  recipeId?: string,
) {
  if (recipientId === actorId) return
  await prisma.notification.create({
    data: { recipientId, actorId, type, recipeId },
  })
}

/** Loads a recipe and throws unless the current user may see it. */
async function viewableRecipe(recipeId: string, userId: string) {
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: { id: true, authorId: true, visibility: true, familyId: true },
  })
  if (!recipe || !(await canViewRecipe(recipe, userId))) {
    throw new Error('Recipe not found')
  }
  return recipe
}

export async function toggleLike(recipeId: string): Promise<boolean> {
  const userId = await currentUserId()
  if (!userId) redirect('/login')

  const recipe = await viewableRecipe(recipeId, userId)
  const key = { userId_recipeId: { userId, recipeId } }
  const existing = await prisma.like.findUnique({ where: key })

  if (existing) {
    await prisma.like.delete({ where: key })
    return false
  }
  await prisma.like.create({ data: { userId, recipeId } })
  await notify(recipe.authorId, userId, 'LIKE', recipeId)
  return true
}

export async function toggleSave(recipeId: string): Promise<boolean> {
  const userId = await currentUserId()
  if (!userId) redirect('/login')

  await viewableRecipe(recipeId, userId)
  const key = { userId_recipeId: { userId, recipeId } }
  const existing = await prisma.save.findUnique({ where: key })

  if (existing) {
    await prisma.save.delete({ where: key })
    return false
  }
  await prisma.save.create({ data: { userId, recipeId } })
  return true
}

export async function toggleFollow(username: string): Promise<boolean> {
  const userId = await currentUserId()
  if (!userId) redirect('/login')

  const followee = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  })
  if (!followee || followee.id === userId) {
    throw new Error('Cannot follow this user')
  }

  const key = {
    followerId_followeeId: { followerId: userId, followeeId: followee.id },
  }
  const existing = await prisma.follow.findUnique({ where: key })

  let following: boolean
  if (existing) {
    await prisma.follow.delete({ where: key })
    following = false
  } else {
    await prisma.follow.create({
      data: { followerId: userId, followeeId: followee.id },
    })
    await notify(followee.id, userId, 'FOLLOW')
    following = true
  }
  revalidatePath(`/u/${username}`)
  return following
}

const commentSchema = z.object({
  text: z.string().trim().min(1, 'Write something first').max(2000),
})

export type CommentFormState = { error: string | null }

export async function addComment(
  recipeId: string,
  _prev: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  const userId = await currentUserId()
  if (!userId) redirect('/login')

  const parsed = commentSchema.safeParse({ text: formData.get('text') })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const recipe = await viewableRecipe(recipeId, userId)
  await prisma.comment.create({
    data: { userId, recipeId, text: parsed.data.text },
  })
  await notify(recipe.authorId, userId, 'COMMENT', recipeId)

  revalidatePath(`/recipes/${recipeId}`)
  return { error: null }
}

export async function deleteComment(commentId: string) {
  const userId = await currentUserId()
  if (!userId) redirect('/login')

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { userId: true, recipeId: true },
  })
  if (!comment || comment.userId !== userId) return

  await prisma.comment.delete({ where: { id: commentId } })
  revalidatePath(`/recipes/${comment.recipeId}`)
}

const madeItSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  notes: z.string().trim().max(1000).optional(),
})

export type MadeItFormState = { error: string | null }

export async function addMadeIt(
  recipeId: string,
  _prev: MadeItFormState,
  formData: FormData,
): Promise<MadeItFormState> {
  const userId = await currentUserId()
  if (!userId) redirect('/login')

  const parsed = madeItSchema.safeParse({
    rating: String(formData.get('rating') ?? '') || undefined,
    notes: String(formData.get('notes') ?? '') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const recipe = await viewableRecipe(recipeId, userId)

  const photo = formData.get('photo')
  let imageUrl: string | null = null
  if (photo instanceof File && photo.size > 0) {
    try {
      imageUrl = await saveUpload(photo)
    } catch (error) {
      if (error instanceof UploadError) return { error: error.message }
      throw error
    }
  }

  await prisma.madeIt.create({
    data: {
      userId,
      recipeId,
      rating: parsed.data.rating,
      notes: parsed.data.notes,
      imageUrl,
    },
  })
  await notify(recipe.authorId, userId, 'MADE_IT', recipeId)

  revalidatePath(`/recipes/${recipeId}`)
  return { error: null }
}

export async function markNotificationsRead() {
  const userId = await currentUserId()
  if (!userId) redirect('/login')

  await prisma.notification.updateMany({
    where: { recipientId: userId, readAt: null },
    data: { readAt: new Date() },
  })
  revalidatePath('/notifications')
}

export async function loadFeedPage(cursor: string): Promise<FeedPage> {
  const userId = await currentUserId()
  if (!userId) redirect('/login')
  return getFeedPage(userId, cursor)
}
