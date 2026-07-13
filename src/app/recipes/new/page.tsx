import { redirect } from 'next/navigation'
import RecipeForm from '@/components/RecipeForm'
import { auth } from '@/lib/auth'

export default async function NewRecipe() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <div className='container mx-auto p-4 max-w-3xl'>
      <h1 className='text-4xl font-bold mb-6'>New recipe</h1>
      <RecipeForm />
    </div>
  )
}
