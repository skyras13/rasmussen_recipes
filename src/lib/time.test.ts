import { describe, expect, it } from 'vitest'
import { timeAgo } from './time'

describe('timeAgo', () => {
  const now = new Date('2026-07-13T12:00:00Z')

  it('says "just now" for very recent times', () => {
    expect(timeAgo(new Date('2026-07-13T11:59:40Z'), now)).toBe('just now')
  })

  it('formats minutes, hours, and days', () => {
    expect(timeAgo(new Date('2026-07-13T11:55:00Z'), now)).toBe('5 minutes ago')
    expect(timeAgo(new Date('2026-07-13T09:00:00Z'), now)).toBe('3 hours ago')
    expect(timeAgo(new Date('2026-07-11T12:00:00Z'), now)).toBe('2 days ago')
  })

  it('formats weeks and years', () => {
    expect(timeAgo(new Date('2026-06-22T12:00:00Z'), now)).toBe('3 weeks ago')
    expect(timeAgo(new Date('2024-07-13T12:00:00Z'), now)).toBe('2 years ago')
  })
})
