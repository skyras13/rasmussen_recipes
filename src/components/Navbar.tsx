import Link from 'next/link'
import { auth } from '@/lib/auth'
import { logout } from '@/app/actions/auth'
import { prisma } from '@/lib/prisma'

export default async function Navbar() {
  const session = await auth()
  const user = session?.user

  const unread = user
    ? await prisma.notification.count({
        where: { recipientId: user.id, readAt: null },
      })
    : 0

  return (
    <nav className='navbar bg-base-100 shadow-sm print:hidden'>
      <div className='navbar-start'>
        <div className='dropdown'>
          <div tabIndex={0} role='button' className='btn btn-ghost lg:hidden'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-5 w-5'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M4 6h16M4 12h8m-8 6h16'
              />
            </svg>
          </div>
          <ul
            tabIndex={0}
            className='menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52'
          >
            <li>
              <Link href='/recipes'>Recipes</Link>
            </li>
            <li>
              <Link href='/families'>Families</Link>
            </li>
            {user && (
              <li>
                <Link href='/user-profile'>Profile</Link>
              </li>
            )}
          </ul>
        </div>
        <Link href='/' className='btn btn-ghost text-xl'>
          FamilyRecipes
        </Link>
        <div className='hidden lg:flex'>
          <ul className='menu menu-horizontal px-1'>
            <li>
              <Link href='/recipes'>Recipes</Link>
            </li>
            <li>
              <Link href='/families'>Families</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className='navbar-end gap-2'>
        {user ? (
          <>
            <Link href='/recipes/new' className='btn btn-primary btn-sm'>
              + New recipe
            </Link>
            <Link
              href='/notifications'
              aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
              className='btn btn-ghost btn-circle'
            >
              <div className='indicator'>
                <span className='text-xl'>🔔</span>
                {unread > 0 && (
                  <span className='badge badge-error badge-xs indicator-item'>
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </div>
            </Link>
            <div className='dropdown dropdown-end'>
              <div
                tabIndex={0}
                role='button'
                className='btn btn-ghost btn-circle avatar avatar-placeholder'
              >
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt={user.name ?? 'You'}
                    className='w-10 rounded-full'
                  />
                ) : (
                  <div className='bg-primary text-primary-content w-10 rounded-full'>
                    <span>{(user.name ?? '?').slice(0, 1).toUpperCase()}</span>
                  </div>
                )}
              </div>
              <ul
                tabIndex={0}
                className='menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52'
              >
                <li>
                  <Link href='/user-profile'>Profile</Link>
                </li>
                <li>
                  <Link href='/saved'>Saved</Link>
                </li>
                <li>
                  <Link href='/shopping'>Shopping list</Link>
                </li>
                <li>
                  <Link href='/notifications'>Notifications</Link>
                </li>
                <li>
                  <form action={logout}>
                    <button type='submit'>Sign out</button>
                  </form>
                </li>
              </ul>
            </div>
          </>
        ) : (
          <>
            <Link href='/login' className='btn btn-ghost'>
              Login
            </Link>
            <Link href='/signup' className='btn btn-primary'>
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
