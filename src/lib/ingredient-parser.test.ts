import { describe, expect, it } from 'vitest'
import { parseIngredientLine } from './ingredient-parser'

describe('parseIngredientLine', () => {
  it('parses quantity, unit, item, and note', () => {
    expect(parseIngredientLine('2 cups all-purpose flour, sifted')).toEqual({
      quantity: '2',
      unit: 'cups',
      item: 'all-purpose flour',
      note: 'sifted',
    })
  })

  it('handles modifiers between quantity and unit', () => {
    expect(parseIngredientLine('2 heaping cups AP flour')).toEqual({
      quantity: '2',
      unit: 'cups',
      item: 'AP flour',
      note: '',
    })
  })

  it('handles fractions and mixed numbers', () => {
    expect(parseIngredientLine('1 1/2 tbsp sugar')).toEqual({
      quantity: '1 1/2',
      unit: 'tbsp',
      item: 'sugar',
      note: '',
    })
    expect(parseIngredientLine('½ tsp salt')).toEqual({
      quantity: '½',
      unit: 'tsp',
      item: 'salt',
      note: '',
    })
  })

  it('handles "of" and unitless lines', () => {
    expect(parseIngredientLine('2 cups of milk')).toEqual({
      quantity: '2',
      unit: 'cups',
      item: 'milk',
      note: '',
    })
    expect(parseIngredientLine('3 eggs, separated')).toEqual({
      quantity: '3',
      unit: '',
      item: 'eggs',
      note: 'separated',
    })
  })

  it('passes through unparseable lines as the item', () => {
    expect(parseIngredientLine('powdered sugar and jam for serving')).toEqual({
      quantity: '',
      unit: '',
      item: 'powdered sugar and jam for serving',
      note: '',
    })
  })

  it('does not treat a long trailing clause as a note', () => {
    const result = parseIngredientLine(
      '1 cup broth, preferably homemade from a slow simmer of roasted bones and aromatics',
    )
    expect(result.note).toBe('')
    expect(result.item).toContain('broth')
  })
})
