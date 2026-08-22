export interface Question {
  id: string
  topic: 'signs' | 'road-rules' | 'safety' | 'documents' | 'accidents'
  prompt: string
  options: string[]
  correct: number
  explanation: string
}

export const practiceQuestion: Question = {
  id: 'practice-turning',
  topic: 'road-rules',
  prompt: 'Before turning left at an intersection, what should you do first?',
  options: [
    'Signal and check for nearby road users',
    'Sound the horn continuously',
    'Move to the right side of the road',
  ],
  correct: 0,
  explanation: 'Signal early, check mirrors and blind spots, and turn only when the path is safe.',
}

export const fullQuestions: Question[] = [
  {
    id: 'red-light',
    topic: 'signs',
    prompt: 'A red traffic light means:',
    options: ['Stop behind the stop line', 'Proceed slowly', 'Turn without checking'],
    correct: 0,
    explanation: 'A steady red signal requires road users to stop behind the marked line.',
  },
  {
    id: 'ambulance',
    topic: 'road-rules',
    prompt: 'When an ambulance approaches with its siren on, you should:',
    options: ['Speed up', 'Give way safely', 'Stop in the middle of the road'],
    correct: 1,
    explanation: 'Move predictably and make a safe path for the emergency vehicle.',
  },
  {
    id: 'seat-belts',
    topic: 'safety',
    prompt: 'Seat belts should be worn by:',
    options: ['Only the driver', 'Only highway passengers', 'Everyone where provided'],
    correct: 2,
    explanation: 'Every occupant should use the restraint provided for their seat.',
  },
  {
    id: 'pedestrian-crossing',
    topic: 'road-rules',
    prompt: 'At a pedestrian crossing, you should:',
    options: ['Give way to pedestrians', 'Use the horn to pass', 'Overtake another vehicle'],
    correct: 0,
    explanation: 'Slow down and give pedestrians enough time and space to cross safely.',
  },
  {
    id: 'mobile-phone',
    topic: 'safety',
    prompt: 'Using a handheld phone while driving is:',
    options: ['Safe at low speed', 'Unsafe and prohibited', 'Allowed in light traffic'],
    correct: 1,
    explanation: 'A handheld phone distracts the driver and should not be used while driving.',
  },
  {
    id: 'stop-sign',
    topic: 'signs',
    prompt: 'At a STOP sign with a clear road, you must:',
    options: ['Slow slightly and continue', 'Come to a complete stop', 'Only stop at night'],
    correct: 1,
    explanation: 'A STOP sign requires a complete stop before checking and proceeding safely.',
  },
  {
    id: 'following-distance',
    topic: 'safety',
    prompt: 'In rain, your following distance should generally:',
    options: ['Increase', 'Stay exactly the same', 'Decrease'],
    correct: 0,
    explanation: 'Wet roads increase stopping distance, so extra space is needed.',
  },
  {
    id: 'overtaking',
    topic: 'road-rules',
    prompt: 'You should avoid overtaking when:',
    options: ['The road ahead is not clearly visible', 'The road is straight and clear', 'The vehicle ahead is slow'],
    correct: 0,
    explanation: 'Never overtake without a clear view and enough safe distance.',
  },
  {
    id: 'documents',
    topic: 'documents',
    prompt: 'A driver should be able to produce:',
    options: ['Only a shopping receipt', 'Required driving and vehicle documents', 'A school identity card only'],
    correct: 1,
    explanation: 'Required driving and vehicle documents must be valid and available when requested.',
  },
  {
    id: 'accident',
    topic: 'accidents',
    prompt: 'After a road accident involving injury, the first priority is to:',
    options: ['Leave immediately', 'Protect life and seek emergency help', 'Argue about responsibility'],
    correct: 1,
    explanation: 'Protect people from further danger and arrange emergency assistance promptly.',
  },
  {
    id: 'school-zone',
    topic: 'safety',
    prompt: 'Near a school, a responsible driver should:',
    options: ['Reduce speed and watch for children', 'Use the horn continuously', 'Overtake stopped school vehicles quickly'],
    correct: 0,
    explanation: 'Children can move unpredictably, so reduce speed and stay ready to stop.',
  },
  {
    id: 'broken-line',
    topic: 'signs',
    prompt: 'A broken centre line generally means you may cross it:',
    options: ['Whenever you want', 'Only when permitted and safe', 'Only while using the horn'],
    correct: 1,
    explanation: 'Road markings do not remove the duty to check that a manoeuvre is permitted and safe.',
  },
  {
    id: 'helmet',
    topic: 'safety',
    prompt: 'A two-wheeler helmet should be:',
    options: ['Properly fastened and suitable', 'Carried on the handlebar', 'Used only in heavy traffic'],
    correct: 0,
    explanation: 'A helmet protects only when it fits and is securely fastened.',
  },
  {
    id: 'horn',
    topic: 'road-rules',
    prompt: 'The horn should be used:',
    options: ['To express anger', 'Only when reasonably needed for safety', 'Continuously near hospitals'],
    correct: 1,
    explanation: 'Use the horn sparingly as a safety warning, not as a substitute for careful driving.',
  },
  {
    id: 'railway-crossing',
    topic: 'signs',
    prompt: 'At an unmanned railway crossing, you should:',
    options: ['Cross quickly without looking', 'Stop, check carefully, and cross only when safe', 'Follow the vehicle ahead without checking'],
    correct: 1,
    explanation: 'Confirm that no train is approaching before crossing the tracks.',
  },
]

export const demoQuestions = fullQuestions.slice(0, 5)
