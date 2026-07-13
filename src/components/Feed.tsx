'use client'

import { useEffect, useRef, useState } from 'react'
import { loadFeedPage } from '@/app/actions/social'
import type { FeedPage, FeedPost } from '@/lib/feed'
import FeedPostCard from './FeedPostCard'

// Infinite scroll: an IntersectionObserver sentinel at the bottom pulls
// the next cursor-paginated page from the server.
export default function Feed({ initial }: { initial: FeedPage }) {
  const [posts, setPosts] = useState<FeedPost[]>(initial.posts)
  const [cursor, setCursor] = useState(initial.nextCursor)
  const [loading, setLoading] = useState(false)
  const sentinel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!cursor || !sentinel.current) return
    const observer = new IntersectionObserver(async (entries) => {
      if (!entries[0].isIntersecting || loading) return
      setLoading(true)
      try {
        const page = await loadFeedPage(cursor)
        setPosts((prev) => [...prev, ...page.posts])
        setCursor(page.nextCursor)
      } finally {
        setLoading(false)
      }
    })
    observer.observe(sentinel.current)
    return () => observer.disconnect()
  }, [cursor, loading])

  return (
    <div className='space-y-6'>
      {posts.map((post) => (
        <FeedPostCard key={post.id} post={post} />
      ))}
      {cursor && (
        <div ref={sentinel} className='flex justify-center py-6'>
          <span className='loading loading-dots loading-md' />
        </div>
      )}
    </div>
  )
}
