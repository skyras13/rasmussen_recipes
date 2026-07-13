'use client'

import { useState, useTransition } from 'react'
import { removeShoppingItem, toggleShoppingItem } from '@/app/actions/shopping'

export type ShoppingItemData = {
  id: string
  quantity: string | null
  unit: string | null
  item: string
  recipeTitle: string | null
  checked: boolean
}

export default function ShoppingItemRow({ item }: { item: ShoppingItemData }) {
  const [checked, setChecked] = useState(item.checked)
  const [removed, setRemoved] = useState(false)
  const [, startTransition] = useTransition()

  if (removed) return null

  return (
    <li className='flex items-center gap-3 rounded-box p-2 hover:bg-base-200'>
      <input
        type='checkbox'
        className='checkbox checkbox-sm'
        checked={checked}
        aria-label={`Mark ${item.item} as ${checked ? 'needed' : 'bought'}`}
        onChange={() => {
          setChecked(!checked)
          startTransition(() => toggleShoppingItem(item.id))
        }}
      />
      <span
        className={`flex-1 ${checked ? 'line-through text-base-content/40' : ''}`}
      >
        {item.quantity && <strong>{item.quantity} </strong>}
        {item.unit && `${item.unit} `}
        {item.item}
        {item.recipeTitle && (
          <span className='text-xs text-base-content/50'>
            {' '}
            · {item.recipeTitle}
          </span>
        )}
      </span>
      <button
        type='button'
        className='btn btn-ghost btn-xs'
        aria-label={`Remove ${item.item}`}
        onClick={() => {
          setRemoved(true)
          startTransition(() => removeShoppingItem(item.id))
        }}
      >
        ✕
      </button>
    </li>
  )
}
