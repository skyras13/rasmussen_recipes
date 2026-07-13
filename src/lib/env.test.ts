import { describe, expect, it, vi } from 'vitest'

describe('env', () => {
  it('throws a readable error when DATABASE_URL is missing', async () => {
    vi.resetModules()
    vi.stubEnv('DATABASE_URL', '')
    const { env } = await import('./env')
    expect(() => env()).toThrow(/DATABASE_URL/)
    vi.unstubAllEnvs()
  })

  it('returns parsed values when the environment is valid', async () => {
    vi.resetModules()
    vi.stubEnv('DATABASE_URL', 'postgresql://user:pass@localhost:5432/db')
    const { env } = await import('./env')
    expect(env().DATABASE_URL).toContain('postgresql://')
    vi.unstubAllEnvs()
  })
})
