'use client'

import { useState, useTransition } from 'react'
import { addRecipeToShoppingList } from '@/app/actions/shopping'

export default function AddToListButton({
  recipeId,
  servings,
}: {
  recipeId: string
  servings: number
}) {
  const [added, setAdded] = useState(false)
  const [pending, startTransition] = useTransition()

  return (
    <button
      type='button'
      className='btn btn-ghost btn-sm'
      disabled={pending || added}
      onClick={() =>
        startTransition(async () => {
          await addRecipeToShoppingList(recipeId, servings)
          setAdded(true)
          setTimeout(() => setAdded(false), 3000)
        })
      }
    >
      {added ? '✓ Added to list' : '🛒 Add to list'}
    </button>
  )
}
