import { useMemo, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, LockKeyhole, ShieldCheck, Sparkles, UserRound } from 'lucide-react'
import { JUDGE_CREDENTIALS, authenticateDemo, createDemoSession, type DemoSession } from './auth'
import { navigatePortal } from './router'
import { localeFor, translate as local, type Language } from './i18n'

export function LoginPage({ language, onSignedIn }: { language: Language; onSignedIn: (session: DemoSession) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const fillDemoCredentials = () => {
    setUsername(JUDGE_CREDENTIALS.username)
    setPassword(JUDGE_CREDENTIALS.password)
    setErrors({})
  }

  const quickSignInAsJudge = () => {
    onSignedIn(createDemoSession())
    navigatePortal('/mp/services')
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!username.trim()) nextErrors.username = local(language, 'Enter the username.', 'यूज़रनेम दर्ज करें।')
    if (!password) nextErrors.password = local(language, 'Enter the password.', 'पासवर्ड दर्ज करें।')
    if (!nextErrors.username && !nextErrors.password && !authenticateDemo(username, password)) {
      nextErrors.credentials = local(
        language,
        'The username or password is incorrect. Use the demo credentials.',
        'यूज़रनेम या पासवर्ड गलत है। ऊपर दिए डेमो क्रेडेंशियल का उपयोग करें।',
      )
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    onSignedIn(createDemoSession())
    navigatePortal('/mp/services')
  }

  return (
    <div className="login-layout">
      <section className="login-card-split" aria-labelledby="login-title">
        {/* Left Column: Context & 1-Click Reviewer Access */}
        <div className="login-card-split__aside">
          <div>
            <div className="login-card-split__brand">
              <span className="login-card-split__icon" aria-hidden="true">
                <LockKeyhole size={20} />
              </span>
              <div>
                <p className="eyebrow">{local(language, 'Portal login', 'पोर्टल लॉगिन')}</p>
                <h2 className="login-card-split__title">{local(language, 'Reviewer Access', 'समीक्षक एक्सेस')}</h2>
              </div>
            </div>

            <p className="login-card-split__desc">
              {local(
                language,
                'Sign in to access saved applications, live service dashboards, and reviewer tools.',
                'सहेजे गए आवेदन, लाइव सेवा डैशबोर्ड और समीक्षा टूल देखने के लिए साइन इन करें।',
              )}
            </p>
          </div>

          <aside className="judge-credentials" aria-label={local(language, 'Demo review account credentials', 'डेमो समीक्षा खाता विवरण')}>
            <div className="judge-credentials__header">
              <div className="judge-credentials__title">
                <KeyRound size={15} />
                <strong>{local(language, 'Demo review account', 'डेमो समीक्षा खाता')}</strong>
              </div>
              <button type="button" className="judge-credentials__autofill" onClick={fillDemoCredentials}>
                <Sparkles size={12} /> {local(language, 'Auto-fill', 'ऑटो-फिल')}
              </button>
            </div>
            <dl className="judge-credentials__grid">
              <div>
                <dt>{local(language, 'Username', 'यूज़रनेम')}</dt>
                <dd><code>{JUDGE_CREDENTIALS.username}</code></dd>
              </div>
              <div>
                <dt>{local(language, 'Password', 'पासवर्ड')}</dt>
                <dd><code>{JUDGE_CREDENTIALS.password}</code></dd>
              </div>
            </dl>
            <button type="button" className="judge-credentials__quick-btn" onClick={quickSignInAsJudge}>
              <CheckCircle2 size={14} /> {local(language, 'One-click sign in as judge', 'एक क्लिक में साइन इन करें')}
            </button>
          </aside>

          <div className="login-card-split__badge">
            <ShieldCheck size={15} />
            <span>{local(language, '100% Client-side demo environment', '100% क्लाइंट-साइड डेमो वातावरण')}</span>
          </div>
        </div>

        {/* Right Column: Direct Sign-In Form */}
        <div className="login-card-split__main">
          <div className="login-card-split__form-header">
            <h1 id="login-title" tabIndex={-1}>{local(language, 'Sign in', 'साइन इन करें')}</h1>
            <p>{local(language, 'Enter credentials to access your session', 'अपने सत्र में प्रवेश करने के लिए विवरण दर्ज करें')}</p>
          </div>

          <form className="login-form" onSubmit={submit} noValidate>
            {errors.credentials && <div className="login-error" role="alert">{errors.credentials}</div>}

            <div className={`form-field ${errors.username ? 'form-field--error' : ''}`}>
              <label htmlFor="login-username">
                {local(language, 'Username', 'यूज़रनेम')} <span className="required-mark">*</span>
              </label>
              <input
                id="login-username"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="licenceflow.judge"
                aria-invalid={Boolean(errors.username)}
              />
              {errors.username && <small className="field-error" role="alert">{errors.username}</small>}
            </div>

            <div className={`form-field ${errors.password ? 'form-field--error' : ''}`}>
              <label htmlFor="login-password">
                {local(language, 'Password', 'पासवर्ड')} <span className="required-mark">*</span>
              </label>
              <div className="password-field">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  aria-invalid={Boolean(errors.password)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? local(language, 'Hide password', 'पासवर्ड छिपाएँ') : local(language, 'Show password', 'पासवर्ड दिखाएँ')}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <small className="field-error" role="alert">{errors.password}</small>}
            </div>

            <button type="submit" className="button button--primary button--full">
              {local(language, 'Sign in', 'साइन इन करें')} <ArrowRight size={18} />
            </button>

            <div className="login-links">
              <button type="button" className="login-link-btn" onClick={() => setForgotOpen((value) => !value)} aria-expanded={forgotOpen}>
                {local(language, 'Forgot password?', 'पासवर्ड भूल गए?')}
              </button>
              <button type="button" className="login-link-btn" onClick={() => navigatePortal('/')}>
                <ArrowLeft size={15} /> {local(language, 'Back to home', 'होम पेज पर वापस जाएँ')}
              </button>
            </div>

            {forgotOpen && (
              <div className="forgot-help" role="status">
                <ShieldCheck size={16} />
                <p>{local(language, 'For this demo, use the credentials on the left or click One-click sign in.', 'इस डेमो के लिए बाएँ दिए विवरण का उपयोग करें या एक-क्लिक साइन इन पर क्लिक करें।')}</p>
              </div>
            )}
          </form>
        </div>
      </section>
    </div>
  )
}

export function AccountDialog({ language, session, onClose, onSignOut }: { language: Language; session: DemoSession; onClose: () => void; onSignOut: () => void }) {
  const signedInTime = useMemo(() => new Date(session.signedInAt).toLocaleString(localeFor(language), { dateStyle: 'medium', timeStyle: 'short' }), [language, session.signedInAt])
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
