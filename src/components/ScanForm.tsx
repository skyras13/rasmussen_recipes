'use client'

import { useState, useTransition } from 'react'
import { scanRecipeCard } from '@/app/actions/scan'
import RecipeForm, { type RecipeFormInitial } from './RecipeForm'

export default function ScanForm({
  families,
  enabled,
}: {
  families: Array<{ id: string; name: string }>
  enabled: boolean
}) {
  const [initial, setInitial] = useState<RecipeFormInitial | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (initial) {
    return <RecipeForm families={families} initial={initial} />
  }

  return (
    <div className='space-y-4'>
      {!enabled && (
        <div role='alert' className='alert alert-warning'>
          AI scanning is not configured — the server needs an ANTHROPIC_API_KEY.
          You can still add the recipe by hand or import it from a URL.
        </div>
      )}
      {error && (
        <div role='alert' className='alert alert-error'>
          {error}
        </div>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault()
          const formData = new FormData(event.currentTarget)
          setError(null)
          startTransition(async () => {
            const result = await scanRecipeCard(formData)
            if (result.ok) setInitial(result.initial)
            else setError(result.error)
          })
        }}
        className='space-y-4 max-w-md'
      >
        <label className='form-control w-full'>
          <span className='label-text mb-1'>
            Photo of the recipe card or page
          </span>
          <input
            name='photo'
            type='file'
            required
            accept='image/jpeg,image/png,image/webp,image/gif'
            className='file-input file-input-bordered w-full'
          />
        </label>
        <button
          type='submit'
          disabled={pending || !enabled}
          className='btn btn-primary'
        >
          {pending ? 'Reading the card…' : '✨ Read this recipe'}
        </button>
      </form>
    </div>
  )
}
