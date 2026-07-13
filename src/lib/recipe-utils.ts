// Quantity parsing/formatting for structured ingredients.
// Quantities are stored as decimals; these helpers translate between the
// numbers and the way cooks actually write them ("1 1/2", "¾").

const UNICODE_FRACTIONS: Record<string, number> = {
  '½': 1 / 2,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '¼': 1 / 4,
  '¾': 3 / 4,
  '⅕': 1 / 5,
  '⅙': 1 / 6,
  '⅛': 1 / 8,
  '⅜': 3 / 8,
  '⅝': 5 / 8,
  '⅞': 7 / 8,
}

const DISPLAY_FRACTIONS: Array<[number, string]> = [
  [1 / 8, '⅛'],
  [1 / 6, '⅙'],
  [1 / 4, '¼'],
  [1 / 3, '⅓'],
  [3 / 8, '⅜'],
  [1 / 2, '½'],
  [5 / 8, '⅝'],
  [2 / 3, '⅔'],
  [3 / 4, '¾'],
  [7 / 8, '⅞'],
]

/**
 * Parse a human-entered quantity: "2", "1.5", "3/4", "1 1/2", "1½".
 * Returns null when the input isn't a usable positive number.
 */
export function parseQuantity(input: string): number | null {
  let text = input.trim()
  if (!text) return null

  let total = 0
  for (const [glyph, value] of Object.entries(UNICODE_FRACTIONS)) {
    if (text.includes(glyph)) {
      total += value
      text = text.replace(glyph, '').trim()
    }
  }

  if (text) {
    const mixed = text.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/)
    const fraction = text.match(/^(\d+)\s*\/\s*(\d+)$/)
    if (mixed) {
      const denominator = Number(mixed[3])
      if (denominator === 0) return null
      total += Number(mixed[1]) + Number(mixed[2]) / denominator
    } else if (fraction) {
      const denominator = Number(fraction[2])
      if (denominator === 0) return null
      total += Number(fraction[1]) / denominator
    } else {
      const decimal = Number(text)
      if (!Number.isFinite(decimal)) return null
      total += decimal
    }
  }

  return total > 0 ? total : null
}

/** Scale a quantity from a recipe's base servings to a target serving count. */
export function scaleQuantity(
  quantity: number,
  baseServings: number,
  targetServings: number,
): number {
  if (baseServings <= 0 || targetServings <= 0) return quantity
  return (quantity * targetServings) / baseServings
}

/**
 * Format a quantity the way a cook would write it: whole numbers stay whole,
 * common fractions render as glyphs ("1½"), everything else trims to at most
 * two decimals.
 */
export function formatQuantity(quantity: number): string {
  if (!Number.isFinite(quantity) || quantity <= 0) return ''

  const whole = Math.floor(quantity)
  const remainder = quantity - whole

  if (remainder < 0.02) return String(whole || quantity.toFixed(2))

  for (const [value, glyph] of DISPLAY_FRACTIONS) {
    if (Math.abs(remainder - value) < 0.02) {
      return whole > 0 ? `${whole}${glyph}` : glyph
    }
  }

  const rounded = Math.round(quantity * 100) / 100
  return String(rounded)
}
