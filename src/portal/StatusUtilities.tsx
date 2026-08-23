import { useState, type FormEvent, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, CircleAlert, Clock3, CreditCard, FileSearch, IndianRupee, Printer, ReceiptText, RefreshCw, Search, ShieldCheck, XCircle } from 'lucide-react'
import { isPaymentConfirmed, paymentNeedsReconciliation } from './payment'
import { loadJourneyProgress, reconcileSyntheticPayment, saveJourneyProgress } from './progress'
import { navigatePortal } from './router'

type Language = 'en' | 'hi'
const local = (language: Language, en: string, hi: string) => language === 'en' ? en : hi
const captchas = ['MP42K', 'LL7RX', 'RTO26'] as const
const paymentStatusLabel = (language: Language, status: ReturnType<typeof loadJourneyProgress>['payment']['status']) => {
  const labels = {
    'not-started': ['Not started', 'शुरू नहीं हुआ'],
    redirecting: ['Opening gateway', 'गेटवे खुल रहा है'],
    pending: ['Payment pending', 'भुगतान लंबित'],
    confirmed: ['Payment successful', 'भुगतान सफल रहा'],
    declined: ['Payment failed', 'भुगतान विफल'],
    cancelled: ['Payment cancelled', 'भुगतान रद्द'],
    'timed-out': ['Gateway timed out', 'गेटवे का समय समाप्त'],
    unknown: ['Status needs checking', 'स्थिति की जाँच आवश्यक'],
  } as const
  return labels[status][language === 'en' ? 0 : 1]
}

function FlowLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return <a href={href} className={className} onClick={(event) => { event.preventDefault(); navigatePortal(href) }}>{children}</a>
}

