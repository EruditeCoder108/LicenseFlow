import { describe, expect, it } from 'vitest'
import { ExamServiceError, type ExamTransport } from '../protectedExamClient'
import { createRecoveryFaultController, recoveryLabEnabled } from './faultInjection'

describe('judge recovery fault controller', () => {
  it('is available only in guided mode with the explicit query flag', () => {
    expect(recoveryLabEnabled('?resilience=1', true)).toBe(true)
    expect(recoveryLabEnabled('?resilience=1', false)).toBe(false)
    expect(recoveryLabEnabled('', true)).toBe(false)
  })

  it('cannot arm a fault while the recovery lab is disabled', () => {
    const controller = createRecoveryFaultController(false)
    expect(() => controller.arm('exam-connection-loss')).toThrow(/disabled/i)
  })

  it('interrupts exactly one matching request before it reaches the server', async () => {
    let calls = 0
    const base: ExamTransport = async <T>() => { calls += 1; return { ok: true } as T }
    const controller = createRecoveryFaultController(true)
    const transport = controller.wrap(base)
    controller.arm('exam-connection-loss')

    await expect(transport('/attempts/example/heartbeat', {})).rejects.toMatchObject({ code: 'connection_lost' })
    expect(calls).toBe(0)
    await expect(transport('/attempts/example/heartbeat', {})).resolves.toEqual({ ok: true })
    expect(calls).toBe(1)
  })

  it('commits an answer before discarding exactly one acknowledgement', async () => {
    let calls = 0
    const base: ExamTransport = async <T>() => { calls += 1; return { saved: true } as T }
    const controller = createRecoveryFaultController(true)
    const transport = controller.wrap(base)
    controller.arm('exam-lost-answer-response')

    await expect(transport('/attempts/example/answers', { optionIndex: 1 })).rejects.toBeInstanceOf(ExamServiceError)
    expect(calls).toBe(1)
    await expect(transport('/attempts/example/answers', { optionIndex: 1 })).resolves.toEqual({ saved: true })
    expect(calls).toBe(2)
  })
})
