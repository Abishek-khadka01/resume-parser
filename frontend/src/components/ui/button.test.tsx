import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from './button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('applies default variant classes', () => {
    render(<Button>OK</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('bg-primary')
  })

  it('applies outline variant', () => {
    render(<Button variant="outline">Cancel</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('border-border')
  })

  it('forwards additional className', () => {
    render(<Button className="extra-class">Test</Button>)
    expect(screen.getByRole('button').className).toContain('extra-class')
  })

  it('renders as disabled', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
