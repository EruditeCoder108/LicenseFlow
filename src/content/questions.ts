export interface Question {
  id: string
  topic: 'signs' | 'road-rules' | 'safety' | 'documents' | 'accidents'
  prompt: string
  promptHi?: string
  options: string[]
  optionsHi?: string[]
  correct: number
  explanation: string
  explanationHi?: string
}

export const practiceQuestion: Question = {
  id: 'practice-turning',
  topic: 'road-rules',
  prompt: 'Before turning left at an intersection, what should you do first?',
  promptHi: 'चौराहे पर बाएँ मुड़ने से पहले आपको सबसे पहले क्या करना चाहिए?',
  options: [
    'Signal and check for nearby road users',
    'Sound the horn continuously',
    'Move to the right side of the road',
  ],
  optionsHi: ['संकेत दें और आसपास के सड़क उपयोगकर्ताओं को देखें', 'लगातार हॉर्न बजाएँ', 'सड़क के दाएँ किनारे चले जाएँ'],
  correct: 0,
  explanation: 'Signal early, check mirrors and blind spots, and turn only when the path is safe.',
  explanationHi: 'समय से संकेत दें, शीशे और ब्लाइंड स्पॉट देखें और रास्ता सुरक्षित होने पर ही मुड़ें।',
}

export const fullQuestions: Question[] = [
  {
    id: 'red-light',
    topic: 'signs',
    prompt: 'A red traffic light means:',
    promptHi: 'लाल ट्रैफिक लाइट का अर्थ है:',
    options: ['Stop behind the stop line', 'Proceed slowly', 'Turn without checking'],
    optionsHi: ['स्टॉप लाइन के पीछे रुकें', 'धीरे आगे बढ़ें', 'बिना देखे मुड़ें'],
    correct: 0,
    explanation: 'A steady red signal requires road users to stop behind the marked line.',
    explanationHi: 'स्थिर लाल संकेत पर सड़क उपयोगकर्ता को चिह्नित लाइन के पीछे रुकना चाहिए।',
  },
  {
    id: 'ambulance',
    topic: 'road-rules',
    prompt: 'When an ambulance approaches with its siren on, you should:',
    promptHi: 'सायरन बजाती एम्बुलेंस पास आए तो आपको क्या करना चाहिए?',
    options: ['Speed up', 'Give way safely', 'Stop in the middle of the road'],
    optionsHi: ['गति बढ़ाएँ', 'सुरक्षित रूप से रास्ता दें', 'सड़क के बीच में रुकें'],
    correct: 1,
    explanation: 'Move predictably and make a safe path for the emergency vehicle.',
    explanationHi: 'सुव्यवस्थित ढंग से चलें और आपातकालीन वाहन के लिए सुरक्षित रास्ता बनाएँ।',
  },
  {
    id: 'seat-belts',
    topic: 'safety',
    prompt: 'Seat belts should be worn by:',
    promptHi: 'सीट बेल्ट किसे पहननी चाहिए?',
    options: ['Only the driver', 'Only highway passengers', 'Everyone where provided'],
    optionsHi: ['केवल चालक', 'केवल राजमार्ग के यात्री', 'जहाँ उपलब्ध हो वहाँ हर व्यक्ति'],
    correct: 2,
    explanation: 'Every occupant should use the restraint provided for their seat.',
    explanationHi: 'हर यात्री को अपनी सीट पर उपलब्ध सुरक्षा बेल्ट का उपयोग करना चाहिए।',
  },
  {
    id: 'pedestrian-crossing',
    topic: 'road-rules',
    prompt: 'At a pedestrian crossing, you should:',
    promptHi: 'पैदल यात्री क्रॉसिंग पर आपको क्या करना चाहिए?',
    options: ['Give way to pedestrians', 'Use the horn to pass', 'Overtake another vehicle'],
    optionsHi: ['पैदल यात्रियों को रास्ता दें', 'हॉर्न बजाकर निकलें', 'दूसरे वाहन को ओवरटेक करें'],
    correct: 0,
    explanation: 'Slow down and give pedestrians enough time and space to cross safely.',
    explanationHi: 'गति कम करें और पैदल यात्रियों को सुरक्षित पार करने के लिए पर्याप्त समय और जगह दें।',
  },
  {
    id: 'mobile-phone',
    topic: 'safety',
    prompt: 'Using a handheld phone while driving is:',
    promptHi: 'वाहन चलाते समय हाथ में फोन का उपयोग करना:',
    options: ['Safe at low speed', 'Unsafe and prohibited', 'Allowed in light traffic'],
    optionsHi: ['कम गति पर सुरक्षित है', 'असुरक्षित और प्रतिबंधित है', 'कम यातायात में अनुमत है'],
    correct: 1,
    explanation: 'A handheld phone distracts the driver and should not be used while driving.',
    explanationHi: 'हाथ में फोन चालक का ध्यान भटकाता है और वाहन चलाते समय इसका उपयोग नहीं करना चाहिए।',
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
