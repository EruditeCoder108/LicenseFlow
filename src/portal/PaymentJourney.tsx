import { useEffect, useState, type FormEvent, type MouseEvent, type ReactNode } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  CreditCard,
  ExternalLink,
  IndianRupee,
  Landmark,
  LockKeyhole,
  ReceiptText,
  RefreshCcw,
  ShieldCheck,
  Smartphone,
  TriangleAlert,
  XCircle,
} from 'lucide-react'
import {
  MP_LL_DEMO_FEE,
  feeTotal,
  isPaymentConfirmed,
  paymentBlocksNewAttempt,
  paymentNeedsReconciliation,
  type PaymentMethod,
  type PaymentOutcome,
  type PaymentStatus,
} from './payment'
import {
  finishSyntheticPayment,
  loadJourneyProgress,
  preparePaymentRetry,
  recordGatewayRedirect,
  saveJourneyProgress,
  startSyntheticPayment,
  type LLJourneyProgress,
} from './progress'
import { navigatePortal } from './router'

type Language = 'en' | 'hi'
type StageChange = (label: string) => void

function local(language: Language, en: string, hi: string) {
  return language === 'en' ? en : hi
}

function money(paise: number, language: Language) {
  return new Intl.NumberFormat(language === 'en' ? 'en-IN' : 'hi-IN', { style: 'currency', currency: 'INR' }).format(paise / 100)
}

function FlowLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigatePortal(href)
  }
  return <a href={href} className={className} onClick={open}>{children}</a>
}

function Breadcrumbs({ language, applicationId, current }: { language: Language; applicationId: string; current: string }) {
  return <nav className="breadcrumbs" aria-label={local(language, 'Breadcrumb', 'पथ')}><ol><li><FlowLink href="/mp/services">{local(language, 'Services', 'सेवाएँ')}</FlowLink></li><li><FlowLink href={`/mp/application/${applicationId}`}>{local(language, 'Application status', 'आवेदन स्थिति')}</FlowLink></li><li><span aria-current="page">{current}</span></li></ol></nav>
}

function statusCopy(language: Language, status: PaymentStatus) {
  const values: Record<PaymentStatus, [string, string]> = {
    'not-started': ['Not started', 'शुरू नहीं हुआ'],
    redirecting: ['Opening gateway', 'गेटवे खुल रहा है'],
    pending: ['Confirmation pending', 'पुष्टि लंबित'],
    confirmed: ['Confirmed', 'पुष्ट'],
    declined: ['Declined', 'अस्वीकृत'],
    cancelled: ['Cancelled', 'रद्द'],
    'timed-out': ['Response timed out', 'उत्तर का समय समाप्त'],
    unknown: ['Status needs checking', 'स्थिति जाँच आवश्यक'],
  }
  return values[status][language === 'en' ? 0 : 1]
}

function paymentAttemptId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function readinessGuard(language: Language, applicationId: string, progress: LLJourneyProgress) {
  const next = progress.readiness.status === 'passed' ? 'rehearsal' : 'readiness'
  return <><Breadcrumbs language={language} applicationId={applicationId} current={local(language, 'Fee payment', 'शुल्क भुगतान')} /><section className="route-guard"><LockKeyhole size={32} /><p className="eyebrow">{local(language, 'Payment protected', 'भुगतान सुरक्षित')}</p><h1 tabIndex={-1}>{local(language, 'Complete the compatibility check first', 'पहले अनुकूलता जाँच पूरी करें')}</h1><p>{local(language, 'Payment stays locked until this device and the answer-recovery rehearsal have both passed.', 'इस डिवाइस और उत्तर-रिकवरी अभ्यास दोनों के सफल होने तक भुगतान बंद रहेगा।')}</p><FlowLink className="button button--primary" href={`/mp/application/${applicationId}/${next}`}>{local(language, 'Continue required check', 'आवश्यक जाँच जारी रखें')}</FlowLink></section></>
}

