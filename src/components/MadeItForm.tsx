'use client'

import { useActionState, useState } from 'react'
import { addMadeIt, type MadeItFormState } from '@/app/actions/social'

const initialState: MadeItFormState = { error: null }

export default function MadeItForm({ recipeId }: { recipeId: string }) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(
    addMadeIt.bind(null, recipeId),
    initialState,
  )

  if (!open) {
    return (
      <button
        type='button'
        className='btn btn-secondary'
        onClick={() => setOpen(true)}
      >
        ✓ I made this
      </button>
    )
  }

  return (
    <form
      action={formAction}
      className='card bg-base-200 p-4 space-y-3 max-w-md'
    >
      <h3 className='font-semibold'>How did it turn out?</h3>
      {state.error && (
        <div role='alert' className='alert alert-error text-sm'>
          {state.error}
        </div>
      )}
      <div className='rating'>
        {[1, 2, 3, 4, 5].map((value) => (
          <input
            key={value}
            type='radio'
            name='rating'
            value={value}
            aria-label={`${value} star${value > 1 ? 's' : ''}`}
            className='mask mask-star-2 bg-warning'
            defaultChecked={value === 5}
          />
        ))}
      </div>
      <textarea
        name='notes'
        rows={2}
        maxLength={1000}
        placeholder='Any tweaks or tips?'
        aria-label='Notes'
        className='textarea textarea-bordered w-full'
      />
      <input
        name='photo'
        type='file'
        accept='image/jpeg,image/png,image/webp,image/gif'
        aria-label='Photo of your result'
        className='file-input file-input-bordered file-input-sm w-full'
      />
      <div className='flex gap-2'>
        <button type='submit' disabled={pending} className='btn btn-primary'>
          {pending ? 'Posting…' : 'Post it'}
        </button>
        <button
          type='button'
          className='btn btn-ghost'
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
