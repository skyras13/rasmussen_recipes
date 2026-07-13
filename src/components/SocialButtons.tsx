'use client'

import { useState, useTransition } from 'react'
import { toggleFollow, toggleLike, toggleSave } from '@/app/actions/social'

// Optimistic toggles: flip the UI immediately, reconcile with the server
// result, and roll back if the action fails.

export function LikeButton({
  recipeId,
  initialLiked,
  initialCount,
}: {
  recipeId: string
  initialLiked: boolean
  initialCount: number
}) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [, startTransition] = useTransition()

  function toggle() {
    const next = !liked
    setLiked(next)
    setCount((c) => c + (next ? 1 : -1))
    startTransition(async () => {
      try {
        const server = await toggleLike(recipeId)
        setLiked(server)
      } catch {
        setLiked(!next)
        setCount((c) => c + (next ? -1 : 1))
      }
    })
  }

  return (
    <button
      type='button'
      onClick={toggle}
      aria-pressed={liked}
      aria-label={liked ? 'Unlike' : 'Like'}
      className='btn btn-ghost btn-sm gap-1'
    >
      <span className={liked ? 'text-error' : ''}>{liked ? '♥' : '♡'}</span>
      <span>{count}</span>
    </button>
  )
}

export function SaveButton({
  recipeId,
  initialSaved,
}: {
  recipeId: string
  initialSaved: boolean
}) {
  const [saved, setSaved] = useState(initialSaved)
  const [, startTransition] = useTransition()

  function toggle() {
    const next = !saved
    setSaved(next)
    startTransition(async () => {
      try {
        setSaved(await toggleSave(recipeId))
      } catch {
        setSaved(!next)
      }
    })
  }

  return (
    <button
      type='button'
      onClick={toggle}
      aria-pressed={saved}
      aria-label={saved ? 'Unsave' : 'Save'}
      className='btn btn-ghost btn-sm gap-1'
    >
      {saved ? '🔖 Saved' : '🔖 Save'}
    </button>
  )
}

export function FollowButton({
  username,
  initialFollowing,
}: {
  username: string
  initialFollowing: boolean
}) {
  const [following, setFollowing] = useState(initialFollowing)
  const [pending, startTransition] = useTransition()

  function toggle() {
    const next = !following
    setFollowing(next)
    startTransition(async () => {
      try {
        setFollowing(await toggleFollow(username))
      } catch {
        setFollowing(!next)
      }
    })
  }

  return (
    <button
      type='button'
      onClick={toggle}
      disabled={pending}
      className={following ? 'btn btn-outline' : 'btn btn-primary'}
    >
      {following ? 'Following' : 'Follow'}
    </button>
  )
}