export function ApplicationLookupPage({ language, knownApplicationId }: { language: Language; knownApplicationId?: string }) {
  const [applicationId, setApplicationId] = useState(knownApplicationId ?? '')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [captcha, setCaptcha] = useState('')
  const [captchaIndex, setCaptchaIndex] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const code = captchas[captchaIndex]
  const submit = (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (!applicationId.trim()) next.applicationId = local(language, 'Enter your application number.', 'अपनी आवेदन संख्या दर्ज करें।')
    if (!dateOfBirth) next.dateOfBirth = local(language, 'Enter applicant date of birth.', 'आवेदक की जन्मतिथि दर्ज करें।')
    if (captcha.trim().toUpperCase() !== code) next.captcha = local(language, 'Captcha code does not match.', 'कैप्चा कोड मेल नहीं खाता।')
    setErrors(next)
    if (!Object.keys(next).length) navigatePortal(`/mp/application/${encodeURIComponent(applicationId.trim().toUpperCase())}`)
  }
  return (
    <>
      <nav className="breadcrumbs" aria-label={local(language, 'Breadcrumb', 'स्थान पथ')}>
        <ol>
          <li><FlowLink href="/">{local(language, 'Home', 'होम')}</FlowLink></li>
          <li><FlowLink href="/mp/services">{local(language, 'Driving licence services', 'ड्राइविंग लाइसेंस सेवाएँ')}</FlowLink></li>
          <li><span aria-current="page">{local(language, 'Application status', 'आवेदन स्थिति')}</span></li>
        </ol>
      </nav>
      <section className="page-title">
        <div>
          <p className="eyebrow">{local(language, 'Citizen services', 'नागरिक सेवाएँ')}</p>
          <h1 tabIndex={-1}>{local(language, 'Check application status', 'आवेदन की स्थिति देखें')}</h1>
          <p>{local(language, 'Enter your application number and date of birth to view current progress.', 'अपनी प्रगति देखने के लिए आवेदन संख्या और जन्मतिथि दर्ज करें।')}</p>
        </div>
      </section>
      <div className="lookup-layout">
        <form className="lookup-form" onSubmit={submit} noValidate>
          <div className="section-heading">
            <div>
              <p className="eyebrow">{local(language, 'Application lookup', 'आवेदन खोज')}</p>
              <h2>{local(language, 'Find your application', 'अपना आवेदन खोजें')}</h2>
            </div>
            <FileSearch size={25} />
          </div>
          <div className={`form-field ${errors.applicationId ? 'form-field--error' : ''}`}>
            <label htmlFor="lookup-application">{local(language, 'Application number', 'आवेदन संख्या')} <span className="required-mark">*</span></label>
            <input id="lookup-application" value={applicationId} onChange={(event) => setApplicationId(event.target.value.toUpperCase())} placeholder="MP-LL-DEMO-2408" />
            {errors.applicationId && <small className="field-error" role="alert">{errors.applicationId}</small>}
          </div>
          <div className={`form-field ${errors.dateOfBirth ? 'form-field--error' : ''}`}>
            <label htmlFor="lookup-dob">{local(language, 'Date of birth', 'जन्मतिथि')} <span className="required-mark">*</span></label>
            <input id="lookup-dob" type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} />
            {errors.dateOfBirth && <small className="field-error" role="alert">{errors.dateOfBirth}</small>}
          </div>
          <div className={`form-field ${errors.captcha ? 'form-field--error' : ''}`}>
            <label htmlFor="lookup-captcha">{local(language, 'Captcha', 'कैप्चा')} <span className="required-mark">*</span></label>
            <div className="captcha-row">
              <div className="captcha-code" aria-label={`${local(language, 'Captcha code', 'कैप्चा कोड')} ${code}`}>{code}</div>
              <button type="button" className="captcha-refresh" onClick={() => { setCaptchaIndex((value) => (value + 1) % captchas.length); setCaptcha('') }} aria-label={local(language, 'Show another captcha code', 'दूसरा कैप्चा कोड दिखाएँ')}>
                <RefreshCw size={20} />
              </button>
              <input id="lookup-captcha" value={captcha} onChange={(event) => setCaptcha(event.target.value.toUpperCase())} maxLength={5} placeholder={local(language, 'Enter captcha', 'कैप्चा दर्ज करें')} />
            </div>
            {errors.captcha && <small className="field-error" role="alert">{errors.captcha}</small>}
          </div>
          <button className="button button--primary button--full" type="submit">
            <Search size={18} /> {local(language, 'View application status', 'आवेदन स्थिति देखें')}
          </button>
        </form>
        <aside className="lookup-help">
          <ShieldCheck size={25} />
          <h2>{local(language, 'Demo application details', 'डेमो आवेदन विवरण')}</h2>
          <p>{local(language, 'For testing, use application number MP-LL-DEMO-2408 and any date of birth.', 'परीक्षण के लिए आवेदन संख्या MP-LL-DEMO-2408 और कोई भी जन्मतिथि उपयोग करें।')}</p>
          <dl>
            <div><dt>{local(language, 'Application number', 'आवेदन संख्या')}</dt><dd>{knownApplicationId ?? 'MP-LL-DEMO-2408'}</dd></div>
            <div><dt>{local(language, 'Captcha', 'कैप्चा')}</dt><dd>{code}</dd></div>
          </dl>
        </aside>
      </div>
    </>
  )
}

