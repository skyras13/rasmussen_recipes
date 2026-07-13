'use client'

import Link from 'next/link'
import { useRef, useState, useTransition } from 'react'
import { toggleLike } from '@/app/actions/social'
import type { FeedPost } from '@/lib/feed'
import { timeAgo } from '@/lib/time'

// One Instagram-style post: photo first, double-tap (or double-click) the
// photo to like, action row underneath.
export default function FeedPostCard({ post }: { post: FeedPost }) {
  const [liked, setLiked] = useState(post.likedByMe)
  const [count, setCount] = useState(post.likeCount)
  const [burst, setBurst] = useState(false)
  const [, startTransition] = useTransition()
  const lastTap = useRef(0)

  function setLike(next: boolean) {
    if (next === liked) return
    setLiked(next)
    setCount((c) => c + (next ? 1 : -1))
    startTransition(async () => {
      try {
        const server = await toggleLike(post.id)
        setLiked(server)
      } catch {
        setLiked(!next)
        setCount((c) => c + (next ? -1 : 1))
      }
    })
  }

  function onDoubleTap() {
    setBurst(true)
    setTimeout(() => setBurst(false), 700)
    setLike(true)
  }

  function onTouchEnd() {
    const now = Date.now()
    if (now - lastTap.current < 300) onDoubleTap()
    lastTap.current = now
  }

  return (
    <article className='card bg-base-100 shadow-sm max-w-xl mx-auto w-full'>
      <div className='flex items-center gap-3 px-4 py-3'>
        <Link
          href={`/u/${post.author.username}`}
          className='avatar avatar-placeholder'
        >
          <div className='bg-primary text-primary-content w-9 rounded-full'>
            <span className='text-sm'>
              {post.author.name.slice(0, 1).toUpperCase()}
            </span>
          </div>
        </Link>
        <div className='flex-1 leading-tight'>
          <Link
            href={`/u/${post.author.username}`}
            className='font-medium hover:underline'
          >
            {post.author.name}
          </Link>
          <p className='text-xs text-base-content/60'>
            @{post.author.username} · {timeAgo(new Date(post.publishedAt))}
            {post.visibility === 'FAMILY' && ' · family only'}
          </p>
        </div>
      </div>

      <div
        className='relative select-none'
        onDoubleClick={onDoubleTap}
        onTouchEnd={onTouchEnd}
      >
        <Link href={`/recipes/${post.id}`} draggable={false}>
          {post.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.coverUrl}
              alt={post.title}
              draggable={false}
              className='aspect-square w-full object-cover'
            />
          ) : (
            <div className='aspect-square w-full bg-base-200 flex items-center justify-center text-6xl'>
              🍽️
            </div>
          )}
        </Link>
        {burst && (
          <span
            aria-hidden
            className='absolute inset-0 flex items-center justify-center text-7xl text-white drop-shadow-lg animate-ping'
          >
            ♥
          </span>
        )}
      </div>

      <div className='px-4 py-3'>
        <div className='flex items-center gap-1 mb-2'>
          <button
            type='button'
            onClick={() => setLike(!liked)}
            aria-pressed={liked}
            aria-label={liked ? 'Unlike' : 'Like'}
            className='btn btn-ghost btn-sm gap-1'
          >
            <span className={`text-lg ${liked ? 'text-error' : ''}`}>
              {liked ? '♥' : '♡'}
            </span>
            <span>{count}</span>
          </button>
          <Link
            href={`/recipes/${post.id}#comments`}
            className='btn btn-ghost btn-sm gap-1'
          >
            💬 {post.commentCount}
          </Link>
        </div>
        <Link href={`/recipes/${post.id}`} className='hover:underline'>
          <h2 className='font-semibold'>{post.title}</h2>
        </Link>
        {post.description && (
          <p className='text-sm text-base-content/70'>{post.description}</p>
        )}
      </div>
    </article>
  )
}
