import { useEffect, useState } from 'react'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { requestExam } from './protectedExamClient'
import type { ProtectedExamSnapshot } from './protectedExamTypes'
import { navigatePortal } from './router'
import { translate as copy, type Language } from './i18n'

export function ProtectedExamStatus({ applicationId, language }: { applicationId: string; language: Language }) {
  const [attempt, setAttempt] = useState<ProtectedExamSnapshot | null>(null)
  useEffect(() => {
    let cancelled = false
    requestExam<{ attempt: ProtectedExamSnapshot | null }>(`/status?applicationId=${encodeURIComponent(applicationId)}`)
      .then((response) => { if (!cancelled) setAttempt(response.attempt) }).catch(() => undefined)
    return () => { cancelled = true }
  }, [applicationId])
  if (!attempt) return null
  return <section className="reference-banner">
    <ShieldCheck size={20} aria-hidden="true" />
    <div><strong>{copy(language, 'Server-saved assessment', 'सर्वर पर सहेजी परीक्षा')}</strong>
      <p>{attempt.result ? copy(language, `Result: ${attempt.result.score} of 15 correct. This server result is separate from the judge walkthrough below.`, `परिणाम: 15 में से ${attempt.result.score} सही। यह सर्वर परिणाम नीचे दिए जज वॉकथ्रू से अलग है।`) : copy(language, `${attempt.currentIndex} of 15 answers confirmed. Your protected attempt is separate from the walkthrough progress below.`, `15 में से ${attempt.currentIndex} उत्तर पुष्ट हैं। आपकी सर्वर परीक्षा नीचे दी वॉकथ्रू प्रगति से अलग है।`)}</p>
      <button className="button button--secondary" onClick={() => navigatePortal(`/mp/application/${applicationId}/protected-test`)}>{attempt.result ? copy(language, 'Open server result', 'सर्वर परिणाम खोलें') : copy(language, 'Resume server-saved test', 'सर्वर पर सहेजी परीक्षा जारी रखें')}<ArrowRight size={17} /></button>
    </div>
  </section>
}
