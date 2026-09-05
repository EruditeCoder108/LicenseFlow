import { ExamServiceError, type ExamTransport } from '../protectedExamClient'

export type RecoveryFaultId = 'exam-connection-loss' | 'exam-lost-answer-response'

export interface RecoveryFaultDefinition {
  id: RecoveryFaultId
  label: string
  description: string
}

export const RECOVERY_FAULTS: readonly RecoveryFaultDefinition[] = [
  {
    id: 'exam-connection-loss',
    label: 'Interrupt one connection check',
    description: 'Stops one test request before it reaches the server, then allows reconnection.',
  },
  {
    id: 'exam-lost-answer-response',
    label: 'Lose one save acknowledgement',
    description: 'Lets the server save the selected answer, then hides that response from the browser.',
  },
] as const

export function recoveryLabEnabled(search: string, guided: boolean) {
  return guided && new URLSearchParams(search).get('resilience') === '1'
}

export interface RecoveryFaultController {
  readonly enabled: boolean
  arm: (fault: RecoveryFaultId) => void
  clear: () => void
  wrap: (transport: ExamTransport) => ExamTransport
}

export function createRecoveryFaultController(enabled: boolean): RecoveryFaultController {
  let armed: RecoveryFaultId | null = null

  return {
    enabled,
    arm(fault) {
      if (!enabled) throw new Error('Recovery simulations are disabled outside the labelled judge lab.')
      armed = fault
    },
    clear() { armed = null },
    wrap(transport) {
      return async <T>(path: string, body?: Record<string, unknown>, keepalive = false) => {
        if (enabled && armed === 'exam-connection-loss' && path.endsWith('/heartbeat')) {
          armed = null
          throw new ExamServiceError('connection_lost', 'The recovery lab interrupted this connection check.')
        }

        if (enabled && armed === 'exam-lost-answer-response' && path.endsWith('/answers')) {
          armed = null
          await transport<T>(path, body, keepalive)
          throw new ExamServiceError('connection_lost', 'The answer reached the server, but its acknowledgement did not reach this browser.')
        }

        return transport<T>(path, body, keepalive)
      }
    },
  }
}
