import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearLicenceFlowDeviceData } from './devicePrivacy'

function storage(values: Record<string, string>): Storage {
  const data = new Map(Object.entries(values))
  return {
    get length() { return data.size },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => Array.from(data.keys())[index] ?? null,
    removeItem: (key) => { data.delete(key) },
    setItem: (key, value) => { data.set(key, value) },
  }
}

describe('clearLicenceFlowDeviceData', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('removes only LicenceFlow application, exam, payment and preference data', () => {
    const localStorage = storage({
      'licenceflow-demo-session-v1': 'session',
      'mp-ll-application-draft-v1': 'draft',
      'mp-ll-application-draft-v2:MP-LL-1234': 'current-draft',
      'mp-ll-active-citizen-id': 'MP-LL-1234',
      'mp-ll-citizen-application-v2': 'application',
      'mp-ll-demo-application-v1': 'application',
      'mp-ll-journey-progress-v1:demo-mp-ll': 'journey',
      'mp-ll-exam-session-v1:demo-mp-ll': 'exam',
      'mp-portal-language': 'hi',
      'licenceflow-judge-tour-active': 'true',
      'licenceflow-judge-tour-step': '2',
      'licenceflow-judge-tour-dismissed': 'true',
      'unrelated-site-data': 'keep',
    })
    vi.stubGlobal('localStorage', localStorage)

    clearLicenceFlowDeviceData()

    expect(localStorage.length).toBe(1)
    expect(localStorage.getItem('unrelated-site-data')).toBe('keep')
  })
})
