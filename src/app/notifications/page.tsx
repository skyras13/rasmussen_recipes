import Link from 'next/link'
import { redirect } from 'next/navigation'
import { markNotificationsRead } from '@/app/actions/social'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { timeAgo } from '@/lib/time'

const MESSAGES: Record<string, string> = {
  LIKE: 'liked your recipe',
  COMMENT: 'commented on your recipe',
  FOLLOW: 'started following you',
  FAMILY_INVITE: 'invited you to a family group',
  MADE_IT: 'made your recipe',
}

export default async function Notifications() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const notifications = await prisma.notification.findMany({
    where: { recipientId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { actor: { select: { name: true, username: true } } },
  })

  const recipeIds = [
    ...new Set(
      notifications
        .map((notification) => notification.recipeId)
        .filter((id): id is string => id !== null),
    ),
  ]
  const recipes = await prisma.recipe.findMany({
    where: { id: { in: recipeIds } },
    select: { id: true, title: true },
  })
  const recipeTitles = new Map(recipes.map((r) => [r.id, r.title]))

  const unread = notifications.filter((n) => n.readAt === null).length

  return (
    <div className='container mx-auto p-4 max-w-2xl'>
      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-4xl font-bold'>Notifications</h1>
        {unread > 0 && (
          <form action={markNotificationsRead}>
            <button type='submit' className='btn btn-ghost btn-sm'>
              Mark all read
            </button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className='text-base-content/60 py-12 text-center'>
          Nothing yet — post a recipe and the hearts will come.
        </p>
      ) : (
        <ul className='space-y-1'>
          {notifications.map((notification) => (
            <li
              key={notification.id}
              className={`flex items-center gap-3 rounded-box p-3 ${
                notification.readAt === null ? 'bg-base-200' : ''
              }`}
            >
              <div className='avatar avatar-placeholder'>
                <div className='bg-neutral text-neutral-content w-9 rounded-full'>
                  <span className='text-sm'>
                    {notification.actor.name.slice(0, 1).toUpperCase()}
                  </span>
                </div>
              </div>
              <p className='flex-1 text-sm'>
                <Link
                  href={`/u/${notification.actor.username}`}
                  className='font-medium hover:underline'
                >
                  {notification.actor.name}
                </Link>{' '}
                {MESSAGES[notification.type] ?? notification.type}
                {notification.recipeId &&
                  recipeTitles.has(notification.recipeId) && (
                    <>
                      {' '}
                      <Link
                        href={`/recipes/${notification.recipeId}`}
                        className='link link-primary'
                      >
                        {recipeTitles.get(notification.recipeId)}
                      </Link>
                    </>
                  )}
                <span className='text-base-content/50'>
                  {' '}
                  · {timeAgo(notification.createdAt)}
                </span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
