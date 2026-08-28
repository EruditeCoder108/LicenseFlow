import type { JudgeTourAction, JudgeTourPhase, JudgeTourScrollMode, JudgeTourStep, RaahiPose } from './types'

export const RAAHI_ASSETS: Record<RaahiPose, { src: string; smallSrc: string; alt: string; altHi: string; width: number; height: number }> = {
  welcome: { src: '/assets/raahi/raahi-welcome.webp', smallSrc: '/assets/raahi/raahi-welcome-240.webp', alt: 'Raahi welcoming the evaluator', altHi: 'राही मूल्यांकनकर्ता का स्वागत करते हुए', width: 400, height: 533 },
  pointing: { src: '/assets/raahi/raahi-pointing.webp', smallSrc: '/assets/raahi/raahi-pointing-240.webp', alt: 'Raahi pointing towards the highlighted control', altHi: 'राही मुख्य नियंत्रण की ओर इशारा करते हुए', width: 400, height: 533 },
  thinking: { src: '/assets/raahi/raahi-thinking.webp', smallSrc: '/assets/raahi/raahi-thinking-240.webp', alt: 'Raahi observing the device checks', altHi: 'राही डिवाइस जाँच का अवलोकन करते हुए', width: 400, height: 533 },
  working: { src: '/assets/raahi/raahi-working.webp', smallSrc: '/assets/raahi/raahi-working-240.webp', alt: 'Raahi guiding the digital journey', altHi: 'राही डिजिटल प्रक्रिया समझाते हुए', width: 400, height: 366 },
  celebrate: { src: '/assets/raahi/raahi-celebrate.webp', smallSrc: '/assets/raahi/raahi-celebrate-240.webp', alt: 'Raahi celebrating the completed journey', altHi: 'राही पूरी प्रक्रिया की खुशी मनाते हुए', width: 400, height: 389 },
  confident: { src: '/assets/raahi/raahi-confident.webp', smallSrc: '/assets/raahi/raahi-confident-240.webp', alt: 'Raahi giving a thumbs up', altHi: 'राही थम्स-अप दिखाते हुए', width: 400, height: 533 },
}

export const JUDGE_TOUR_PHASES: { id: JudgeTourPhase; en: string; hi: string }[] = [
  { id: 'discover', en: 'Discover', hi: 'खोजें' },
  { id: 'apply', en: 'Apply', hi: 'आवेदन' },
  { id: 'verify', en: 'Verify', hi: 'जाँच' },
  { id: 'pay', en: 'Pay', hi: 'भुगतान' },
  { id: 'learn-test', en: 'Learn & test', hi: 'सीख व टेस्ट' },
  { id: 'result', en: 'Result', hi: 'परिणाम' },
]

type StepInput = Omit<JudgeTourStep, 'stepNumber' | 'fallbackNotice'>
const bi = (en: string, hi = en) => ({ en, hi })
const step = (
  id: string,
  phase: JudgeTourPhase,
  targetSelector: string,
  routePattern: string,
  title: string,
  dialogue: string,
  actionLabel: string,
  action: JudgeTourAction = 'advance',
  scrollMode: JudgeTourScrollMode = 'top',
  pose: RaahiPose = 'working',
): StepInput => ({
  id, phase, targetSelector, routePattern, title: bi(title), dialogue: bi(dialogue), actionLabel: bi(actionLabel), action, scrollMode, pose,
})

const applicationShowcaseSteps = [
  ['category', '1 of 7 · Licence details', 'The applicant’s current licence situation is filled.'],
  ['identity', '2 of 7 · Identity check', 'The identity method and fictional demo e-KYC details are filled.'],
  ['personal', '3 of 7 · Personal details', 'Personal, contact and education details are filled.'],
  ['address', '4 of 7 · Address', 'Present and permanent addresses are filled.'],
  ['vehicles', '5 of 7 · Vehicle types', 'The motorcycle and car categories are selected.'],
  ['fitness', '6 of 7 · Health declaration', 'The health and accessibility declarations are filled.'],
  ['review', '7 of 7 · Final review', 'All seven parts are complete and ready for review.'],
] as const

