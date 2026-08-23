import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, BadgeCheck, Bike, CarFront, Check, CheckCircle2, ChevronDown, CircleHelp, FileCheck2, FileText, Gauge, Save, ShieldCheck, Upload, UserRoundCheck, type LucideIcon } from 'lucide-react'
import {
  applicationSteps,
  completedStepCount,
  createEmptyDraft,
  fitnessQuestions,
  loadApplicationDraft,
  saveApplicationDraft,
  validateAllApplicationSteps,
  validateApplicationStep,
  vehicleOptions,
  type ApplicationStep,
  type FieldErrors,
  type FitnessAnswer,
  type LLApplicationDraft,
} from './application'
import { navigatePortal } from './router'

type AppLanguage = 'en' | 'hi'
const local = (language: AppLanguage, en: string, hi: string) => language === 'en' ? en : hi

const stepCopy: Record<ApplicationStep, { label: string; title: string; description: string }> = {
  category: { label: 'Applicant category', title: 'Tell us which situation applies', description: 'Your choice helps us show the right questions.' },
  identity: { label: 'Identity method', title: 'Choose how to verify your identity', description: 'Both options are for this demo. Read what each option does before you continue.' },
  personal: { label: 'Applicant details', title: 'Your details', description: 'Use only demo details. Do not enter real personal information.' },
  address: { label: 'Address', title: 'Present and permanent address', description: 'For this demo, your address is saved only in this browser.' },
  vehicles: { label: 'Vehicle classes', title: 'Choose the vehicle you want to learn', description: 'Choose the type of vehicle for this Learner’s Licence.' },
  fitness: { label: 'Form 1', title: 'Form 1 health declaration', description: 'Answer every question. A “Yes” answer may need review; it does not automatically reject your application.' },
  review: { label: 'Review', title: 'Review and submit', description: 'Check your details, fix anything missing, then submit the demo application.' },
}

const stepCopyHi: Record<ApplicationStep, { label: string; title: string; description: string }> = {
  category: { label: 'आवेदक श्रेणी', title: 'अपने लिए सही विकल्प चुनें', description: 'आपके चयन से हमें सही प्रश्न दिखाने में मदद मिलती है।' },
  identity: { label: 'पहचान का तरीका', title: 'पहचान की जाँच का तरीका चुनें', description: 'दोनों विकल्प डेमो के लिए हैं। आगे बढ़ने से पहले समझ लें कि हर विकल्प क्या करता है।' },
  personal: { label: 'आवेदक की जानकारी', title: 'आपकी जानकारी', description: 'केवल डेमो जानकारी भरें। वास्तविक निजी जानकारी दर्ज न करें।' },
  address: { label: 'पता', title: 'वर्तमान और स्थायी पता', description: 'इस डेमो में पता केवल इसी ब्राउज़र में सहेजा जाता है।' },
  vehicles: { label: 'वाहन प्रकार', title: 'वह वाहन चुनें जिसे आप सीखना चाहते हैं', description: 'इस लर्नर लाइसेंस के लिए वाहन का प्रकार चुनें।' },
  fitness: { label: 'फॉर्म 1', title: 'फॉर्म 1 स्वास्थ्य घोषणा', description: 'हर प्रश्न का जवाब दें। “हाँ” जवाब पर आगे जाँच हो सकती है; आवेदन अपने-आप रद्द नहीं होगा।' },
  review: { label: 'समीक्षा', title: 'जाँचें और जमा करें', description: 'अपनी जानकारी जाँचें, जो अधूरा है उसे ठीक करें, फिर डेमो आवेदन जमा करें।' },
}

const validationHi: Record<string, string> = {
  'Choose the option that describes the applicant.': 'अपने लिए सही विकल्प चुनें।',
  'Enter a synthetic existing licence number for this route.': 'इस विकल्प के लिए डेमो लाइसेंस संख्या दर्ज करें।',
  'Choose a synthetic identity route.': 'पहचान की जाँच का तरीका चुनें।',
  'Accept the prototype identity consent to continue.': 'आगे बढ़ने के लिए डेमो पहचान की शर्तों से सहमत हों।',
  'Verify the demonstration OTP to continue.': 'आगे बढ़ने के लिए डेमो OTP सत्यापित करें।',
  'Select at least one vehicle class.': 'कम से कम एक वाहन चुनें।',
  'Choose whether the applicant trained at a driving school.': 'बताएँ कि आपने ड्राइविंग स्कूल में प्रशिक्षण लिया है या नहीं।',
  'Accept the declaration before submitting.': 'आवेदन जमा करने से पहले घोषणा स्वीकार करें।',
}

function FlowLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return <a href={href} className={className} onClick={(event) => { event.preventDefault(); navigatePortal(href) }}>{children}</a>
}

function Field({ id, label, helper, error, required, optionalBadge, children }: { id: string; label: string; helper?: string; error?: string; required?: boolean; optionalBadge?: string; children: ReactNode }) {
  return (
    <div className={`form-field ${error ? 'form-field--error' : ''}`}>
      <div className="form-field__label-row">
        <label htmlFor={id}>
          {label}
          {required && <span className="required-mark" aria-hidden="true"> *</span>}
        </label>
        {optionalBadge && <span className="optional-badge">{optionalBadge}</span>}
      </div>
      {children}
      {helper && <small id={`${id}-help`} className="field-helper">{helper}</small>}
      {error && <small id={`${id}-error`} className="field-error" role="alert">{error}</small>}
    </div>
  )
}

function ErrorSummary({ errors, language }: { errors: FieldErrors; language: AppLanguage }) {
  const entries = Object.entries(errors)
  if (!entries.length) return null
  return <section className="error-summary" role="alert" aria-labelledby="error-summary-title"><strong id="error-summary-title">{local(language, `Please fix ${entries.length} item${entries.length === 1 ? '' : 's'} before continuing`, `आगे बढ़ने से पहले ${entries.length} गलती ठीक करें`)}</strong><ul>{entries.map(([field, message]) => <li key={field}><a href={`#${field.replaceAll('.', '-')}`}>{language === 'hi' ? validationHi[message] ?? message : message}</a></li>)}</ul></section>
}

function ContextHelp({ children, language = 'en' }: { children: ReactNode; language?: AppLanguage }) {
  return <details className="context-help"><summary><CircleHelp size={18} /> {local(language, 'Explain this step', 'यह प्रक्रिया समझें')}</summary><div>{children}</div></details>
}

