'use server'

import bcrypt from 'bcryptjs'
import { AuthError } from 'next-auth'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { signIn, signOut } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { signupSchema } from '@/lib/validation'

export type AuthFormState = { error: string | null }

export async function signup(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse({
    name: formData.get('name'),
    username: formData.get('username'),
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }
  const { name, username, email, password } = parsed.data

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { email: true },
  })
  if (existing) {
    return {
      error:
        existing.email === email
          ? 'An account with that email already exists'
          : 'That username is taken',
    }
  }

  await prisma.user.create({
    data: {
      name,
      username,
      email,
      passwordHash: await bcrypt.hash(password, 12),
    },
  })

  // Sign the new user straight in; signIn finishes with a redirect throw.
  return login(_prev, formData)
}

export async function login(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  try {
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirectTo: '/recipes',
    })
    return { error: null }
  } catch (error) {
    if (isRedirectError(error)) throw error
    if (error instanceof AuthError) {
      return { error: 'Invalid email or password' }
    }
    throw error
  }
}

export async function logout() {
  await signOut({ redirectTo: '/' })
}
