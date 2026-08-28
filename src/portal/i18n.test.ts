import { describe, expect, it } from 'vitest'
import { LANGUAGES, isLanguage, languageMeta, translate } from './i18n'

describe('scheduled-language registry', () => {
  it('lists English plus all 22 scheduled Indian languages exactly once', () => {
    expect(LANGUAGES).toHaveLength(23)
    expect(new Set(LANGUAGES.map((item) => item.code)).size).toBe(23)
    expect(LANGUAGES.filter((item) => item.translationStatus === 'reviewed').map((item) => item.code)).toEqual(['en', 'hi'])
  })

  it('keeps unavailable language packs explicit instead of substituting Hindi', () => {
    expect(LANGUAGES.filter((item) => item.translationStatus === 'pending')).toHaveLength(21)
    expect(translate('brx', 'Continue', 'आगे बढ़ें')).toBe('Continue')
  })

  it('declares right-to-left scripts and validates stored preferences', () => {
    expect(['ks', 'sd', 'ur'].map((code) => languageMeta(code as 'ks' | 'sd' | 'ur').direction)).toEqual(['rtl', 'rtl', 'rtl'])
    expect(isLanguage('mni-Mtei')).toBe(true)
    expect(isLanguage('xx')).toBe(false)
  })
})
