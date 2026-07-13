import { z } from 'zod'

export const signupSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Username must be at least 3 characters')
    .max(30)
    .regex(
      /^[a-z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores',
    ),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const ingredientInputSchema = z.object({
  quantity: z.string().trim().optional(),
  unit: z.string().trim().max(30).optional(),
  item: z.string().trim().min(1, 'Ingredient name is required').max(200),
  note: z.string().trim().max(200).optional(),
})

export const stepInputSchema = z.object({
  text: z.string().trim().min(1, 'Step text is required').max(2000),
})

export const recipeSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120),
  description: z.string().trim().max(500).optional(),
  story: z.string().trim().max(5000).optional(),
  servings: z.coerce.number().int().min(1).max(100),
  prepMin: z.coerce.number().int().min(0).max(6000).optional(),
  cookMin: z.coerce.number().int().min(0).max(6000).optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  cuisine: z.string().trim().max(60).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20),
  visibility: z.enum(['PUBLIC', 'FAMILY', 'PRIVATE']),
  ingredients: z
    .array(ingredientInputSchema)
    .min(1, 'Add at least one ingredient'),
  steps: z.array(stepInputSchema).min(1, 'Add at least one step'),
})

export type SignupInput = z.infer<typeof signupSchema>
export type RecipeInput = z.infer<typeof recipeSchema>
