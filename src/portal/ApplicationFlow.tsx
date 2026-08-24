import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  FileCheck2,
  FileText,
  HelpCircle,
  Info,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRoundCheck,
  X,
} from 'lucide-react'
import {
  applicationSteps,
  createEmptyDraft,
  fitnessQuestions,
  loadApplicationDraft,
  saveApplicationDraft,
  validateAllApplicationSteps,
  validateApplicationStep,
  type ApplicationStep,
  type FieldErrors,
  type FitnessAnswer,
  type LLApplicationDraft,
} from './application'
import { navigatePortal } from './router'

type AppLanguage = 'en' | 'hi'
const local = (language: AppLanguage, en: string, hi: string) => (language === 'en' ? en : hi)

const stepCopy: Record<ApplicationStep, { label: string; title: string; description: string }> = {
  category: {
    label: 'Applicant category',
    title: 'Tell us which situation applies',
    description: 'Select your current licence status to configure application requirements.',
  },
  identity: {
    label: 'Identity method',
    title: 'Choose how to verify your identity',
    description: 'Select Aadhaar e-KYC for instant contactless verification, or the physical document route.',
  },
  personal: {
    label: 'Applicant details',
    title: 'Your personal details',
    description: 'Enter demo applicant information. Do not use real personal data.',
  },
  address: {
    label: 'Address',
    title: 'Present and permanent address',
    description: 'Enter your residential address and stay duration in Madhya Pradesh.',
  },
  vehicles: {
    label: 'Vehicle classes',
    title: 'Choose the vehicles you want to learn',
    description: 'Select the vehicle categories you want to include in your Learner’s Licence.',
  },
  fitness: {
    label: 'Form 1',
    title: 'Form 1 physical fitness declaration',
    description: 'Answer every health question honestly. Medical review may be required if applicable.',
  },
  review: {
    label: 'Review',
    title: 'Review and submit application',
    description: 'Verify your entered information, make any necessary edits, and submit.',
  },
}

const stepCopyHi: Record<ApplicationStep, { label: string; title: string; description: string }> = {
  category: {
    label: 'आवेदक श्रेणी',
    title: 'अपने लिए सही स्थिति चुनें',
    description: 'आवेदन की आवश्यकताएं तय करने के लिए अपनी वर्तमान लाइसेंस स्थिति चुनें।',
  },
  identity: {
    label: 'पहचान का तरीका',
    title: 'पहचान सत्यापन का तरीका चुनें',
    description: 'त्वरित संपर्क-रहित सत्यापन के लिए आधार e-KYC या दस्तावेज़ अपलोड मार्ग चुनें।',
  },
  personal: {
    label: 'व्यक्तिगत जानकारी',
    title: 'आपकी व्यक्तिगत जानकारी',
    description: 'डेमो आवेदक की जानकारी भरें। वास्तविक निजी डेटा दर्ज न करें।',
  },
  address: {
    label: 'पता विवरण',
    title: 'वर्तमान और स्थायी पता',
    description: 'मध्य प्रदेश में अपना निवास पता और रहने की अवधि दर्ज करें।',
  },
  vehicles: {
    label: 'वाहन वर्ग',
    title: 'वह वाहन चुनें जिसे आप सीखना चाहते हैं',
    description: 'अपने लर्नर लाइसेंस के लिए उपयुक्त वाहन श्रेणियाँ चुनें।',
  },
  fitness: {
    label: 'फॉर्म 1',
    title: 'फॉर्म 1 शारीरिक फिटनेस स्व-घोषणा',
    description: 'सभी स्वास्थ्य प्रश्नों का ईमानदारी से उत्तर दें। आवश्यकता पड़ने पर चिकित्सकीय समीक्षा होगी।',
  },
  review: {
    label: 'समीक्षा',
    title: 'आवेदन की समीक्षा और जमा करें',
    description: 'दर्ज जानकारी की जाँच करें, आवश्यकतानुसार सुधार करें और जमा करें।',
  },
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
  return (
    <a
      href={href}
      className={className}
      onClick={(event) => {
        event.preventDefault()
        navigatePortal(href)
      }}
    >
      {children}
    </a>
  )
}

