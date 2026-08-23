import { describe, expect, it } from 'vitest'
import { JUDGE_CREDENTIALS, authenticateDemo, createDemoSession } from './auth'

describe('demo authentication', () => {
  it('accepts only the published judge credentials', () => {
    expect(authenticateDemo(JUDGE_CREDENTIALS.username, JUDGE_CREDENTIALS.password)).toBe(true)
    expect(authenticateDemo(JUDGE_CREDENTIALS.username.toUpperCase(), JUDGE_CREDENTIALS.password)).toBe(true)
    expect(authenticateDemo('judge', 'password')).toBe(false)
  })

  it('creates a non-sensitive local demo session', () => {
    const session = createDemoSession()
    expect(session.username).toBe(JUDGE_CREDENTIALS.username)
    expect(session.displayName).toBe('Hackathon judge')
    expect(session).not.toHaveProperty('password')
  })
})
