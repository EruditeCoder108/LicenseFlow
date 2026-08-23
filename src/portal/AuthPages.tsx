import { useMemo, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, LockKeyhole, RefreshCw, ShieldCheck, UserRound } from 'lucide-react'
import { JUDGE_CREDENTIALS, authenticateDemo, createDemoSession, type DemoSession } from './auth'
import { navigatePortal } from './router'

type Language = 'en' | 'hi'
const local = (language: Language, en: string, hi: string) => language === 'en' ? en : hi
const captchaCodes = ['LF42M', 'MP7RX', 'RTO26', 'SAFE8'] as const

export function LoginPage({ language, onSignedIn }: { language: Language; onSignedIn: (session: DemoSession) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [captcha, setCaptcha] = useState('')
  const [captchaIndex, setCaptchaIndex] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const captchaCode = captchaCodes[captchaIndex]

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!username.trim()) nextErrors.username = local(language, 'Enter the username.', 'यूज़रनेम दर्ज करें।')
    if (!password) nextErrors.password = local(language, 'Enter the password.', 'पासवर्ड दर्ज करें।')
    if (captcha.trim().toUpperCase() !== captchaCode) nextErrors.captcha = local(language, 'Captcha code does not match. Enter the characters shown.', 'कैप्चा कोड मेल नहीं खाता। दिखाए गए अक्षर दर्ज करें।')
    if (!nextErrors.username && !nextErrors.password && !authenticateDemo(username, password)) nextErrors.credentials = local(language, 'The username or password is incorrect. Use the demo credentials shown above.', 'यूज़रनेम या पासवर्ड गलत है। ऊपर दिए डेमो क्रेडेंशियल का उपयोग करें।')
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    onSignedIn(createDemoSession())
    navigatePortal('/mp/services')
  }

  const refreshCaptcha = () => {
    setCaptchaIndex((value) => (value + 1) % captchaCodes.length)
    setCaptcha('')
    setErrors((current) => ({ ...current, captcha: '' }))
  }

  return (
    <div className="login-layout">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-card__heading">
          <span><LockKeyhole size={29} /></span>
          <p className="eyebrow">{local(language, 'Portal login', 'पोर्टल लॉगिन')}</p>
          <h1 id="login-title" tabIndex={-1}>{local(language, 'Sign in', 'साइन इन करें')}</h1>
          <p>{local(language, 'Sign in to access saved applications, payments, and reviewer tools.', 'सहेजे गए आवेदन, भुगतान और समीक्षा टूल देखने के लिए साइन इन करें।')}</p>
        </div>
        <aside className="judge-credentials" aria-label={local(language, 'Demo review account credentials', 'डेमो समीक्षा खाता विवरण')}>
          <KeyRound size={21} />
          <div>
            <strong>{local(language, 'Demo review account', 'डेमो समीक्षा खाता')}</strong>
            <p style={{ margin: '4px 0 8px', fontSize: '0.85rem' }}>{local(language, 'Use these demo details to sign in:', 'साइन इन करने के लिए इन डेमो विवरणों का उपयोग करें:')}</p>
            <dl>
              <div><dt>{local(language, 'Username', 'यूज़रनेम')}</dt><dd>{JUDGE_CREDENTIALS.username}</dd></div>
              <div><dt>{local(language, 'Password', 'पासवर्ड')}</dt><dd>{JUDGE_CREDENTIALS.password}</dd></div>
            </dl>
          </div>
        </aside>
        <form className="login-form" onSubmit={submit} noValidate>
          {errors.credentials && <div className="login-error" role="alert">{errors.credentials}</div>}
          <div className={`form-field ${errors.username ? 'form-field--error' : ''}`}>
            <label htmlFor="login-username">{local(language, 'Username', 'यूज़रनेम')} <span className="required-mark">*</span></label>
            <input id="login-username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} aria-invalid={Boolean(errors.username)} />
            {errors.username && <small className="field-error" role="alert">{errors.username}</small>}
          </div>
          <div className={`form-field ${errors.password ? 'form-field--error' : ''}`}>
            <label htmlFor="login-password">{local(language, 'Password', 'पासवर्ड')} <span className="required-mark">*</span></label>
            <div className="password-field">
              <input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} aria-invalid={Boolean(errors.password)} />
              <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? local(language, 'Hide password', 'पासवर्ड छिपाएँ') : local(language, 'Show password', 'पासवर्ड दिखाएँ')}>
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && <small className="field-error" role="alert">{errors.password}</small>}
          </div>
          <div className={`form-field ${errors.captcha ? 'form-field--error' : ''}`}>
            <label htmlFor="login-captcha">{local(language, 'Captcha', 'कैप्चा')} <span className="required-mark">*</span></label>
            <div className="captcha-row">
              <div className="captcha-code" aria-label={local(language, `Captcha code ${captchaCode}`, `कैप्चा कोड ${captchaCode}`)}>{captchaCode}</div>
              <button type="button" className="captcha-refresh" onClick={refreshCaptcha} aria-label={local(language, 'Show another captcha code', 'दूसरा कैप्चा कोड दिखाएँ')}>
                <RefreshCw size={20} />
              </button>
              <input id="login-captcha" autoComplete="off" value={captcha} onChange={(event) => setCaptcha(event.target.value.toUpperCase())} maxLength={5} placeholder={local(language, 'Enter captcha', 'कैप्चा दर्ज करें')} aria-invalid={Boolean(errors.captcha)} />
            </div>
            {errors.captcha && <small className="field-error" role="alert">{errors.captcha}</small>}
          </div>
          <button type="submit" className="button button--primary button--full">
            {local(language, 'Sign in', 'साइन इन करें')} <ArrowRight size={18} />
          </button>
          <div className="login-links">
            <button type="button" onClick={() => setForgotOpen((value) => !value)} aria-expanded={forgotOpen}>
              {local(language, 'Forgot password?', 'पासवर्ड भूल गए?')}
            </button>
            <button type="button" onClick={() => navigatePortal('/')}>
              <ArrowLeft size={17} /> {local(language, 'Back to home', 'होम पेज पर वापस जाएँ')}
            </button>
          </div>
          {forgotOpen && (
            <div className="forgot-help" role="status">
              <ShieldCheck size={19} />
              <p>{local(language, 'For this demo, use the credentials shown above. Password reset is not needed.', 'इस डेमो के लिए ऊपर दिए विवरण का उपयोग करें। पासवर्ड रीसेट की जरूरत नहीं है।')}</p>
            </div>
          )}
        </form>
      </section>
    </div>
  )
}