function ApplicationProgress({ step, draft, language }: { step: ApplicationStep; draft: LLApplicationDraft; language: AppLanguage }) {
  const current = applicationSteps.indexOf(step)
  const labels = language === 'en' ? stepCopy : stepCopyHi
  const renderSteps = () => applicationSteps.map((item, index) => {
    const valid = Object.keys(validateApplicationStep(draft, item)).length === 0
    const state = index === current ? 'current' : valid ? 'complete' : 'upcoming'
    return (
      <li key={item} className={`application-progress__step application-progress__step--${state}`}>
        <FlowLink
          href={`/mp/ll/application/${item}`}
          className="application-progress__step-link"
          aria-current={index === current ? 'step' : undefined}
        >
          <span className="application-progress__badge">
            {valid && index !== current ? <Check size={13} /> : index + 1}
          </span>
          <div className="application-progress__text">
            <strong>{labels[item].label}</strong>
            <small>{index === current ? local(language, 'In progress', 'जारी है') : valid ? local(language, 'Saved', 'सहेजा गया') : local(language, 'Not complete', 'अधूरा')}</small>
          </div>
        </FlowLink>
      </li>
    )
  })
  return (
    <aside className="application-progress" aria-label={local(language, 'Application progress', 'आवेदन की प्रगति')}>
      <div className="application-progress__summary">
        <p className="eyebrow">{local(language, 'Application progress', 'आवेदन की प्रगति')}</p>
        <strong>{local(language, `Step ${current + 1} of ${applicationSteps.length}`, `${applicationSteps.length} में से चरण ${current + 1}`)}</strong>
        <div className="application-progress__bar" role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={applicationSteps.length}>
          <div className="application-progress__bar-fill" style={{ width: `${((current + 1) / applicationSteps.length) * 100}%` }} />
        </div>
      </div>
      <ol className="application-progress__desktop">{renderSteps()}</ol>
      <details className="application-progress__compact">
        <summary>
          <span>{local(language, `Step ${current + 1} of 7 · ${labels[step].label}`, `चरण ${current + 1}/7 · ${labels[step].label}`)}</span>
          <ChevronDown size={18} aria-hidden="true" />
        </summary>
        <ol>{renderSteps()}</ol>
      </details>
      <div className="application-progress__footer-note">
        <ShieldCheck size={14} aria-hidden="true" />
        <span>{local(language, 'Saved on this device', 'इस डिवाइस पर सहेजा गया')}</span>
      </div>
    </aside>
  )
}

