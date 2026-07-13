import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  UPLOAD_DIR: z.string().default('./uploads'),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
})

// Parse lazily so importing app code never crashes at build time when a
// variable is only needed at runtime (e.g. DATABASE_URL during `next build`).
let cached: z.infer<typeof envSchema> | undefined

export function env(): z.infer<typeof envSchema> {
  if (!cached) {
    const result = envSchema.safeParse(process.env)
    if (!result.success) {
      const issues = result.error.issues
        .map((i) => `  ${i.path.join('.')}: ${i.message}`)
        .join('\n')
      throw new Error(`Invalid environment variables:\n${issues}`)
    }
    cached = result.data
  }
  return cached
}