export function PaymentPage({ language, applicationId }: { language: Language; applicationId: string }) {
  const [progress, setProgress] = useState<LLJourneyProgress>(() => loadJourneyProgress(applicationId))
  const [method, setMethod] = useState<PaymentMethod>('upi')
  const [confirmed, setConfirmed] = useState(false)
  const ready = progress.readiness.status === 'passed' && progress.rehearsal.status === 'completed'

  if (!ready) return readinessGuard(language, applicationId, progress)
  if (isPaymentConfirmed(progress.payment)) return <><Breadcrumbs language={language} applicationId={applicationId} current={local(language, 'Fee payment', 'शुल्क भुगतान')} /><section className="route-guard route-guard--success"><CheckCircle2 size={34} /><p className="eyebrow">{local(language, 'No action needed', 'कोई कार्रवाई आवश्यक नहीं')}</p><h1 tabIndex={-1}>{local(language, 'Payment is already confirmed', 'भुगतान पहले से पुष्ट है')}</h1><p>{local(language, 'Do not pay again. The receipt remains linked to this application.', 'दोबारा भुगतान न करें। रसीद इस आवेदन से जुड़ी हुई है।')}</p><FlowLink className="button button--primary" href={`/mp/application/${applicationId}/receipt`}>{local(language, 'Open receipt', 'रसीद खोलें')}</FlowLink></section></>
  if (progress.payment.status === 'redirecting') return <><Breadcrumbs language={language} applicationId={applicationId} current={local(language, 'Fee payment', 'शुल्क भुगतान')} /><section className="route-guard"><ExternalLink size={34} /><p className="eyebrow">{local(language, 'Payment attempt already active', 'भुगतान प्रयास पहले से सक्रिय')}</p><h1 tabIndex={-1}>{local(language, 'Continue the existing gateway attempt', 'मौजूदा गेटवे प्रयास जारी रखें')}</h1><p>{local(language, 'A second attempt is disabled. Continue the saved redirect or cancel it from the gateway.', 'दूसरा प्रयास बंद है। सहेजा रीडायरेक्ट जारी रखें या गेटवे से इसे रद्द करें।')}</p><FlowLink className="button button--primary" href={`/mp/application/${applicationId}/payment/redirect`}>{local(language, 'Continue to gateway', 'गेटवे पर जारी रखें')}</FlowLink></section></>
  if (paymentNeedsReconciliation(progress.payment)) return <><Breadcrumbs language={language} applicationId={applicationId} current={local(language, 'Fee payment', 'शुल्क भुगतान')} /><section className="route-guard"><Clock3 size={34} /><p className="eyebrow">{local(language, 'System check', 'सिस्टम जाँच')}</p><h1 tabIndex={-1}>{local(language, 'Check the earlier payment before trying again', 'दोबारा प्रयास से पहले पिछले भुगतान की जाँच करें')}</h1><p>{local(language, 'Its final status is not known yet. A second Pay action is disabled to prevent duplicate payment.', 'अंतिम स्थिति अभी ज्ञात नहीं है। दोहरे भुगतान से बचाने के लिए दूसरा भुगतान बंद है।')}</p><FlowLink className="button button--primary" href={`/mp/application/${applicationId}/payment-status`}>{local(language, 'Check payment status', 'भुगतान स्थिति जाँचें')}</FlowLink></section></>

  const begin = () => {
    let current = progress
    if (current.payment.status === 'declined' || current.payment.status === 'cancelled') current = preparePaymentRetry(current)
    const updated = startSyntheticPayment(current, method, paymentAttemptId())
    saveJourneyProgress(updated)
    setProgress(updated)
    navigatePortal(`/mp/application/${applicationId}/payment/redirect`)
  }

  const total = feeTotal()
  return <><Breadcrumbs language={language} applicationId={applicationId} current={local(language, 'Fee payment', 'शुल्क भुगतान')} /><section className="page-title"><div><p className="eyebrow">{local(language, 'Your action · fee review', 'आपकी कार्रवाई · शुल्क समीक्षा')}</p><h1 tabIndex={-1}>{local(language, 'Review the fee and choose how to pay', 'शुल्क देखें और भुगतान का तरीका चुनें')}</h1><p>{local(language, 'Your compatibility check and recovery rehearsal are complete. Review this configured prototype amount before continuing.', 'अनुकूलता जाँच और रिकवरी अभ्यास पूरे हैं। आगे बढ़ने से पहले इस विन्यास योग्य प्रोटोटाइप राशि को देखें।')}</p></div></section>
  {(progress.payment.status === 'declined' || progress.payment.status === 'cancelled') && <div className="lf-alert" role="status"><CircleAlert size={20} /><div><strong>{local(language, `Previous attempt: ${statusCopy(language, progress.payment.status)}`, `पिछला प्रयास: ${statusCopy(language, progress.payment.status)}`)}</strong><p>{local(language, 'No payment was confirmed. You may safely begin a new sandbox attempt.', 'कोई भुगतान पुष्ट नहीं हुआ। आप सुरक्षित रूप से नया सैंडबॉक्स प्रयास शुरू कर सकते हैं।')}</p></div></div>}
  <div className="payment-layout"><section className="payment-summary" aria-labelledby="fee-summary-title"><div className="payment-summary__heading"><div><p className="eyebrow">{local(language, 'Fee summary', 'शुल्क सारांश')}</p><h2 id="fee-summary-title">{local(language, "Learner's Licence", 'लर्नर लाइसेंस')}</h2></div><strong>{money(total, language)}</strong></div><ul>{MP_LL_DEMO_FEE.items.map((item) => <li key={item.id}><div><strong>{local(language, item.labelEn, item.labelHi)}</strong><small>{local(language, item.explanationEn, item.explanationHi)}</small></div><span>{money(item.amountPaise, language)}</span></li>)}</ul><dl><div><dt>{local(language, 'Application number', 'आवेदन संख्या')}</dt><dd>{applicationId}</dd></div><div><dt>{local(language, 'Device check', 'डिवाइस जाँच')}</dt><dd>{local(language, 'Passed', 'सफल')}</dd></div><div><dt>{local(language, 'Recovery rehearsal', 'रिकवरी अभ्यास')}</dt><dd>{local(language, 'Completed', 'पूरा')}</dd></div></dl><div className="payment-summary__total"><span>{local(language, 'Total', 'कुल')}</span><strong>{money(total, language)}</strong></div></section>
  <section className="payment-methods" aria-labelledby="payment-method-title"><p className="eyebrow">{local(language, 'Payment method', 'भुगतान माध्यम')}</p><h2 id="payment-method-title">{local(language, 'Choose a gateway option', 'गेटवे विकल्प चुनें')}</h2><fieldset><legend className="visually-hidden">{local(language, 'Payment method', 'भुगतान माध्यम')}</legend>{([['upi', Smartphone, 'UPI', 'Test UPI ID'], ['card', CreditCard, local(language, 'Card', 'कार्ड'), local(language, 'Test card details', 'परीक्षण कार्ड विवरण')], ['net-banking', Landmark, local(language, 'Net banking', 'नेट बैंकिंग'), local(language, 'Test bank selection', 'परीक्षण बैंक चयन')]] as const).map(([value, Icon, title, detail]) => <label className={`payment-method ${method === value ? 'payment-method--selected' : ''}`} key={value}><input type="radio" name="payment-method" value={value} checked={method === value} onChange={() => setMethod(value)} /><Icon size={22} /><span><strong>{title}</strong><small>{detail}</small></span></label>)}</fieldset><details className="context-help"><summary><TriangleAlert size={18} /> {local(language, 'What if payment does not return?', 'यदि भुगतान वापस न आए तो क्या होगा?')}</summary><div><p>{local(language, 'Do not pay again immediately. Open Payment status so the existing attempt can be checked first.', 'तुरंत दोबारा भुगतान न करें। पहले मौजूदा प्रयास की जाँच के लिए भुगतान स्थिति खोलें।')}</p></div></details><label className="consent-box"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span><strong>{local(language, 'I reviewed the application and amount.', 'मैंने आवेदन और राशि देख ली है।')}</strong><small>{local(language, 'The next page opens a separate sandbox gateway. Do not enter real financial information.', 'अगला पेज अलग सैंडबॉक्स गेटवे खोलेगा। वास्तविक वित्तीय जानकारी दर्ज न करें।')}</small></span></label></section></div>
  <div className="journey-contract" aria-label={local(language, 'What is safe right now', 'अभी क्या सुरक्षित है')}><ShieldCheck size={21} /><div><strong>{local(language, 'What is safe right now', 'अभी क्या सुरक्षित है')}</strong><ul><li>{local(language, 'Application saved', 'आवेदन सहेजा गया')}</li><li>{local(language, 'No payment attempt is active', 'कोई भुगतान प्रयास सक्रिय नहीं है')}</li><li>{local(language, 'Device and recovery checks passed', 'डिवाइस और रिकवरी जाँच सफल हैं')}</li></ul></div></div>
  <div className="lf-actions"><button className="button button--primary" disabled={!confirmed || paymentBlocksNewAttempt(progress.payment)} onClick={begin}>{local(language, 'Continue to secure gateway', 'सुरक्षित गेटवे पर जाएँ')} <ExternalLink size={18} /></button><FlowLink className="button button--secondary" href={`/mp/application/${applicationId}`}><ArrowLeft size={18} /> {local(language, 'Exit safely', 'सुरक्षित रूप से बाहर जाएँ')}</FlowLink></div></>
}

