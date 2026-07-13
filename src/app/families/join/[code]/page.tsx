import { notFound } from 'next/navigation'
import { joinFamily } from '@/app/actions/families'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function JoinFamily({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const session = await auth()

  const family = await prisma.family.findUnique({
    where: { inviteCode: code },
    include: { _count: { select: { members: true, recipes: true } } },
  })
  if (!family) notFound()

  return (
    <div className='min-h-[70vh] flex items-center justify-center p-4'>
      <div className='card w-96 bg-base-100 shadow-xl'>
        <div className='card-body text-center'>
          <p className='text-sm text-base-content/60'>
            You&apos;re invited to join
          </p>
          <h1 className='card-title justify-center text-2xl'>{family.name}</h1>
          {family.about && (
            <p className='text-base-content/70'>{family.about}</p>
          )}
          <p className='text-sm text-base-content/60'>
            {family._count.members}{' '}
            {family._count.members === 1 ? 'member' : 'members'} ·{' '}
            {family._count.recipes}{' '}
            {family._count.recipes === 1 ? 'recipe' : 'recipes'}
          </p>
          {session?.user ? (
            <form action={joinFamily.bind(null, code)} className='mt-4'>
              <button type='submit' className='btn btn-primary w-full'>
                Join the family
              </button>
            </form>
          ) : (
            <div className='mt-4 space-y-2'>
              <Link href='/signup' className='btn btn-primary w-full'>
                Sign up to join
              </Link>
              <Link href='/login' className='btn btn-ghost w-full'>
                I have an account
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
