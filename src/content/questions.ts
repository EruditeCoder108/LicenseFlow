export type QuestionTopic = 'signs' | 'road-rules' | 'safety' | 'documents' | 'accidents'
export type QuestionDifficulty = 'easy' | 'medium' | 'applied'

export interface Question {
  id: string
  family: string
  topic: QuestionTopic
  difficulty: QuestionDifficulty
  prompt: string
  promptHi?: string
  options: string[]
  optionsHi?: string[]
  correct: number
  explanation: string
  explanationHi?: string
}
export type PresentedQuestion = Pick<Question, 'prompt' | 'promptHi' | 'options' | 'optionsHi'>

// Public rehearsal/judge fixtures, never the protected assessment bank.
// Protected questions and their marking keys live only under server/exam/.
export const practiceQuestion: Question = {
  id: 'practice-turning', family: 'turning-basics', topic: 'road-rules', difficulty: 'easy',
  prompt: 'Before turning left at an intersection, what should you do first?',
  promptHi: 'चौराहे पर बाएँ मुड़ने से पहले आपको सबसे पहले क्या करना चाहिए?',
  options: ['Signal and check for nearby road users', 'Sound the horn continuously', 'Move to the right side of the road'],
  optionsHi: ['संकेत दें और आसपास के सड़क उपयोगकर्ताओं को देखें', 'लगातार हॉर्न बजाएँ', 'सड़क के दाएँ किनारे चले जाएँ'],
  correct: 0,
  explanation: 'Signal early, check mirrors and blind spots, and turn only when the path is safe.',
  explanationHi: 'समय से संकेत दें, शीशे और ब्लाइंड स्पॉट देखें और रास्ता सुरक्षित होने पर ही मुड़ें।',
}
const fixture = (n: number, difficulty: QuestionDifficulty, prompt: string, options: string[], correct: number, explanation: string): Question => ({
  id: `judge-fixture-${n}`, family: `judge-family-${n}`, topic: 'safety', difficulty, prompt, options, correct, explanation,
})
export const fullQuestions: Question[] = [
  fixture(1, 'easy', 'What should you fasten before moving a car?', ['Your seat belt', 'The radio cable', 'Nothing on a short trip'], 0, 'Fasten your seat belt before the journey starts.'),
  fixture(2, 'easy', 'Before riding a motorcycle, which item protects your head?', ['A cap', 'A properly fastened helmet', 'Sunglasses'], 1, 'Wear a suitable helmet and fasten its strap correctly.'),
  fixture(3, 'easy', 'When someone is crossing directly ahead, what is the safe action?', ['Accelerate', 'Swerve past closely', 'Slow down and allow them to cross'], 2, 'Give the pedestrian space and time to cross safely.'),
  fixture(4, 'easy', 'Where should a driver look while moving?', ['At messages on a phone', 'At the road and surrounding traffic', 'Only at the speedometer'], 1, 'Watch the road, mirrors and surrounding traffic, not a phone.'),
  fixture(5, 'easy', 'Which journey needs a safety check?', ['Only a long journey', 'Only a night journey', 'Every journey'], 2, 'Check the vehicle and surroundings even for a short journey.'),
  fixture(6, 'easy', 'What helps other drivers understand your intended turn?', ['Using the direction indicator in advance', 'Turning suddenly', 'Waving after the turn'], 0, 'Give an early, clear signal and check that turning is safe.'),
  fixture(7, 'medium', 'Your phone rings while you are driving. What should you do?', ['Answer immediately', 'Stop in a safe permitted place before using it', 'Read it on the steering wheel'], 1, 'Deal with the phone only after stopping safely.'),
  fixture(8, 'medium', 'A large vehicle blocks your view ahead. What should you do?', ['Follow closely', 'Overtake without a view', 'Keep enough distance to see and stop'], 2, 'A larger gap improves visibility and reaction time.'),
  fixture(9, 'medium', 'Rain has just made the road slippery. How should you respond?', ['Reduce speed and increase the following gap', 'Brake sharply to test grip', 'Drive as before'], 0, 'Lower speed and a larger gap reduce the risk of skidding.'),
  fixture(10, 'medium', 'Before opening a car door beside traffic, check for:', ['Only parked cars', 'Approaching cyclists and other road users', 'The radio volume'], 1, 'Look behind and beside the vehicle before opening a door.'),
  fixture(11, 'medium', 'If you feel too tired to concentrate, you should:', ['Drive faster to finish sooner', 'Open a window and ignore it', 'Stop safely and rest'], 2, 'Rest is the safe response to fatigue.'),
  fixture(12, 'medium', 'What is a useful check before reversing?', ['Check around the vehicle and move slowly', 'Use only the horn', 'Assume the space is clear'], 0, 'Look around, use mirrors and reverse slowly only when safe.'),
  fixture(13, 'medium', 'A vehicle ahead slows unexpectedly. You should:', ['Tailgate it', 'Reduce speed while keeping a safe gap', 'Immediately overtake on a blind bend'], 1, 'A safe gap gives time to respond to unexpected slowing.'),
  fixture(14, 'applied', 'A ball rolls into the road near parked cars. What should you anticipate?', ['A clear road', 'Permission to accelerate', 'A child may follow it; slow down and prepare to stop'], 2, 'A rolling ball is a warning that a child may run into the road.'),
  fixture(15, 'applied', 'Your exit is approaching, but changing lanes now would cut off another vehicle. What should you do?', ['Continue safely and find another route', 'Cut across immediately', 'Stop in the traffic lane'], 0, 'Missing an exit is safer than making a dangerous last-second manoeuvre.'),
]
export const questionById = new Map(fullQuestions.map((question) => [question.id, question]))
export const demoQuestions = fullQuestions.slice(0, 5)