export function PaymentRedirectPage({ language, applicationId }: { language: Language; applicationId: string }) {
  const [progress, setProgress] = useState(() => loadJourneyProgress(applicationId))
  if (progress.payment.status !== 'redirecting') return <PaymentReturnPage language={language} applicationId={applicationId} />
  const open = () => {
    const updated = recordGatewayRedirect(progress)
    saveJourneyProgress(updated)
    setProgress(updated)
    navigatePortal(`/sandbox-gateway/${applicationId}`)
  }
  return <><Breadcrumbs language={language} applicationId={applicationId} current={local(language, 'Gateway redirect', 'गेटवे रीडायरेक्ट')} /><section className="redirect-panel"><span><ExternalLink size={32} /></span><p className="eyebrow">{local(language, 'Leaving department portal', 'विभागीय पोर्टल से बाहर जा रहे हैं')}</p><h1 tabIndex={-1}>{local(language, 'Continue to the secure test gateway', 'सुरक्षित परीक्षण गेटवे पर जाएँ')}</h1><p>{local(language, 'The gateway will authorize this sandbox transaction and return you to the same application. The department portal does not ask for payment credentials here.', 'गेटवे इस सैंडबॉक्स लेन-देन को अधिकृत करके इसी आवेदन पर वापस लाएगा। विभागीय पोर्टल यहाँ भुगतान विवरण नहीं माँगता।')}</p><dl><div><dt>{local(language, 'Amount', 'राशि')}</dt><dd>{money(progress.payment.amountPaise, language)}</dd></div><div><dt>{local(language, 'Method', 'माध्यम')}</dt><dd>{progress.payment.method}</dd></div><div><dt>{local(language, 'Application', 'आवेदन')}</dt><dd>{applicationId}</dd></div></dl><div className="lf-actions"><button className="button button--primary" onClick={open}>{local(language, 'Open secure test gateway', 'सुरक्षित परीक्षण गेटवे खोलें')} <ArrowRight size={18} /></button><FlowLink className="button button--secondary" href={`/mp/application/${applicationId}/payment`}>{local(language, 'Return to fee review', 'शुल्क समीक्षा पर लौटें')}</FlowLink></div></section></>
}

