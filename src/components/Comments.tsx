'use client'

import { useActionState, useEffect, useRef } from 'react'
import {
  addComment,
  deleteComment,
  type CommentFormState,
} from '@/app/actions/social'
import { timeAgo } from '@/lib/time'

export type CommentData = {
  id: string
  text: string
  createdAt: string
  author: { name: string; username: string }
  mine: boolean
}

const initialState: CommentFormState = { error: null }

export function CommentForm({ recipeId }: { recipeId: string }) {
  const [state, formAction, pending] = useActionState(
    addComment.bind(null, recipeId),
    initialState,
  )
  const formRef = useRef<HTMLFormElement>(null)
  const wasPending = useRef(false)

  // Clear the box once a submission lands without an error.
  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      formRef.current?.reset()
    }
    wasPending.current = pending
  }, [pending, state.error])

  return (
    <form ref={formRef} action={formAction} className='space-y-2'>
      {state.error && (
        <div role='alert' className='alert alert-error text-sm'>
          {state.error}
        </div>
      )}
      <div className='flex gap-2'>
        <input
          name='text'
          required
          maxLength={2000}
          placeholder='Add a comment…'
          aria-label='Add a comment'
          className='input input-bordered flex-1'
        />
        <button type='submit' disabled={pending} className='btn btn-primary'>
          {pending ? '…' : 'Post'}
        </button>
      </div>
    </form>
  )
}

export function CommentItem({ comment }: { comment: CommentData }) {
  return (
    <li className='flex gap-3'>
      <div className='avatar avatar-placeholder'>
        <div className='bg-neutral text-neutral-content w-8 rounded-full'>
          <span className='text-xs'>
            {comment.author.name.slice(0, 1).toUpperCase()}
          </span>
        </div>
      </div>
      <div className='flex-1'>
        <p className='text-sm'>
          <span className='font-medium'>{comment.author.name}</span>{' '}
          <span className='text-base-content/50'>
            @{comment.author.username} · {timeAgo(new Date(comment.createdAt))}
          </span>
        </p>
        <p className='whitespace-pre-line'>{comment.text}</p>
      </div>
      {comment.mine && (
        <form action={deleteComment.bind(null, comment.id)}>
          <button
            type='submit'
            className='btn btn-ghost btn-xs'
            aria-label='Delete comment'
          >
            ✕
          </button>
        </form>
      )}
    </li>
  )
}
