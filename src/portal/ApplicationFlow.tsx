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
  category: { label: 'Applicant category', title: 'Tell us which route applies', description: 'Your selection controls which existing-licence details are requested.' },
  identity: { label: 'Identity route', title: 'Choose a safe identity route', description: 'Both options are synthetic and demonstrate how the real portal could explain consequences before consent.' },
  personal: { label: 'Applicant details', title: 'Applicant and contact details', description: 'Use only fictional information in this independent prototype.' },
  address: { label: 'Address', title: 'Present and permanent address', description: 'Address data is saved only in this browser for the prototype.' },
  vehicles: { label: 'Vehicle classes', title: 'Choose vehicle classes', description: 'Vehicle-class terminology is a reference pattern and must be verified for current MP production use.' },
  fitness: { label: 'Form 1', title: 'Physical-fitness self-declaration', description: 'Answer every question. A “Yes” answer requests review; it does not automatically reject the application.' },
  review: { label: 'Review', title: 'Review and submit', description: 'Check each section, return to anything incomplete, then submit the synthetic application.' },
}

const stepCopyHi: Record<ApplicationStep, { label: string; title: string; description: string }> = {
  category: { label: 'आवेदक श्रेणी', title: 'अपने लिए सही विकल्प चुनें', description: 'आपके चयन के आधार पर तय होगा कि मौजूदा लाइसेंस की जानकारी माँगी जाएगी या नहीं।' },
  identity: { label: 'पहचान का तरीका', title: 'पहचान सत्यापन का तरीका चुनें', description: 'आगे बढ़ने से पहले दोनों विकल्पों की जानकारी ध्यान से पढ़ें।' },
  personal: { label: 'आवेदक की जानकारी', title: 'आवेदक और संपर्क की जानकारी', description: 'इस स्वतंत्र प्रोटोटाइप में केवल काल्पनिक जानकारी का उपयोग करें।' },
  address: { label: 'पता', title: 'वर्तमान और स्थायी पता', description: 'प्रोटोटाइप के लिए पते की जानकारी केवल इस ब्राउज़र में सहेजी जाती है।' },
  vehicles: { label: 'वाहन वर्ग', title: 'वाहन वर्ग चुनें', description: 'वह वाहन वर्ग चुनें जिसके लिए लर्नर लाइसेंस चाहिए।' },
  fitness: { label: 'फॉर्म 1', title: 'शारीरिक फिटनेस स्व-घोषणा', description: 'हर प्रश्न का उत्तर दें। “हाँ” उत्तर से समीक्षा माँगी जाती है; आवेदन अपने-आप अस्वीकार नहीं होता।' },
  review: { label: 'समीक्षा', title: 'जाँचें और जमा करें', description: 'हर भाग जाँचें, अधूरी जानकारी ठीक करें और फिर आवेदन जमा करें।' },
}

const validationHi: Record<string, string> = {
  'Choose the option that describes the applicant.': 'आवेदक के लिए सही विकल्प चुनें।',
  'Enter a synthetic existing licence number for this route.': 'इस विकल्प के लिए काल्पनिक मौजूदा लाइसेंस संख्या दर्ज करें।',
  'Choose a synthetic identity route.': 'पहचान सत्यापन का तरीका चुनें।',
  'Accept the prototype identity consent to continue.': 'आगे बढ़ने के लिए पहचान संबंधी सहमति स्वीकार करें।',
  'Verify the demonstration OTP to continue.': 'आगे बढ़ने के लिए डेमो ओटीपी सत्यापित करें।',
  'Select at least one vehicle class.': 'कम से कम एक वाहन वर्ग चुनें।',
  'Choose whether the applicant trained at a driving school.': 'बताएँ कि आवेदक ने ड्राइविंग स्कूल में प्रशिक्षण लिया है या नहीं।',
  'Accept the declaration before submitting.': 'जमा करने से पहले घोषणा स्वीकार करें।',
}

function FlowLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return <a href={href} className={className} onClick={(event) => { event.preventDefault(); navigatePortal(href) }}>{children}</a>
}

