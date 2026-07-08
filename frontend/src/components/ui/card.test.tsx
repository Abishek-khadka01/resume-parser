import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card'

describe('Card', () => {
  it('renders children', () => {
    render(<Card>content</Card>)
    expect(screen.getByText('content')).toBeInTheDocument()
  })
})

describe('CardHeader', () => {
  it('renders children', () => {
    render(<CardHeader>header</CardHeader>)
    expect(screen.getByText('header')).toBeInTheDocument()
  })
})

describe('CardTitle', () => {
  it('renders title text', () => {
    render(<CardTitle>My Title</CardTitle>)
    expect(screen.getByText('My Title')).toBeInTheDocument()
  })
})

describe('CardDescription', () => {
  it('renders description', () => {
    render(<CardDescription>desc</CardDescription>)
    expect(screen.getByText('desc')).toBeInTheDocument()
  })
})

describe('CardContent', () => {
  it('renders content area', () => {
    render(<CardContent>body</CardContent>)
    expect(screen.getByText('body')).toBeInTheDocument()
  })
})

describe('CardFooter', () => {
  it('renders footer', () => {
    render(<CardFooter>footer</CardFooter>)
    expect(screen.getByText('footer')).toBeInTheDocument()
  })
})
