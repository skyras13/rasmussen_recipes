import { describe, expect, it } from 'vitest'
import { formatQuantity, parseQuantity, scaleQuantity } from './recipe-utils'

describe('parseQuantity', () => {
  it('parses whole numbers and decimals', () => {
    expect(parseQuantity('2')).toBe(2)
    expect(parseQuantity('1.5')).toBe(1.5)
  })

  it('parses fractions and mixed numbers', () => {
    expect(parseQuantity('3/4')).toBe(0.75)
    expect(parseQuantity('1 1/2')).toBe(1.5)
    expect(parseQuantity('1½')).toBe(1.5)
    expect(parseQuantity('½')).toBe(0.5)
  })

  it('rejects garbage, zero, and division by zero', () => {
    expect(parseQuantity('')).toBeNull()
    expect(parseQuantity('a pinch')).toBeNull()
    expect(parseQuantity('0')).toBeNull()
    expect(parseQuantity('1/0')).toBeNull()
  })
})

describe('scaleQuantity', () => {
  it('scales linearly with servings', () => {
    expect(scaleQuantity(2, 4, 8)).toBe(4)
    expect(scaleQuantity(1.5, 4, 2)).toBe(0.75)
  })

  it('leaves the quantity alone for invalid serving counts', () => {
    expect(scaleQuantity(2, 0, 8)).toBe(2)
  })
})

describe('formatQuantity', () => {
  it('renders whole numbers plainly', () => {
    expect(formatQuantity(3)).toBe('3')
  })

  it('renders common fractions as glyphs', () => {
    expect(formatQuantity(0.5)).toBe('½')
    expect(formatQuantity(1.5)).toBe('1½')
    expect(formatQuantity(0.75)).toBe('¾')
    expect(formatQuantity(1 / 3)).toBe('⅓')
  })

  it('falls back to trimmed decimals', () => {
    expect(formatQuantity(1.3)).toBe('1.3')
  })
})
