import { describe, expect, it } from 'vitest'
import { matchesRequestedHeadTurn } from './useDeviceReadiness'

describe('head-turn direction mapping', () => {
  it('matches the applicant-relative direction shown in the mirrored preview', () => {
    expect(matchesRequestedHeadTurn('left', -0.2)).toBe(true)
    expect(matchesRequestedHeadTurn('left', 0.2)).toBe(false)
    expect(matchesRequestedHeadTurn('right', 0.2)).toBe(true)
    expect(matchesRequestedHeadTurn('right', -0.2)).toBe(false)
  })

  it('does not accept movement below the turn threshold', () => {
    expect(matchesRequestedHeadTurn('left', -0.15)).toBe(false)
    expect(matchesRequestedHeadTurn('right', 0.15)).toBe(false)
  })
})
