import { describe, expect, it } from 'vitest'
import { containsSensitiveDetails, getLocalRaahiReply } from './localGuide'

describe('Raahi built-in guide', () => {
  it('gives a route-aware next action', () => {
    expect(getLocalRaahiReply('What should I do next?', { pathname: '/payment', language: 'en' }))
      .toContain('simulated payment gateway')
  })

  it('explains an uncertain payment without claiming real payment processing', () => {
    const answer = getLocalRaahiReply('What if my payment is uncertain?', { pathname: '/payment', language: 'en' })
    expect(answer).toContain('uncertain')
    expect(answer).toContain('no real fee')
  })

  it('explains the complete Learner’s Licence flow instead of returning generic help', () => {
    const answer = getLocalRaahiReply('How can I get a learner\'s license?', { pathname: '/', language: 'en' })
    expect(answer).toContain('the journey is')
    expect(answer).toContain('Check the device')
    expect(answer).toContain('official Sarathi/Parivahan service')
  })

  it('explains the on-device camera privacy boundary', () => {
    const answer = getLocalRaahiReply('Will my camera video be uploaded?', { pathname: '/readiness', language: 'en' })
    expect(answer).toContain('on the device')
    expect(answer).toContain('does not record video')
  })

  it('refuses to solve a test question', () => {
    const answer = getLocalRaahiReply('Which option is the correct answer?', { pathname: '/test', language: 'en' })
    expect(answer).toContain('cannot solve or hint')
  })

  it('falls back to its narrow LicenceFlow scope', () => {
    const answer = getLocalRaahiReply('Write a poem about the moon', { pathname: '/tutorial', language: 'en' })
    expect(answer).toContain('built-in LicenceFlow guide')
    expect(answer).toContain('Complete the road-safety learning step')
  })

  it('answers in Hindi when the interface is Hindi', () => {
    expect(getLocalRaahiReply('अब आगे क्या करना है?', { pathname: '/result', language: 'hi' }))
      .toContain('उत्तर देखें')
  })

  it('detects identity, contact and payment details before they enter chat history', () => {
    expect(containsSensitiveDetails('My email is aarav@example.com')).toBe(true)
    expect(containsSensitiveDetails('My Aadhaar is 1234 5678 9012')).toBe(true)
    expect(containsSensitiveDetails('My phone is 9876543210')).toBe(true)
    expect(containsSensitiveDetails('Why is a phone number required?')).toBe(false)
  })
})
