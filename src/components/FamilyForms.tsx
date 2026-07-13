'use client'

import { useActionState, useState } from 'react'
import { createFamily, type FamilyFormState } from '@/app/actions/families'

const initialState: FamilyFormState = { error: null }

export function CreateFamilyForm() {
  const [state, formAction, pending] = useActionState(
    createFamily,
    initialState,
  )

  return (
    <form action={formAction} className='space-y-3'>
      {state.error && (
        <div role='alert' className='alert alert-error text-sm'>
          {state.error}
        </div>
      )}
      <label className='form-control w-full'>
        <span className='label-text mb-1'>Family name</span>
        <input
          name='name'
          required
          minLength={2}
          maxLength={80}
          placeholder='The Rasmussens'
          className='input input-bordered w-full'
        />
      </label>
      <label className='form-control w-full'>
        <span className='label-text mb-1'>About (optional)</span>
        <input
          name='about'
          maxLength={500}
          placeholder='Four generations of Danish-American cooking.'
          className='input input-bordered w-full'
        />
      </label>
      <button type='submit' disabled={pending} className='btn btn-primary'>
        {pending ? 'Creating…' : 'Create family group'}
      </button>
    </form>
  )
}

export function InviteLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <div className='flex flex-wrap items-center gap-2'>
      <code className='bg-base-200 rounded px-2 py-1 text-sm break-all'>
        {url}
      </code>
      <button
        type='button'
        className='btn btn-sm btn-outline'
        onClick={async () => {
          await navigator.clipboard.writeText(url)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        }}
      >
        {copied ? 'Copied!' : 'Copy invite link'}
      </button>
    </div>
  )
}
