import { redirect } from 'next/navigation'
import { SignupForm } from '@/components/AuthForms'
import { auth } from '@/lib/auth'

export default async function Signup() {
  const session = await auth()
  if (session?.user) redirect('/recipes')

  return (
    <div className='min-h-[70vh] flex items-center justify-center p-4'>
      <div className='card w-96 bg-base-100 shadow-xl'>
        <div className='card-body'>
          <h2 className='card-title'>Sign Up</h2>
          <SignupForm />
        </div>
      </div>
    </div>
  )
}