export function FeeAndReceiptHub({ language, applicationId }: { language: Language; applicationId?: string }) {
  const id = applicationId ?? 'MP-LL-DEMO-2408'
  const actions = [
    { icon: IndianRupee, title: local(language, 'Pay application fee', 'आवेदन शुल्क का भुगतान करें'), body: local(language, 'Review fee details and complete payment.', 'शुल्क विवरण देखें और भुगतान पूरा करें।'), href: `/mp/application/${id}/payment` },
    { icon: Clock3, title: local(language, 'Check payment status', 'भुगतान स्थिति जाँचें'), body: local(language, 'Check whether a payment was successful or is still pending.', 'जाँचें कि भुगतान सफल रहा या अभी लंबित है।'), href: `/mp/application/${id}/payment-status` },
    { icon: ReceiptText, title: local(language, 'View payment receipt', 'भुगतान रसीद देखें'), body: local(language, 'Open and print the receipt for a completed payment.', 'पूरे हो चुके भुगतान की रसीद देखें और प्रिंट करें।'), href: `/mp/application/${id}/receipt` },
  ]
  return (
    <>
      <nav className="breadcrumbs" aria-label={local(language, 'Breadcrumb', 'स्थान पथ')}>
        <ol>
          <li><FlowLink href="/mp/services">{local(language, 'Services', 'सेवाएँ')}</FlowLink></li>
          <li><span aria-current="page">{local(language, 'Fees and receipts', 'शुल्क और रसीदें')}</span></li>
        </ol>
      </nav>
      <section className="page-title">
        <div>
          <p className="eyebrow">{local(language, 'Payment services', 'भुगतान सेवाएँ')}</p>
          <h1 tabIndex={-1}>{local(language, 'Fees, payments and receipts', 'शुल्क, भुगतान और रसीदें')}</h1>
          <p>{local(language, 'Review fee amounts, check transaction status, or print your payment receipt.', 'शुल्क देखें, भुगतान की स्थिति जाँचें या रसीद प्रिंट करें।')}</p>
        </div>
      </section>
      <div className="fee-service-grid">
        {actions.map(({ icon: Icon, title, body, href }) => (
          <FlowLink href={href} key={title}>
            <span><Icon size={25} /></span>
            <div>
              <h2>{title}</h2>
              <p>{body}</p>
            </div>
            <ArrowRight size={20} />
          </FlowLink>
        ))}
      </div>
    </>
  )
}

