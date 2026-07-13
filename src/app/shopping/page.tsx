import Link from 'next/link'
import { redirect } from 'next/navigation'
import { clearCheckedItems } from '@/app/actions/shopping'
import ShoppingItemRow from '@/components/ShoppingItemRow'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatQuantity } from '@/lib/recipe-utils'

export default async function ShoppingList() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const items = await prisma.shoppingListItem.findMany({
    where: { userId: session.user.id },
    orderBy: [{ checked: 'asc' }, { createdAt: 'asc' }],
  })
  const checkedCount = items.filter((item) => item.checked).length

  return (
    <div className='container mx-auto p-4 max-w-2xl'>
      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-4xl font-bold'>Shopping list</h1>
        {checkedCount > 0 && (
          <form action={clearCheckedItems}>
            <button type='submit' className='btn btn-ghost btn-sm'>
              Clear checked ({checkedCount})
            </button>
          </form>
        )}
      </div>

      {items.length === 0 ? (
        <div className='hero py-24 bg-base-200 rounded-box'>
          <div className='hero-content text-center'>
            <div>
              <p className='text-lg mb-4'>
                Your list is empty — add ingredients from any recipe.
              </p>
              <Link href='/recipes' className='btn btn-primary'>
                Browse recipes
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <ul className='space-y-1'>
          {items.map((item) => (
            <ShoppingItemRow
              key={item.id}
              item={{
                id: item.id,
                quantity: item.quantity
                  ? formatQuantity(Number(item.quantity))
                  : null,
                unit: item.unit,
                item: item.item,
                recipeTitle: item.recipeTitle,
                checked: item.checked,
              }}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
