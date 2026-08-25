import {
  applicationSteps,
  completedStepCount,
  validateApplicationStep,
  type ApplicationMode,
  type ApplicationStep,
  type LLApplicationDraft,
} from './application'
import { isPaymentConfirmed, paymentNeedsReconciliation } from './payment'
import type { LLJourneyProgress } from './progress'
import type { JourneyState as ExamSession } from '../domain/journey'
import type { PortalRoute } from './router'

export type CanonicalStageId =
  | 'application'
  | 'uploads'
  | 'readiness'
  | 'payment'
  | 'tutorial'
  | 'test'
  | 'result'

export type StageStatus = 'completed' | 'in_progress' | 'needs_action' | 'not_started' | 'blocked'

export interface CanonicalStage {
  id: CanonicalStageId
  title: { en: string; hi: string }
  status: StageStatus
  href: string
  completedSubsteps?: number
  totalSubsteps?: number
  detail?: { en: string; hi: string }
}

export interface NextActionInfo {
  title: { en: string; hi: string }
  body: { en: string; hi: string }
  action: { en: string; hi: string }
  href: string
}

export interface DerivedJourneyState {
  applicationId: string
  mode: ApplicationMode
  stages: CanonicalStage[]
  currentStage: CanonicalStageId
  completedStageCount: number
  totalStageCount: number
  resumeHref: string
  nextAction: NextActionInfo
}

