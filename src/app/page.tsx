import Link from 'next/link'
import { auth } from '@/lib/auth'

export default async function Home() {
  const session = await auth()

  return (
    <div className='hero min-h-[80vh] bg-base-200'>
      <div className='hero-content text-center'>
        <div className='max-w-md'>
          <h1 className='text-5xl font-bold'>Family Recipes</h1>
          <p className='py-6'>
            Share and preserve your family&apos;s culinary heritage.
          </p>
          {session?.user ? (
            <div className='flex gap-3 justify-center'>
              <Link href='/recipes' className='btn btn-primary'>
                Browse recipes
              </Link>
              <Link href='/recipes/new' className='btn btn-outline'>
                Add a recipe
              </Link>
            </div>
          ) : (
            <Link href='/signup' className='btn btn-primary'>
              Get Started
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