export function PaymentStatusPage({ language, applicationId }: { language: Language; applicationId: string }) {
  const [progress, setProgress] = useState(() => loadJourneyProgress(applicationId))
  const payment = progress.payment
  const paid = isPaymentConfirmed(payment)
  const uncertain = paymentNeedsReconciliation(payment)
  const definitivelyUnpaid = payment.status === 'not-started' || payment.status === 'declined' || payment.status === 'cancelled'
  const Icon = paid ? CheckCircle2 : uncertain ? Clock3 : definitivelyUnpaid ? XCircle : CircleAlert
  const headline = paid ? local(language, 'Payment successful', 'भुगतान सफल रहा') : uncertain ? local(language, 'Please wait — checking payment', 'कृपया प्रतीक्षा करें — भुगतान जाँचा जा रहा है') : local(language, 'No confirmed payment found', 'कोई सफल भुगतान नहीं मिला')
  const explanation = paid ? local(language, 'This application has a confirmed payment receipt. No further payment is needed.', 'इस आवेदन का भुगतान सफल हो चुका है। दोबारा भुगतान करने की जरूरत नहीं है।') : uncertain ? local(language, 'Your previous payment may still be processing. Check its status before trying again.', 'आपका पिछला भुगतान अभी प्रोसेस हो रहा हो सकता है। दोबारा प्रयास से पहले स्थिति जाँच लें।') : local(language, 'You can complete device checks and proceed to payment review.', 'आप डिवाइस जाँच पूरी करके भुगतान पर आगे बढ़ सकते हैं।')
  const reconcile = (outcome: 'confirmed' | 'declined') => {
    const updated = reconcileSyntheticPayment(progress, outcome)
    saveJourneyProgress(updated)
    setProgress(updated)
  }
  return (
    <>
      <nav className="breadcrumbs" aria-label={local(language, 'Breadcrumb', 'स्थान पथ')}>
        <ol>
          <li><FlowLink href="/mp/services">{local(language, 'Services', 'सेवाएँ')}</FlowLink></li>
          <li><FlowLink href="/mp/service/fee-payment">{local(language, 'Fees and receipts', 'शुल्क और रसीदें')}</FlowLink></li>
          <li><span aria-current="page">{local(language, 'Payment status', 'भुगतान स्थिति')}</span></li>
        </ol>
      </nav>
      <section className="page-title">
        <div>
          <p className="eyebrow">{local(language, 'Application', 'आवेदन')} · {applicationId}</p>
          <h1 tabIndex={-1}>{local(language, 'Payment status', 'भुगतान स्थिति')}</h1>
          <p>{local(language, 'Check whether your payment was processed successfully.', 'जाँचें कि आपका भुगतान सफलतापूर्वक पूरा हुआ या नहीं।')}</p>
        </div>
      </section>
      <section className={`payment-status-card ${paid ? 'payment-status-card--paid' : uncertain ? 'payment-status-card--pending' : ''}`}>
        <span><Icon size={31} /></span>
        <div>
          <p className="eyebrow">{local(language, 'Current transaction state', 'वर्तमान लेन-देन स्थिति')} · {paymentStatusLabel(language, payment.status)}</p>
          <h2>{headline}</h2>
          <p>{explanation}</p>
          {payment.attemptId && (
            <dl>
              <div><dt>{local(language, 'Attempt', 'प्रयास')}</dt><dd>{payment.attemptId}</dd></div>
              <div><dt>{local(language, 'Method', 'माध्यम')}</dt><dd>{payment.method ?? '—'}</dd></div>
              <div><dt>{local(language, 'Reference', 'संदर्भ')}</dt><dd>{payment.reference ?? local(language, 'Not assigned', 'निर्धारित नहीं')}</dd></div>
              <div><dt>{local(language, 'Updated', 'अपडेट')}</dt><dd>{payment.updatedAt ? new Date(payment.updatedAt).toLocaleString(language === 'en' ? 'en-IN' : 'hi-IN') : '—'}</dd></div>
            </dl>
          )}
        </div>
      </section>
      {uncertain && (
        <section className="reconciliation-panel">
          <div>
            <p className="eyebrow">{local(language, 'Demo payment controls', 'डेमो भुगतान नियंत्रण')}</p>
            <h2>{local(language, 'Simulate payment outcome', 'भुगतान परिणाम चुनें')}</h2>
            <p>{local(language, 'These test buttons simulate whether the bank confirmed or declined the payment.', 'ये बटन दिखाते हैं कि बैंक द्वारा भुगतान स्वीकार या अस्वीकार होने पर क्या होता है।')}</p>
          </div>
          <div className="lf-actions">
            <button className="button button--primary" onClick={() => reconcile('confirmed')}>
              {local(language, 'Simulate payment success', 'सफल भुगतान दिखाएँ')}
            </button>
            <button className="button button--secondary" onClick={() => reconcile('declined')}>
              {local(language, 'Simulate payment failure', 'विफल भुगतान दिखाएँ')}
            </button>
          </div>
        </section>
      )}
      {payment.activity.length > 0 && (
        <details className="payment-activity">
          <summary>{local(language, 'See payment activity', 'भुगतान गतिविधि देखें')}</summary>
          <ol>
            {payment.activity.map((item) => (
              <li key={item.id}>
                <span />
                <div>
                  <strong>{local(language, item.titleEn, item.titleHi)}</strong>
                  <p>{local(language, item.detailEn, item.detailHi)}</p>
                  <small>{new Date(item.at).toLocaleString(language === 'en' ? 'en-IN' : 'hi-IN')} · {item.code}</small>
                </div>
              </li>
            ))}
          </ol>
        </details>
      )}
      <div className="form-actions">
        <FlowLink href="/mp/service/fee-payment" className="button button--secondary">
          <ArrowLeft size={18} /> {local(language, 'Back to payment services', 'भुगतान सेवाओं पर लौटें')}
        </FlowLink>
        {paid ? (
          <FlowLink href={`/mp/application/${applicationId}/receipt`} className="button button--primary">
            <ReceiptText size={18} /> {local(language, 'View receipt', 'रसीद देखें')}
          </FlowLink>
        ) : !uncertain ? (
          <FlowLink href={`/mp/application/${applicationId}/payment`} className="button button--primary">
            <CreditCard size={18} /> {local(language, 'Go to fee payment', 'शुल्क भुगतान पर जाएँ')}
          </FlowLink>
        ) : null}
      </div>
    </>
  )
}