function Field({ id, label, helper, error, required, children }: { id: string; label: string; helper?: string; error?: string; required?: boolean; children: ReactNode }) {
  return <div className={`form-field ${error ? 'form-field--error' : ''}`}><label htmlFor={id}>{label}{required && <span className="required-mark" aria-hidden="true"> *</span>}</label>{children}{helper && <small id={`${id}-help`} className="field-helper">{helper}</small>}{error && <small id={`${id}-error`} className="field-error" role="alert">{error}</small>}</div>
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
    return <li key={item} className={`application-progress__step application-progress__step--${state}`}><span>{valid && index !== current ? <Check size={14} /> : index + 1}</span><div><strong>{labels[item].label}</strong><small>{index === current ? local(language, 'In progress', 'जारी है') : valid ? local(language, 'Saved', 'सहेजा गया') : local(language, 'Not complete', 'अधूरा')}</small></div></li>
  })
  return <aside className="application-progress" aria-label={local(language, 'Application progress', 'आवेदन की प्रगति')}><div className="application-progress__summary"><p className="eyebrow">{local(language, 'Application progress', 'आवेदन की प्रगति')}</p><strong>{local(language, `Step ${current + 1} of ${applicationSteps.length}`, `${applicationSteps.length} में से चरण ${current + 1}`)}</strong><span>{local(language, `${completedStepCount(draft)} sections complete`, `${completedStepCount(draft)} भाग पूरे`)}</span></div><ol className="application-progress__desktop">{renderSteps()}</ol><details className="application-progress__compact"><summary><span>{local(language, 'View all application steps', 'आवेदन के सभी चरण देखें')}</span><ChevronDown size={19} aria-hidden="true" /></summary><ol>{renderSteps()}</ol></details><div className="autosave-box"><Save size={17} /><span><strong>{local(language, 'Autosave is on', 'अपने-आप सहेजना चालू है')}</strong><small>{local(language, 'Draft stays on this device', 'ड्राफ्ट इसी डिवाइस पर रहेगा')}</small></span></div></aside>
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
  const choices = [
    ['no-licence', local(language, 'I do not hold an Indian Driving Licence or Learner’s Licence', 'मेरे पास भारतीय ड्राइविंग लाइसेंस या लर्नर लाइसेंस नहीं है'), local(language, 'New LL application', 'नया एलएल आवेदन')],
    ['holds-driving-licence', local(language, 'I hold an Indian Driving Licence', 'मेरे पास भारतीय ड्राइविंग लाइसेंस है'), local(language, 'Existing DL details will be required', 'मौजूदा डीएल की जानकारी देनी होगी')],
    ['holds-learner-licence', local(language, 'I hold an Indian Learner’s Licence', 'मेरे पास भारतीय लर्नर लाइसेंस है'), local(language, 'Existing LL details will be required', 'मौजूदा एलएल की जानकारी देनी होगी')],
  ] as const
  const categoryError = language === 'hi' && errors.applicantCategory ? validationHi[errors.applicantCategory] ?? errors.applicantCategory : errors.applicantCategory
  return <><ContextHelp language={language}><p>{local(language, 'Choose the statement that is true for the applicant. If an existing licence is selected, its details will be requested next.', 'आवेदक के लिए सही कथन चुनें। मौजूदा लाइसेंस चुनने पर उसकी जानकारी आगे माँगी जाएगी।')}</p></ContextHelp><fieldset className={`choice-fieldset ${errors.applicantCategory ? 'choice-fieldset--error' : ''}`} id="applicantCategory"><legend>{local(language, 'Applicant status', 'आवेदक की स्थिति')} <span className="required-mark">*</span></legend><div className="choice-stack">{choices.map(([value, title, detail]) => <label className={`radio-choice ${draft.applicantCategory === value ? 'radio-choice--selected' : ''}`} key={value}><input type="radio" name="applicantCategory" value={value} checked={draft.applicantCategory === value} onChange={() => setDraft({ ...draft, applicantCategory: value })} /><span className="radio-control" /><span><strong>{title}</strong><small>{detail}</small></span></label>)}</div>{categoryError && <small className="field-error" role="alert">{categoryError}</small>}</fieldset>{draft.applicantCategory && draft.applicantCategory !== 'no-licence' && <Field id="existingLicenceNumber" label={local(language, 'Existing sample licence number', 'मौजूदा नमूना लाइसेंस संख्या')} required error={errors.existingLicenceNumber} helper={local(language, 'Do not enter a real licence number.', 'वास्तविक लाइसेंस संख्या दर्ज न करें।')}><input id="existingLicenceNumber" value={draft.existingLicenceNumber} onChange={(event) => setDraft({ ...draft, existingLicenceNumber: event.target.value.toUpperCase() })} /></Field>}<Field id="specialCategory" label={local(language, 'Special applicant category', 'विशेष आवेदक श्रेणी')} helper={local(language, 'Select only when applicable.', 'लागू होने पर ही चुनें।')}><select id="specialCategory" value={draft.specialCategory} onChange={(event) => setDraft({ ...draft, specialCategory: event.target.value as LLApplicationDraft['specialCategory'] })}><option value="none">{local(language, 'None', 'कोई नहीं')}</option><option value="diplomat">{local(language, 'Diplomat', 'राजनयिक')}</option><option value="refugee">{local(language, 'Refugee', 'शरणार्थी')}</option><option value="repatriate">{local(language, 'Repatriate', 'स्वदेश लौटे व्यक्ति')}</option><option value="ex-serviceman">{local(language, 'Ex-serviceman', 'भूतपूर्व सैनिक')}</option></select></Field></>
}

