// Heuristic ingredient-line parser: turns free text like
// "2 heaping cups AP flour, sifted" into structured quantity/unit/item/note.
// Used by URL import and AI extraction post-processing; no AI required.

const UNITS = new Set(
  [
    'cup',
    'cups',
    'c',
    'tablespoon',
    'tablespoons',
    'tbsp',
    'tbs',
    'teaspoon',
    'teaspoons',
    'tsp',
    'pound',
    'pounds',
    'lb',
    'lbs',
    'ounce',
    'ounces',
    'oz',
    'gram',
    'grams',
    'g',
    'kilogram',
    'kilograms',
    'kg',
    'milliliter',
    'milliliters',
    'ml',
    'liter',
    'liters',
    'l',
    'pinch',
    'pinches',
    'dash',
    'dashes',
    'clove',
    'cloves',
    'can',
    'cans',
    'jar',
    'jars',
    'stick',
    'sticks',
    'slice',
    'slices',
    'piece',
    'pieces',
    'bunch',
    'bunches',
    'package',
    'packages',
    'pack',
    'packs',
    'sprig',
    'sprigs',
    'stalk',
    'stalks',
    'head',
    'heads',
    'quart',
    'quarts',
    'qt',
    'pint',
    'pints',
    'pt',
    'gallon',
    'gallons',
    'square',
    'squares',
  ].map((unit) => unit.toLowerCase()),
)

// Descriptors that sit between the quantity and the unit ("2 heaping cups").
const QUANTITY_MODIFIERS = new Set([
  'heaping',
  'scant',
  'level',
  'rounded',
  'generous',
  'large',
  'small',
  'medium',
])

export type ParsedIngredient = {
  quantity: string
  unit: string
  item: string
  note: string
}

const QUANTITY_TOKEN =
  /^(\d+\s+\d+\s*\/\s*\d+|\d+\s*\/\s*\d+|\d+(?:\.\d+)?|[½⅓⅔¼¾⅕⅙⅛⅜⅝⅞]|\d+[½⅓⅔¼¾⅕⅙⅛⅜⅝⅞])$/

/** Parse one ingredient line. Unparseable lines land in `item` untouched. */
export function parseIngredientLine(line: string): ParsedIngredient {
  const cleaned = line.replace(/\s+/g, ' ').trim()
  if (!cleaned) return { quantity: '', unit: '', item: '', note: '' }

  // Trailing ", note" → note (only the last comma segment, keep it short).
  let note = ''
  let rest = cleaned
  const commaIndex = cleaned.lastIndexOf(',')
  if (commaIndex > 0) {
    const candidate = cleaned.slice(commaIndex + 1).trim()
    if (candidate && candidate.length <= 40) {
      note = candidate
      rest = cleaned.slice(0, commaIndex).trim()
    }
  }

  const tokens = rest.split(' ')
  let index = 0

  // Quantity: "2", "1.5", "3/4", "1 1/2", "1½", "½"
  let quantity = ''
  if (index < tokens.length && QUANTITY_TOKEN.test(tokens[index])) {
    quantity = tokens[index]
    index++
    // Mixed number written as two tokens: "1" + "1/2"
    if (
      index < tokens.length &&
      /^\d+\s*\/\s*\d+$/.test(tokens[index]) &&
      /^\d+$/.test(quantity)
    ) {
      quantity = `${quantity} ${tokens[index]}`
      index++
    }
  }

  // Skip modifiers like "heaping" only when a unit follows them.
  let modifierEnd = index
  while (
    modifierEnd < tokens.length &&
    QUANTITY_MODIFIERS.has(tokens[modifierEnd].toLowerCase())
  ) {
    modifierEnd++
  }

  let unit = ''
  if (
    quantity &&
    modifierEnd < tokens.length &&
    UNITS.has(tokens[modifierEnd].toLowerCase().replace(/\.$/, ''))
  ) {
    unit = tokens[modifierEnd].toLowerCase().replace(/\.$/, '')
    index = modifierEnd + 1
  }

  const item = tokens
    .slice(index)
    .join(' ')
    .replace(/^of\s+/i, '')
  return { quantity, unit, item, note }
}
