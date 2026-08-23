export const JUDGE_CREDENTIALS = {
  username: 'licenceflow.judge',
  password: 'MPDemo@2026',
} as const

export type DemoSession = {
  username: string
  displayName: string
  signedInAt: string
}

const SESSION_KEY = 'licenceflow-demo-session-v1'

export function authenticateDemo(username: string, password: string): boolean {
  return username.trim().toLowerCase() === JUDGE_CREDENTIALS.username && password === JUDGE_CREDENTIALS.password
}

export function createDemoSession(): DemoSession {
  return {
    username: JUDGE_CREDENTIALS.username,
    displayName: 'Hackathon judge',
    signedInAt: new Date().toISOString(),
  }
}

export function loadDemoSession(): DemoSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as DemoSession
    return session.username === JUDGE_CREDENTIALS.username ? session : null
  } catch {
    return null
  }
}

export function saveDemoSession(session: DemoSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearDemoSession(): void {
  localStorage.removeItem(SESSION_KEY)
}
