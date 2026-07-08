import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './badge'

describe('Badge', () => {
  it('renders text', () => {
    render(<Badge>New</Badge>)
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('applies default variant', () => {
    render(<Badge>Default</Badge>)
    const el = screen.getByText('Default')
    expect(el.className).toContain('bg-primary')
  })

  it('applies outline variant', () => {
    render(<Badge variant="outline">Outline</Badge>)
    const el = screen.getByText('Outline')
    expect(el.className).toContain('border-border')
  })
})
