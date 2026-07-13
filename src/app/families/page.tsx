import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CreateFamilyForm } from '@/components/FamilyForms'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function Families() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const memberships = await prisma.familyMember.findMany({
    where: { userId: session.user.id },
    include: {
      family: {
        include: { _count: { select: { members: true, recipes: true } } },
      },
    },
    orderBy: { joinedAt: 'asc' },
  })

  return (
    <div className='container mx-auto p-4 max-w-3xl'>
      <h1 className='text-4xl font-bold mb-2'>Family Groups</h1>
      <p className='text-base-content/70 mb-8'>
        A family group is a shared cookbook: heirloom recipes, stories, and the
        people who keep them alive.
      </p>

      {memberships.length > 0 && (
        <section className='mb-10'>
          <h2 className='text-xl font-semibold mb-4'>Your families</h2>
          <ul className='space-y-3'>
            {memberships.map(({ family, role }) => (
              <li key={family.id}>
                <Link
                  href={`/families/${family.slug}`}
                  className='card bg-base-100 shadow-sm hover:shadow-md transition-shadow'
                >
                  <div className='card-body py-4 flex-row items-center justify-between'>
                    <div>
                      <h3 className='font-semibold'>
                        {family.name}
                        {role === 'ADMIN' && (
                          <span className='badge badge-ghost badge-sm ml-2'>
                            admin
                          </span>
                        )}
                      </h3>
                      <p className='text-sm text-base-content/60'>
                        {family._count.members}{' '}
                        {family._count.members === 1 ? 'member' : 'members'} ·{' '}
                        {family._count.recipes}{' '}
                        {family._count.recipes === 1 ? 'recipe' : 'recipes'}
                      </p>
                    </div>
                    <span aria-hidden>→</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className='card bg-base-200 p-6 max-w-md'>
        <h2 className='text-xl font-semibold mb-3'>Start a new family group</h2>
        <CreateFamilyForm />
      </section>
    </div>
  )
}
