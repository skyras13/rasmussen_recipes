import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className='navbar bg-base-100'>
      <div className='navbar-start'>
        <div className='dropdown'>
          <div tabIndex={0} role='button' className='btn btn-ghost lg:hidden'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-5 w-5'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'>
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
            className='menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52'>
            <li>
              <Link href='/recipes'>Recipes</Link>
            </li>
            <li>
              <Link href='/families'>Families</Link>
            </li>
            <li>
              <Link href='/user-profile'>Profile</Link>
            </li>
          </ul>
        </div>
        <Link href='/' className='btn btn-ghost text-xl'>
          FamilyRecipes
        </Link>
      </div>
      <div className='navbar-end'>
        <Link href='/login' className='btn btn-ghost'>
          Login
        </Link>
        <Link href='/signup' className='btn btn-primary'>
          Sign Up
        </Link>
      </div>
    </nav>
  )
}