export function deriveJourneyState(input: {
  applicationId: string
  draft: LLApplicationDraft | null
  progress: LLJourneyProgress | null
  examSession: ExamSession | null
}): DerivedJourneyState {
  const { applicationId, draft, progress, examSession } = input
  const mode: ApplicationMode = draft?.mode ?? (applicationId === 'MP-LL-DEMO-2408' ? 'prepared-demo' : 'citizen-journey')

  // --- Stage 1: Application Form (7 substeps) ---
  const substepsComplete = draft ? completedStepCount(draft) : 0
  const firstIncompleteSubStep: ApplicationStep = draft
    ? applicationSteps.find((step) => Object.keys(validateApplicationStep(draft, step)).length > 0) ?? 'review'
    : 'category'

  const isApplicationSubmitted = Boolean(draft?.submittedAt)
  let applicationStageStatus: StageStatus = 'not_started'
  if (isApplicationSubmitted) {
    applicationStageStatus = 'completed'
  } else if (draft && (substepsComplete > 0 || draft.applicantCategory !== '')) {
    applicationStageStatus = 'in_progress'
  }

  const applicationStageHref = isApplicationSubmitted
    ? `/mp/ll/application/review`
    : `/mp/ll/application/${firstIncompleteSubStep}`

  // --- Stage 2: Documents & photo ---
  const areUploadsComplete = isApplicationSubmitted && Boolean(draft?.photoUploaded && draft?.signatureUploaded && draft?.documentsUploaded)
  let uploadsStageStatus: StageStatus = 'blocked'
  if (!isApplicationSubmitted) {
    uploadsStageStatus = 'blocked'
  } else if (areUploadsComplete) {
    uploadsStageStatus = 'completed'
  } else {
    uploadsStageStatus = 'needs_action'
  }
  const uploadsStageHref = `/mp/application/${applicationId}/uploads`

  // --- Stage 3: Device check & test practice ---
  const isReadinessPassed = Boolean(progress && progress.readiness.status === 'passed')
  const isRehearsalCompleted = Boolean(progress && progress.rehearsal.status === 'completed')
  const isReadinessStageComplete = isReadinessPassed && isRehearsalCompleted

  let readinessStageStatus: StageStatus = 'blocked'
  if (!areUploadsComplete) {
    readinessStageStatus = 'blocked'
  } else if (isReadinessStageComplete) {
    readinessStageStatus = 'completed'
  } else {
    readinessStageStatus = 'needs_action'
  }

  const readinessStageHref = isReadinessPassed
    ? `/mp/application/${applicationId}/rehearsal`
    : `/mp/application/${applicationId}/readiness`

  // --- Stage 4: Fee payment ---
  const isPaymentPaid = Boolean(progress && isPaymentConfirmed(progress.payment))
  const isPaymentPendingReconciliation = Boolean(progress && paymentNeedsReconciliation(progress.payment))

  let paymentStageStatus: StageStatus = 'blocked'
  if (!isReadinessStageComplete) {
    paymentStageStatus = 'blocked'
  } else if (isPaymentPaid) {
    paymentStageStatus = 'completed'
  } else {
    paymentStageStatus = 'needs_action'
  }

  const paymentStageHref = isPaymentPendingReconciliation
    ? `/mp/application/${applicationId}/payment-status`
    : `/mp/application/${applicationId}/payment`

  // --- Stage 5: Learn road-safety rules ---
  const isTutorialDone = Boolean(progress && progress.tutorial.status === 'completed')
  let tutorialStageStatus: StageStatus = 'blocked'
  if (!isPaymentPaid) {
    tutorialStageStatus = 'blocked'
  } else if (isTutorialDone) {
    tutorialStageStatus = 'completed'
  } else {
    tutorialStageStatus = 'needs_action'
  }
  const tutorialStageHref = `/mp/application/${applicationId}/tutorial`

  // --- Stage 6: Online test ---
  const isExamFinished = Boolean(examSession && examSession.stage === 'result')
  let testStageStatus: StageStatus = 'blocked'
  if (!isTutorialDone) {
    testStageStatus = 'blocked'
  } else if (isExamFinished) {
    testStageStatus = 'completed'
  } else {
    testStageStatus = 'needs_action'
  }

  let testStageHref = `/mp/application/${applicationId}/test-entry`
  if (examSession?.stage === 'interruption') {
    testStageHref = `/mp/application/${applicationId}/test-interruption`
  } else if (examSession?.stage === 'exam') {
    testStageHref = `/mp/application/${applicationId}/test`
  }

  // --- Stage 7: Result & licence ---
  let resultStageStatus: StageStatus = 'blocked'
  if (isExamFinished) {
    resultStageStatus = 'completed'
  }
  const resultStageHref = `/mp/application/${applicationId}/result`

  // Assemble Canonical Stages
  const stages: CanonicalStage[] = [
    {
      id: 'application',
      title: { en: 'Application', hi: 'आवेदन' },
      status: applicationStageStatus,
      href: applicationStageHref,
      completedSubsteps: isApplicationSubmitted ? 7 : substepsComplete,
      totalSubsteps: 7,
      detail: isApplicationSubmitted
        ? { en: 'Completed and submitted', hi: 'पूरा और जमा हुआ' }
        : applicationStageStatus === 'in_progress'
          ? { en: `${substepsComplete} of 7 sections complete`, hi: `7 में से ${substepsComplete} भाग पूरे` }
          : { en: 'Not started', hi: 'शुरू नहीं हुआ' },
    },
    {
      id: 'uploads',
      title: { en: 'Documents & photo', hi: 'दस्तावेज़ और फोटो' },
      status: uploadsStageStatus,
      href: uploadsStageHref,
      detail: areUploadsComplete
        ? { en: 'Completed and verified', hi: 'पूरा और सत्यापित' }
        : uploadsStageStatus === 'needs_action'
          ? { en: 'Uploads required', hi: 'अपलोड जरूरी है' }
          : { en: 'Locked', hi: 'लॉक्ड' },
    },
    {
      id: 'readiness',
      title: { en: 'Device check & test practice', hi: 'डिवाइस जाँच और परीक्षा अभ्यास' },
      status: readinessStageStatus,
      href: readinessStageHref,
      detail: isReadinessStageComplete
        ? { en: 'Device and practice passed', hi: 'डिवाइस और अभ्यास सफल' }
        : readinessStageStatus === 'needs_action'
          ? isReadinessPassed
            ? { en: 'Test practice pending', hi: 'परीक्षा अभ्यास बाकी' }
            : { en: 'Device check required', hi: 'डिवाइस जाँच जरूरी' }
          : { en: 'Locked', hi: 'लॉक्ड' },
    },
    {
      id: 'payment',
      title: { en: 'Fee payment', hi: 'शुल्क भुगतान' },
      status: paymentStageStatus,
      href: paymentStageHref,
      detail: isPaymentPaid
        ? { en: 'Paid and confirmed', hi: 'भुगतान पुष्ट हुआ' }
        : paymentStageStatus === 'needs_action'
          ? isPaymentPendingReconciliation
            ? { en: 'Payment verification needed', hi: 'भुगतान सत्यापन जरूरी' }
            : { en: 'Payment pending', hi: 'भुगतान बाकी' }
          : { en: 'Locked', hi: 'लॉक्ड' },
    },
    {
      id: 'tutorial',
      title: { en: 'Learn road-safety rules', hi: 'सड़क सुरक्षा नियम सीखें' },
      status: tutorialStageStatus,
      href: tutorialStageHref,
      detail: isTutorialDone
        ? { en: 'Learning complete', hi: 'अध्ययन पूरा हुआ' }
        : tutorialStageStatus === 'needs_action'
          ? { en: 'Tutorial required before test', hi: 'टेस्ट से पहले ट्यूटोरियल जरूरी' }
          : { en: 'Locked', hi: 'लॉक्ड' },
    },
    {
      id: 'test',
      title: { en: 'Online test', hi: 'ऑनलाइन परीक्षा' },
      status: testStageStatus,
      href: testStageHref,
      detail: isExamFinished
        ? { en: 'Test completed', hi: 'परीक्षा पूरी हुई' }
        : testStageStatus === 'needs_action'
          ? examSession?.stage === 'interruption'
            ? { en: 'Test paused — resume now', hi: 'परीक्षा रुकी — अभी शुरू करें' }
            : examSession?.stage === 'exam'
              ? { en: 'In progress', hi: 'जारी है' }
              : { en: 'Ready to enter test', hi: 'परीक्षा शुरू करने के लिए तैयार' }
          : { en: 'Locked', hi: 'लॉक्ड' },
    },
    {
      id: 'result',
      title: { en: 'Result & licence', hi: 'परिणाम और लाइसेंस' },
      status: resultStageStatus,
      href: resultStageHref,
      detail: isExamFinished
        ? { en: 'Result available for download', hi: 'परिणाम डाउनलोड के लिए उपलब्ध' }
        : { en: 'Locked', hi: 'लॉक्ड' },
    },
  ]

  const completedStageCount = stages.filter((s) => s.status === 'completed').length

  // Determine current active stage and exact resume URL
  let currentStage: CanonicalStageId = 'application'
  let resumeHref = applicationStageHref
  let nextAction: NextActionInfo

  if (!isApplicationSubmitted) {
    currentStage = 'application'
    resumeHref = `/mp/ll/application/${firstIncompleteSubStep}`
    nextAction = {
      title: { en: 'Continue your application', hi: 'अपना आवेदन जारी रखें' },
      body: {
        en: `Next: ${firstIncompleteSubStep === 'category' ? 'Applicant category' : firstIncompleteSubStep === 'identity' ? 'Identity method' : firstIncompleteSubStep === 'personal' ? 'Applicant details' : firstIncompleteSubStep === 'address' ? 'Address details' : firstIncompleteSubStep === 'vehicles' ? 'Vehicle classes' : firstIncompleteSubStep === 'fitness' ? 'Fitness Form 1' : 'Review & declaration'} (${substepsComplete} of 7 sections complete).`,
        hi: `अगला: ${firstIncompleteSubStep === 'category' ? 'आवेदक श्रेणी' : firstIncompleteSubStep === 'identity' ? 'पहचान का तरीका' : firstIncompleteSubStep === 'personal' ? 'आवेदक की जानकारी' : firstIncompleteSubStep === 'address' ? 'पता' : firstIncompleteSubStep === 'vehicles' ? 'वाहन वर्ग' : firstIncompleteSubStep === 'fitness' ? 'फिटनेस Form 1' : 'समीक्षा व घोषणा'} (7 में से ${substepsComplete} भाग पूरे)।`,
      },
      action: { en: 'Continue application', hi: 'आवेदन जारी रखें' },
      href: resumeHref,
    }
  } else if (!areUploadsComplete) {
    currentStage = 'uploads'
    resumeHref = uploadsStageHref
    nextAction = {
      title: { en: 'Upload photo and signature', hi: 'फोटो और हस्ताक्षर अपलोड करें' },
      body: {
        en: 'Review the sample photo, signature, and documents before continuing.',
        hi: 'आगे बढ़ने से पहले नमूना फोटो, हस्ताक्षर और दस्तावेज़ देखें।',
      },
      action: { en: 'Open uploads', hi: 'अपलोड खोलें' },
      href: resumeHref,
    }
  } else if (!isReadinessStageComplete) {
    currentStage = 'readiness'
    resumeHref = readinessStageHref
    if (!isReadinessPassed) {
      nextAction = {
        title: { en: 'Check this device before payment', hi: 'भुगतान से पहले इस डिवाइस की जाँच करें' },
        body: {
          en: 'Check the camera, microphone, browser and connection so that test problems are found early.',
          hi: 'कैमरा, माइक्रोफोन, ब्राउज़र और कनेक्शन जाँचें ताकि परीक्षा की समस्या पहले मिल सके।',
        },
        action: { en: 'Check device', hi: 'डिवाइस जाँचें' },
        href: resumeHref,
      }
    } else {
      nextAction = {
        title: { en: 'Complete test practice', hi: 'परीक्षा अभ्यास पूरा करें' },
        body: {
          en: 'Learn how answers are checkpointed and how a paused test can be safely resumed.',
          hi: 'जानें कि उत्तर कैसे सहेजे जाते हैं और रुकी परीक्षा कैसे फिर शुरू होती है।',
        },
        action: { en: 'Start practice', hi: 'अभ्यास शुरू करें' },
        href: resumeHref,
      }
    }
  } else if (!isPaymentPaid) {
    currentStage = 'payment'
    resumeHref = paymentStageHref
    if (isPaymentPendingReconciliation) {
      nextAction = {
        title: { en: 'Check earlier payment attempt', hi: 'पिछले भुगतान प्रयास की जाँच करें' },
        body: {
          en: 'Check the status of your payment attempt before making another payment.',
          hi: 'दूसरा भुगतान करने से पहले अपने भुगतान प्रयास की स्थिति जाँचें।',
        },
        action: { en: 'Check payment status', hi: 'भुगतान स्थिति जाँचें' },
        href: resumeHref,
      }
    } else {
      nextAction = {
        title: { en: 'Review and pay the fee', hi: 'शुल्क देखें और भुगतान करें' },
        body: {
          en: 'Your device check and practice are complete. Review the test fee before continuing.',
          hi: 'डिवाइस जाँच और अभ्यास पूरा है। आगे बढ़ने से पहले परीक्षा शुल्क देखें।',
        },
        action: { en: 'Review fee', hi: 'शुल्क देखें' },
        href: resumeHref,
      }
    }
  } else if (!isTutorialDone) {
    currentStage = 'tutorial'
    resumeHref = tutorialStageHref
    nextAction = {
      title: { en: 'Learn road-safety rules', hi: 'सड़क सुरक्षा नियम सीखें' },
      body: {
        en: 'Study mandatory road signs and safety guidelines before taking the online test.',
        hi: 'ऑनलाइन परीक्षा देने से पहले जरूरी सड़क संकेत और सुरक्षा नियम पढ़ें।',
      },
      action: { en: 'Open tutorial', hi: 'ट्यूटोरियल खोलें' },
      href: resumeHref,
    }
  } else if (!isExamFinished) {
    currentStage = 'test'
    resumeHref = testStageHref
    if (examSession?.stage === 'interruption') {
      nextAction = {
        title: { en: 'Resume your paused test', hi: 'रुकी हुई परीक्षा फिर शुरू करें' },
        body: {
          en: 'Your earlier answers remain safely saved. Resume from your exact question.',
          hi: 'आपके पिछले उत्तर सुरक्षित हैं। अपने उसी प्रश्न से परीक्षा फिर शुरू करें।',
        },
        action: { en: 'Resume test', hi: 'परीक्षा फिर शुरू करें' },
        href: resumeHref,
      }
    } else if (examSession?.stage === 'exam') {
      nextAction = {
        title: { en: 'Continue your online test', hi: 'ऑनलाइन परीक्षा जारी रखें' },
        body: {
          en: 'Answer each road safety question. Answers are saved as you proceed.',
          hi: 'प्रत्येक सड़क सुरक्षा प्रश्न का उत्तर दें। उत्तर साथ-साथ सहेजे जाते हैं।',
        },
        action: { en: 'Continue test', hi: 'परीक्षा जारी रखें' },
        href: resumeHref,
      }
    } else {
      nextAction = {
        title: { en: 'Start the online LL test', hi: 'ऑनलाइन एलएल परीक्षा शुरू करें' },
        body: {
          en: 'Enter the 15-question road safety exam. Camera monitoring is enabled during the test.',
          hi: '15 प्रश्नों की सड़क सुरक्षा परीक्षा में प्रवेश करें। परीक्षा के दौरान कैमरा निगरानी चालू रहेगी।',
        },
        action: { en: 'Enter test', hi: 'परीक्षा में जाएँ' },
        href: resumeHref,
      }
    }
  } else {
    currentStage = 'result'
    resumeHref = resultStageHref
    nextAction = {
      title: { en: 'View test result & licence', hi: 'परीक्षा परिणाम और लाइसेंस देखें' },
      body: {
        en: 'Review your test score and download your demonstration Learner’s Licence or receipt.',
        hi: 'अपना स्कोर देखें और डेमो लर्नर लाइसेंस या रसीद डाउनलोड करें।',
      },
      action: { en: 'View result', hi: 'परिणाम देखें' },
      href: resumeHref,
    }
  }

  return {
    applicationId,
    mode,
    stages,
    currentStage,
    completedStageCount,
    totalStageCount: 7,
    resumeHref,
    nextAction,
  }
}

