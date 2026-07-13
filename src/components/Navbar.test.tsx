import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Navbar from './Navbar'

describe('Navbar', () => {
  it('renders the brand and primary navigation links', () => {
    render(<Navbar />)

    expect(screen.getByRole('link', { name: 'FamilyRecipes' })).toHaveAttribute(
      'href',
      '/',
    )
    expect(screen.getByRole('link', { name: 'Recipes' })).toHaveAttribute(
      'href',
      '/recipes',
    )
    expect(screen.getByRole('link', { name: 'Families' })).toHaveAttribute(
      'href',
      '/families',
    )
    expect(screen.getByRole('link', { name: 'Sign Up' })).toHaveAttribute(
      'href',
      '/signup',
    )
  })
})