const rawSteps: StepInput[] = [
  step('home-overview', 'discover', '[data-tour="home-overview"]', '/', 'Meet LicenceFlow', 'I’m Raahi. I’ll guide you through the complete demo. You can stop at any time.', 'Show the first service', 'advance', 'top', 'welcome'),
  step('home-service-cards', 'discover', '[data-tour="home-service-cards"]', '/', 'Choose a service area', 'These cards show the main transport services available to citizens. Driving licence services is the first option.', 'Show the driving licence card', 'advance', 'target', 'working'),
  step('home-driving-services', 'discover', '[data-tour="home-driving-services-card"]', '/', 'Start with driving licence services', 'Choose this card to open Learner’s Licence and other driving licence services.', 'Open driving services', 'click', 'target', 'pointing'),
  step('state-selection', 'discover', '[data-tour="state-selection-continue"]', '/', 'Choose Madhya Pradesh', 'Madhya Pradesh contains the complete interactive prototype.', 'Continue to MP services', 'click', 'target', 'pointing'),
  step('services-overview', 'discover', '[data-tour="services-overview"]', '/mp/services', 'Driving licence services', 'This page lists the available services. The Learner’s Licence application is below.', 'Find Learner’s Licence'),
  step('apply-ll-service', 'discover', '[data-tour="apply-ll-service"]', '/mp/services', 'Apply for a Learner’s Licence', 'Choose this service to start the application.', 'Open the application', 'click', 'target', 'pointing'),
  step('ll-start-overview', 'apply', '[data-tour="ll-start-overview"]', '/mp/ll/start', 'Start or continue an application', 'Saved applicants can continue later. For this tour, we will start a fresh application.', 'Show the start button'),
  step('start-fresh-application', 'apply', '[data-tour="start-fresh-application"]', '/mp/ll/start', 'Start a fresh application', 'This opens the seven-part application form.', 'Start fresh application', 'smart-start', 'target', 'pointing'),
  step('application-category-overview', 'apply', '[data-tour="application-step-overview"]', '/mp/ll/application/category', 'See the complete application', 'One click will fill the form with clearly fictional demo details. I’ll then show all seven parts, one by one.', 'Show the completed form', 'autoplay-forms', 'top', 'working'),
  ...applicationShowcaseSteps.map(([name, title, description]) =>
    step(`application-showcase-${name}`, 'apply', '[data-tour="application-step-content"]', `/mp/ll/application/${name}`, title, description, `Showing ${title.toLowerCase()}…`, 'advance', 'top', 'working'),
  ),
  step('application-review-submit', 'apply', '[data-tour="application-continue"]', '/mp/ll/application/review', 'Application ready to submit', 'Every part has been shown and the fictional details are ready. Submit the application to continue.', 'Submit application', 'click', 'target', 'pointing'),
  step('submitted-overview', 'apply', '[data-tour="submitted-overview"]', '/mp/ll/submitted', 'Application submitted', 'A reference number is created and the next step is clearly shown.', 'Show the document step', 'advance', 'top', 'confident'),
  step('submitted-continue', 'apply', '[data-tour="submitted-continue"]', '/mp/ll/submitted', 'Add supporting files', 'Continue to the document, photo and signature page.', 'Add documents and photo', 'click', 'target', 'pointing'),
  step('uploads-overview', 'apply', '[data-tour="uploads-overview"]', '/mp/application/:id/uploads', 'Add demo documents', 'The three fictional files are not attached yet. The next action will attach them so you can see the change.', 'Show the attach button'),
  step('uploads-attach', 'apply', '[data-tour="uploads-attach-all"]', '/mp/application/:id/uploads', 'Attach the fictional files', 'This adds the demo document, portrait and signature. No real file is uploaded.', 'Attach demo files', 'click', 'target', 'pointing'),
  step('uploads-confirm', 'apply', '[data-tour="uploads-confirm"]', '/mp/application/:id/uploads', 'Confirm the files', 'All three demo files are now attached. Confirm them to continue.', 'Confirm demo files', 'click', 'target', 'pointing'),
  step('readiness-overview', 'verify', '[data-tour="readiness-overview"]', '/mp/application/:id/readiness', 'Check the device before payment', 'In the normal process, the applicant allows camera and microphone access and the site checks the real device.', 'Show the camera-free judge demo', 'advance', 'top', 'thinking'),
  step('readiness-demo', 'verify', '[data-tour="readiness-demo-simulation"]', '/mp/application/:id/readiness', 'Run the judge demo without camera access', 'This labelled demo will not turn on your camera or microphone. It safely fills the check results so judges can continue.', 'Run camera-free demo', 'click', 'target', 'pointing'),
  step('readiness-demo-complete', 'verify', '[data-tour="readiness-overview"]', '/mp/application/:id/readiness', 'Demo device check completed', 'No camera was opened. This page now shows the result an applicant would see after the real checks pass.', 'Show the demo question button', 'advance', 'top', 'confident'),
  step('readiness-continue', 'verify', '[data-tour="readiness-continue"]', '/mp/application/:id/readiness', 'Confirm that this device can show the test', 'Open one demo question, choose an answer and save it. It does not affect the final score.', 'Open demo question', 'click', 'target', 'pointing'),
  step('rehearsal-overview', 'verify', '[data-tour="rehearsal-overview"]', '/mp/application/:id/rehearsal', 'One demo question', 'This checks that the device can display a question, accept a choice and save the answer.', 'Choose a demo answer', 'advance', 'top', 'thinking'),
  step('rehearsal-answer', 'verify', '[data-tour="rehearsal-first-answer"]', '/mp/application/:id/rehearsal', 'Choose an answer', 'Raahi will select option A using the normal answer control.', 'Select option A', 'click', 'target', 'pointing'),
  step('rehearsal-save', 'verify', '[data-tour="rehearsal-save"]', '/mp/application/:id/rehearsal', 'Save the demo answer', 'Saving confirms that this device can record an answer.', 'Save demo answer', 'click', 'target', 'pointing'),
  step('rehearsal-success', 'verify', '[data-tour="rehearsal-continue-payment"]', '/mp/application/:id/rehearsal', 'Demo question completed', 'The device check is complete. Continue to the fee page.', 'Continue to fee payment', 'click', 'target', 'confident'),
  step('payment-overview', 'pay', '[data-tour="payment-overview"]', '/mp/application/:id/payment', 'Review the fee', 'The amount, application details and duplicate-payment protection are shown before payment.', 'Show payment consent'),
  step('payment-consent', 'pay', '[data-tour="payment-consent"]', '/mp/application/:id/payment', 'Confirm the demo fee', 'This is a simulated payment. No bank account, card or real money is used.', 'Accept demo consent', 'click', 'target', 'pointing'),
  step('payment-start', 'pay', '[data-tour="payment-start-gateway"]', '/mp/application/:id/payment', 'Start the demo payment', 'The next pages show the handoff to a clearly labelled demo gateway.', 'Open payment page', 'click', 'target', 'pointing'),
  step('payment-redirect', 'pay', '[data-tour="payment-redirect-overview"]', '/mp/application/:id/payment/redirect', 'Review before leaving the portal', 'The amount, payment method and application number remain visible.', 'Show the continue button'),
  step('payment-redirect-continue', 'pay', '[data-tour="payment-redirect-continue"]', '/mp/application/:id/payment/redirect', 'Continue to the demo gateway', 'The next page is clearly marked as a payment simulation.', 'Continue to gateway', 'click', 'target', 'pointing'),
  step('gateway-overview', 'pay', '[data-tour="gateway-overview"]', '/sandbox-gateway/:id', 'Demo payment gateway', 'Fictional payment details are already filled so the judge can continue quickly.', 'Show payment action'),
  step('gateway-complete', 'pay', '[data-tour="gateway-complete"]', '/sandbox-gateway/:id', 'Complete the demo payment', 'This records a successful simulated payment.', 'Complete demo payment', 'click', 'target', 'pointing'),
  step('payment-return', 'pay', '[data-tour="payment-return-overview"]', '/mp/application/:id/payment/return', 'Demo payment confirmed', 'The application cannot be charged twice for the same attempt. The learning step is now available.', 'Show the learning button', 'advance', 'top', 'confident'),
  step('payment-to-tutorial', 'pay', '[data-tour="payment-continue-tutorial"]', '/mp/application/:id/payment/return', 'Continue to road-safety learning', 'Open the required learning video before the test.', 'Open tutorial', 'click', 'target', 'pointing'),
  step('tutorial-overview', 'learn-test', '[data-tour="tutorial-overview"]', '/mp/application/:id/tutorial', 'Road-safety tutorial', 'Citizens must watch the full video. Their progress is saved and fast-forwarding is blocked.', 'Show the judge shortcut', 'advance', 'top', 'thinking'),
  step('tutorial-skip', 'learn-test', '[data-tour="skip-tutorial-judge"]', '/mp/application/:id/tutorial', 'Use the judge shortcut', 'This labelled shortcut skips only the waiting time during judging.', 'Complete tutorial for demo', 'click', 'target', 'pointing'),
  step('test-entry-overview', 'learn-test', '[data-tour="test-entry-overview"]', '/mp/application/:id/test-entry', 'Read the test instructions', 'The page explains the number of questions, pass mark, time limit, saved answers and camera mode.', 'Show the test declaration', 'advance', 'top', 'thinking'),
  step('test-entry-consent', 'learn-test', '[data-tour="test-entry-consent"]', '/mp/application/:id/test-entry', 'Confirm this is a demo test', 'Accept the declaration before entering the focused test screen.', 'Accept test declaration', 'click', 'target', 'pointing'),
  step('test-entry-start', 'learn-test', '[data-tour="test-entry-start"]', '/mp/application/:id/test-entry', 'Start the 15-question test', 'The test opens in a focused, non-scrolling interface.', 'Start the 15-question test', 'click', 'target', 'pointing'),
  step('test-overview', 'learn-test', '[data-tour="test-question-overview"]', '/mp/application/:id/test', 'Test interface', 'The question, choices, timer, read-aloud button, progress map and camera status are visible together.', 'Show safe recovery', 'advance', 'top', 'working'),
  step('test-preview-recovery', 'learn-test', '[data-tour="preview-recovery-judge"]', '/mp/application/:id/test', 'Prove that failure is recoverable', 'This judge control saves the current answer, then demonstrates a prepared network interruption.', 'Preview safe recovery', 'click', 'target', 'pointing'),
  step('interruption-overview', 'learn-test', '[data-tour="interruption-overview"]', '/mp/application/:id/test-interruption', 'The test paused; progress did not', 'The page separates a technical event from cheating and confirms that the answer and payment remain safe.', 'Show exact resume', 'advance', 'top', 'thinking'),
  step('interruption-resume', 'learn-test', '[data-tour="interruption-resume"]', '/mp/application/:id/test-interruption', 'Resume from the saved checkpoint', 'Return to the test without repeating the form, payment or saved answer.', 'Resume the test', 'click', 'target', 'pointing'),
  step('test-resumed-overview', 'learn-test', '[data-tour="test-question-overview"]', '/mp/application/:id/test', 'Back at the exact next question', 'The first answer is still locked and the test continues from Question 2.', 'Show the judge result button', 'advance', 'top', 'confident'),
  step('test-preview-result', 'learn-test', '[data-tour="preview-result-judge"]', '/mp/application/:id/test', 'Complete the test quickly for judging', 'This clearly labelled shortcut records a passing demo attempt so judges do not need to answer all 15 questions.', 'Preview passing result', 'click', 'target', 'pointing'),
  step('result-overview', 'result', '[data-tour="result-overview"]', '/mp/application/:id/result', 'Result and next steps', 'This page shows the score, pass mark, attempt details, technical interruptions and monitoring notes.', 'Show answer review', 'advance', 'top', 'celebrate'),
  step('result-open-review', 'result', '[data-tour="result-open-review"]', '/mp/application/:id/result', 'Review every answer', 'Open the full review to compare each selected answer with the correct answer and explanation.', 'Open answer review', 'click', 'target', 'pointing'),
  step('result-review-overview', 'result', '[data-tour="result-review-overview"]', '/mp/application/:id/result/review', 'Learn from the result', 'The review shows which answers were correct and explains each answer.', 'Return to the final result'),
  step('result-review-back', 'result', '[data-tour="result-review-back"]', '/mp/application/:id/result/review', 'Return to the result', 'Go back to the final result. The demo can then be reset for the next person.', 'Return to result', 'click', 'target', 'pointing'),
  step('tour-complete', 'result', '[data-tour="reset-demo"]', '/mp/application/:id/result', 'Full journey complete', 'You have seen the complete process. Explore freely, or reset the demo here for a fresh start.', 'Finish and explore', 'finish', 'target', 'celebrate'),
]

export const JUDGE_TOUR_STEPS: JudgeTourStep[] = rawSteps.map((item, index) => ({
  ...item,
  stepNumber: index + 1,
  fallbackNotice: bi('Preparing this screen…', 'यह स्क्रीन तैयार हो रही है…'),
}))