export function getRouteAccess(input: {
  route: PortalRoute
  journey: DerivedJourneyState
}): { allowed: boolean; redirectHref?: string; reason?: { en: string; hi: string } } {
  const { route, journey } = input
  const { stages } = journey

  // Public/Utility routes always allowed
  if (
    route.name === 'home' ||
    route.name === 'login' ||
    route.name === 'services' ||
    route.name === 'll-start' ||
    route.name === 'service' ||
    route.name === 'not-found'
  ) {
    return { allowed: true }
  }

  // Application form sub-steps
  if (route.name === 'll-application') {
    return { allowed: true }
  }

  if (route.name === 'll-submitted') {
    const appStage = stages.find((s) => s.id === 'application')
    if (appStage?.status !== 'completed') {
      return {
        allowed: false,
        redirectHref: journey.resumeHref,
        reason: { en: 'Please complete and submit the application form first.', hi: 'कृपया पहले आवेदन फॉर्म पूरा करके जमा करें।' },
      }
    }
    return { allowed: true }
  }

  // Status tracker and receipt pages always allowed if application exists
  if (route.name === 'application' || route.name === 'payment-status' || route.name === 'receipt') {
    return { allowed: true }
  }

  // Uploads check
  if (route.name === 'uploads') {
    const appStage = stages.find((s) => s.id === 'application')
    if (appStage?.status !== 'completed') {
      return {
        allowed: false,
        redirectHref: journey.resumeHref,
        reason: { en: 'Please complete and submit the application form first.', hi: 'कृपया पहले आवेदन फॉर्म पूरा करके जमा करें।' },
      }
    }
    return { allowed: true }
  }

  // Readiness / Rehearsal check
  if (route.name === 'readiness' || route.name === 'rehearsal') {
    const uploadsStage = stages.find((s) => s.id === 'uploads')
    if (uploadsStage?.status !== 'completed') {
      return {
        allowed: false,
        redirectHref: journey.resumeHref,
        reason: { en: 'Please complete earlier application and upload steps first.', hi: 'कृपया पहले आवेदन और अपलोड चरण पूरे करें।' },
      }
    }
    return { allowed: true }
  }

  // Payment check
  if (route.name === 'payment' || route.name === 'payment-redirect' || route.name === 'gateway' || route.name === 'payment-return') {
    const readinessStage = stages.find((s) => s.id === 'readiness')
    if (readinessStage?.status !== 'completed') {
      return {
        allowed: false,
        redirectHref: journey.resumeHref,
        reason: { en: 'Please complete device check and practice first.', hi: 'कृपया पहले डिवाइस जाँच और अभ्यास पूरा करें।' },
      }
    }
    return { allowed: true }
  }

  // Tutorial check
  if (route.name === 'tutorial') {
    const paymentStage = stages.find((s) => s.id === 'payment')
    if (paymentStage?.status !== 'completed') {
      return {
        allowed: false,
        redirectHref: journey.resumeHref,
        reason: { en: 'Please complete fee payment first.', hi: 'कृपया पहले शुल्क भुगतान पूरा करें।' },
      }
    }
    return { allowed: true }
  }

  // Test checks
  if (route.name === 'test-entry' || route.name === 'test' || route.name === 'test-interruption') {
    const tutorialStage = stages.find((s) => s.id === 'tutorial')
    if (tutorialStage?.status !== 'completed') {
      return {
        allowed: false,
        redirectHref: journey.resumeHref,
        reason: { en: 'Please complete the road safety tutorial first.', hi: 'कृपया पहले सड़क सुरक्षा ट्यूटोरियल पूरा करें।' },
      }
    }
    return { allowed: true }
  }

  // Result and Review check
  if (route.name === 'result' || route.name === 'result-review') {
    const testStage = stages.find((s) => s.id === 'test')
    if (testStage?.status !== 'completed') {
      return {
        allowed: false,
        redirectHref: journey.resumeHref,
        reason: { en: 'Please complete the test first.', hi: 'कृपया पहले परीक्षा पूरी करें।' },
      }
    }
    return { allowed: true }
  }

  return { allowed: true }
}