export function PaymentReceiptPage({ language, applicationId }: { language: Language; applicationId: string }) {
  const progress = loadJourneyProgress(applicationId)
  const paid = isPaymentConfirmed(progress.payment)
  if (!paid) {
    return (
      <>
        <section className="route-guard">
          <ReceiptText size={38} />
          <p className="eyebrow">{local(language, 'Receipt not available', 'रसीद उपलब्ध नहीं')}</p>
          <h1>{local(language, 'No confirmed payment found', 'कोई सफल भुगतान नहीं मिला')}</h1>
          <p>{local(language, 'A receipt is only generated after a payment is successfully completed.', 'रसीद केवल सफल भुगतान के बाद ही बनती है।')}</p>
          <FlowLink href={`/mp/application/${applicationId}/payment-status`} className="button button--primary">
            {local(language, 'Check payment status', 'भुगतान स्थिति जाँचें')}
          </FlowLink>
        </section>
      </>
    )
  }
  return (
    <>
      <nav className="breadcrumbs" aria-label={local(language, 'Breadcrumb', 'स्थान पथ')}>
        <ol>
          <li><FlowLink href="/mp/service/fee-payment">{local(language, 'Fees and receipts', 'शुल्क और रसीदें')}</FlowLink></li>
          <li><span aria-current="page">{local(language, 'Payment receipt', 'भुगतान रसीद')}</span></li>
        </ol>
      </nav>
      <section className="receipt-sheet" aria-labelledby="receipt-title">
        <div className="receipt-sheet__heading">
          <div>
            <p>{local(language, 'MP Transport Department', 'म.प्र. परिवहन विभाग')}</p>
            <h1 id="receipt-title" tabIndex={-1}>{local(language, 'Learner’s Licence fee receipt', 'लर्नर लाइसेंस शुल्क रसीद')}</h1>
          </div>
          <CheckCircle2 size={31} />
        </div>
        <dl>
          <div><dt>{local(language, 'Application number', 'आवेदन संख्या')}</dt><dd>{applicationId}</dd></div>
          <div><dt>{local(language, 'Payment reference', 'भुगतान संदर्भ')}</dt><dd>{progress.payment.reference}</dd></div>
          <div><dt>{local(language, 'Payment date', 'भुगतान तिथि')}</dt><dd>{progress.payment.confirmedAt ? new Date(progress.payment.confirmedAt).toLocaleString(language === 'en' ? 'en-IN' : 'hi-IN') : '—'}</dd></div>
          <div><dt>{local(language, 'Status', 'स्थिति')}</dt><dd>{local(language, 'Payment successful', 'भुगतान सफल रहा')}</dd></div>
          <div><dt>{local(language, 'Amount', 'राशि')}</dt><dd>{new Intl.NumberFormat(language === 'en' ? 'en-IN' : 'hi-IN', { style: 'currency', currency: 'INR' }).format(progress.payment.amountPaise / 100)}</dd></div>
          <div><dt>{local(language, 'Payment mode', 'भुगतान माध्यम')}</dt><dd>{progress.payment.method ? progress.payment.method.toUpperCase() : local(language, 'Demo gateway', 'डेमो गेटवे')}</dd></div>
        </dl>
        <p className="receipt-sheet__note">{local(language, 'Demo receipt: No real money was charged. This is not an official government receipt.', 'डेमो रसीद: कोई वास्तविक शुल्क नहीं लिया गया। यह आधिकारिक सरकारी रसीद नहीं है।')}</p>
      </section>
      <div className="form-actions">
        <FlowLink href={`/mp/application/${applicationId}/payment-status`} className="button button--secondary">
          <ArrowLeft size={18} /> {local(language, 'Back to payment status', 'भुगतान स्थिति पर लौटें')}
        </FlowLink>
        <button className="button button--primary" onClick={() => window.print()}>
          <Printer size={18} /> {local(language, 'Print receipt', 'रसीद प्रिंट करें')}
        </button>
      </div>
    </>
  )
}
