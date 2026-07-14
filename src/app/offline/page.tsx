import Link from 'next/link'

export default function Offline() {
  return (
    <div className='hero min-h-[70vh]'>
      <div className='hero-content text-center'>
        <div className='max-w-md'>
          <h1 className='text-4xl font-bold mb-4'>📡 You&apos;re offline</h1>
          <p className='text-base-content/70 mb-6'>
            Pages you&apos;ve visited recently may still work. Reconnect to keep
            cooking with the family.
          </p>
          <Link href='/' className='btn btn-primary'>
            Try again
          </Link>
        </div>
      </div>
    </div>
  )
}
