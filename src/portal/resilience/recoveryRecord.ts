import type { ProtectedExamEvent, ProtectedExamSnapshot } from '../protectedExamTypes'
import type { Language } from '../i18n'

export type RecoveryRecordEvent = {
  id: string
  at: number
  title: string
  detail: string
}

const eventCopy: Record<string, { en: [string, string]; hi: [string, string] }> = {
  ATTEMPT_CREATED: {
    en: ['Test attempt created', 'The assessment service reserved a balanced paper for this attempt.'],
    hi: ['टेस्ट प्रयास बनाया गया', 'परीक्षा सेवा ने इस प्रयास के लिए संतुलित प्रश्नपत्र सुरक्षित किया।'],
  },
  TAB_CONNECTED: {
    en: ['Saved test connected', 'This browser connected to the existing attempt instead of creating a new one.'],
    hi: ['सहेजा टेस्ट जुड़ गया', 'नया प्रयास बनाने के बजाय यह ब्राउज़र मौजूदा प्रयास से जुड़ा।'],
  },
  QUESTION_OPENED: {
    en: ['Timed question opened', 'The assessment service started the time allowance for the next question.'],
    hi: ['समयबद्ध प्रश्न खुला', 'परीक्षा सेवा ने अगले प्रश्न का समय शुरू किया।'],
  },
  ANSWER_LOCKED: {
    en: ['Answer saved', 'The answer was confirmed before the test moved forward.'],
    hi: ['उत्तर सहेजा गया', 'टेस्ट आगे बढ़ने से पहले उत्तर की पुष्टि हुई।'],
  },
  PAUSED: {
    en: ['Test paused safely', 'Confirmed answers were kept while the interruption policy was applied.'],
    hi: ['टेस्ट सुरक्षित रूप से रुका', 'रुकावट के नियम लागू होते समय पुष्ट उत्तर सुरक्षित रखे गए।'],
  },
  RESUMED: {
    en: ['Test resumed', 'The same attempt continued with its server-calculated remaining time.'],
    hi: ['टेस्ट फिर शुरू हुआ', 'वही प्रयास सर्वर द्वारा गिने गए बचे समय के साथ जारी हुआ।'],
  },
  TIME_EXPIRED: {
    en: ['Time ended', 'Unanswered items were closed while previously confirmed answers stayed saved.'],
    hi: ['समय समाप्त हुआ', 'अनुत्तरित प्रश्न बंद हुए और पहले से पुष्ट उत्तर सुरक्षित रहे।'],
  },
}

export function recoveryRecordEvent(event: ProtectedExamEvent, language: Language): RecoveryRecordEvent {
  const known = eventCopy[event.kind]
  const [title, detail] = known
    ? known[language === 'hi' ? 'hi' : 'en']
    : language === 'hi'
      ? ['टेस्ट गतिविधि दर्ज हुई', 'परीक्षा सेवा ने इस चरण को दर्ज किया।']
      : ['Test activity recorded', 'The assessment service recorded this step.']
  return { id: event.id, at: event.at, title, detail }
}

export function recoveryRecordEvents(attempt: ProtectedExamSnapshot, language: Language): RecoveryRecordEvent[] {
  return attempt.events.map((event) => recoveryRecordEvent(event, language))
}
