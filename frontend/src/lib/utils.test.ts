import { describe, it, expect } from 'vitest'
import { cn, formatDate, getMatchColor, categoryLabel } from './utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible')
  })

  it('handles no args', () => {
    expect(cn()).toBe('')
  })
})

describe('formatDate', () => {
  it('formats an ISO string', () => {
    const result = formatDate('2026-07-08T12:00:00Z')
    expect(result).toContain('Jul')
    expect(result).toContain('8')
    expect(result).toContain('2026')
  })

  it('formats a Date object', () => {
    const result = formatDate(new Date('2026-01-15'))
    expect(result).toContain('Jan')
    expect(result).toContain('15')
    expect(result).toContain('2026')
  })
})

describe('getMatchColor', () => {
  it('returns green for score >= 8', () => {
    const cls = getMatchColor(8)
    expect(cls).toContain('green')
    expect(cls).not.toContain('red')
    expect(cls).not.toContain('yellow')
  })

  it('returns yellow for score 5-7', () => {
    const cls = getMatchColor(5)
    expect(cls).toContain('yellow')
    expect(cls).not.toContain('green')
    expect(cls).not.toContain('red')
  })

  it('returns red for score < 5', () => {
    const cls = getMatchColor(4)
    expect(cls).toContain('red')
    expect(cls).not.toContain('green')
    expect(cls).not.toContain('yellow')
  })

  it('returns red for score 0', () => {
    expect(getMatchColor(0)).toContain('red')
  })
})

describe('categoryLabel', () => {
  it('converts snake_case to Title Case', () => {
    expect(categoryLabel('programming_languages')).toBe('Programming Languages')
  })

  it('handles single word', () => {
    expect(categoryLabel('tools')).toBe('Tools')
  })

  it('handles empty string', () => {
    expect(categoryLabel('')).toBe('')
  })
})
