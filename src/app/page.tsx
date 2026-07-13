import Link from 'next/link'
import Feed from '@/components/Feed'
import { auth } from '@/lib/auth'
import { getFeedPage } from '@/lib/feed'

export default async function Home() {
  const session = await auth()

  if (!session?.user) {
    return (
      <div className='hero min-h-[80vh] bg-base-200'>
        <div className='hero-content text-center'>
          <div className='max-w-md'>
            <h1 className='text-5xl font-bold'>Family Recipes</h1>
            <p className='py-6'>
              Share and preserve your family&apos;s culinary heritage.
            </p>
            <Link href='/signup' className='btn btn-primary'>
              Get Started
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const page = await getFeedPage(session.user.id)

  if (page.posts.length === 0) {
    return (
      <div className='hero min-h-[60vh]'>
        <div className='hero-content text-center'>
          <div className='max-w-md'>
            <h1 className='text-3xl font-bold'>Your feed is quiet</h1>
            <p className='py-4 text-base-content/70'>
              Follow some cooks or join your family group and their recipes will
              show up here.
            </p>
            <div className='flex gap-3 justify-center'>
              <Link href='/recipes' className='btn btn-primary'>
                Explore recipes
              </Link>
              <Link href='/recipes/new' className='btn btn-outline'>
                Post your own
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='container mx-auto p-4'>
      <Feed initial={page} />
    </div>
  )
}
