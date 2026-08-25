const EXACT_KEYS = new Set([
  'licenceflow-demo-session-v1',
  'mp-ll-application-draft-v1',
  'mp-ll-active-citizen-id',
  'mp-ll-active-demo-id',
  'mp-ll-active-application-id',
  'mp-ll-citizen-application-v2',
  'mp-ll-demo-application-v2',
  'mp-ll-demo-application-v1',
  'mp-portal-language',
  'mp-portal-text-scale',
])

const KEY_PREFIXES = [
  'mp-ll-application-draft-v2:',
  'mp-ll-journey-progress-v1:',
  'mp-ll-exam-session-v1:',
]

export function clearLicenceFlowDeviceData(): void {
  const keys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
  for (const key of keys) {
    if (key && (EXACT_KEYS.has(key) || KEY_PREFIXES.some((prefix) => key.startsWith(prefix)))) {
      localStorage.removeItem(key)
    }
  }
}