function TextInput({ field, label, draft, setDraft, errors, type = 'text', required, helper, inputMode, autoComplete }: {
  field: keyof LLApplicationDraft
  label: string
  draft: LLApplicationDraft
  setDraft: (draft: LLApplicationDraft) => void
  errors: FieldErrors
  type?: string
  required?: boolean
  helper?: string
  inputMode?: 'text' | 'numeric' | 'tel' | 'email'
  autoComplete?: string
}) {
  const id = String(field)
  return <Field id={id} label={label} required={required} helper={helper} error={errors[id]}><input id={id} type={type} inputMode={inputMode} autoComplete={autoComplete} value={String(draft[field])} aria-describedby={[helper ? `${id}-help` : '', errors[id] ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined} aria-invalid={Boolean(errors[id])} onChange={(event) => setDraft({ ...draft, [field]: event.target.value })} /></Field>
}

function AddressFields({ prefix, title, value, onChange, errors }: { prefix: 'presentAddress' | 'permanentAddress'; title: string; value: LLApplicationDraft['presentAddress']; onChange: (value: LLApplicationDraft['presentAddress']) => void; errors: FieldErrors }) {
  const addressField = (key: keyof typeof value, label: string, required = false, inputMode?: 'numeric') => {
    const errorKey = `${prefix}.${key}`
    const id = `${prefix}-${key}`
    return <Field id={id} label={label} required={required} error={errors[errorKey]}><input id={id} inputMode={inputMode} value={value[key]} aria-invalid={Boolean(errors[errorKey])} aria-describedby={errors[errorKey] ? `${id}-error` : undefined} onChange={(event) => onChange({ ...value, [key]: event.target.value })} /></Field>
  }
  return <fieldset className="form-section"><legend>{title}</legend><div className="form-grid">{addressField('house', 'House/flat number or name', true)}{addressField('street', 'Street or road')}{addressField('locality', 'Village, town or locality', true)}{addressField('district', 'District', true)}{addressField('pin', 'PIN code', true, 'numeric')}</div></fieldset>
}

function CategoryStep({ draft, setDraft, errors, language }: StepProps) {
  const [showHelp, setShowHelp] = useState(false)
  const choices = [
    ['no-licence', local(language, 'I do not hold an Indian Driving Licence or Learner’s Licence', 'मेरे पास भारतीय ड्राइविंग लाइसेंस या लर्नर लाइसेंस नहीं है'), local(language, 'New LL application', 'नया एलएल आवेदन')],
    ['holds-driving-licence', local(language, 'I hold an Indian Driving Licence', 'मेरे पास भारतीय ड्राइविंग लाइसेंस है'), local(language, 'Existing DL details will be required', 'मौजूदा डीएल की जानकारी देनी होगी')],
    ['holds-learner-licence', local(language, 'I hold an Indian Learner’s Licence', 'मेरे पास भारतीय लर्नर लाइसेंस है'), local(language, 'Existing LL details will be required', 'मौजूदा एलएल की जानकारी देनी होगी')],
  ] as const
  const categoryError = language === 'hi' && errors.applicantCategory ? validationHi[errors.applicantCategory] ?? errors.applicantCategory : errors.applicantCategory
  return (
    <div className="form-content-wrap">
      <fieldset className={`choice-fieldset ${errors.applicantCategory ? 'choice-fieldset--error' : ''}`} id="applicantCategory">
        <div className="form-question-header">
          <legend className="form-question-title">
            {local(language, 'Which situation applies to you?', 'आपके लिए कौन सा विकल्प लागू होता है?')}
            <span className="required-mark" aria-hidden="true"> *</span>
          </legend>
          <button
            type="button"
            className="context-help-trigger"
            onClick={() => setShowHelp(!showHelp)}
            aria-expanded={showHelp}
          >
            <CircleHelp size={15} aria-hidden="true" />
            <span>{local(language, 'Why this matters', 'यह क्यों जरूरी है')}</span>
          </button>
        </div>

        {showHelp && (
          <div className="context-help-inline" role="region" aria-label={local(language, 'Why this matters', 'यह क्यों जरूरी है')}>
            <p>{local(language, 'Your selection determines whether LicenceFlow asks for details of an existing DL or Learner’s Licence.', 'आपके चयन के आधार पर तय होगा कि आगे मौजूदा डीएल या लर्नर लाइसेंस की जानकारी माँगी जाएगी या नहीं।')}</p>
          </div>
        )}

        <div className="choice-stack">
          {choices.map(([value, title, detail]) => (
            <label className={`radio-choice ${draft.applicantCategory === value ? 'radio-choice--selected' : ''}`} key={value}>
              <input
                type="radio"
                name="applicantCategory"
                value={value}
                checked={draft.applicantCategory === value}
                onChange={() => setDraft({ ...draft, applicantCategory: value })}
              />
              <span className="radio-choice__text">
                <strong>{title}</strong>
                <small>{detail}</small>
              </span>
            </label>
          ))}
        </div>
        {categoryError && <small className="field-error" role="alert">{categoryError}</small>}
      </fieldset>

      {draft.applicantCategory && draft.applicantCategory !== 'no-licence' && (
        <Field
          id="existingLicenceNumber"
          label={local(language, 'Existing sample licence number', 'मौजूदा नमूना लाइसेंस संख्या')}
          required
          error={errors.existingLicenceNumber}
          helper={local(language, 'Do not enter a real licence number.', 'वास्तविक लाइसेंस संख्या दर्ज न करें।')}
        >
          <input
            id="existingLicenceNumber"
            value={draft.existingLicenceNumber}
            onChange={(event) => setDraft({ ...draft, existingLicenceNumber: event.target.value.toUpperCase() })}
          />
        </Field>
      )}

      <div className="secondary-form-field">
        <fieldset className="special-category-fieldset" id="specialCategory">
          <div className="special-category-header">
            <legend className="special-category-label">
              {local(language, 'Special category', 'विशेष श्रेणी')}
            </legend>
            <span className="optional-badge">{local(language, 'Optional', 'वैकल्पिक')}</span>
          </div>
          <div className="special-category-pills" role="radiogroup" aria-label={local(language, 'Special category', 'विशेष श्रेणी')}>
            {([
              ['none', local(language, 'None', 'कोई नहीं')],
              ['diplomat', local(language, 'Diplomat', 'राजनयिक')],
              ['refugee', local(language, 'Refugee', 'शरणार्थी')],
              ['repatriate', local(language, 'Repatriate', 'स्वदेश लौटे व्यक्ति')],
              ['ex-serviceman', local(language, 'Ex-serviceman', 'भूतपूर्व सैनिक')],
            ] as const).map(([val, label]) => {
              const isSelected = (draft.specialCategory || 'none') === val
              return (
                <label
                  key={val}
                  className={`special-category-pill ${isSelected ? 'special-category-pill--selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="specialCategory"
                    value={val}
                    checked={isSelected}
                    onChange={() => setDraft({ ...draft, specialCategory: val as LLApplicationDraft['specialCategory'] })}
                    className="visually-hidden"
                  />
                  <span>{label}</span>
                </label>
              )
            })}
          </div>
          <small className="field-helper">{local(language, 'Select only when applicable.', 'लागू होने पर ही चुनें।')}</small>
        </fieldset>
      </div>
    </div>
  )
}

function IdentityStep({ draft, setDraft, errors, language }: StepProps) {
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [showHelp, setShowHelp] = useState(false)
  const chooseRoute = (identityRoute: LLApplicationDraft['identityRoute']) => setDraft({ ...draft, identityRoute, identityOtpSent: false, identityVerified: false })
  const verifyOtp = () => {
    if (otp !== '246810') {
      setOtpError(local(language, 'Enter the 6-digit demo OTP shown above.', 'ऊपर दिया 6 अंकों का डेमो OTP दर्ज करें।'))
      return
    }
    setOtpError('')
    setDraft({ ...draft, identityVerified: true })
  }
  return (
    <div className="form-content-wrap">
      <section className="privacy-banner">
        <ShieldCheck size={22} />
        <div>
          <strong>{local(language, 'Do not enter an Aadhaar number on this page.', 'इस पेज पर आधार संख्या दर्ज न करें।')}</strong>
          <p>{local(language, 'This demo shows the e-KYC and OTP steps. It does not collect your Aadhaar number or contact UIDAI.', 'यह डेमो e-KYC और OTP के चरण दिखाता है। यह आपका आधार नंबर नहीं लेता और UIDAI से नहीं जुड़ता।')}</p>
        </div>
      </section>

      <fieldset className={`choice-fieldset ${errors.identityRoute ? 'choice-fieldset--error' : ''}`} id="identityRoute">
        <div className="form-question-header">
          <legend className="form-question-title">
            {local(language, 'How would you like to verify your identity?', 'आप अपनी पहचान कैसे सत्यापित करना चाहते हैं?')}
            <span className="required-mark" aria-hidden="true"> *</span>
          </legend>
          <button
            type="button"
            className="context-help-trigger"
            onClick={() => setShowHelp(!showHelp)}
            aria-expanded={showHelp}
          >
            <CircleHelp size={15} aria-hidden="true" />
            <span>{local(language, 'Why this matters', 'यह क्यों जरूरी है')}</span>
          </button>
        </div>

        {showHelp && (
          <div className="context-help-inline" role="region" aria-label={local(language, 'Why this matters', 'यह क्यों जरूरी है')}>
            <p>{local(language, 'Aadhaar e-KYC enables instant contactless identity verification in the portal. Without Aadhaar, physical verification at the RTO is required.', 'आधार e-KYC से पोर्टल पर तुरंत संपर्क-रहित पहचान सत्यापन होता है। बिना आधार के आरटीओ में दस्तावेज़ सत्यापन की आवश्यकता होती है।')}</p>
          </div>
        )}

        <div className="choice-stack">
          <label className={`radio-choice ${draft.identityRoute === 'aadhaar-ekyc' ? 'radio-choice--selected' : ''}`}>
            <input
              type="radio"
              name="identityRoute"
              value="aadhaar-ekyc"
              checked={draft.identityRoute === 'aadhaar-ekyc'}
              onChange={() => chooseRoute('aadhaar-ekyc')}
            />
            <span className="radio-choice__text">
              <strong>{local(language, 'Demo Aadhaar e-KYC (Fastest & Contactless)', 'डेमो आधार e-KYC (त्वरित एवं संपर्क-रहित)')}</strong>
              <small>{local(language, 'Uses a demo OTP and sample profile. It does not connect to UIDAI.', 'डेमो OTP और नमूना प्रोफाइल का उपयोग होता है। UIDAI से कोई कनेक्शन नहीं होता।')}</small>
            </span>
          </label>

          <label className={`radio-choice ${draft.identityRoute === 'documents' ? 'radio-choice--selected' : ''}`}>
            <input
              type="radio"
              name="identityRoute"
              value="documents"
              checked={draft.identityRoute === 'documents'}
              onChange={() => chooseRoute('documents')}
            />
            <span className="radio-choice__text">
              <strong>{local(language, 'Without Aadhaar (Upload documents)', 'बिना आधार (दस्तावेज़ अपलोड करें)')}</strong>
              <small>{local(language, 'Continue by filling details manually and uploading demo documents in the next stage.', 'अपनी जानकारी खुद भरें और अगले चरण में नमूना दस्तावेज़ अपलोड करें।')}</small>
            </span>
          </label>
        </div>
        {errors.identityRoute && <small className="field-error" role="alert">{language === 'hi' ? validationHi[errors.identityRoute] ?? errors.identityRoute : errors.identityRoute}</small>}
      </fieldset>

      {draft.identityRoute && (
        <label className={`consent-box ${errors.identityConsent ? 'consent-box--error' : ''}`} id="identityConsent">
          <input
            type="checkbox"
            checked={draft.identityConsent}
            onChange={(event) => setDraft({
              ...draft,
              identityConsent: event.target.checked,
              identityOtpSent: event.target.checked ? draft.identityOtpSent : false,
              identityVerified: event.target.checked ? draft.identityVerified : false,
            })}
          />
          <span>
            <strong>{local(language, 'I agree to use this demo identity method.', 'मैं इस डेमो पहचान तरीके का उपयोग करने के लिए सहमत हूँ।')}</strong>
            <small>{local(language, 'No real biometric or government identity check is performed.', 'कोई वास्तविक बायोमेट्रिक या सरकारी पहचान जाँच नहीं होती।')}</small>
            {errors.identityConsent && <span className="field-error" role="alert">{language === 'hi' ? validationHi[errors.identityConsent] ?? errors.identityConsent : errors.identityConsent}</span>}
          </span>
        </label>
      )}

      {draft.identityRoute === 'aadhaar-ekyc' && draft.identityConsent && (
        <section className="otp-panel" id="identityVerified" aria-labelledby="otp-title">
          <div className="otp-panel__heading">
            <div>
              <p className="eyebrow">{local(language, 'Mobile verification', 'मोबाइल सत्यापन')}</p>
              <h2 id="otp-title">{local(language, 'Enter the demo OTP', 'डेमो OTP दर्ज करें')}</h2>
            </div>
            {draft.identityVerified && <span className="saved-indicator"><CheckCircle2 size={17} /> {local(language, 'Verified', 'सत्यापित')}</span>}
          </div>
          {!draft.identityOtpSent ? (
            <div className="otp-request-state">
              <p>{local(language, 'This demo uses a sample mobile number ending in 0042. No real SMS is sent.', 'इस डेमो में 0042 पर खत्म होने वाला नमूना मोबाइल नंबर है। कोई वास्तविक SMS नहीं भेजा जाता।')}</p>
              <button type="button" className="button button--primary" onClick={() => setDraft({ ...draft, identityOtpSent: true })}>
                {local(language, 'Send demo OTP', 'डेमो OTP भेजें')}
              </button>
            </div>
          ) : draft.identityVerified ? (
            <div className="otp-success">
              <CheckCircle2 size={21} />
              <p>{local(language, 'OTP verified. You can continue with the demo profile.', 'OTP सत्यापित हो गया। अब डेमो प्रोफाइल के साथ आगे बढ़ें।')}</p>
            </div>
          ) : (
            <div className="otp-verification-flow">
              <div className="demo-otp">
                <div>
                  <strong>{local(language, 'Demo OTP', 'डेमो OTP')}</strong>
                  <small>{local(language, 'Use this code to continue the demo:', 'डेमो पूरा करने के लिए इस कोड का उपयोग करें:')}</small>
                </div>
                <span>246810</span>
              </div>
              <div className="otp-entry">
                <label htmlFor="identity-otp">{local(language, 'Enter 6-digit OTP', '6 अंकों का OTP दर्ज करें')}</label>
                <div className="otp-input-group">
                  <input
                    id="identity-otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="246810"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
                    aria-invalid={Boolean(otpError)}
                  />
                  <button type="button" className="button button--primary" onClick={verifyOtp}>
                    {local(language, 'Verify OTP', 'OTP सत्यापित करें')}
                  </button>
                </div>
                {otpError && <small className="field-error" role="alert">{otpError}</small>}
                <button type="button" className="text-button" onClick={() => { setOtp(''); setOtpError('') }}>
                  {local(language, 'Resend OTP', 'OTP फिर भेजें')}
                </button>
              </div>
            </div>
          )}
          {errors.identityVerified && !draft.identityVerified && <small className="field-error" role="alert">{local(language, 'Complete OTP verification before continuing.', 'आगे बढ़ने से पहले OTP सत्यापन पूरा करें।')}</small>}
        </section>
      )}

      {draft.identityRoute === 'documents' && draft.identityConsent && (
        <section className="document-route-note">
          <FileText size={21} />
          <div>
            <strong>{local(language, 'Document option selected', 'दस्तावेज़ वाला विकल्प चुना गया')}</strong>
            <p>{local(language, 'You can continue now. We’ll ask for the demo document, photo and signature later.', 'अब आप आगे बढ़ सकते हैं। डेमो दस्तावेज़, फोटो और हस्ताक्षर बाद में माँगे जाएँगे।')}</p>
          </div>
        </section>
      )}
    </div>
  )
}

function PersonalStep({ draft, setDraft, errors, language }: StepProps) {
  return (
    <>
      <ContextHelp language={language}>
        <p>{local(language, 'We split the form into small sections so it is easier to complete.', 'फॉर्म को छोटे भागों में बाँटा गया है ताकि इसे भरना आसान हो।')}</p>
      </ContextHelp>
      <fieldset className="form-section">
        <legend>{local(language, 'Name and relation', 'नाम और संबंध')}</legend>
        <div className="form-grid">
          <TextInput field="firstName" label={local(language, 'First name', 'पहला नाम')} required draft={draft} setDraft={setDraft} errors={errors} autoComplete="given-name" />
          <TextInput field="middleName" label={local(language, 'Middle name', 'मध्यम नाम')} draft={draft} setDraft={setDraft} errors={errors} autoComplete="additional-name" />
          <TextInput field="lastName" label={local(language, 'Last name', 'अंतिम नाम')} required draft={draft} setDraft={setDraft} errors={errors} autoComplete="family-name" />
          <Field id="relationType" label={local(language, 'Relationship', 'संबंध')} required>
            <select id="relationType" value={draft.relationType} onChange={(event) => setDraft({ ...draft, relationType: event.target.value as LLApplicationDraft['relationType'] })}>
              <option value="father">{local(language, 'Father', 'पिता')}</option>
              <option value="mother">{local(language, 'Mother', 'माता')}</option>
              <option value="spouse">{local(language, 'Spouse', 'पति/पत्नी')}</option>
              <option value="guardian">{local(language, 'Guardian', 'अभिभावक')}</option>
            </select>
          </Field>
          <TextInput field="relationName" label={local(language, 'Relation name', 'संबंधी का नाम')} required draft={draft} setDraft={setDraft} errors={errors} />
        </div>
      </fieldset>
      <fieldset className="form-section">
        <legend>{local(language, 'Personal details', 'व्यक्तिगत जानकारी')}</legend>
        <div className="form-grid">
          <Field id="gender" label={local(language, 'Gender', 'लिंग')} required error={errors.gender}>
            <select id="gender" value={draft.gender} onChange={(event) => setDraft({ ...draft, gender: event.target.value as LLApplicationDraft['gender'] })}>
              <option value="">{local(language, 'Select', 'चुनें')}</option>
              <option value="male">{local(language, 'Male', 'पुरुष')}</option>
              <option value="female">{local(language, 'Female', 'महिला')}</option>
              <option value="transgender">{local(language, 'Transgender', 'ट्रांसजेंडर')}</option>
            </select>
          </Field>
          <TextInput field="dateOfBirth" label={local(language, 'Date of birth', 'जन्मतिथि')} type="date" required draft={draft} setDraft={setDraft} errors={errors} />
          <TextInput field="placeOfBirth" label={local(language, 'Place of birth', 'जन्म स्थान')} draft={draft} setDraft={setDraft} errors={errors} />
          <TextInput field="education" label={local(language, 'Education', 'शिक्षा')} draft={draft} setDraft={setDraft} errors={errors} />
        </div>
      </fieldset>
      <fieldset className="form-section">
        <legend>{local(language, 'Contact and identification', 'संपर्क और पहचान')}</legend>
        <div className="form-grid">
          <TextInput
            field="mobile"
            label={local(language, 'Demo mobile number', 'डेमो मोबाइल नंबर')}
            required
            draft={draft}
            setDraft={setDraft}
            errors={errors}
            inputMode="tel"
            autoComplete="tel"
            helper={local(language, 'Use a demo 10-digit number. Do not enter your real number.', '10 अंकों का डेमो नंबर डालें। अपना असली नंबर न डालें।')}
          />
          <TextInput
            field="email"
            label={local(language, 'Demo email address', 'डेमो ईमेल')}
            type="email"
            draft={draft}
            setDraft={setDraft}
            errors={errors}
            inputMode="email"
            autoComplete="email"
          />
          <TextInput field="identificationMark1" label={local(language, 'Identification mark 1', 'पहचान चिन्ह 1')} required draft={draft} setDraft={setDraft} errors={errors} />
          <TextInput field="identificationMark2" label={local(language, 'Identification mark 2', 'पहचान चिन्ह 2')} draft={draft} setDraft={setDraft} errors={errors} />
        </div>
      </fieldset>
    </>
  )
}

function AddressStep({ draft, setDraft, errors, language }: StepProps) {
  return (
    <>
      <AddressFields
        prefix="presentAddress"
        title={local(language, 'Present address', 'वर्तमान पता')}
        value={draft.presentAddress}
        errors={errors}
        onChange={(presentAddress) => setDraft({ ...draft, presentAddress })}
      />
      <fieldset className="form-section">
        <legend>{local(language, 'How long have you lived here?', 'आप यहाँ कितने समय से रह रहे हैं?')}</legend>
        <div className="form-grid">
          <TextInput field="yearsAtAddress" label={local(language, 'Years', 'वर्ष')} required draft={draft} setDraft={setDraft} errors={errors} inputMode="numeric" />
          <TextInput field="monthsAtAddress" label={local(language, 'Months', 'महीने')} draft={draft} setDraft={setDraft} errors={errors} inputMode="numeric" />
        </div>
      </fieldset>
      <label className="consent-box">
        <input
          type="checkbox"
          checked={draft.samePermanentAddress}
          onChange={(event) => setDraft({ ...draft, samePermanentAddress: event.target.checked })}
        />
        <span>
          <strong>{local(language, 'My permanent address is the same', 'मेरा स्थायी पता भी यही है')}</strong>
          <small>{local(language, 'If you uncheck this, any permanent address you already entered will stay saved.', 'इसे हटाने पर पहले भरा स्थायी पता मिटेगा नहीं।')}</small>
        </span>
      </label>
      {!draft.samePermanentAddress && (
        <AddressFields
          prefix="permanentAddress"
          title={local(language, 'Permanent address', 'स्थायी पता')}
          value={draft.permanentAddress}
          errors={errors}
          onChange={(permanentAddress) => setDraft({ ...draft, permanentAddress })}
        />
      )}
    </>
  )
}

function VehiclesStep({ draft, setDraft, errors, language }: StepProps) {
  const toggle = (vehicle: string) => setDraft({ ...draft, vehicleClasses: draft.vehicleClasses.includes(vehicle) ? draft.vehicleClasses.filter((item) => item !== vehicle) : [...draft.vehicleClasses, vehicle] })
  const visual: Record<(typeof vehicleOptions)[number]['id'], LucideIcon> = { MCWOG: Gauge, MCWG: Bike, LMV: CarFront }
  const namesHi: Record<(typeof vehicleOptions)[number]['id'], [string, string]> = { MCWOG: ['बिना गियर की मोटरसाइकिल', 'स्कूटर या मोपेड वर्ग'], MCWG: ['गियर वाली मोटरसाइकिल', 'गियर वाली बाइक वर्ग'], LMV: ['हल्का मोटर वाहन', 'कार या जीप वर्ग'] }
  return (
    <>
      <ContextHelp language={language}>
        <p>{local(language, 'Choose the vehicle you want to learn. We’ll also show the licence class code.', 'वह वाहन चुनें जिसे आप सीखना चाहते हैं। साथ में लाइसेंस क्लास कोड भी दिखेगा।')}</p>
      </ContextHelp>
      <fieldset className={`choice-fieldset ${errors.vehicleClasses ? 'choice-fieldset--error' : ''}`} id="vehicleClasses">
        <legend>{local(language, 'Vehicle type', 'वाहन का प्रकार')} <span className="required-mark">*</span></legend>
        <div className="vehicle-choice-grid">
          {vehicleOptions.map((vehicle) => {
            const Icon = visual[vehicle.id]
            const selected = draft.vehicleClasses.includes(vehicle.id)
            return (
              <label className={`vehicle-choice ${selected ? 'vehicle-choice--selected' : ''}`} key={vehicle.id}>
                <input type="checkbox" checked={selected} onChange={() => toggle(vehicle.id)} />
                <span className="vehicle-choice__visual"><Icon size={34} /></span>
                <span>
                  <strong>{language === 'en' ? vehicle.name : namesHi[vehicle.id][0]}</strong>
                  <small>{language === 'en' ? vehicle.example : namesHi[vehicle.id][1]}</small>
                  <b>{vehicle.id}</b>
                </span>
                {selected && <CheckCircle2 size={20} aria-label={local(language, 'Selected', 'चुना गया')} />}
              </label>
            )
          })}
        </div>
        {errors.vehicleClasses && <small className="field-error" role="alert">{language === 'hi' ? validationHi[errors.vehicleClasses] ?? errors.vehicleClasses : errors.vehicleClasses}</small>}
        <details className="vehicle-code-help">
          <summary><CircleHelp size={18} /> {local(language, 'What do these class codes mean?', 'इन वाहन वर्ग कोड का क्या अर्थ है?')}</summary>
          <p>{local(language, 'MCWOG is a motorcycle without gear, MCWG is a motorcycle with gear, and LMV is a light motor vehicle. Eligibility and exact state rules must be confirmed in the official service.', 'MCWOG बिना गियर की मोटरसाइकिल, MCWG गियर वाली मोटरसाइकिल और LMV हल्का मोटर वाहन है। पात्रता और राज्य के सटीक नियम आधिकारिक सेवा में जाँचें।')}</p>
        </details>
      </fieldset>
      {draft.vehicleClasses.length > 0 && (
        <section className="vehicle-selection-summary">
          <p className="eyebrow">{local(language, 'Selected vehicles', 'चुने वाहन वर्ग')}</p>
          <div>
            {draft.vehicleClasses.map((item) => (
              <span key={item}><Check size={14} /> {item}</span>
            ))}
          </div>
        </section>
      )}
      <fieldset className="choice-fieldset" id="trainedAtDrivingSchool">
        <legend>{local(language, 'Training at a driving school', 'ड्राइविंग स्कूल में प्रशिक्षण')} <span className="required-mark">*</span></legend>
        <div className="inline-choices">
          <label>
            <input type="radio" name="trainedAtDrivingSchool" checked={draft.trainedAtDrivingSchool === 'yes'} onChange={() => setDraft({ ...draft, trainedAtDrivingSchool: 'yes' })} /> {local(language, 'Yes', 'हाँ')}
          </label>
          <label>
            <input type="radio" name="trainedAtDrivingSchool" checked={draft.trainedAtDrivingSchool === 'no'} onChange={() => setDraft({ ...draft, trainedAtDrivingSchool: 'no' })} /> {local(language, 'No', 'नहीं')}
          </label>
        </div>
        {errors.trainedAtDrivingSchool && <small className="field-error" role="alert">{language === 'hi' ? validationHi[errors.trainedAtDrivingSchool] ?? errors.trainedAtDrivingSchool : errors.trainedAtDrivingSchool}</small>}
      </fieldset>
    </>
  )
}

function FitnessStep({ draft, setDraft, errors, language }: StepProps) {
  const answer = (id: string, value: FitnessAnswer) => setDraft({ ...draft, fitnessAnswers: { ...draft.fitnessAnswers, [id]: value } })
  return (
    <>
      <section className="reference-banner">
        <FileCheck2 size={22} />
        <div>
          <strong>{local(language, 'Demo Form 1', 'डेमो Form 1')}</strong>
          <p>{local(language, 'This demo uses simplified Form 1 wording. Official MP wording must be checked before production use.', 'इस डेमो में Form 1 की भाषा आसान की गई है। वास्तविक उपयोग से पहले आधिकारिक MP भाषा की जाँच जरूरी है।')}</p>
        </div>
      </section>
      <fieldset className="fitness-list">
        <legend className="visually-hidden">{local(language, 'Physical fitness questions', 'शारीरिक फिटनेस प्रश्न')}</legend>
        {fitnessQuestions.map((question, index) => {
          const error = errors[`fitness.${question.id}`]
          return (
            <div className={`fitness-question ${error ? 'fitness-question--error' : ''}`} id={`fitness-${question.id}`} key={question.id}>
              <div>
                <span>{index + 1}</span>
                <p>{question.text}</p>
              </div>
              <div className="segmented-choice">
                <label className={draft.fitnessAnswers[question.id] === 'yes' ? 'selected' : ''}>
                  <input type="radio" name={`fitness-${question.id}`} checked={draft.fitnessAnswers[question.id] === 'yes'} onChange={() => answer(question.id, 'yes')} />
                  {local(language, 'Yes', 'हाँ')}
                </label>
                <label className={draft.fitnessAnswers[question.id] === 'no' ? 'selected' : ''}>
                  <input type="radio" name={`fitness-${question.id}`} checked={draft.fitnessAnswers[question.id] === 'no'} onChange={() => answer(question.id, 'no')} />
                  {local(language, 'No', 'नहीं')}
                </label>
              </div>
              {error && <small className="field-error" role="alert">{error}</small>}
            </div>
          )
        })}
      </fieldset>
    </>
  )
}

function ReviewStep({ draft, setDraft, errors, language }: StepProps) {
  const allErrors = validateAllApplicationSteps(draft)
  const sections = applicationSteps.filter((step) => step !== 'review').map((step) => ({ step, complete: Object.keys(allErrors[step]).length === 0 }))
  const address = draft.presentAddress
  const stepLabels = language === 'en' ? stepCopy : stepCopyHi
  return (
    <>
      <section className="review-intro">
        <CheckCircle2 size={22} />
        <div>
          <strong>{local(language, `${sections.filter((section) => section.complete).length} of ${sections.length} sections complete`, `${sections.length} में से ${sections.filter((section) => section.complete).length} भाग पूरे`)}</strong>
          <p>{local(language, 'This is a demo submission. It does not create a government record.', 'यह डेमो सबमिशन है। इससे कोई सरकारी रिकॉर्ड नहीं बनता।')}</p>
        </div>
      </section>
      <div className="review-sections">
        {sections.map(({ step, complete }) => (
          <section key={step}>
            <div>
              <span className={complete ? 'review-state review-state--complete' : 'review-state'}>{complete ? <Check size={15} /> : '!'}</span>
              <h3>{stepLabels[step].label}</h3>
            </div>
            <FlowLink href={`/mp/ll/application/${step}`}>
              {complete ? local(language, 'Review', 'जाँचें') : local(language, 'Fix section', 'सुधारें')}
            </FlowLink>
          </section>
        ))}
      </div>
      <section className="review-data">
        <h3>{local(language, 'Application summary', 'आवेदन सारांश')}</h3>
        <dl>
          <div>
            <dt>{local(language, 'Applicant', 'आवेदक')}</dt>
            <dd>{[draft.firstName, draft.middleName, draft.lastName].filter(Boolean).join(' ') || local(language, 'Not provided', 'उपलब्ध नहीं')}</dd>
          </div>
          <div>
            <dt>{local(language, 'Identity method', 'पहचान का तरीका')}</dt>
            <dd>{draft.identityRoute === 'aadhaar-ekyc' ? local(language, 'Demo Aadhaar e-KYC', 'डेमो आधार e-KYC') : draft.identityRoute === 'documents' ? local(language, 'Document-assisted', 'दस्तावेज़ सहायता') : local(language, 'Not selected', 'नहीं चुना गया')}</dd>
          </div>
          <div>
            <dt>{local(language, 'Address', 'पता')}</dt>
            <dd>{[address.house, address.locality, address.district, address.pin].filter(Boolean).join(', ') || local(language, 'Not provided', 'उपलब्ध नहीं')}</dd>
          </div>
          <div>
            <dt>{local(language, 'Vehicle classes', 'वाहन वर्ग')}</dt>
            <dd>{draft.vehicleClasses.join(', ') || local(language, 'None selected', 'कोई नहीं चुना गया')}</dd>
          </div>
        </dl>
      </section>
      <label className={`consent-box ${errors.declarationAccepted ? 'consent-box--error' : ''}`} id="declarationAccepted">
        <input type="checkbox" checked={draft.declarationAccepted} onChange={(event) => setDraft({ ...draft, declarationAccepted: event.target.checked })} />
        <span>
          <strong>{local(language, 'I confirm these are demo details and are correct for this test.', 'मैं पुष्टि करता/करती हूँ कि ये डेमो जानकारी सही है।')}</strong>
          <small>{local(language, 'I understand this does not submit an official LL application.', 'मैं समझता/समझती हूँ कि इससे वास्तविक LL आवेदन जमा नहीं होता।')}</small>
          {errors.declarationAccepted && <span className="field-error" role="alert">{errors.declarationAccepted}</span>}
        </span>
      </label>
    </>
  )
}

type StepProps = { draft: LLApplicationDraft; setDraft: (draft: LLApplicationDraft) => void; errors: FieldErrors; language: AppLanguage }

function StepContent(props: StepProps & { step: ApplicationStep }) {
  if (props.step === 'category') return <CategoryStep {...props} />
  if (props.step === 'identity') return <IdentityStep {...props} />
  if (props.step === 'personal') return <PersonalStep {...props} />
  if (props.step === 'address') return <AddressStep {...props} />
  if (props.step === 'vehicles') return <VehiclesStep {...props} />
  if (props.step === 'fitness') return <FitnessStep {...props} />
  return <ReviewStep {...props} />
}

export function ApplicationFlow({ step, onSubmitted, language }: { step: ApplicationStep; onSubmitted: (draft: LLApplicationDraft) => void; language: AppLanguage }) {
  const [draft, setDraft] = useState<LLApplicationDraft>(() => loadApplicationDraft() ?? createEmptyDraft())
  const [errors, setErrors] = useState<FieldErrors>({})
  const index = applicationSteps.indexOf(step)
  const pageCopy = (language === 'en' ? stepCopy : stepCopyHi)[step]
  useEffect(() => { saveApplicationDraft(draft) }, [draft])
  useEffect(() => { setErrors({}) }, [step])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const currentErrors = validateApplicationStep(draft, step)
    setErrors(currentErrors)
    if (Object.keys(currentErrors).length) {
      const first = Object.keys(currentErrors)[0]?.replaceAll('.', '-')
      window.requestAnimationFrame(() => {
        const target = document.getElementById(first ?? '')
        const focusable = target?.matches('input, select, textarea, button, a[href]')
          ? target
          : target?.querySelector<HTMLElement>('input, select, textarea, button, a[href]')
        focusable?.focus()
      })
      return
    }
    if (step === 'review') {
      const all = validateAllApplicationSteps(draft)
      const firstIncomplete = applicationSteps.find((item) => Object.keys(all[item]).length > 0)
      if (firstIncomplete && firstIncomplete !== 'review') { navigatePortal(`/mp/ll/application/${firstIncomplete}`); return }
      const submitted = { ...draft, submittedAt: new Date().toISOString() }
      saveApplicationDraft(submitted)
      setDraft(submitted)
      onSubmitted(submitted)
      return
    }
    navigatePortal(`/mp/ll/application/${applicationSteps[index + 1]}`)
  }
  const backHref = index === 0 ? '/mp/ll/start' : `/mp/ll/application/${applicationSteps[index - 1]}`
  return (
    <>
      <nav className="breadcrumbs" aria-label={local(language, 'Breadcrumb', 'स्थान पथ')}>
        <ol>
          <li><FlowLink href="/mp/services">{local(language, 'Services', 'सेवाएँ')}</FlowLink></li>
          <li><FlowLink href="/mp/ll/start">{local(language, 'Learner’s Licence', 'लर्नर लाइसेंस')}</FlowLink></li>
          <li><span aria-current="page">{pageCopy.label}</span></li>
        </ol>
      </nav>

      <section className="page-title application-title">
        <div>
          <p className="eyebrow application-eyebrow">
            {local(language, 'Application', 'आवेदन')} · {draft.applicationId}
          </p>
          <h1 tabIndex={-1}>{pageCopy.title}</h1>
          <p className="page-subtitle">{pageCopy.description}</p>
        </div>
        <span className="saved-indicator">
          <Check size={16} aria-hidden="true" /> {local(language, 'Saved automatically', 'अपने-आप सहेजा गया')}
        </span>
      </section>

      <div className="application-layout">
        <ApplicationProgress step={step} draft={draft} language={language} />
        <form className="application-form" onSubmit={submit} noValidate>
          <ErrorSummary errors={errors} language={language} />
          <StepContent step={step} draft={draft} setDraft={setDraft} errors={errors} language={language} />
          <div className="form-actions">
            <FlowLink href={backHref} className="button button--secondary">
              <ArrowLeft size={18} /> {local(language, 'Back', 'पीछे')}
            </FlowLink>
            <button type="submit" className="button button--primary">
              {step === 'review' ? local(language, 'Submit application', 'आवेदन जमा करें') : local(language, 'Save and continue', 'सहेजें और आगे बढ़ें')} <ArrowRight size={18} />
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

export function SubmittedPage({ onContinue, language }: { onContinue: (draft: LLApplicationDraft) => void; language: AppLanguage }) {
  const draft = useMemo(() => loadApplicationDraft() ?? createEmptyDraft('MP-LL-UNKNOWN'), [])
  return (
    <>
      <nav className="breadcrumbs" aria-label={local(language, 'Breadcrumb', 'स्थान पथ')}>
        <ol>
          <li><FlowLink href="/mp/services">{local(language, 'Services', 'सेवाएँ')}</FlowLink></li>
          <li><span aria-current="page">{local(language, 'Application saved', 'आवेदन सहेजा गया')}</span></li>
        </ol>
      </nav>
      <section className="submission-card">
        <span className="submission-card__icon"><BadgeCheck size={34} /></span>
        <p className="eyebrow">{local(language, 'Application saved', 'आवेदन सहेजा गया')}</p>
        <h1 tabIndex={-1}>{local(language, 'Your application has been saved', 'आपका आवेदन सहेज लिया गया है')}</h1>
        <p>{local(language, 'Keep this application number. Use it to check progress or continue later.', 'यह आवेदन संख्या सुरक्षित रखें। इससे प्रगति देख सकते हैं या बाद में जारी रख सकते हैं।')}</p>
        <dl>
          <div><dt>{local(language, 'Application number', 'आवेदन संख्या')}</dt><dd>{draft.applicationId}</dd></div>
          <div><dt>{local(language, 'Applicant', 'आवेदक')}</dt><dd>{[draft.firstName, draft.lastName].filter(Boolean).join(' ') || local(language, 'Sample applicant', 'नमूना आवेदक')}</dd></div>
          <div><dt>{local(language, 'Submitted', 'सहेजने का समय')}</dt><dd>{draft.submittedAt ? new Date(draft.submittedAt).toLocaleString(language === 'en' ? 'en-IN' : 'hi-IN') : local(language, 'Saved now', 'अभी सहेजा गया')}</dd></div>
          <div><dt>{local(language, 'Next stage', 'अगला चरण')}</dt><dd>{local(language, 'Documents, photo and signature', 'दस्तावेज़, फोटो और हस्ताक्षर')}</dd></div>
        </dl>
        <div className="submission-actions">
          <button className="button button--primary" onClick={() => onContinue(draft)}>
            {local(language, 'Add documents and photo', 'दस्तावेज़ और फोटो जोड़ें')} <ArrowRight size={18} />
          </button>
          <FlowLink href={`/mp/application/${draft.applicationId}`} className="button button--secondary">
            {local(language, 'Check application status', 'आवेदन स्थिति देखें')}
          </FlowLink>
        </div>
        <div className="privacy-note">
          <ShieldCheck size={19} />
          <span>
            <strong>{local(language, 'Keep this reference', 'यह नंबर सुरक्षित रखें')}</strong>
            <small>{local(language, 'You can reopen this saved demo application after refreshing the browser.', 'ब्राउज़र रिफ्रेश करने के बाद भी यह डेमो आवेदन फिर खोला जा सकता है।')}</small>
          </span>
        </div>
      </section>
    </>
  )
}

export function UploadsPage({ applicationId, onComplete, language }: { applicationId: string; onComplete: (draft: LLApplicationDraft) => void; language: AppLanguage }) {
  const [draft, setDraft] = useState<LLApplicationDraft>(() => loadApplicationDraft(applicationId) ?? createEmptyDraft(applicationId))
  const update = (patch: Partial<LLApplicationDraft>) => { const next = { ...draft, ...patch }; setDraft(next); saveApplicationDraft(next) }
  const complete = draft.documentsUploaded && draft.photoUploaded && draft.signatureUploaded
  return (
    <>
      <nav className="breadcrumbs" aria-label={local(language, 'Breadcrumb', 'स्थान पथ')}>
        <ol>
          <li><FlowLink href="/mp/services">{local(language, 'Services', 'सेवाएँ')}</FlowLink></li>
          <li><FlowLink href={`/mp/application/${applicationId}`}>{local(language, 'Application status', 'आवेदन स्थिति')}</FlowLink></li>
          <li><span aria-current="page">{local(language, 'Uploads', 'अपलोड')}</span></li>
        </ol>
      </nav>
      <section className="page-title">
        <div>
          <p className="eyebrow">{local(language, 'Application', 'आवेदन')} · {applicationId}</p>
          <h1 tabIndex={-1}>{local(language, 'Documents, photo and signature', 'दस्तावेज़, फोटो और हस्ताक्षर')}</h1>
          <p>{local(language, 'Check all three items before you continue.', 'आगे बढ़ने से पहले तीनों चीजें जाँचें।')}</p>
        </div>
        <span className="progress-count">{[draft.documentsUploaded, draft.photoUploaded, draft.signatureUploaded].filter(Boolean).length} / 3 {local(language, 'ready', 'तैयार')}</span>
      </section>
      <div className="upload-grid upload-grid--three">
        <UploadCard
          language={language}
          kind="document"
          title={local(language, 'Address and age document', 'पता और आयु दस्तावेज़')}
          description={local(language, 'Demo document for the identity option you selected.', 'आपके चुने पहचान विकल्प के लिए डेमो दस्तावेज़।')}
          complete={draft.documentsUploaded}
          onUse={() => update({ documentsUploaded: true })}
          onReplace={() => update({ documentsUploaded: false })}
        />
        <UploadCard
          language={language}
          kind="photo"
          title={local(language, 'Applicant photo', 'आवेदक का फोटो')}
          description={local(language, 'Demo front-facing photo with a plain background.', 'सादे बैकग्राउंड वाला सामने से लिया डेमो फोटो।')}
          complete={draft.photoUploaded}
          onUse={() => update({ photoUploaded: true })}
          onReplace={() => update({ photoUploaded: false })}
        />
        <UploadCard
          language={language}
          kind="signature"
          title={local(language, 'Applicant signature', 'आवेदक के हस्ताक्षर')}
          description={local(language, 'Demo signature on a plain light background.', 'सादे हल्के बैकग्राउंड पर डेमो हस्ताक्षर।')}
          complete={draft.signatureUploaded}
          onUse={() => update({ signatureUploaded: true })}
          onReplace={() => update({ signatureUploaded: false })}
        />
      </div>
      <section className="upload-guidance">
        <Upload size={22} />
        <div>
          <strong>{local(language, 'Check each item before saving.', 'सहेजने से पहले हर चीज जाँचें।')}</strong>
          <p>{local(language, 'This demo uses sample files. Do not upload real identity documents.', 'इस डेमो में नमूना फाइलें हैं। वास्तविक पहचान दस्तावेज़ अपलोड न करें।')}</p>
        </div>
      </section>
      <div className="form-actions">
        <FlowLink href={`/mp/application/${applicationId}`} className="button button--secondary">
          <ArrowLeft size={18} /> {local(language, 'Application status', 'आवेदन स्थिति')}
        </FlowLink>
        <button className="button button--primary" disabled={!complete} onClick={() => onComplete(draft)}>
          {local(language, 'Confirm all uploads', 'सभी अपलोड की पुष्टि करें')} <ArrowRight size={18} />
        </button>
      </div>
    </>
  )
}

function UploadCard({ title, description, complete, kind, language, onUse, onReplace }: { title: string; description: string; complete: boolean; kind: 'document' | 'photo' | 'signature'; language: AppLanguage; onUse: () => void; onReplace: () => void }) {
  return (
    <article className={`upload-card ${complete ? 'upload-card--complete' : ''}`}>
      <div className="synthetic-preview" aria-hidden="true">
        {kind === 'photo' ? <UserRoundCheck size={38} /> : kind === 'document' ? <FileText size={36} /> : <span>AV</span>}
      </div>
      <div>
        <span className="status-pill"><span /> {local(language, 'Demo sample', 'डेमो नमूना')}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {complete ? (
        <div className="upload-card__saved">
          <div className="upload-complete"><CheckCircle2 size={19} /> {local(language, 'Preview checked and saved', 'पूर्वावलोकन जाँचकर सहेजा गया')}</div>
          <button type="button" className="text-button" onClick={onReplace}>{local(language, 'Replace', 'बदलें')}</button>
        </div>
      ) : (
        <button type="button" className="button button--secondary" onClick={onUse}>{local(language, 'Preview sample', 'नमूना देखें')}</button>
      )}
    </article>
  )
}