function Field({
  id,
  label,
  helper,
  error,
  required,
  optionalBadge,
  children,
}: {
  id: string
  label: string
  helper?: string
  error?: string
  required?: boolean
  optionalBadge?: string
  children: ReactNode
}) {
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
  return (
    <section className="error-summary" role="alert" aria-labelledby="error-summary-title">
      <strong id="error-summary-title">
        {local(
          language,
          `Please review and correct ${entries.length} item${entries.length === 1 ? '' : 's'} before continuing`,
          `आगे बढ़ने से पहले ${entries.length} त्रुटि ठीक करें`
        )}
      </strong>
      <ul>
        {entries.map(([field, message]) => (
          <li key={field}>
            <a href={`#${field.replaceAll('.', '-')}`}>
              {language === 'hi' ? validationHi[message] ?? message : message}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

function ApplicationProgress({
  step,
  draft,
  language,
}: {
  step: ApplicationStep
  draft: LLApplicationDraft
  language: AppLanguage
}) {
  const current = applicationSteps.indexOf(step)
  const labels = language === 'en' ? stepCopy : stepCopyHi
  const renderSteps = () =>
    applicationSteps.map((item, index) => {
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
              <small>
                {index === current
                  ? local(language, 'In progress', 'जारी है')
                  : valid
                  ? local(language, 'Saved', 'सहेजा गया')
                  : local(language, 'Not complete', 'अधूरा')}
              </small>
            </div>
          </FlowLink>
        </li>
      )
    })
  return (
    <aside className="application-progress" aria-label={local(language, 'Application progress', 'आवेदन की प्रगति')}>
      <div className="application-progress__summary">
        <p className="eyebrow">{local(language, 'Application Progress', 'आवेदन की प्रगति')}</p>
        <strong>
          {local(
            language,
            `Step ${current + 1} of ${applicationSteps.length}`,
            `${applicationSteps.length} में से चरण ${current + 1}`
          )}
        </strong>
        <div
          className="application-progress__bar"
          role="progressbar"
          aria-valuenow={current + 1}
          aria-valuemin={1}
          aria-valuemax={applicationSteps.length}
        >
          <div
            className="application-progress__bar-fill"
            style={{ width: `${((current + 1) / applicationSteps.length) * 100}%` }}
          />
        </div>
      </div>
      <ol className="application-progress__desktop">{renderSteps()}</ol>
      <details className="application-progress__compact">
        <summary>
          <span>
            {local(
              language,
              `Step ${current + 1} of 7 · ${labels[step].label}`,
              `चरण ${current + 1}/7 · ${labels[step].label}`
            )}
          </span>
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

function TextInput({
  field,
  label,
  draft,
  setDraft,
  errors,
  type = 'text',
  required,
  helper,
  inputMode,
  autoComplete,
  placeholder,
}: {
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
  placeholder?: string
}) {
  const id = String(field)
  return (
    <Field id={id} label={label} required={required} helper={helper} error={errors[id]}>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={String(draft[field])}
        aria-describedby={
          [helper ? `${id}-help` : '', errors[id] ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined
        }
        aria-invalid={Boolean(errors[id])}
        onChange={(event) => setDraft({ ...draft, [field]: event.target.value })}
      />
    </Field>
  )
}

function AddressFields({
  prefix,
  title,
  value,
  onChange,
  errors,
  language,
}: {
  prefix: 'presentAddress' | 'permanentAddress'
  title: string
  value: LLApplicationDraft['presentAddress']
  onChange: (value: LLApplicationDraft['presentAddress']) => void
  errors: FieldErrors
  language: AppLanguage
}) {
  const addressField = (
    key: keyof typeof value,
    label: string,
    required = false,
    inputMode?: 'numeric',
    placeholder?: string
  ) => {
    const errorKey = `${prefix}.${key}`
    const id = `${prefix}-${key}`
    return (
      <Field id={id} label={label} required={required} error={errors[errorKey]}>
        <input
          id={id}
          inputMode={inputMode}
          placeholder={placeholder}
          value={value[key]}
          aria-invalid={Boolean(errors[errorKey])}
          aria-describedby={errors[errorKey] ? `${id}-error` : undefined}
          onChange={(event) => onChange({ ...value, [key]: event.target.value })}
        />
      </Field>
    )
  }

  const mpDistricts = [
    'Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Rewa', 'Satna',
    'Chhindwara', 'Dewas', 'Ratlam', 'Shivpuri', 'Khandwa', 'Khargone', 'Sehore', 'Vidisha',
  ]

  return (
    <fieldset className="form-section">
      <legend>{title}</legend>
      <div className="form-grid form-grid--address">
        <div className="form-grid__col-1">
          {addressField('house', local(language, 'House / Flat / Door No.', 'मकान / फ्लैट नंबर'), true, undefined, 'e.g. Flat 402, Block B')}
        </div>
        <div className="form-grid__col-2">
          {addressField('street', local(language, 'Street / Area / Locality', 'सड़क / मोहल्ला / क्षेत्र'), false, undefined, 'e.g. Dhanvantri Nagar, Main Road')}
        </div>
        <div className="form-grid__col-1">
          {addressField('locality', local(language, 'Village / Town / City', 'गाँव / शहर / कस्बा'), true, undefined, 'e.g. Jabalpur')}
        </div>
        <div className="form-grid__col-1">
          <div className={`form-field ${errors[`${prefix}.district`] ? 'form-field--error' : ''}`}>
            <label htmlFor={`${prefix}-district`}>
              {local(language, 'District', 'ज़िला')}
              <span className="required-mark" aria-hidden="true"> *</span>
            </label>
            <div className="formal-select-wrap">
              <select
                id={`${prefix}-district`}
                value={value.district}
                onChange={(e) => onChange({ ...value, district: e.target.value })}
              >
                <option value="">{local(language, 'Select District', 'ज़िला चुनें')}</option>
                {mpDistricts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <ChevronDown size={17} className="formal-select-chevron" aria-hidden="true" />
            </div>
            {errors[`${prefix}.district`] && (
              <small className="field-error" role="alert">{errors[`${prefix}.district`]}</small>
            )}
          </div>
        </div>
        <div className="form-grid__col-1">
          {addressField('pin', local(language, 'PIN Code', 'पिन कोड'), true, 'numeric', 'e.g. 482003')}
        </div>
      </div>
    </fieldset>
  )
}

function CategoryStep({ draft, setDraft, errors, language }: StepProps) {
  const [showWhy, setShowWhy] = useState(false)
  const choices = [
    {
      value: 'no-licence',
      title: local(language, 'I do not hold an Indian Driving Licence or Learner’s Licence', 'मेरे पास भारतीय ड्राइविंग या लर्नर लाइसेंस नहीं है'),
      tag: local(language, 'First-Time Applicant', 'प्रथम बार आवेदक'),
      detail: local(language, 'Applying for a fresh Learner’s Licence for motorcycle, scooter, or light motor vehicle.', 'मोटरसाइकिल, स्कूटर या कार के लिए नए लर्नर लाइसेंस का आवेदन।'),
    },
    {
      value: 'holds-driving-licence',
      title: local(language, 'I hold an Indian Driving Licence', 'मेरे पास भारतीय ड्राइविंग लाइसेंस है'),
      tag: local(language, 'Adding Vehicle Class', 'वाहन वर्ग जोड़ना'),
      detail: local(language, 'Existing DL holders applying to add an additional vehicle class (e.g. adding LMV to MCWG).', 'मौजूदा DL धारक जो नया वाहन वर्ग जोड़ना चाहते हैं।'),
    },
    {
      value: 'holds-learner-licence',
      title: local(language, 'I hold an Indian Learner’s Licence', 'मेरे पास भारतीय लर्नर लाइसेंस है'),
      tag: local(language, 'Renewal / Extension', 'नवीनीकरण / विस्तार'),
      detail: local(language, 'Holders of an existing or expired Learner’s Licence seeking renewal or re-test.', 'मौजूदा या समाप्त हो चुके लर्नर लाइसेंस के नवीनीकरण के लिए।'),
    },
  ] as const

  const categoryError =
    language === 'hi' && errors.applicantCategory
      ? validationHi[errors.applicantCategory] ?? errors.applicantCategory
      : errors.applicantCategory

  return (
    <div className="form-content-wrap">
      <fieldset
        className={`choice-fieldset ${errors.applicantCategory ? 'choice-fieldset--error' : ''}`}
        id="applicantCategory"
      >
        <div className="form-question-header">
          <div>
            <legend className="form-question-title">
              {local(language, 'Which situation applies to you?', 'आपके लिए कौन सी स्थिति लागू होती है?')}
              <span className="required-mark" aria-hidden="true"> *</span>
            </legend>
            <p className="form-question-sub">
              {local(language, 'This sets up the required prerequisites and verification steps.', 'यह आवश्यक शर्तें और सत्यापन के चरण निर्धारित करता है।')}
            </p>
          </div>
          <button
            type="button"
            className="quiet-help-link"
            onClick={() => setShowWhy(!showWhy)}
            aria-expanded={showWhy}
          >
            <HelpCircle size={15} />
            <span>{local(language, 'Why this matters', 'यह क्यों आवश्यक है')}</span>
          </button>
        </div>

        {showWhy && (
          <div className="quiet-help-box" role="region">
            <Info size={16} />
            <p>
              {local(
                language,
                'First-time applicants undergo the standard 7-step contactless application. If you already hold a licence, LicenceFlow verifies your existing record to avoid duplicate identity checks.',
                'पहली बार आवेदन करने वाले मानक 7-चरणों की प्रक्रिया से गुजरते हैं। यदि आपके पास पहले से लाइसेंस है, तो डुप्लिकेट जांच से बचने के लिए पिछला रिकॉर्ड सत्यापित किया जाता है।'
              )}
            </p>
          </div>
        )}

        <div className="interactive-card-stack">
          {choices.map((choice) => {
            const isSelected = draft.applicantCategory === choice.value
            return (
              <label
                key={choice.value}
                className={`interactive-choice-card ${isSelected ? 'interactive-choice-card--selected' : ''}`}
              >
                <div className="interactive-choice-card__radio">
                  <input
                    type="radio"
                    name="applicantCategory"
                    value={choice.value}
                    checked={isSelected}
                    onChange={() => setDraft({ ...draft, applicantCategory: choice.value })}
                  />
                </div>
                <div className="interactive-choice-card__content">
                  <div className="interactive-choice-card__header">
                    <strong>{choice.title}</strong>
                    <span className="interactive-choice-card__tag">{choice.tag}</span>
                  </div>
                  <p>{choice.detail}</p>
                </div>
              </label>
            )
          })}
        </div>
        {categoryError && <small className="field-error" role="alert">{categoryError}</small>}
      </fieldset>

      {draft.applicantCategory && draft.applicantCategory !== 'no-licence' && (
        <div className="conditional-field-panel">
          <Field
            id="existingLicenceNumber"
            label={
              draft.applicantCategory === 'holds-driving-licence'
                ? local(language, 'Existing Driving Licence Number', 'मौजूदा ड्राइविंग लाइसेंस संख्या')
                : local(language, 'Existing Learner’s Licence Number', 'मौजूदा लर्नर लाइसेंस संख्या')
            }
            required
            error={errors.existingLicenceNumber}
            helper={local(language, 'Example format: MP-04-2023-0012345 (Enter demo value for prototype)', 'उदा. प्रारूप: MP-04-2023-0012345 (डेमो मान दर्ज करें)')}
          >
            <input
              id="existingLicenceNumber"
              placeholder="MP-04-2023-0012345"
              value={draft.existingLicenceNumber}
              onChange={(event) =>
                setDraft({ ...draft, existingLicenceNumber: event.target.value.toUpperCase() })
              }
            />
          </Field>
        </div>
      )}

      <div className="secondary-form-section">
        <fieldset className="special-category-fieldset" id="specialCategory">
          <div className="special-category-header">
            <legend className="special-category-label">
              {local(language, 'Special category', 'विशेष श्रेणी')}
            </legend>
            <span className="optional-badge">{local(language, 'Optional', 'वैकल्पिक')}</span>
          </div>
          <div
            className="special-category-pills"
            role="radiogroup"
            aria-label={local(language, 'Special category', 'विशेष श्रेणी')}
          >
            {(
              [
                ['none', local(language, 'None (General)', 'सामान्य (कोई नहीं)')],
                ['diplomat', local(language, 'Diplomat', 'राजनयिक')],
                ['refugee', local(language, 'Refugee', 'शरणार्थी')],
                ['repatriate', local(language, 'Repatriate', 'स्वदेश लौटे')],
                ['ex-serviceman', local(language, 'Ex-serviceman', 'भूतपूर्व सैनिक')],
              ] as const
            ).map(([val, label]) => {
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
                    onChange={() =>
                      setDraft({
                        ...draft,
                        specialCategory: val as LLApplicationDraft['specialCategory'],
                      })
                    }
                    className="visually-hidden"
                  />
                  <span>{label}</span>
                </label>
              )
            })}
          </div>
          <small className="field-helper">
            {local(language, 'Select only if you qualify under quota or institutional exemptions.', 'केवल तभी चुनें जब आप विशेष श्रेणी या छूट के पात्र हों।')}
          </small>
        </fieldset>
      </div>
    </div>
  )
}

function IdentityStep({ draft, setDraft, errors, language }: StepProps) {
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [showWhy, setShowWhy] = useState(false)

  const chooseRoute = (identityRoute: LLApplicationDraft['identityRoute']) =>
    setDraft({ ...draft, identityRoute, identityOtpSent: false, identityVerified: false })

  const verifyOtp = () => {
    if (otp !== '246810') {
      setOtpError(local(language, 'Enter the 6-digit demo OTP code (246810).', 'ऊपर दिया 6 अंकों का कोड (246810) दर्ज करें।'))
      return
    }
    setOtpError('')
    setDraft({ ...draft, identityVerified: true })
  }

  return (
    <div className="form-content-wrap">
      <div className="formal-security-strip">
        <ShieldCheck size={18} />
        <div>
          <strong>{local(language, 'Confidential & Secure Identity Route', 'गोपनीय और सुरक्षित पहचान मार्ग')}</strong>
          <p>
            {local(
              language,
              'This is an interactive simulation of Sarathi e-KYC. Real Aadhaar numbers or biometrics are never requested.',
              'यह सारथी e-KYC का इंटरैक्टिव सिमुलेशन है। कोई वास्तविक आधार नंबर या बायोमेट्रिक डेटा नहीं मांगा जाता।'
            )}
          </p>
        </div>
      </div>

      <fieldset
        className={`choice-fieldset ${errors.identityRoute ? 'choice-fieldset--error' : ''}`}
        id="identityRoute"
      >
        <div className="form-question-header">
          <div>
            <legend className="form-question-title">
              {local(language, 'Choose your verification method', 'पहचान सत्यापन का तरीका चुनें')}
              <span className="required-mark" aria-hidden="true"> *</span>
            </legend>
            <p className="form-question-sub">
              {local(language, 'Choose how your identity and residence will be authenticated.', 'तय करें कि आपकी पहचान और पते का सत्यापन कैसे होगा।')}
            </p>
          </div>
          <button
            type="button"
            className="quiet-help-link"
            onClick={() => setShowWhy(!showWhy)}
            aria-expanded={showWhy}
          >
            <HelpCircle size={15} />
            <span>{local(language, 'Compare routes', 'मार्गों की तुलना')}</span>
          </button>
        </div>

        {showWhy && (
          <div className="quiet-help-box" role="region">
            <Info size={16} />
            <p>
              {local(
                language,
                'Aadhaar e-KYC verifies your name, date of birth, and MP address automatically via OTP with zero paperwork. The Document route requires manual uploading of proof of age and address followed by RTO verification.',
                'आधार e-KYC बिना किसी कागजी कार्रवाई के OTP के जरिए आपका नाम, जन्मतिथि और पता सत्यापित करता है। दस्तावेज़ मार्ग में आयु और पते के प्रमाण को अपलोड करना होता है।'
              )}
            </p>
          </div>
        )}

        <div className="visual-identity-grid">
          {/* 1. Aadhaar e-KYC Route */}
          <label
            className={`visual-identity-card ${draft.identityRoute === 'aadhaar-ekyc' ? 'visual-identity-card--selected' : ''}`}
          >
            <div className="visual-identity-card__top">
              <span className="visual-identity-card__badge visual-identity-card__badge--recommended">
                <Sparkles size={12} />
                {local(language, 'Recommended · Instant', 'अनुशंसित · त्वरित')}
              </span>
              <input
                type="radio"
                name="identityRoute"
                value="aadhaar-ekyc"
                checked={draft.identityRoute === 'aadhaar-ekyc'}
                onChange={() => chooseRoute('aadhaar-ekyc')}
              />
            </div>
            <div className="visual-identity-card__image-wrap">
              <img
                src="/assets/identity-aadhaar.png"
                alt="Aadhaar e-KYC verification"
                className="visual-identity-card__img"
              />
            </div>
            <div className="visual-identity-card__body">
              <h3>{local(language, 'Demo Aadhaar e-KYC', 'डेमो आधार e-KYC')}</h3>
              <p>
                {local(
                  language,
                  'Fastest contactless route. Instant demo OTP verification with sample citizen profile.',
                  'सबसे तेज़ संपर्क-रहित मार्ग। डेमो OTP और नमूना नागरिक प्रोफ़ाइल के साथ त्वरित सत्यापन।'
                )}
              </p>
            </div>
          </label>

          {/* 2. Document Upload Route */}
          <label
            className={`visual-identity-card ${draft.identityRoute === 'documents' ? 'visual-identity-card--selected' : ''}`}
          >
            <div className="visual-identity-card__top">
              <span className="visual-identity-card__badge">
                {local(language, 'Document Upload', 'दस्तावेज़ अपलोड')}
              </span>
              <input
                type="radio"
                name="identityRoute"
                value="documents"
                checked={draft.identityRoute === 'documents'}
                onChange={() => chooseRoute('documents')}
              />
            </div>
            <div className="visual-identity-card__image-wrap">
              <img
                src="/assets/identity-docs.png"
                alt="Physical document route"
                className="visual-identity-card__img"
              />
            </div>
            <div className="visual-identity-card__body">
              <h3>{local(language, 'Without Aadhaar', 'बिना आधार (दस्तावेज़)')}</h3>
              <p>
                {local(
                  language,
                  'Fill details manually and upload synthetic age and address proofs for RTO verification.',
                  'जानकारी स्वयं भरें और आरटीओ सत्यापन के लिए आयु व पते के प्रमाण अपलोड करें।'
                )}
              </p>
            </div>
          </label>
        </div>

        {errors.identityRoute && (
          <small className="field-error" role="alert">
            {language === 'hi' ? validationHi[errors.identityRoute] ?? errors.identityRoute : errors.identityRoute}
          </small>
        )}
      </fieldset>

      {draft.identityRoute && (
        <label className={`consent-checkbox-card ${errors.identityConsent ? 'consent-checkbox-card--error' : ''}`} id="identityConsent">
          <input
            type="checkbox"
            checked={draft.identityConsent}
            onChange={(event) =>
              setDraft({
                ...draft,
                identityConsent: event.target.checked,
                identityOtpSent: event.target.checked ? draft.identityOtpSent : false,
                identityVerified: event.target.checked ? draft.identityVerified : false,
              })
            }
          />
          <div className="consent-checkbox-card__text">
            <strong>{local(language, 'I consent to use this identity verification method.', 'मैं इस पहचान सत्यापन तरीके का उपयोग करने की सहमति देता/देती हूँ।')}</strong>
            <small>
              {local(
                language,
                'In this simulation, synthetic records are generated locally on your device.',
                'इस सिमुलेशन में, आपके डिवाइस पर स्थानीय रूप से डेमो रिकॉर्ड तैयार किए जाते हैं।'
              )}
            </small>
            {errors.identityConsent && (
              <span className="field-error" role="alert">
                {language === 'hi' ? validationHi[errors.identityConsent] ?? errors.identityConsent : errors.identityConsent}
              </span>
            )}
          </div>
        </label>
      )}

      {/* Aadhaar e-KYC OTP flow */}
      {draft.identityRoute === 'aadhaar-ekyc' && draft.identityConsent && (
        <section className="interactive-otp-panel" id="identityVerified" aria-labelledby="otp-title">
          <div className="interactive-otp-panel__header">
            <div>
              <p className="eyebrow">{local(language, 'e-KYC Mobile Verification', 'e-KYC मोबाइल सत्यापन')}</p>
              <h2 id="otp-title">{local(language, 'Verify demonstration OTP', 'डेमो OTP सत्यापित करें')}</h2>
            </div>
            {draft.identityVerified && (
              <span className="verified-badge">
                <CheckCircle2 size={16} /> {local(language, 'Verified', 'सत्यापित')}
              </span>
            )}
          </div>

          {!draft.identityOtpSent ? (
            <div className="otp-init-box">
              <p>
                {local(
                  language,
                  'Click below to generate a synthetic OTP for demo applicant mobile ending in ···0042.',
                  '···0042 पर समाप्त होने वाले डेमो मोबाइल पर OTP कोड प्राप्त करने के लिए नीचे क्लिक करें।'
                )}
              </p>
              <button
                type="button"
                className="button button--primary"
                onClick={() => setDraft({ ...draft, identityOtpSent: true })}
              >
                {local(language, 'Send Demo OTP Code', 'डेमो OTP भेजें')} <ArrowRight size={16} />
              </button>
            </div>
          ) : draft.identityVerified ? (
            <div className="otp-success-banner">
              <CheckCircle2 size={24} className="otp-success-banner__icon" />
              <div>
                <strong>{local(language, 'Identity successfully authenticated', 'पहचान सफलतापूर्वक सत्यापित')}</strong>
                <p>{local(language, 'Demo citizen profile loaded: Name, Date of Birth & Address populated.', 'डेमो नागरिक प्रोफ़ाइल लोड हो गई: नाम, जन्मतिथि और पता भर दिया गया है।')}</p>
              </div>
            </div>
          ) : (
            <div className="otp-active-box">
              <div className="demo-code-pill" onClick={() => setOtp('246810')} role="button" tabIndex={0}>
                <div>
                  <small>{local(language, 'Demo Code Available', 'उपलब्ध डेमो कोड')}</small>
                  <strong>246810</strong>
                </div>
                <span className="demo-code-pill__hint">{local(language, 'Click to autofill', 'भरने के लिए क्लिक करें')}</span>
              </div>

              <div className="otp-input-row">
                <label htmlFor="identity-otp" className="visually-hidden">
                  {local(language, 'Enter 6-digit OTP', '6 अंकों का OTP दर्ज करें')}
                </label>
                <input
                  id="identity-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="246810"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
                  aria-invalid={Boolean(otpError)}
                />
                <button type="button" className="button button--primary" onClick={verifyOtp}>
                  {local(language, 'Verify & Proceed', 'सत्यापित करें')} <ArrowRight size={16} />
                </button>
              </div>
              {otpError && <small className="field-error" role="alert">{otpError}</small>}
            </div>
          )}
          {errors.identityVerified && !draft.identityVerified && (
            <small className="field-error" role="alert">
              {local(language, 'Please complete demo OTP verification to continue.', 'आगे बढ़ने के लिए कृपया डेमो OTP सत्यापन पूरा करें।')}
            </small>
          )}
        </section>
      )}

      {/* Document Route Info */}
      {draft.identityRoute === 'documents' && draft.identityConsent && (
        <div className="document-route-box">
          <FileText size={20} />
          <div>
            <strong>{local(language, 'Document route enabled', 'दस्तावेज़ मार्ग सक्षम')}</strong>
            <p>
              {local(
                language,
                'You will enter applicant and address details in the next steps, with synthetic document verification.',
                'आप अगले चरणों में आवेदक और पते का विवरण भरेंगे, जहाँ डेमो दस्तावेज़ संलग्न होंगे।'
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function PersonalStep({ draft, setDraft, errors, language }: StepProps) {
  const age = useMemo(() => {
    if (!draft.dateOfBirth) return null
    const dob = new Date(draft.dateOfBirth)
    if (isNaN(dob.getTime())) return null
    const diffMs = Date.now() - dob.getTime()
    const ageDate = new Date(diffMs)
    return Math.abs(ageDate.getUTCFullYear() - 1970)
  }, [draft.dateOfBirth])

  return (
    <div className="form-content-wrap">
      {/* 1. Name and Relation */}
      <fieldset className="form-section">
        <legend>{local(language, '1. Full name & relation', '1. पूरा नाम और संबंधी')}</legend>
        <div className="form-grid form-grid--3col">
          <TextInput
            field="firstName"
            label={local(language, 'First name', 'पहला नाम')}
            required
            draft={draft}
            setDraft={setDraft}
            errors={errors}
            autoComplete="given-name"
            placeholder="e.g. Sambhav"
          />
          <TextInput
            field="middleName"
            label={local(language, 'Middle name', 'मध्यम नाम')}
            draft={draft}
            setDraft={setDraft}
            errors={errors}
            autoComplete="additional-name"
            placeholder="e.g. Kumar"
          />
          <TextInput
            field="lastName"
            label={local(language, 'Last name', 'अंतिम नाम')}
            required
            draft={draft}
            setDraft={setDraft}
            errors={errors}
            autoComplete="family-name"
            placeholder="e.g. Jain"
          />
        </div>
        <div className="form-grid form-grid--relation">
          <div className="form-grid__col-1">
            <Field id="relationType" label={local(language, 'Relationship', 'संबंध')} required>
              <div className="formal-select-wrap">
                <select
                  id="relationType"
                  value={draft.relationType}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      relationType: event.target.value as LLApplicationDraft['relationType'],
                    })
                  }
                >
                  <option value="father">{local(language, 'Father', 'पिता')}</option>
                  <option value="mother">{local(language, 'Mother', 'माता')}</option>
                  <option value="spouse">{local(language, 'Spouse', 'पति/पत्नी')}</option>
                  <option value="guardian">{local(language, 'Guardian', 'अभिभावक')}</option>
                </select>
                <ChevronDown size={17} className="formal-select-chevron" aria-hidden="true" />
              </div>
            </Field>
          </div>
          <div className="form-grid__col-2">
            <TextInput
              field="relationName"
              label={local(language, 'Relative’s full name', 'संबंधी का पूरा नाम')}
              required
              draft={draft}
              setDraft={setDraft}
              errors={errors}
              placeholder="e.g. Ramesh Chandra Jain"
            />
          </div>
        </div>
      </fieldset>

      {/* 2. Personal & Educational Details */}
      <fieldset className="form-section">
        <legend>{local(language, '2. Personal & educational details', '2. व्यक्तिगत और शैक्षिक जानकारी')}</legend>
        <div className="form-grid form-grid--3col">
          <Field id="gender" label={local(language, 'Gender', 'लिंग')} required error={errors.gender}>
            <div className="formal-select-wrap">
              <select
                id="gender"
                value={draft.gender}
                onChange={(event) =>
                  setDraft({ ...draft, gender: event.target.value as LLApplicationDraft['gender'] })
                }
              >
                <option value="">{local(language, 'Select Gender', 'लिंग चुनें')}</option>
                <option value="male">{local(language, 'Male', 'पुरुष')}</option>
                <option value="female">{local(language, 'Female', 'महिला')}</option>
                <option value="transgender">{local(language, 'Transgender', 'ट्रांसजेंडर')}</option>
              </select>
              <ChevronDown size={17} className="formal-select-chevron" aria-hidden="true" />
            </div>
          </Field>

          <div className="dob-field-wrap">
            <TextInput
              field="dateOfBirth"
              label={local(language, 'Date of birth', 'जन्मतिथि')}
              type="date"
              required
              draft={draft}
              setDraft={setDraft}
              errors={errors}
            />
            {age !== null && (
              <span className={`age-eligibility-badge ${age >= 18 ? 'age-eligibility-badge--eligible' : 'age-eligibility-badge--restricted'}`}>
                {age >= 18
                  ? local(language, `✓ ${age} yrs · Eligible for all classes`, `✓ ${age} वर्ष · सभी वर्गों के लिए पात्र`)
                  : age >= 16
                  ? local(language, `✓ ${age} yrs · Eligible for MCWOG (50cc)`, `✓ ${age} वर्ष · बिना गियर के लिए पात्र`)
                  : local(language, `! ${age} yrs · Minimum age is 16`, `! ${age} वर्ष · न्यूनतम आयु 16 वर्ष`)}
              </span>
            )}
          </div>

          <Field id="education" label={local(language, 'Educational qualification', 'शैक्षिक योग्यता')}>
            <div className="formal-select-wrap">
              <select
                id="education"
                value={draft.education}
                onChange={(e) => setDraft({ ...draft, education: e.target.value })}
              >
                <option value="">{local(language, 'Select Qualification', 'योग्यता चुनें')}</option>
                <option value="10th">{local(language, '10th Standard / SSC', '10वीं कक्षा / एसएससी')}</option>
                <option value="12th">{local(language, '12th Standard / HSC', '12वीं कक्षा / एचएससी')}</option>
                <option value="Graduate">{local(language, 'Graduate / Degree', 'स्नातक / डिग्री')}</option>
                <option value="Postgraduate">{local(language, 'Post Graduate', 'स्नातकोत्तर')}</option>
                <option value="Below 8th">{local(language, 'Below 8th Standard', '8वीं से कम')}</option>
              </select>
              <ChevronDown size={17} className="formal-select-chevron" aria-hidden="true" />
            </div>
          </Field>
        </div>

        <div className="form-grid form-grid--2col">
          <TextInput
            field="placeOfBirth"
            label={local(language, 'Place of birth (City / District)', 'जन्म स्थान (शहर / ज़िला)')}
            draft={draft}
            setDraft={setDraft}
            errors={errors}
            placeholder="e.g. Bhopal, Madhya Pradesh"
          />
        </div>
      </fieldset>

      {/* 3. Contact & Identification */}
      <fieldset className="form-section">
        <legend>{local(language, '3. Contact & identification marks', '3. संपर्क और पहचान चिन्ह')}</legend>
        <div className="form-grid form-grid--2col">
          <TextInput
            field="mobile"
            label={local(language, 'Demo mobile number', 'डेमो मोबाइल नंबर')}
            required
            draft={draft}
            setDraft={setDraft}
            errors={errors}
            inputMode="tel"
            autoComplete="tel"
            placeholder="e.g. 7024320441"
            helper={local(language, 'Use a demo 10-digit number. No real SMS sent.', '10 अंकों का डेमो नंबर डालें। कोई असली SMS नहीं भेजा जाएगा।')}
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
            placeholder="e.g. applicant.demo@sarathi.mp.gov.in"
          />
        </div>
        <div className="form-grid form-grid--2col">
          <TextInput
            field="identificationMark1"
            label={local(language, 'Identification mark 1', 'पहचान चिन्ह 1')}
            required
            draft={draft}
            setDraft={setDraft}
            errors={errors}
            placeholder={local(language, 'e.g. Small mole on right cheek', 'उदा. दाहिने गाल पर तिल')}
          />
          <TextInput
            field="identificationMark2"
            label={local(language, 'Identification mark 2 (Optional)', 'पहचान चिन्ह 2 (वैकल्पिक)')}
            draft={draft}
            setDraft={setDraft}
            errors={errors}
            placeholder={local(language, 'e.g. Scar on left forearm', 'उदा. बायीं कलाई पर निशान')}
          />
        </div>
      </fieldset>
    </div>
  )
}

function AddressStep({ draft, setDraft, errors, language }: StepProps) {
  return (
    <div className="form-content-wrap">
      <AddressFields
        prefix="presentAddress"
        title={local(language, 'Present residential address (Madhya Pradesh)', 'वर्तमान निवास पता (मध्य प्रदेश)')}
        value={draft.presentAddress}
        errors={errors}
        language={language}
        onChange={(presentAddress) => setDraft({ ...draft, presentAddress })}
      />

      <fieldset className="form-section">
        <legend>{local(language, 'Duration of stay at present address', 'वर्तमान पते पर रहने की अवधि')}</legend>
        <div className="form-grid form-grid--duration">
          <TextInput
            field="yearsAtAddress"
            label={local(language, 'Years', 'वर्ष')}
            required
            draft={draft}
            setDraft={setDraft}
            errors={errors}
            inputMode="numeric"
            placeholder="e.g. 5"
          />
          <TextInput
            field="monthsAtAddress"
            label={local(language, 'Months', 'महीने')}
            draft={draft}
            setDraft={setDraft}
            errors={errors}
            inputMode="numeric"
            placeholder="e.g. 6"
          />
        </div>
      </fieldset>

      <label className="consent-checkbox-card">
        <input
          type="checkbox"
          checked={draft.samePermanentAddress}
          onChange={(event) => setDraft({ ...draft, samePermanentAddress: event.target.checked })}
        />
        <div className="consent-checkbox-card__text">
          <strong>{local(language, 'Permanent address is the same as present address', 'स्थायी पता वर्तमान पते के समान है')}</strong>
          <small>
            {local(
              language,
              'Uncheck if your permanent home address is in a different location.',
              'यदि आपका स्थायी गृह पता किसी अन्य स्थान पर है तो इसे अनचेक करें।'
            )}
          </small>
        </div>
      </label>

      {!draft.samePermanentAddress && (
        <AddressFields
          prefix="permanentAddress"
          title={local(language, 'Permanent address', 'स्थायी पता')}
          value={draft.permanentAddress}
          errors={errors}
          language={language}
          onChange={(permanentAddress) => setDraft({ ...draft, permanentAddress })}
        />
      )}
    </div>
  )
}

function VehiclesStep({ draft, setDraft, errors, language }: StepProps) {
  const [showCompare, setShowCompare] = useState(false)

  const toggle = (vehicle: string) =>
    setDraft({
      ...draft,
      vehicleClasses: draft.vehicleClasses.includes(vehicle)
        ? draft.vehicleClasses.filter((item) => item !== vehicle)
        : [...draft.vehicleClasses, vehicle],
    })

  const vehiclesData = [
    {
      id: 'MCWOG',
      code: 'MCWOG',
      nameEn: 'Motorcycle without gear',
      nameHi: 'बिना गियर की मोटरसाइकिल',
      categoryEn: 'Scooters & Mopeds',
      categoryHi: 'स्कूटर एवं मोपेड वर्ग',
      examplesEn: 'Honda Activa, TVS Jupiter, Suzuki Access, EV Scooters',
      examplesHi: 'होंडा एक्टिवा, टीवीएस जुपिटर, सुजुकी एक्सेस, इलेक्ट्रिक स्कूटर',
      image: '/assets/vehicle-mcwog.png',
      minAge: '16+ yrs (up to 50cc) / 18+ yrs',
    },
    {
      id: 'MCWG',
      code: 'MCWG',
      nameEn: 'Motorcycle with gear',
      nameHi: 'गियर वाली मोटरसाइकिल',
      categoryEn: 'Geared Motorcycles & Bikes',
      categoryHi: 'गियर वाली बाइक वर्ग',
      examplesEn: 'Hero Splendor, Bajaj Pulsar, Royal Enfield, Honda Shine',
      examplesHi: 'हीरो स्प्लेंडर, बजाज पल्सर, रॉयल एनफील्ड, होंडा शाइन',
      image: '/assets/vehicle-mcwg.png',
      minAge: '18+ yrs',
    },
    {
      id: 'LMV',
      code: 'LMV',
      nameEn: 'Light motor vehicle',
      nameHi: 'हल्का मोटर वाहन (LMV)',
      categoryEn: 'Cars, Jeeps & Light Taxis',
      categoryHi: 'कार, जीप व हल्के वाहन',
      examplesEn: 'Maruti Swift, WagonR, Hyundai Creta, Tata Nexon',
      examplesHi: 'मारुति स्विफ्ट, वैगनआर, क्रेटा, टाटा नेक्सॉन',
      image: '/assets/vehicle-lmv.png',
      minAge: '18+ yrs',
    },
  ]

  return (
    <div className="form-content-wrap">
      <fieldset
        className={`choice-fieldset ${errors.vehicleClasses ? 'choice-fieldset--error' : ''}`}
        id="vehicleClasses"
      >
        <div className="form-question-header">
          <div>
            <legend className="form-question-title">
              {local(language, 'Choose the vehicle you want to learn', 'वह वाहन चुनें जिसे आप सीखना चाहते हैं')}
              <span className="required-mark" aria-hidden="true"> *</span>
            </legend>
            <p className="form-question-sub">
              {local(language, 'You may select multiple classes in a single application.', 'आप एक ही आवेदन में कई वाहन वर्ग चुन सकते हैं।')}
            </p>
          </div>
          <button
            type="button"
            className="quiet-help-link"
            onClick={() => setShowCompare(!showCompare)}
            aria-expanded={showCompare}
          >
            <HelpCircle size={15} />
            <span>{local(language, 'Compare vehicle classes', 'वाहन वर्गों की तुलना')}</span>
          </button>
        </div>

        {/* Comparison Drawer / Modal */}
        {showCompare && (
          <div className="vehicle-compare-modal" role="region">
            <div className="vehicle-compare-modal__header">
              <strong>{local(language, 'Official Vehicle Class Classifications', 'आधिकारिक वाहन वर्ग वर्गीकरण')}</strong>
              <button
                type="button"
                className="icon-button"
                onClick={() => setShowCompare(false)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="vehicle-compare-table-wrap">
              <table className="vehicle-compare-table">
                <thead>
                  <tr>
                    <th>{local(language, 'Class', 'वर्ग')}</th>
                    <th>{local(language, 'Description', 'विवरण')}</th>
                    <th>{local(language, 'Popular Models', 'प्रमुख मॉडल')}</th>
                    <th>{local(language, 'Eligibility', 'पात्रता')}</th>
                  </tr>
                </thead>
                <tbody>
                  {vehiclesData.map((v) => (
                    <tr key={v.id}>
                      <td><strong>{v.code}</strong></td>
                      <td>{language === 'en' ? v.nameEn : v.nameHi}</td>
                      <td>{language === 'en' ? v.examplesEn : v.examplesHi}</td>
                      <td>{v.minAge}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3D Visual Vehicle Choice Cards */}
        <div className="vehicle-card-3d-grid">
          {vehiclesData.map((v) => {
            const isSelected = draft.vehicleClasses.includes(v.id)
            return (
              <div
                key={v.id}
                className={`vehicle-card-3d ${isSelected ? 'vehicle-card-3d--selected' : ''}`}
                onClick={() => toggle(v.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    toggle(v.id)
                  }
                }}
              >
                <div className="vehicle-card-3d__top">
                  <span className="vehicle-card-3d__code">{v.code}</span>
                  <div className="vehicle-card-3d__checkbox">
                    {isSelected ? (
                      <span className="vehicle-selected-indicator">
                        <Check size={14} />
                      </span>
                    ) : (
                      <div className="vehicle-unselected-box" />
                    )}
                  </div>
                </div>

                <div className="vehicle-card-3d__image-wrap">
                  <img src={v.image} alt={v.nameEn} className="vehicle-card-3d__image" />
                </div>

                <div className="vehicle-card-3d__content">
                  <h3 className="vehicle-card-3d__title">{language === 'en' ? v.nameEn : v.nameHi}</h3>
                  <p className="vehicle-card-3d__category">{language === 'en' ? v.categoryEn : v.categoryHi}</p>
                  <div className="vehicle-card-3d__models-pill">{language === 'en' ? v.examplesEn : v.examplesHi}</div>
                </div>
              </div>
            )
          })}
        </div>

        {errors.vehicleClasses && (
          <small className="field-error" role="alert">
            {language === 'hi' ? validationHi[errors.vehicleClasses] ?? errors.vehicleClasses : errors.vehicleClasses}
          </small>
        )}
      </fieldset>

      {/* Selected Vehicles Basket */}
      {draft.vehicleClasses.length > 0 && (
        <section className="vehicle-basket-card">
          <div className="vehicle-basket-card__header">
            <p className="eyebrow">{local(language, 'Selected vehicle classes for licence', 'लाइसेंस के लिए चयनित वाहन वर्ग')}</p>
            <span className="vehicle-basket-card__count">
              {draft.vehicleClasses.length} {draft.vehicleClasses.length === 1 ? 'class' : 'classes'}
            </span>
          </div>
          <div className="vehicle-basket-card__chips">
            {draft.vehicleClasses.map((item) => (
              <span key={item} className="vehicle-basket-chip">
                <Check size={14} />
                <strong>{item}</strong>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggle(item)
                  }}
                  aria-label={`Remove ${item}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Driving School Training */}
      <fieldset className="choice-fieldset" id="trainedAtDrivingSchool">
        <div className="form-question-header">
          <div>
            <legend className="form-question-title">
              {local(language, 'Training at a recognized driving school', 'मान्यता प्राप्त ड्राइविंग स्कूल में प्रशिक्षण')}
              <span className="required-mark" aria-hidden="true"> *</span>
            </legend>
            <p className="form-question-sub">
              {local(language, 'Have you completed or are currently enrolled in an authorized motor driving school?', 'क्या आपने किसी अधिकृत मोटर ड्राइविंग स्कूल से प्रशिक्षण लिया है?')}
            </p>
          </div>
        </div>
        <div className="driving-school-choices">
          <label className={`driving-school-pill ${draft.trainedAtDrivingSchool === 'yes' ? 'driving-school-pill--selected' : ''}`}>
            <input
              type="radio"
              name="trainedAtDrivingSchool"
              checked={draft.trainedAtDrivingSchool === 'yes'}
              onChange={() => setDraft({ ...draft, trainedAtDrivingSchool: 'yes' })}
            />
            <span>{local(language, 'Yes, trained at driving school', 'हाँ, ड्राइविंग स्कूल से प्रशिक्षित')}</span>
          </label>
          <label className={`driving-school-pill ${draft.trainedAtDrivingSchool === 'no' ? 'driving-school-pill--selected' : ''}`}>
            <input
              type="radio"
              name="trainedAtDrivingSchool"
              checked={draft.trainedAtDrivingSchool === 'no'}
              onChange={() => setDraft({ ...draft, trainedAtDrivingSchool: 'no' })}
            />
            <span>{local(language, 'No, self-learning / private tutor', 'नहीं, निजी प्रशिक्षण / स्वयं सीखा')}</span>
          </label>
        </div>
        {errors.trainedAtDrivingSchool && (
          <small className="field-error" role="alert">
            {language === 'hi' ? validationHi[errors.trainedAtDrivingSchool] ?? errors.trainedAtDrivingSchool : errors.trainedAtDrivingSchool}
          </small>
        )}
      </fieldset>
    </div>
  )
}

function FitnessStep({ draft, setDraft, errors, language }: StepProps) {
  const answer = (id: string, value: FitnessAnswer) =>
    setDraft({ ...draft, fitnessAnswers: { ...draft.fitnessAnswers, [id]: value } })

  return (
    <div className="form-content-wrap">
      <div className="formal-security-strip">
        <FileCheck2 size={20} />
        <div>
          <strong>{local(language, 'Official MoRTH Form 1 Physical Fitness Declaration', 'आधिकारिक MoRTH Form 1 शारीरिक फिटनेस घोषणा')}</strong>
          <p>
            {local(
              language,
              'Self-declaration of medical fitness under the Central Motor Vehicles Rules. An affirmative ("Yes") response indicates the need for medical evaluation rather than automatic rejection.',
              'केंद्रीय मोटर वाहन नियमों के तहत शारीरिक फिटनेस की स्व-घोषणा। किसी भी प्रश्न पर "हाँ" का अर्थ चिकित्सकीय परामर्श है, आवेदन का स्वतः निरस्तीकरण नहीं।'
            )}
          </p>
        </div>
      </div>

      <fieldset className="fitness-list">
        <legend className="visually-hidden">
          {local(language, 'Physical fitness questions', 'शारीरिक फिटनेस प्रश्न')}
        </legend>
        {fitnessQuestions.map((question, index) => {
          const error = errors[`fitness.${question.id}`]
          const currentAnswer = draft.fitnessAnswers[question.id]
          return (
            <div
              className={`fitness-question ${error ? 'fitness-question--error' : ''}`}
              id={`fitness-${question.id}`}
              key={question.id}
            >
              <div className="fitness-question__header">
                <span className="fitness-question__number">{index + 1}</span>
                <p className="fitness-question__text">{question.text}</p>
              </div>
              <div className="fitness-question__actions">
                <div className="segmented-choice">
                  <label className={currentAnswer === 'yes' ? 'selected selected--yes' : ''}>
                    <input
                      type="radio"
                      name={`fitness-${question.id}`}
                      checked={currentAnswer === 'yes'}
                      onChange={() => answer(question.id, 'yes')}
                    />
                    {local(language, 'Yes', 'हाँ')}
                  </label>
                  <label className={currentAnswer === 'no' ? 'selected selected--no' : ''}>
                    <input
                      type="radio"
                      name={`fitness-${question.id}`}
                      checked={currentAnswer === 'no'}
                      onChange={() => answer(question.id, 'no')}
                    />
                    {local(language, 'No', 'नहीं')}
                  </label>
                </div>
              </div>
              {error && <small className="field-error" role="alert">{error}</small>}
            </div>
          )
        })}
      </fieldset>
    </div>
  )
}

function ReviewStep({ draft, setDraft, errors, language }: StepProps) {
  const allErrors = validateAllApplicationSteps(draft)
  const sections = applicationSteps
    .filter((step) => step !== 'review')
    .map((step) => ({ step, complete: Object.keys(allErrors[step]).length === 0 }))
  const address = draft.presentAddress
  const stepLabels = language === 'en' ? stepCopy : stepCopyHi
  const completeCount = sections.filter((s) => s.complete).length

  return (
    <div className="form-content-wrap">
      <div className="formal-security-strip">
        <CheckCircle2 size={20} />
        <div>
          <strong>
            {local(
              language,
              `${completeCount} of ${sections.length} application sections completed`,
              `${sections.length} में से ${completeCount} आवेदन भाग पूरे`
            )}
          </strong>
          <p>
            {local(
              language,
              'Please review your details below before final submission. You may edit any section directly.',
              'कृपया अंतिम रूप से जमा करने से पहले अपने विवरण की समीक्षा करें। आप किसी भी भाग में सीधे बदलाव कर सकते हैं।'
            )}
          </p>
        </div>
      </div>

      {/* Section Jump Grid */}
      <div className="review-section-chips">
        {sections.map(({ step, complete }) => (
          <div key={step} className={`review-chip ${complete ? 'review-chip--complete' : 'review-chip--incomplete'}`}>
            <div className="review-chip__left">
              <span className="review-chip__icon">
                {complete ? <Check size={14} /> : '!'}
              </span>
              <strong>{stepLabels[step].label}</strong>
            </div>
            <FlowLink href={`/mp/ll/application/${step}`} className="review-chip__link">
              {complete ? local(language, 'Edit', 'बदलें') : local(language, 'Complete', 'पूरा करें')}
            </FlowLink>
          </div>
        ))}
      </div>

      {/* Summary Dossier Cards */}
      <div className="review-dossier-grid">
        {/* Applicant Details */}
        <div className="review-dossier-card">
          <div className="review-dossier-card__header">
            <strong>{local(language, 'Applicant Details', 'आवेदक का विवरण')}</strong>
            <FlowLink href="/mp/ll/application/personal">{local(language, 'Edit', 'बदलें')}</FlowLink>
          </div>
          <dl className="review-dossier-list">
            <div>
              <dt>{local(language, 'Full Name', 'पूरा नाम')}</dt>
              <dd>{[draft.firstName, draft.middleName, draft.lastName].filter(Boolean).join(' ') || '—'}</dd>
            </div>
            <div>
              <dt>{local(language, 'Relationship', 'संबंध')}</dt>
              <dd>{draft.relationType}: {draft.relationName || '—'}</dd>
            </div>
            <div>
              <dt>{local(language, 'Gender & DOB', 'लिंग और जन्मतिथि')}</dt>
              <dd>{draft.gender || '—'} · {draft.dateOfBirth || '—'}</dd>
            </div>
            <div>
              <dt>{local(language, 'Contact', 'संपर्क')}</dt>
              <dd>{draft.mobile || '—'} | {draft.email || '—'}</dd>
            </div>
          </dl>
        </div>

        {/* Identity & Address */}
        <div className="review-dossier-card">
          <div className="review-dossier-card__header">
            <strong>{local(language, 'Identity & Address', 'पहचान और पता')}</strong>
            <FlowLink href="/mp/ll/application/address">{local(language, 'Edit', 'बदलें')}</FlowLink>
          </div>
          <dl className="review-dossier-list">
            <div>
              <dt>{local(language, 'Identity Method', 'पहचान मार्ग')}</dt>
              <dd>{draft.identityRoute === 'aadhaar-ekyc' ? 'Demo Aadhaar e-KYC (Verified ✓)' : 'Document Route'}</dd>
            </div>
            <div>
              <dt>{local(language, 'Present Address', 'वर्तमान पता')}</dt>
              <dd>{[address.house, address.street, address.locality, address.district, address.pin].filter(Boolean).join(', ') || '—'}</dd>
            </div>
            <div>
              <dt>{local(language, 'Stay Duration', 'निवास अवधि')}</dt>
              <dd>{draft.yearsAtAddress || 0} yrs, {draft.monthsAtAddress || 0} mos</dd>
            </div>
          </dl>
        </div>

        {/* Selected Vehicles */}
        <div className="review-dossier-card">
          <div className="review-dossier-card__header">
            <strong>{local(language, 'Vehicle Classes', 'वाहन वर्ग')}</strong>
            <FlowLink href="/mp/ll/application/vehicles">{local(language, 'Edit', 'बदलें')}</FlowLink>
          </div>
          <div className="review-vehicle-pill-row">
            {draft.vehicleClasses.length > 0 ? (
              draft.vehicleClasses.map((v) => (
                <span key={v} className="review-vehicle-badge">
                  <Check size={14} /> {v}
                </span>
              ))
            ) : (
              <span className="text-muted">{local(language, 'None selected', 'कोई नहीं चुना गया')}</span>
            )}
          </div>
        </div>
      </div>

      {/* Final Declaration */}
      <label
        className={`consent-checkbox-card ${errors.declarationAccepted ? 'consent-checkbox-card--error' : ''}`}
        id="declarationAccepted"
      >
        <input
          type="checkbox"
          checked={draft.declarationAccepted}
          onChange={(event) => setDraft({ ...draft, declarationAccepted: event.target.checked })}
        />
        <div className="consent-checkbox-card__text">
          <strong>
            {local(
              language,
              'I confirm that all provided details are correct and acknowledge this interactive prototype demonstration.',
              'मैं पुष्टि करता/करती हूँ कि दी गई जानकारी सही है और इस इंटरैक्टिव प्रोटोटाइप डेमो को स्वीकार करता/करती हूँ।'
            )}
          </strong>
          <small>
            {local(
              language,
              'Submission advances your application to Stage 3: Contactless Device Readiness Check.',
              'आवेदन जमा करने के बाद आप चरण 3: संपर्क-रहित डिवाइस जाँच पर जाएँगे।'
            )}
          </small>
          {errors.declarationAccepted && (
            <span className="field-error" role="alert">{errors.declarationAccepted}</span>
          )}
        </div>
      </label>
    </div>
  )
}

type StepProps = {
  draft: LLApplicationDraft
  setDraft: (draft: LLApplicationDraft) => void
  errors: FieldErrors
  language: AppLanguage
}

function StepContent(props: StepProps & { step: ApplicationStep }) {
  if (props.step === 'category') return <CategoryStep {...props} />
  if (props.step === 'identity') return <IdentityStep {...props} />
  if (props.step === 'personal') return <PersonalStep {...props} />
  if (props.step === 'address') return <AddressStep {...props} />
  if (props.step === 'vehicles') return <VehiclesStep {...props} />
  if (props.step === 'fitness') return <FitnessStep {...props} />
  return <ReviewStep {...props} />
}

export function ApplicationFlow({
  step,
  onSubmitted,
  language,
}: {
  step: ApplicationStep
  onSubmitted: (draft: LLApplicationDraft) => void
  language: AppLanguage
}) {
  const [draft, setDraft] = useState<LLApplicationDraft>(() => loadApplicationDraft() ?? createEmptyDraft())
  const [errors, setErrors] = useState<FieldErrors>({})
  const index = applicationSteps.indexOf(step)
  const pageCopy = (language === 'en' ? stepCopy : stepCopyHi)[step]

  useEffect(() => {
    saveApplicationDraft(draft)
  }, [draft])

  useEffect(() => {
    setErrors({})
  }, [step])

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
      if (firstIncomplete && firstIncomplete !== 'review') {
        navigatePortal(`/mp/ll/application/${firstIncomplete}`)
        return
      }
      const finalDraft: LLApplicationDraft = {
        ...draft,
        submittedAt: draft.submittedAt ?? new Date().toISOString(),
      }
      saveApplicationDraft(finalDraft)
      onSubmitted(finalDraft)
      return
    }

    const nextStep = applicationSteps[index + 1]
    if (nextStep) {
      navigatePortal(`/mp/ll/application/${nextStep}`)
    }
  }

  const prevStep = index > 0 ? applicationSteps[index - 1] : null

  return (
    <div className="application-flow">
      <header className="page-header">
        <div className="page-header__left">
          <p className="eyebrow">
            {local(language, 'Application', 'आवेदन')} · {draft.applicationId}
          </p>
          <h1>{pageCopy.title}</h1>
          <p className="page-header__sub">{pageCopy.description}</p>
        </div>
        <div className="page-header__right">
          <span className="saved-badge">
            <Check size={14} /> {local(language, 'Saved automatically', 'स्वतः सहेजा गया')}
          </span>
        </div>
      </header>

      <div className="application-flow__body">
        <ApplicationProgress step={step} draft={draft} language={language} />

        <form className="application-flow__main" onSubmit={submit} noValidate>
          <ErrorSummary errors={errors} language={language} />

          <StepContent step={step} draft={draft} setDraft={setDraft} errors={errors} language={language} />

          <div className="application-flow__actions">
            {prevStep ? (
              <button
                type="button"
                className="button button--secondary"
                onClick={() => navigatePortal(`/mp/ll/application/${prevStep}`)}
              >
                <ArrowLeft size={17} /> {local(language, 'Back', 'पीछे')}
              </button>
            ) : (
              <button
                type="button"
                className="button button--secondary"
                onClick={() => navigatePortal('/mp/services')}
              >
                <ArrowLeft size={17} /> {local(language, 'Services', 'सेवाएँ')}
              </button>
            )}

            <button type="submit" className="button button--primary">
              {step === 'review'
                ? local(language, 'Submit application & continue', 'आवेदन जमा करें और आगे बढ़ें')
                : local(language, 'Save and continue', 'सहेजें और आगे बढ़ें')}{' '}
              <ArrowRight size={17} />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function SubmittedPage({
  onContinue,
  language,
}: {
  onContinue: (draft: LLApplicationDraft) => void
  language: AppLanguage
}) {
  const [draft] = useState<LLApplicationDraft>(() => loadApplicationDraft() ?? createEmptyDraft())
  return (
    <div className="application-flow">
      <nav className="breadcrumbs" aria-label={local(language, 'Breadcrumb', 'स्थान पथ')}>
        <ol>
          <li>
            <FlowLink href="/mp/services">{local(language, 'Services', 'सेवाएँ')}</FlowLink>
          </li>
          <li>
            <span aria-current="page">{local(language, 'Application submitted', 'आवेदन जमा हुआ')}</span>
          </li>
        </ol>
      </nav>

      <section className="submission-card">
        <div className="submission-card__icon" aria-hidden="true">
          <BadgeCheck size={38} />
        </div>
        <p className="eyebrow">{local(language, 'Stage 1 complete', 'चरण 1 पूरा')}</p>
        <h1>{local(language, 'Application saved on this device', 'आवेदन इस डिवाइस पर सहेजा गया')}</h1>
        <p>
          {local(
            language,
            'Your application details have been safely stored locally. In this prototype, you can proceed immediately to document verification.',
            'आपके आवेदन का विवरण सुरक्षित रूप से स्थानीय रूप से सहेजा गया है। इस प्रोटोटाइप में, आप तुरंत दस्तावेज़ सत्यापन पर आगे बढ़ सकते हैं।'
          )}
        </p>
        <dl>
          <div>
            <dt>{local(language, 'Application number', 'आवेदन संख्या')}</dt>
            <dd>{draft.applicationId}</dd>
          </div>
          <div>
            <dt>{local(language, 'Applicant', 'आवेदक')}</dt>
            <dd>
              {[draft.firstName, draft.lastName].filter(Boolean).join(' ') ||
                local(language, 'Sample applicant', 'नमूना आवेदक')}
            </dd>
          </div>
          <div>
            <dt>{local(language, 'Submitted', 'सहेजने का समय')}</dt>
            <dd>
              {draft.submittedAt
                ? new Date(draft.submittedAt).toLocaleString(language === 'en' ? 'en-IN' : 'hi-IN')
                : local(language, 'Saved now', 'अभी सहेजा गया')}
            </dd>
          </div>
          <div>
            <dt>{local(language, 'Next stage', 'अगला चरण')}</dt>
            <dd>{local(language, 'Documents, photo and signature', 'दस्तावेज़, फोटो और हस्ताक्षर')}</dd>
          </div>
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
            <small>
              {local(
                language,
                'You can reopen this saved demo application after refreshing the browser.',
                'ब्राउज़र रिफ्रेश करने के बाद भी यह डेमो आवेदन फिर खोला जा सकता है।'
              )}
            </small>
          </span>
        </div>
      </section>
    </div>
  )
}

export function UploadsPage({
  applicationId,
  onComplete,
  language,
}: {
  applicationId: string
  onComplete: (draft: LLApplicationDraft) => void
  language: AppLanguage
}) {
  const [draft, setDraft] = useState<LLApplicationDraft>(
    () => loadApplicationDraft(applicationId) ?? createEmptyDraft(applicationId)
  )
  const update = (patch: Partial<LLApplicationDraft>) => {
    const next = { ...draft, ...patch }
    setDraft(next)
    saveApplicationDraft(next)
  }
  const complete = draft.documentsUploaded && draft.photoUploaded && draft.signatureUploaded

  return (
    <div className="application-flow">
      <nav className="breadcrumbs" aria-label={local(language, 'Breadcrumb', 'स्थान पथ')}>
        <ol>
          <li>
            <FlowLink href="/mp/services">{local(language, 'Services', 'सेवाएँ')}</FlowLink>
          </li>
          <li>
            <FlowLink href={`/mp/application/${applicationId}`}>
              {local(language, 'Application status', 'आवेदन स्थिति')}
            </FlowLink>
          </li>
          <li>
            <span aria-current="page">{local(language, 'Uploads', 'अपलोड')}</span>
          </li>
        </ol>
      </nav>
      <header className="page-header">
        <div className="page-header__left">
          <p className="eyebrow">
            {local(language, 'Application', 'आवेदन')} · {applicationId}
          </p>
          <h1>{local(language, 'Documents, photo and signature', 'दस्तावेज़, फोटो और हस्ताक्षर')}</h1>
          <p className="page-header__sub">
            {local(language, 'Check all three items before you continue.', 'आगे बढ़ने से पहले तीनों चीजें जाँचें।')}
          </p>
        </div>
        <div className="page-header__right">
          <span className="saved-badge">
            {[draft.documentsUploaded, draft.photoUploaded, draft.signatureUploaded].filter(Boolean).length} / 3{' '}
            {local(language, 'ready', 'तैयार')}
          </span>
        </div>
      </header>

      <div className="upload-grid upload-grid--three">
        <UploadCard
          language={language}
          kind="document"
          title={local(language, 'Address and age document', 'पता और आयु दस्तावेज़')}
          description={local(
            language,
            'Demo document for the identity option you selected.',
            'आपके चुने पहचान विकल्प के लिए डेमो दस्तावेज़।'
          )}
          complete={draft.documentsUploaded}
          onUse={() => update({ documentsUploaded: true })}
          onReplace={() => update({ documentsUploaded: false })}
        />
        <UploadCard
          language={language}
          kind="photo"
          title={local(language, 'Applicant photo', 'आवेदक का फोटो')}
          description={local(
            language,
            'Demo front-facing photo with a plain background.',
            'सादे बैकग्राउंड वाला सामने से लिया डेमो फोटो।'
          )}
          complete={draft.photoUploaded}
          onUse={() => update({ photoUploaded: true })}
          onReplace={() => update({ photoUploaded: false })}
        />
        <UploadCard
          language={language}
          kind="signature"
          title={local(language, 'Applicant signature', 'आवेदक के हस्ताक्षर')}
          description={local(
            language,
            'Demo signature on a plain light background.',
            'सादे हल्के बैकग्राउंड पर डेमो हस्ताक्षर।'
          )}
          complete={draft.signatureUploaded}
          onUse={() => update({ signatureUploaded: true })}
          onReplace={() => update({ signatureUploaded: false })}
        />
      </div>

      <div className="formal-security-strip" style={{ marginTop: '24px' }}>
        <Upload size={22} />
        <div>
          <strong>{local(language, 'Check each item before saving.', 'सहेजने से पहले हर चीज जाँचें।')}</strong>
          <p>
            {local(
              language,
              'This demo uses sample files. Do not upload real identity documents.',
              'इस डेमो में नमूना फाइलें हैं। वास्तविक पहचान दस्तावेज़ अपलोड न करें।'
            )}
          </p>
        </div>
      </div>

      <div className="application-flow__actions">
        <FlowLink href={`/mp/application/${applicationId}`} className="button button--secondary">
          <ArrowLeft size={18} /> {local(language, 'Application status', 'आवेदन स्थिति')}
        </FlowLink>
        <button className="button button--primary" disabled={!complete} onClick={() => onComplete(draft)}>
          {local(language, 'Confirm all uploads', 'सभी अपलोड की पुष्टि करें')} <ArrowRight size={18} />
        </button>
      </div>
    </div>
  )
}

function UploadCard({
  title,
  description,
  complete,
  kind,
  language,
  onUse,
  onReplace,
}: {
  title: string
  description: string
  complete: boolean
  kind: 'document' | 'photo' | 'signature'
  language: AppLanguage
  onUse: () => void
  onReplace: () => void
}) {
  return (
    <article className={`upload-card ${complete ? 'upload-card--complete' : ''}`}>
      <div className="synthetic-preview" aria-hidden="true">
        {kind === 'photo' ? <UserRoundCheck size={38} /> : kind === 'document' ? <FileText size={36} /> : <span>AV</span>}
      </div>
      <div>
        <span className="status-pill">
          <span /> {local(language, 'Demo sample', 'डेमो नमूना')}
        </span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {complete ? (
        <div className="upload-card__saved">
          <div className="upload-complete">
            <CheckCircle2 size={19} /> {local(language, 'Preview checked and saved', 'पूर्वावलोकन जाँचकर सहेजा गया')}
          </div>
          <button type="button" className="text-button" onClick={onReplace}>
            {local(language, 'Replace', 'बदलें')}
          </button>
        </div>
      ) : (
        <button type="button" className="button button--secondary" onClick={onUse}>
          {local(language, 'Preview sample', 'नमूना देखें')}
        </button>
      )}
    </article>
  )
}
