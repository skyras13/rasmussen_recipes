'use client'

import { useState } from 'react'
import { formatQuantity, scaleQuantity } from '@/lib/recipe-utils'

export type IngredientData = {
  id: string
  quantity: number | null
  unit: string | null
  item: string
  note: string | null
}

// Interactive ingredient panel: scale servings up/down and check items off
// while cooking. Quantities scale linearly from the recipe's base servings.
export default function IngredientList({
  ingredients,
  baseServings,
}: {
  ingredients: IngredientData[]
  baseServings: number
}) {
  const [servings, setServings] = useState(baseServings)
  const [checked, setChecked] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div>
      <div className='flex items-center gap-3 mb-4'>
        <h2 className='text-xl font-semibold flex-1'>Ingredients</h2>
        <div className='join' aria-label='Adjust servings'>
          <button
            type='button'
            className='btn btn-sm join-item'
            aria-label='Fewer servings'
            disabled={servings <= 1}
            onClick={() => setServings((s) => Math.max(1, s - 1))}
          >
            −
          </button>
          <span className='btn btn-sm join-item pointer-events-none'>
            {servings} {servings === 1 ? 'serving' : 'servings'}
          </span>
          <button
            type='button'
            className='btn btn-sm join-item'
            aria-label='More servings'
            onClick={() => setServings((s) => Math.min(100, s + 1))}
          >
            +
          </button>
        </div>
      </div>
      <ul className='space-y-2'>
        {ingredients.map((ingredient) => {
          const scaled =
            ingredient.quantity !== null
              ? formatQuantity(
                  scaleQuantity(ingredient.quantity, baseServings, servings),
                )
              : null
          const isChecked = checked.has(ingredient.id)
          return (
            <li key={ingredient.id}>
              <label className='flex items-start gap-3 cursor-pointer'>
                <input
                  type='checkbox'
                  className='checkbox checkbox-sm mt-0.5'
                  checked={isChecked}
                  onChange={() => toggle(ingredient.id)}
                />
                <span
                  className={
                    isChecked ? 'line-through text-base-content/50' : ''
                  }
                >
                  {scaled && <strong>{scaled} </strong>}
                  {ingredient.unit && `${ingredient.unit} `}
                  {ingredient.item}
                  {ingredient.note && (
                    <span className='text-base-content/60'>
                      {' '}
                      ({ingredient.note})
                    </span>
                  )}
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
