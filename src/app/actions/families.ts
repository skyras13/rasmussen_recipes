'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { currentUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { familySchema } from '@/lib/validation'

export type FamilyFormState = { error: string | null }

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export async function createFamily(
  _prev: FamilyFormState,
  formData: FormData,
): Promise<FamilyFormState> {
  const userId = await currentUserId()
  if (!userId) redirect('/login')

  const parsed = familySchema.safeParse({
    name: formData.get('name'),
    about: String(formData.get('about') ?? '') || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const base = slugify(parsed.data.name) || 'family'
  let slug = base
  for (let i = 2; await prisma.family.findUnique({ where: { slug } }); i++) {
    slug = `${base}-${i}`
  }

  const family = await prisma.family.create({
    data: {
      name: parsed.data.name,
      about: parsed.data.about,
      slug,
      members: { create: [{ userId, role: 'ADMIN' }] },
    },
  })

  redirect(`/families/${family.slug}`)
}

export async function joinFamily(inviteCode: string) {
  const userId = await currentUserId()
  if (!userId) redirect(`/login`)

  const family = await prisma.family.findUnique({
    where: { inviteCode },
    include: {
      members: { where: { role: 'ADMIN' }, select: { userId: true } },
    },
  })
  if (!family) throw new Error('Invite link is invalid')

  const existing = await prisma.familyMember.findUnique({
    where: { userId_familyId: { userId, familyId: family.id } },
  })
  if (!existing) {
    await prisma.familyMember.create({
      data: { userId, familyId: family.id, role: 'MEMBER' },
    })
    // Let the admins know someone accepted the invite.
    await prisma.notification.createMany({
      data: family.members
        .filter((member) => member.userId !== userId)
        .map((member) => ({
          recipientId: member.userId,
          actorId: userId,
          type: 'FAMILY_INVITE' as const,
        })),
    })
  }

  redirect(`/families/${family.slug}`)
}

export async function leaveFamily(familyId: string) {
  const userId = await currentUserId()
  if (!userId) redirect('/login')

  const membership = await prisma.familyMember.findUnique({
    where: { userId_familyId: { userId, familyId } },
    include: { family: { select: { slug: true } } },
  })
  if (!membership) return

  // The last admin can't walk out and orphan the group.
  if (membership.role === 'ADMIN') {
    const admins = await prisma.familyMember.count({
      where: { familyId, role: 'ADMIN' },
    })
    if (admins <= 1) {
      throw new Error('Promote another admin before leaving')
    }
  }

  await prisma.familyMember.delete({
    where: { userId_familyId: { userId, familyId } },
  })
  revalidatePath('/families')
  redirect('/families')
}
