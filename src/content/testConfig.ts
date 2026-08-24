export const LL_TEST_CONFIG = {
  revision: 'licenceflow-mp-prototype-2026-08',
  questionCount: 15,
  passMark: 9,
  secondsPerQuestion: 30,
  negativeMarking: false,
  interruptionAfterQuestion: 3,
} as const

export const ROAD_SAFETY_VIDEO = {
  revision: 'road-safety-learning-v1',
  youtubeId: 'zOF4I2I0mH4',
  embedUrl: 'https://www.youtube-nocookie.com/embed/zOF4I2I0mH4',
  youtubeUrl: 'https://youtu.be/zOF4I2I0mH4',
  title: 'Parivahan Sarathi — Road Safety Tutorial for Learner Licence',
  expectedDurationSeconds: 724,
  source: '/assets/road-safety-learning.mp4',
  captions: '/assets/road-safety-learning-en.vtt',
} as const

export const OFFICIAL_QUESTION_BANK = {
  source: '/assets/stall-sample-question-bank-english.pdf',
  label: 'Official STALL sample question bank — English',
} as const
