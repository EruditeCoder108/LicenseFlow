export const LANGUAGES = [
  { code: 'en', englishName: 'English', nativeName: 'English', locale: 'en-IN', direction: 'ltr', translationStatus: 'reviewed' },
  { code: 'hi', englishName: 'Hindi', nativeName: 'हिन्दी', locale: 'hi-IN', direction: 'ltr', translationStatus: 'reviewed' },
  { code: 'as', englishName: 'Assamese', nativeName: 'অসমীয়া', locale: 'as-IN', direction: 'ltr', translationStatus: 'pending' },
  { code: 'bn', englishName: 'Bengali', nativeName: 'বাংলা', locale: 'bn-IN', direction: 'ltr', translationStatus: 'pending' },
  { code: 'brx', englishName: 'Bodo', nativeName: 'बड़ो', locale: 'brx-IN', direction: 'ltr', translationStatus: 'pending' },
  { code: 'doi', englishName: 'Dogri', nativeName: 'डोगरी', locale: 'doi-IN', direction: 'ltr', translationStatus: 'pending' },
  { code: 'gu', englishName: 'Gujarati', nativeName: 'ગુજરાતી', locale: 'gu-IN', direction: 'ltr', translationStatus: 'pending' },
  { code: 'kn', englishName: 'Kannada', nativeName: 'ಕನ್ನಡ', locale: 'kn-IN', direction: 'ltr', translationStatus: 'pending' },
  { code: 'ks', englishName: 'Kashmiri', nativeName: 'کٲشُر', locale: 'ks-IN', direction: 'rtl', translationStatus: 'pending' },
  { code: 'gom', englishName: 'Konkani', nativeName: 'कोंकणी', locale: 'kok-IN', direction: 'ltr', translationStatus: 'pending' },
  { code: 'mai', englishName: 'Maithili', nativeName: 'मैथिली', locale: 'mai-IN', direction: 'ltr', translationStatus: 'pending' },
  { code: 'ml', englishName: 'Malayalam', nativeName: 'മലയാളം', locale: 'ml-IN', direction: 'ltr', translationStatus: 'pending' },
  { code: 'mr', englishName: 'Marathi', nativeName: 'मराठी', locale: 'mr-IN', direction: 'ltr', translationStatus: 'pending' },
  { code: 'mni-Mtei', englishName: 'Manipuri (Meitei)', nativeName: 'ꯃꯤꯇꯩ ꯂꯣꯟ', locale: 'mni-IN', direction: 'ltr', translationStatus: 'pending' },
  { code: 'ne', englishName: 'Nepali', nativeName: 'नेपाली', locale: 'ne-IN', direction: 'ltr', translationStatus: 'pending' },
  { code: 'or', englishName: 'Odia', nativeName: 'ଓଡ଼ିଆ', locale: 'or-IN', direction: 'ltr', translationStatus: 'pending' },
  { code: 'pa', englishName: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', locale: 'pa-IN', direction: 'ltr', translationStatus: 'pending' },
  { code: 'sa', englishName: 'Sanskrit', nativeName: 'संस्कृतम्', locale: 'sa-IN', direction: 'ltr', translationStatus: 'pending' },
  { code: 'sat', englishName: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ', locale: 'sat-IN', direction: 'ltr', translationStatus: 'pending' },
  { code: 'sd', englishName: 'Sindhi', nativeName: 'سنڌي', locale: 'sd-IN', direction: 'rtl', translationStatus: 'pending' },
  { code: 'ta', englishName: 'Tamil', nativeName: 'தமிழ்', locale: 'ta-IN', direction: 'ltr', translationStatus: 'pending' },
  { code: 'te', englishName: 'Telugu', nativeName: 'తెలుగు', locale: 'te-IN', direction: 'ltr', translationStatus: 'pending' },
  { code: 'ur', englishName: 'Urdu', nativeName: 'اردو', locale: 'ur-IN', direction: 'rtl', translationStatus: 'pending' },
] as const

export type Language = typeof LANGUAGES[number]['code']
export type LanguageMeta = typeof LANGUAGES[number]

export const languageMeta = (language: Language): LanguageMeta => LANGUAGES.find((item) => item.code === language) ?? LANGUAGES[0]
export const isLanguage = (value: string | null): value is Language => LANGUAGES.some((item) => item.code === value)
export const isHindi = (language: Language) => language === 'hi'

export function translate(language: Language, english: string, hindi = english): string {
  if (language === 'en') return english
  if (language === 'hi') return hindi
  return english
}

export function localeFor(language: Language): string {
  return languageMeta(language).locale
}

export type BilingualText = { en: string; hi: string }
export const translatedText = (language: Language, text: BilingualText) => translate(language, text.en, text.hi)
