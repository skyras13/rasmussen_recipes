import { describe, expect, it } from 'vitest'
import { detectTimerSeconds } from './CookMode'

describe('detectTimerSeconds', () => {
  it('detects simple minute durations', () => {
    expect(detectTimerSeconds('Simmer for 10 minutes.')).toBe(600)
    expect(detectTimerSeconds('rest 15 min')).toBe(900)
  })

  it('uses the lower bound of a range', () => {
    expect(detectTimerSeconds('Bake for 22–25 minutes until golden.')).toBe(
      22 * 60,
    )
  })

  it('detects hours and seconds', () => {
    expect(detectTimerSeconds('Proof for 1 hour.')).toBe(3600)
    expect(detectTimerSeconds('microwave 30 seconds')).toBe(30)
  })

  it('returns null when no duration is present', () => {
    expect(detectTimerSeconds('Whisk the dry ingredients together.')).toBeNull()
    expect(detectTimerSeconds('Add 2 cups of flour.')).toBeNull()
  })
})