export function GatewayPage({ language, applicationId }: { language: Language; applicationId: string }) {
  const [progress, setProgress] = useState(() => loadJourneyProgress(applicationId))
  const [credential, setCredential] = useState(progress.payment.method === 'upi' ? 'demo@licenceflow' : progress.payment.method === 'card' ? '4242 4242 4242 4242' : 'LicenceFlow Test Bank')
  const [outcome, setOutcome] = useState<PaymentOutcome>('confirmed')
  const [error, setError] = useState('')

  const authorize = (event: FormEvent) => {
    event.preventDefault()
    if (credential.trim().length < 4) {
      setError(local(language, 'Enter the provided fictional test value.', 'दिया गया काल्पनिक परीक्षण मान दर्ज करें।'))
      return
    }
    const updated = finishSyntheticPayment(progress, outcome)
    saveJourneyProgress(updated)
    setProgress(updated)
    navigatePortal(`/mp/application/${applicationId}/payment/return`)
  }

  const cancel = () => {
    const updated = finishSyntheticPayment(progress, 'cancelled')
    saveJourneyProgress(updated)
    setProgress(updated)
    navigatePortal(`/mp/application/${applicationId}/payment/return`)
  }

  if (progress.payment.status !== 'redirecting') return <div className="gateway-shell"><main className="gateway-card"><CircleAlert size={34} /><h1>{local(language, 'This gateway session is no longer active', 'यह गेटवे सत्र अब सक्रिय नहीं है')}</h1><p>{local(language, 'Return to the department portal to check the saved transaction.', 'सहेजे गए लेन-देन की जाँच के लिए विभागीय पोर्टल पर लौटें।')}</p><FlowLink className="button button--primary" href={`/mp/application/${applicationId}/payment-status`}>{local(language, 'Return to department', 'विभाग पर लौटें')}</FlowLink></main></div>

  const methodLabel = progress.payment.method === 'upi' ? 'UPI ID' : progress.payment.method === 'card' ? local(language, 'Test card number', 'परीक्षण कार्ड नंबर') : local(language, 'Test bank', 'परीक्षण बैंक')
  return <div className="gateway-shell"><header className="gateway-header"><div><span><LockKeyhole size={20} /></span><div><strong>{local(language, 'LicenceFlow Test Gateway', 'लाइसेंसफ्लो परीक्षण गेटवे')}</strong><small>{local(language, 'Encrypted sandbox session', 'एन्क्रिप्टेड सैंडबॉक्स सत्र')}</small></div></div><span className="gateway-sandbox">SANDBOX</span></header><main className="gateway-card"><div className="gateway-merchant"><Building2 size={26} /><div><small>{local(language, 'Paying', 'भुगतान')}</small><strong>{local(language, 'Madhya Pradesh Transport Department prototype', 'मध्य प्रदेश परिवहन विभाग प्रोटोटाइप')}</strong></div><b>{money(progress.payment.amountPaise, language)}</b></div><form onSubmit={authorize}><div className="field"><label htmlFor="gateway-credential">{methodLabel}</label><input id="gateway-credential" value={credential} onChange={(event) => { setCredential(event.target.value); setError('') }} aria-describedby="gateway-safety" autoComplete="off" /></div>{error && <p className="field-error" role="alert">{error}</p>}<p id="gateway-safety" className="gateway-safety"><ShieldCheck size={17} /> {local(language, 'Use only the pre-filled fictional value. No bank is contacted.', 'केवल पहले से भरा काल्पनिक मान उपयोग करें। किसी बैंक से संपर्क नहीं होता।')}</p><details className="gateway-test-controls"><summary>{local(language, 'Gateway test controls', 'गेटवे परीक्षण नियंत्रण')} <ChevronDown size={17} /></summary><label htmlFor="gateway-outcome">{local(language, 'Return this test outcome', 'यह परीक्षण परिणाम लौटाएँ')}</label><select id="gateway-outcome" value={outcome} onChange={(event) => setOutcome(event.target.value as PaymentOutcome)}><option value="confirmed">{local(language, 'Successful authorization', 'सफल प्राधिकरण')}</option><option value="pending">{local(language, 'Confirmation pending', 'पुष्टि लंबित')}</option><option value="declined">{local(language, 'Authorization declined', 'प्राधिकरण अस्वीकृत')}</option><option value="cancelled">{local(language, 'Citizen cancelled', 'नागरिक ने रद्द किया')}</option><option value="timed-out">{local(language, 'Gateway timeout', 'गेटवे समय समाप्त')}</option><option value="unknown">{local(language, 'Return status lost', 'वापसी स्थिति खो गई')}</option></select></details><button className="button button--primary button--full" type="submit">{local(language, 'Authorize test payment', 'परीक्षण भुगतान अधिकृत करें')} <ArrowRight size={18} /></button><button className="gateway-cancel" type="button" onClick={cancel}>{local(language, 'Cancel and return', 'रद्द करके लौटें')}</button></form></main><footer>{local(language, 'Independent hackathon sandbox · No real transaction', 'स्वतंत्र हैकाथॉन सैंडबॉक्स · कोई वास्तविक लेन-देन नहीं')}</footer></div>
}

