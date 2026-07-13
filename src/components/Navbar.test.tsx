import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Navbar from './Navbar'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(async () => null),
}))
vi.mock('@/app/actions/auth', () => ({
  logout: vi.fn(),
}))

describe('Navbar', () => {
  it('renders brand and auth links for a signed-out visitor', async () => {
    render(await Navbar())

    expect(screen.getByRole('link', { name: 'FamilyRecipes' })).toHaveAttribute(
      'href',
      '/',
    )
    expect(screen.getAllByRole('link', { name: 'Recipes' })[0]).toHaveAttribute(
      'href',
      '/recipes',
    )
    expect(screen.getByRole('link', { name: 'Login' })).toHaveAttribute(
      'href',
      '/login',
    )
    expect(screen.getByRole('link', { name: 'Sign Up' })).toHaveAttribute(
      'href',
      '/signup',
    )
    expect(
      screen.queryByRole('link', { name: '+ New recipe' }),
    ).not.toBeInTheDocument()
  })
})