function IdentityStep({ draft, setDraft, errors, language }: StepProps) {
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const chooseRoute = (identityRoute: LLApplicationDraft['identityRoute']) => setDraft({ ...draft, identityRoute, identityOtpSent: false, identityVerified: false })
  const verifyOtp = () => {
    if (otp !== '246810') {
      setOtpError(local(language, 'Enter the six-digit demonstration OTP shown above.', 'ऊपर दिया छह अंकों का डेमो ओटीपी दर्ज करें।'))
      return
    }
    setOtpError('')
    setDraft({ ...draft, identityVerified: true })
  }
  return <><section className="privacy-banner"><ShieldCheck size={22} /><div><strong>{local(language, 'Do not enter an Aadhaar number on this page.', 'इस पेज पर आधार संख्या दर्ज न करें।')}</strong><p>{local(language, 'The prepared eKYC route demonstrates consent and OTP recovery without collecting an identifier or contacting UIDAI.', 'तैयार ईकेवाईसी विकल्प बिना पहचान संख्या लिए या यूआईडीएआई से जुड़े सहमति और ओटीपी रिकवरी दिखाता है।')}</p></div></section><fieldset className={`choice-fieldset ${errors.identityRoute ? 'choice-fieldset--error' : ''}`} id="identityRoute"><legend>{local(language, 'Identity verification route', 'पहचान सत्यापन का तरीका')} <span className="required-mark">*</span></legend><div className="choice-stack"><label className={`radio-choice ${draft.identityRoute === 'aadhaar-ekyc' ? 'radio-choice--selected' : ''}`}><input type="radio" name="identityRoute" checked={draft.identityRoute === 'aadhaar-ekyc'} onChange={() => chooseRoute('aadhaar-ekyc')} /><span className="radio-control" /><span><strong>{local(language, 'Prepared Aadhaar eKYC demonstration', 'तैयार आधार ईकेवाईसी प्रदर्शन')}</strong><small>{local(language, 'Uses a fixed OTP and a fictional profile; no UIDAI connection.', 'निश्चित ओटीपी और काल्पनिक प्रोफ़ाइल का उपयोग; यूआईडीएआई से कोई जुड़ाव नहीं।')}</small></span></label><label className={`radio-choice ${draft.identityRoute === 'documents' ? 'radio-choice--selected' : ''}`}><input type="radio" name="identityRoute" checked={draft.identityRoute === 'documents'} onChange={() => chooseRoute('documents')} /><span className="radio-control" /><span><strong>{local(language, 'Document-assisted verification', 'दस्तावेज़-सहायित सत्यापन')}</strong><small>{local(language, 'Continue with applicant details and provide the document sample after submission.', 'आवेदक की जानकारी भरें और जमा करने के बाद दस्तावेज़ नमूना दें।')}</small></span></label></div>{errors.identityRoute && <small className="field-error" role="alert">{language === 'hi' ? validationHi[errors.identityRoute] ?? errors.identityRoute : errors.identityRoute}</small>}</fieldset>{draft.identityRoute && <label className={`consent-box ${errors.identityConsent ? 'consent-box--error' : ''}`} id="identityConsent"><input type="checkbox" checked={draft.identityConsent} onChange={(event) => setDraft({ ...draft, identityConsent: event.target.checked, identityOtpSent: event.target.checked ? draft.identityOtpSent : false, identityVerified: event.target.checked ? draft.identityVerified : false })} /><span><strong>{local(language, 'I consent to use the selected demonstration route.', 'मैं चुने गए प्रदर्शन विकल्प के उपयोग की सहमति देता/देती हूँ।')}</strong><small>{local(language, 'No biometric authentication or government identity result is used.', 'कोई बायोमेट्रिक प्रमाणीकरण या सरकारी पहचान परिणाम उपयोग नहीं होता।')}</small>{errors.identityConsent && <span className="field-error" role="alert">{language === 'hi' ? validationHi[errors.identityConsent] ?? errors.identityConsent : errors.identityConsent}</span>}</span></label>}{draft.identityRoute === 'aadhaar-ekyc' && draft.identityConsent && <section className="otp-panel" id="identityVerified" aria-labelledby="otp-title"><div className="otp-panel__heading"><div><p className="eyebrow">{local(language, 'Mobile verification', 'मोबाइल सत्यापन')}</p><h2 id="otp-title">{local(language, 'Verify the demonstration OTP', 'डेमो ओटीपी सत्यापित करें')}</h2></div>{draft.identityVerified && <span className="saved-indicator"><CheckCircle2 size={17} /> {local(language, 'Verified', 'सत्यापित')}</span>}</div>{!draft.identityOtpSent ? <><p>{local(language, 'A fictional mobile number ending in 0042 will be used. No message is actually sent.', '0042 पर समाप्त काल्पनिक मोबाइल नंबर उपयोग होगा। वास्तव में कोई संदेश नहीं भेजा जाता।')}</p><button type="button" className="button button--secondary" onClick={() => setDraft({ ...draft, identityOtpSent: true })}>{local(language, 'Send demonstration OTP', 'डेमो ओटीपी भेजें')}</button></> : draft.identityVerified ? <div className="otp-success"><CheckCircle2 size={21} /><p>{local(language, 'Identity route verified. The prepared fictional profile can now be used.', 'पहचान विकल्प सत्यापित है। अब तैयार काल्पनिक प्रोफ़ाइल उपयोग की जा सकती है।')}</p></div> : <><div className="demo-otp"><strong>{local(language, 'Demonstration OTP', 'डेमो ओटीपी')}</strong><span>246810</span><small>{local(language, 'Use this code to complete the review flow.', 'समीक्षा प्रक्रिया पूरी करने के लिए इस कोड का उपयोग करें।')}</small></div><div className="otp-entry"><label htmlFor="identity-otp">{local(language, 'Enter six-digit OTP', 'छह अंकों का ओटीपी दर्ज करें')}</label><div><input id="identity-otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} aria-invalid={Boolean(otpError)} /><button type="button" className="button button--primary" onClick={verifyOtp}>{local(language, 'Verify OTP', 'ओटीपी सत्यापित करें')}</button></div>{otpError && <small className="field-error" role="alert">{otpError}</small>}<button type="button" className="text-button" onClick={() => { setOtp(''); setOtpError('') }}>{local(language, 'Resend OTP', 'ओटीपी फिर भेजें')}</button></div></>}{errors.identityVerified && !draft.identityVerified && <small className="field-error" role="alert">{local(language, 'Complete OTP verification before continuing.', 'आगे बढ़ने से पहले ओटीपी सत्यापन पूरा करें।')}</small>}</section>}{draft.identityRoute === 'documents' && draft.identityConsent && <section className="document-route-note"><FileText size={21} /><div><strong>{local(language, 'Document verification selected', 'दस्तावेज़ सत्यापन चुना गया')}</strong><p>{local(language, 'You can continue now. The document, photograph and signature checklist appears after submission.', 'अब आप आगे बढ़ सकते हैं। जमा करने के बाद दस्तावेज़, फोटो और हस्ताक्षर सूची दिखाई जाएगी।')}</p></div></section>}</>
}

function PersonalStep({ draft, setDraft, errors }: StepProps) {
  return <><ContextHelp><p>Fields are grouped to match the detailed application structure without placing the entire form on one page.</p></ContextHelp><fieldset className="form-section"><legend>Name and relation</legend><div className="form-grid"><TextInput field="firstName" label="First name" required draft={draft} setDraft={setDraft} errors={errors} autoComplete="given-name" /><TextInput field="middleName" label="Middle name" draft={draft} setDraft={setDraft} errors={errors} autoComplete="additional-name" /><TextInput field="lastName" label="Last name" required draft={draft} setDraft={setDraft} errors={errors} autoComplete="family-name" /><Field id="relationType" label="Relation type" required><select id="relationType" value={draft.relationType} onChange={(event) => setDraft({ ...draft, relationType: event.target.value as LLApplicationDraft['relationType'] })}><option value="father">Father</option><option value="mother">Mother</option><option value="spouse">Spouse</option><option value="guardian">Guardian</option></select></Field><TextInput field="relationName" label="Relation name" required draft={draft} setDraft={setDraft} errors={errors} /></div></fieldset><fieldset className="form-section"><legend>Personal details</legend><div className="form-grid"><Field id="gender" label="Gender" required error={errors.gender}><select id="gender" value={draft.gender} onChange={(event) => setDraft({ ...draft, gender: event.target.value as LLApplicationDraft['gender'] })}><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="transgender">Transgender</option></select></Field><TextInput field="dateOfBirth" label="Date of birth" type="date" required draft={draft} setDraft={setDraft} errors={errors} /><TextInput field="placeOfBirth" label="Place of birth" draft={draft} setDraft={setDraft} errors={errors} /><TextInput field="education" label="Education qualification" draft={draft} setDraft={setDraft} errors={errors} /></div></fieldset><fieldset className="form-section"><legend>Contact and identification</legend><div className="form-grid"><TextInput field="mobile" label="Synthetic mobile number" required draft={draft} setDraft={setDraft} errors={errors} inputMode="tel" autoComplete="tel" helper="Use a fictional 10-digit number." /><TextInput field="email" label="Synthetic email address" type="email" draft={draft} setDraft={setDraft} errors={errors} inputMode="email" autoComplete="email" /><TextInput field="identificationMark1" label="Identification mark 1" required draft={draft} setDraft={setDraft} errors={errors} /><TextInput field="identificationMark2" label="Identification mark 2" draft={draft} setDraft={setDraft} errors={errors} /></div></fieldset></>
}

function AddressStep({ draft, setDraft, errors }: StepProps) {
  return <><AddressFields prefix="presentAddress" title="Present address" value={draft.presentAddress} errors={errors} onChange={(presentAddress) => setDraft({ ...draft, presentAddress })} /><fieldset className="form-section"><legend>Duration at present address</legend><div className="form-grid"><TextInput field="yearsAtAddress" label="Complete years" required draft={draft} setDraft={setDraft} errors={errors} inputMode="numeric" /><TextInput field="monthsAtAddress" label="Additional months" draft={draft} setDraft={setDraft} errors={errors} inputMode="numeric" /></div></fieldset><label className="consent-box"><input type="checkbox" checked={draft.samePermanentAddress} onChange={(event) => setDraft({ ...draft, samePermanentAddress: event.target.checked })} /><span><strong>Permanent address is the same as present address</strong><small>Turning this off does not erase any permanent-address draft already entered.</small></span></label>{!draft.samePermanentAddress && <AddressFields prefix="permanentAddress" title="Permanent address" value={draft.permanentAddress} errors={errors} onChange={(permanentAddress) => setDraft({ ...draft, permanentAddress })} />}</>
}

function VehiclesStep({ draft, setDraft, errors, language }: StepProps) {
  const toggle = (vehicle: string) => setDraft({ ...draft, vehicleClasses: draft.vehicleClasses.includes(vehicle) ? draft.vehicleClasses.filter((item) => item !== vehicle) : [...draft.vehicleClasses, vehicle] })
  const visual: Record<(typeof vehicleOptions)[number]['id'], LucideIcon> = { MCWOG: Gauge, MCWG: Bike, LMV: CarFront }
  const namesHi: Record<(typeof vehicleOptions)[number]['id'], [string, string]> = { MCWOG: ['बिना गियर की मोटरसाइकिल', 'स्कूटर या मोपेड वर्ग'], MCWG: ['गियर वाली मोटरसाइकिल', 'गियर वाली बाइक वर्ग'], LMV: ['हल्का मोटर वाहन', 'कार या जीप वर्ग'] }
  return <><ContextHelp language={language}><p>{local(language, 'Choose the vehicle the applicant intends to learn. The short code is the licence class that will appear in the application.', 'वह वाहन चुनें जिसे आवेदक सीखना चाहता है। छोटा कोड वह लाइसेंस वर्ग है जो आवेदन में दिखाई देगा।')}</p></ContextHelp><fieldset className={`choice-fieldset ${errors.vehicleClasses ? 'choice-fieldset--error' : ''}`} id="vehicleClasses"><legend>{local(language, 'Class of vehicle', 'वाहन वर्ग')} <span className="required-mark">*</span></legend><div className="vehicle-choice-grid">{vehicleOptions.map((vehicle) => { const Icon = visual[vehicle.id]; const selected = draft.vehicleClasses.includes(vehicle.id); return <label className={`vehicle-choice ${selected ? 'vehicle-choice--selected' : ''}`} key={vehicle.id}><input type="checkbox" checked={selected} onChange={() => toggle(vehicle.id)} /><span className="vehicle-choice__visual"><Icon size={34} /></span><span><strong>{language === 'en' ? vehicle.name : namesHi[vehicle.id][0]}</strong><small>{language === 'en' ? vehicle.example : namesHi[vehicle.id][1]}</small><b>{vehicle.id}</b></span>{selected && <CheckCircle2 size={20} aria-label={local(language, 'Selected', 'चुना गया')} />}</label> })}</div>{errors.vehicleClasses && <small className="field-error" role="alert">{language === 'hi' ? validationHi[errors.vehicleClasses] ?? errors.vehicleClasses : errors.vehicleClasses}</small>}<details className="vehicle-code-help"><summary><CircleHelp size={18} /> {local(language, 'What do these class codes mean?', 'इन वाहन वर्ग कोड का क्या अर्थ है?')}</summary><p>{local(language, 'MCWOG is a motorcycle without gear, MCWG is a motorcycle with gear, and LMV is a light motor vehicle. Eligibility and exact state rules must be confirmed in the official service.', 'MCWOG बिना गियर की मोटरसाइकिल, MCWG गियर वाली मोटरसाइकिल और LMV हल्का मोटर वाहन है। पात्रता और राज्य के सटीक नियम आधिकारिक सेवा में जाँचें।')}</p></details></fieldset>{draft.vehicleClasses.length > 0 && <section className="vehicle-selection-summary"><p className="eyebrow">{local(language, 'Selected classes', 'चुने वाहन वर्ग')}</p><div>{draft.vehicleClasses.map((item) => <span key={item}><Check size={14} /> {item}</span>)}</div></section>}<fieldset className="choice-fieldset" id="trainedAtDrivingSchool"><legend>{local(language, 'Training at a driving school', 'ड्राइविंग स्कूल में प्रशिक्षण')} <span className="required-mark">*</span></legend><div className="inline-choices"><label><input type="radio" name="trainedAtDrivingSchool" checked={draft.trainedAtDrivingSchool === 'yes'} onChange={() => setDraft({ ...draft, trainedAtDrivingSchool: 'yes' })} /> {local(language, 'Yes', 'हाँ')}</label><label><input type="radio" name="trainedAtDrivingSchool" checked={draft.trainedAtDrivingSchool === 'no'} onChange={() => setDraft({ ...draft, trainedAtDrivingSchool: 'no' })} /> {local(language, 'No', 'नहीं')}</label></div>{errors.trainedAtDrivingSchool && <small className="field-error" role="alert">{language === 'hi' ? validationHi[errors.trainedAtDrivingSchool] ?? errors.trainedAtDrivingSchool : errors.trainedAtDrivingSchool}</small>}</fieldset></>
}

function FitnessStep({ draft, setDraft, errors }: StepProps) {
  const answer = (id: string, value: FitnessAnswer) => setDraft({ ...draft, fitnessAnswers: { ...draft.fitnessAnswers, [id]: value } })
  return <><section className="reference-banner"><FileCheck2 size={22} /><div><strong>Form 1 structure reference</strong><p>This wording is an accessibility-focused prototype interpretation. Current official MP wording must be checked before production use.</p></div></section><fieldset className="fitness-list"><legend className="visually-hidden">Physical fitness questions</legend>{fitnessQuestions.map((question, index) => { const error = errors[`fitness.${question.id}`]; return <div className={`fitness-question ${error ? 'fitness-question--error' : ''}`} id={`fitness-${question.id}`} key={question.id}><div><span>{index + 1}</span><p>{question.text}</p></div><div className="segmented-choice"><label className={draft.fitnessAnswers[question.id] === 'yes' ? 'selected' : ''}><input type="radio" name={`fitness-${question.id}`} checked={draft.fitnessAnswers[question.id] === 'yes'} onChange={() => answer(question.id, 'yes')} />Yes</label><label className={draft.fitnessAnswers[question.id] === 'no' ? 'selected' : ''}><input type="radio" name={`fitness-${question.id}`} checked={draft.fitnessAnswers[question.id] === 'no'} onChange={() => answer(question.id, 'no')} />No</label></div>{error && <small className="field-error" role="alert">{error}</small>}</div> })}</fieldset></>
}

function ReviewStep({ draft, setDraft, errors }: StepProps) {
  const allErrors = validateAllApplicationSteps(draft)
  const sections = applicationSteps.filter((step) => step !== 'review').map((step) => ({ step, complete: Object.keys(allErrors[step]).length === 0 }))
  const address = draft.presentAddress
  return <><section className="review-intro"><CheckCircle2 size={22} /><div><strong>{sections.filter((section) => section.complete).length} of {sections.length} information sections complete</strong><p>Submission remains synthetic and creates no government record.</p></div></section><div className="review-sections">{sections.map(({ step, complete }) => <section key={step}><div><span className={complete ? 'review-state review-state--complete' : 'review-state'}>{complete ? <Check size={15} /> : '!'}</span><h3>{stepCopy[step].label}</h3></div><FlowLink href={`/mp/ll/application/${step}`}>{complete ? 'Review' : 'Fix section'}</FlowLink></section>)}</div><section className="review-data"><h3>Application summary</h3><dl><div><dt>Applicant</dt><dd>{[draft.firstName, draft.middleName, draft.lastName].filter(Boolean).join(' ') || 'Not provided'}</dd></div><div><dt>Identity route</dt><dd>{draft.identityRoute === 'aadhaar-ekyc' ? 'Synthetic Aadhaar eKYC' : draft.identityRoute === 'documents' ? 'Document-assisted' : 'Not selected'}</dd></div><div><dt>Address</dt><dd>{[address.house, address.locality, address.district, address.pin].filter(Boolean).join(', ') || 'Not provided'}</dd></div><div><dt>Vehicle classes</dt><dd>{draft.vehicleClasses.join(', ') || 'None selected'}</dd></div></dl></section><label className={`consent-box ${errors.declarationAccepted ? 'consent-box--error' : ''}`} id="declarationAccepted"><input type="checkbox" checked={draft.declarationAccepted} onChange={(event) => setDraft({ ...draft, declarationAccepted: event.target.checked })} /><span><strong>I confirm the information is fictional and correct for this demonstration.</strong><small>I understand this does not submit an official LL application.</small>{errors.declarationAccepted && <span className="field-error" role="alert">{errors.declarationAccepted}</span>}</span></label></>
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
  return <><nav className="breadcrumbs" aria-label={local(language, 'Breadcrumb', 'स्थान पथ')}><ol><li><FlowLink href="/mp/services">{local(language, 'Services', 'सेवाएँ')}</FlowLink></li><li><FlowLink href="/mp/ll/start">{local(language, 'Learner’s Licence', 'लर्नर लाइसेंस')}</FlowLink></li><li><span aria-current="page">{pageCopy.label}</span></li></ol></nav><section className="page-title application-title"><div><p className="eyebrow">{local(language, 'Application', 'आवेदन')} · {draft.applicationId}</p><h1 tabIndex={-1}>{pageCopy.title}</h1><p>{pageCopy.description}</p></div><span className="saved-indicator"><Save size={17} /> {local(language, 'Saved automatically', 'अपने-आप सहेजा गया')}</span></section><div className="application-layout"><ApplicationProgress step={step} draft={draft} language={language} /><form className="application-form" onSubmit={submit} noValidate><ErrorSummary errors={errors} language={language} /><StepContent step={step} draft={draft} setDraft={setDraft} errors={errors} language={language} /><div className="form-actions"><FlowLink href={backHref} className="button button--secondary"><ArrowLeft size={18} /> {local(language, 'Back', 'पीछे')}</FlowLink><button type="submit" className="button button--primary">{step === 'review' ? local(language, 'Submit application', 'आवेदन जमा करें') : local(language, 'Save and continue', 'सहेजें और आगे बढ़ें')} <ArrowRight size={18} /></button></div></form></div></>
}

export function SubmittedPage({ onContinue, language }: { onContinue: (draft: LLApplicationDraft) => void; language: AppLanguage }) {
  const draft = useMemo(() => loadApplicationDraft() ?? createEmptyDraft('MP-LL-UNKNOWN'), [])
  return <><nav className="breadcrumbs" aria-label={local(language, 'Breadcrumb', 'स्थान पथ')}><ol><li><FlowLink href="/mp/services">{local(language, 'Services', 'सेवाएँ')}</FlowLink></li><li><span aria-current="page">{local(language, 'Application submitted', 'आवेदन जमा हुआ')}</span></li></ol></nav><section className="submission-card"><span className="submission-card__icon"><BadgeCheck size={34} /></span><p className="eyebrow">{local(language, 'Application acknowledgement', 'आवेदन पावती')}</p><h1 tabIndex={-1}>{local(language, 'Your application has been saved', 'आपका आवेदन सहेज लिया गया है')}</h1><p>{local(language, 'Keep the application number below. You can use it to check progress and continue pending stages.', 'नीचे दिया आवेदन नंबर सुरक्षित रखें। इससे प्रगति देख सकते हैं और बाकी चरण जारी रख सकते हैं।')}</p><dl><div><dt>{local(language, 'Application number', 'आवेदन संख्या')}</dt><dd>{draft.applicationId}</dd></div><div><dt>{local(language, 'Applicant', 'आवेदक')}</dt><dd>{[draft.firstName, draft.lastName].filter(Boolean).join(' ') || local(language, 'Sample applicant', 'नमूना आवेदक')}</dd></div><div><dt>{local(language, 'Submitted', 'जमा करने का समय')}</dt><dd>{draft.submittedAt ? new Date(draft.submittedAt).toLocaleString(language === 'en' ? 'en-IN' : 'hi-IN') : local(language, 'Saved now', 'अभी सहेजा गया')}</dd></div><div><dt>{local(language, 'Next stage', 'अगला चरण')}</dt><dd>{local(language, 'Documents, photograph and signature', 'दस्तावेज़, फोटो और हस्ताक्षर')}</dd></div></dl><div className="submission-actions"><button className="button button--primary" onClick={() => onContinue(draft)}>{local(language, 'Continue to uploads', 'अपलोड पर आगे बढ़ें')} <ArrowRight size={18} /></button><FlowLink href={`/mp/application/${draft.applicationId}`} className="button button--secondary">{local(language, 'View application status', 'आवेदन स्थिति देखें')}</FlowLink></div><div className="privacy-note"><ShieldCheck size={19} /><span><strong>{local(language, 'Keep this reference', 'यह नंबर सुरक्षित रखें')}</strong><small>{local(language, 'This saved review application can be resumed after refreshing this browser.', 'ब्राउज़र रीफ्रेश करने के बाद भी यह सहेजा समीक्षा आवेदन फिर खोला जा सकता है।')}</small></span></div></section></>
}

export function UploadsPage({ applicationId, onComplete, language }: { applicationId: string; onComplete: (draft: LLApplicationDraft) => void; language: AppLanguage }) {
  const [draft, setDraft] = useState<LLApplicationDraft>(() => loadApplicationDraft() ?? createEmptyDraft(applicationId))
  const update = (patch: Partial<LLApplicationDraft>) => { const next = { ...draft, ...patch }; setDraft(next); saveApplicationDraft(next) }
  const complete = draft.documentsUploaded && draft.photoUploaded && draft.signatureUploaded
  return <><nav className="breadcrumbs" aria-label={local(language, 'Breadcrumb', 'स्थान पथ')}><ol><li><FlowLink href="/mp/services">{local(language, 'Services', 'सेवाएँ')}</FlowLink></li><li><FlowLink href={`/mp/application/${applicationId}`}>{local(language, 'Application status', 'आवेदन स्थिति')}</FlowLink></li><li><span aria-current="page">{local(language, 'Uploads', 'अपलोड')}</span></li></ol></nav><section className="page-title"><div><p className="eyebrow">{local(language, 'Application', 'आवेदन')} · {applicationId}</p><h1 tabIndex={-1}>{local(language, 'Documents, photograph and signature', 'दस्तावेज़, फोटो और हस्ताक्षर')}</h1><p>{local(language, 'Check all three previews before confirming this stage.', 'इस चरण की पुष्टि से पहले तीनों पूर्वावलोकन जाँचें।')}</p></div><span className="progress-count">{[draft.documentsUploaded, draft.photoUploaded, draft.signatureUploaded].filter(Boolean).length} / 3 {local(language, 'ready', 'तैयार')}</span></section><div className="upload-grid upload-grid--three"><UploadCard language={language} kind="document" title={local(language, 'Address and age document', 'पता और आयु दस्तावेज़')} description={local(language, 'Prepared fictional document bundle for the selected verification route.', 'चुने सत्यापन विकल्प के लिए तैयार काल्पनिक दस्तावेज़ समूह।')} complete={draft.documentsUploaded} onUse={() => update({ documentsUploaded: true })} onReplace={() => update({ documentsUploaded: false })} /><UploadCard language={language} kind="photo" title={local(language, 'Applicant photograph', 'आवेदक का फोटो')} description={local(language, 'Front-facing fictional portrait with a plain background.', 'सादे बैकग्राउंड वाला सामने से काल्पनिक फोटो।')} complete={draft.photoUploaded} onUse={() => update({ photoUploaded: true })} onReplace={() => update({ photoUploaded: false })} /><UploadCard language={language} kind="signature" title={local(language, 'Applicant signature', 'आवेदक के हस्ताक्षर')} description={local(language, 'Prepared fictional dark signature on a clear light background.', 'साफ हल्के बैकग्राउंड पर तैयार काल्पनिक हस्ताक्षर।')} complete={draft.signatureUploaded} onUse={() => update({ signatureUploaded: true })} onReplace={() => update({ signatureUploaded: false })} /></div><section className="upload-guidance"><Upload size={22} /><div><strong>{local(language, 'Review each preview before saving.', 'सहेजने से पहले हर पूर्वावलोकन जाँचें।')}</strong><p>{local(language, 'This review build uses prepared fictional samples and does not accept real identity files.', 'यह समीक्षा संस्करण तैयार काल्पनिक नमूने उपयोग करता है और वास्तविक पहचान फाइल नहीं लेता।')}</p></div></section><div className="form-actions"><FlowLink href={`/mp/application/${applicationId}`} className="button button--secondary"><ArrowLeft size={18} /> {local(language, 'Application status', 'आवेदन स्थिति')}</FlowLink><button className="button button--primary" disabled={!complete} onClick={() => onComplete(draft)}>{local(language, 'Confirm all uploads', 'सभी अपलोड की पुष्टि करें')} <ArrowRight size={18} /></button></div></>
}

function UploadCard({ title, description, complete, kind, language, onUse, onReplace }: { title: string; description: string; complete: boolean; kind: 'document' | 'photo' | 'signature'; language: AppLanguage; onUse: () => void; onReplace: () => void }) {
  return <article className={`upload-card ${complete ? 'upload-card--complete' : ''}`}><div className="synthetic-preview" aria-hidden="true">{kind === 'photo' ? <UserRoundCheck size={38} /> : kind === 'document' ? <FileText size={36} /> : <span>AV</span>}</div><div><span className="status-pill"><span /> {local(language, 'Prepared sample', 'तैयार नमूना')}</span><h2>{title}</h2><p>{description}</p></div>{complete ? <div className="upload-card__saved"><div className="upload-complete"><CheckCircle2 size={19} /> {local(language, 'Preview checked and saved', 'पूर्वावलोकन जाँचकर सहेजा गया')}</div><button type="button" className="text-button" onClick={onReplace}>{local(language, 'Replace', 'बदलें')}</button></div> : <button type="button" className="button button--secondary" onClick={onUse}>{local(language, 'Preview sample', 'नमूना देखें')}</button>}</article>
}
