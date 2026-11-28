import { describe, expect, it } from 'vitest'
import { normalizeLoginEmail } from './loginEmail'

describe('normalizeLoginEmail', () => {
  it.each([
    ['member', 'member@jbnu.ac.kr'],
    [' Member ', 'member@jbnu.ac.kr'],
    ['Member@JBNU.AC.KR', 'member@jbnu.ac.kr'],
    ['member@example.com', 'member@example.com'],
    ['', ''],
    ['   ', ''],
    ['member@', 'member@'],
  ])('normalizes %j to %j', (value, expected) => {
    expect(normalizeLoginEmail(value)).toBe(expected)
  })
})