export function PaymentReturnPage({ language, applicationId, onStageChange }: { language: Language; applicationId: string; onStageChange?: StageChange }) {
  const [progress, setProgress] = useState(() => loadJourneyProgress(applicationId))
  const payment = progress.payment
  const confirmed = isPaymentConfirmed(payment)
  const uncertain = paymentNeedsReconciliation(payment)
  const retryable = payment.status === 'declined' || payment.status === 'cancelled'
  const Icon = confirmed ? CheckCircle2 : uncertain ? Clock3 : retryable ? XCircle : RefreshCcw
  const title = confirmed
    ? local(language, 'Payment confirmed and linked', 'भुगतान पुष्ट होकर जुड़ गया')
    : uncertain
      ? local(language, 'Payment status needs checking', 'भुगतान स्थिति की जाँच आवश्यक है')
      : retryable
        ? local(language, `Payment ${payment.status}`, payment.status === 'declined' ? 'भुगतान अस्वीकृत हुआ' : 'भुगतान रद्द हुआ')
        : local(language, 'Return to payment status', 'भुगतान स्थिति पर लौटें')
  const body = confirmed
    ? local(language, 'One sandbox receipt was created. You do not need to pay again.', 'एक सैंडबॉक्स रसीद बनी है। दोबारा भुगतान आवश्यक नहीं है।')
    : uncertain
      ? local(language, 'Do not pay again yet. Check and reconcile this existing attempt first.', 'अभी दोबारा भुगतान न करें। पहले इसी प्रयास की जाँच और मिलान करें।')
      : local(language, 'No payment was confirmed. Your application and readiness results remain saved.', 'कोई भुगतान पुष्ट नहीं हुआ। आपका आवेदन और तैयारी परिणाम सहेजे हुए हैं।')

  const retry = () => {
    const updated = preparePaymentRetry(progress)
    saveJourneyProgress(updated)
    setProgress(updated)
    navigatePortal(`/mp/application/${applicationId}/payment`)
  }
  useEffect(() => {
    if (confirmed) onStageChange?.('Road-safety tutorial')
  }, [confirmed])
  return <><Breadcrumbs language={language} applicationId={applicationId} current={local(language, 'Gateway return', 'गेटवे वापसी')} /><section className={`payment-return payment-return--${payment.status}`}><span><Icon size={36} /></span><p className="eyebrow">{local(language, `Transaction status · ${statusCopy(language, payment.status)}`, `लेन-देन स्थिति · ${statusCopy(language, payment.status)}`)}</p><h1 tabIndex={-1}>{title}</h1><p>{body}</p><div className="journey-contract"><ShieldCheck size={20} /><div><strong>{local(language, 'What is safe right now', 'अभी क्या सुरक्षित है')}</strong><ul><li>{local(language, 'Application saved', 'आवेदन सहेजा गया')}</li><li>{confirmed ? local(language, 'Payment confirmed once', 'भुगतान एक बार पुष्ट') : uncertain ? local(language, 'Existing attempt protected from duplicate payment', 'मौजूदा प्रयास दोहरे भुगतान से सुरक्षित') : local(language, 'No confirmed charge in this sandbox', 'इस सैंडबॉक्स में कोई पुष्ट शुल्क नहीं')}</li><li>{local(language, 'Compatibility and rehearsal remain passed', 'अनुकूलता और अभ्यास सफल बने हुए हैं')}</li></ul></div></div><div className="lf-actions">{confirmed && <FlowLink className="button button--primary" href={`/mp/application/${applicationId}/receipt`}><ReceiptText size={18} /> {local(language, 'Open receipt', 'रसीद खोलें')}</FlowLink>}{uncertain && <FlowLink className="button button--primary" href={`/mp/application/${applicationId}/payment-status`}>{local(language, 'Check existing payment', 'मौजूदा भुगतान जाँचें')} <ArrowRight size={18} /></FlowLink>}{retryable && <button className="button button--primary" onClick={retry}>{local(language, 'Return and try again', 'लौटकर दोबारा प्रयास करें')} <RefreshCcw size={18} /></button>}<FlowLink className="button button--secondary" href={`/mp/application/${applicationId}`}>{local(language, 'Application status', 'आवेदन स्थिति')}</FlowLink></div></section></>
}