export function AccountDialog({ language, session, onClose, onSignOut }: { language: Language; session: DemoSession; onClose: () => void; onSignOut: () => void }) {
  const signedInTime = useMemo(() => new Date(session.signedInAt).toLocaleString(language === 'en' ? 'en-IN' : 'hi-IN', { dateStyle: 'medium', timeStyle: 'short' }), [language, session.signedInAt])
  return (
    <div className="dialog-layer" onMouseDown={onClose}>
      <section className="help-dialog account-dialog" role="dialog" aria-modal="true" aria-labelledby="account-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="account-dialog__icon"><UserRound size={28} /></div>
        <p className="eyebrow">{local(language, 'Signed in', 'साइन इन हैं')}</p>
        <h2 id="account-title">{session.displayName}</h2>
        <p>{session.username}</p>
        <div className="account-session">
          <CheckCircle2 size={19} />
          <span>{local(language, `Session started: ${signedInTime}`, `सत्र: ${signedInTime}`)}</span>
        </div>
        <div className="account-actions">
          <button className="button button--secondary" onClick={onClose}>{local(language, 'Close', 'बंद करें')}</button>
          <button className="button account-signout" onClick={onSignOut}>{local(language, 'Sign out', 'साइन आउट करें')}</button>
        </div>
      </section>
    </div>
  )
}
