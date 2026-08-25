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
  QrCode,
  ReceiptText,
  RefreshCcw,
  ShieldCheck,
  Smartphone,
  Sparkles,
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

function FlowLink({ href, className, children, dataTour }: { href: string; className?: string; children: ReactNode; dataTour?: string }) {
  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigatePortal(href)
  }
  return <a href={href} className={className} onClick={open} data-tour={dataTour}>{children}</a>
}

function Breadcrumbs({ language, applicationId, current }: { language: Language; applicationId: string; current: string }) {
  return (
    <nav className="breadcrumbs" aria-label={local(language, 'Breadcrumb', 'स्थान पथ')}>
      <ol>
        <li><FlowLink href="/mp/services">{local(language, 'Services', 'सेवाएँ')}</FlowLink></li>
        <li><FlowLink href={`/mp/application/${applicationId}`}>{local(language, 'Application status', 'आवेदन स्थिति')}</FlowLink></li>
        <li><span aria-current="page">{current}</span></li>
      </ol>
    </nav>
  )
}

function statusCopy(language: Language, status: PaymentStatus) {
  const values: Record<PaymentStatus, [string, string]> = {
    'not-started': ['Not started', 'शुरू नहीं हुआ'],
    redirecting: ['Opening gateway', 'गेटवे खुल रहा है'],
    pending: ['Payment pending', 'भुगतान लंबित'],
    confirmed: ['Payment successful', 'भुगतान सफल रहा'],
    declined: ['Payment failed', 'भुगतान विफल'],
    cancelled: ['Payment cancelled', 'भुगतान रद्द'],
    'timed-out': ['Gateway timed out', 'गेटवे का समय समाप्त'],
    unknown: ['Status needs checking', 'स्थिति की जाँच आवश्यक'],
  }
  return values[status][language === 'en' ? 0 : 1]
}

function paymentAttemptId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function readinessGuard(language: Language, applicationId: string, progress: LLJourneyProgress) {
  const next = progress.readiness.status === 'passed' ? 'rehearsal' : 'readiness'
  return (
    <>
      <Breadcrumbs language={language} applicationId={applicationId} current={local(language, 'Fee payment', 'शुल्क भुगतान')} />
      <section className="route-guard">
        <LockKeyhole size={32} />
        <p className="eyebrow">{local(language, 'Payment protected', 'भुगतान सुरक्षित')}</p>
        <h1 tabIndex={-1}>{local(language, 'Complete device check first', 'पहले डिवाइस जाँच पूरी करें')}</h1>
        <p>{local(language, 'Payment opens only after this device passes the camera and practice checks.', 'कैमरा और अभ्यास जाँच पूरी होने के बाद ही भुगतान खुलेगा।')}</p>
        <FlowLink className="button button--primary" href={`/mp/application/${applicationId}/${next}`}>
          {local(language, 'Go to device check', 'डिवाइस जाँच पर जाएँ')}
        </FlowLink>
      </section>
    </>
  )
}

function UpiQrPreview({
  language,
  total,
  onSimulatePay,
}: {
  language: Language
  total: number
  onSimulatePay: () => void
}) {
  return (
    <div className="upi-qr-card">
      <div className="upi-qr-card__header">
        <div>
          <strong>{local(language, 'Scan with Any UPI App', 'किसी भी UPI ऐप से स्कैन करें')}</strong>
          <small>{local(language, 'Instant demo settlement · Zero duplicate charge', 'त्वरित डेमो भुगतान · कोई दोहरा शुल्क नहीं')}</small>
        </div>
        <span className="upi-qr-card__badge"><QrCode size={13} /> UPI QR</span>
      </div>
      <div className="upi-qr-card__content">
        <div className="upi-qr-card__qr-wrap">
          <svg className="upi-qr-card__svg" viewBox="0 0 160 160" aria-label="UPI QR Code">
            <rect width="160" height="160" fill="white" rx="8" />
            <rect x="12" y="12" width="40" height="40" fill="#071a34" rx="4" />
            <rect x="18" y="18" width="28" height="28" fill="white" rx="2" />
            <rect x="24" y="24" width="16" height="16" fill="#1d4ed8" rx="2" />
            <rect x="108" y="12" width="40" height="40" fill="#071a34" rx="4" />
            <rect x="114" y="18" width="28" height="28" fill="white" rx="2" />
            <rect x="120" y="24" width="16" height="16" fill="#1d4ed8" rx="2" />
            <rect x="12" y="108" width="40" height="40" fill="#071a34" rx="4" />
            <rect x="18" y="114" width="28" height="28" fill="white" rx="2" />
            <rect x="24" y="120" width="16" height="16" fill="#1d4ed8" rx="2" />
            <rect x="60" y="16" width="10" height="10" fill="#071a34" rx="1" />
            <rect x="76" y="16" width="10" height="10" fill="#1d4ed8" rx="1" />
            <rect x="92" y="16" width="8" height="8" fill="#071a34" rx="1" />
            <rect x="60" y="32" width="8" height="12" fill="#071a34" rx="1" />
            <rect x="74" y="30" width="12" height="8" fill="#071a34" rx="1" />
            <rect x="90" y="32" width="10" height="14" fill="#1d4ed8" rx="1" />
            <rect x="16" y="60" width="10" height="10" fill="#1d4ed8" rx="1" />
            <rect x="32" y="60" width="8" height="12" fill="#071a34" rx="1" />
            <rect x="46" y="60" width="10" height="8" fill="#071a34" rx="1" />
            <rect x="16" y="76" width="14" height="10" fill="#071a34" rx="1" />
            <rect x="36" y="78" width="8" height="8" fill="#1d4ed8" rx="1" />
            <rect x="48" y="74" width="8" height="14" fill="#071a34" rx="1" />
            <rect x="16" y="92" width="8" height="8" fill="#071a34" rx="1" />
            <rect x="30" y="92" width="14" height="8" fill="#1d4ed8" rx="1" />
            <rect x="48" y="92" width="8" height="10" fill="#071a34" rx="1" />
            <rect x="64" y="64" width="32" height="32" fill="#071a34" rx="6" />
            <circle cx="80" cy="80" r="11" fill="#2563eb" />
            <text x="80" y="84" textAnchor="middle" fill="white" fontSize="10" fontWeight="900" fontFamily="sans-serif">₹</text>
            <rect x="60" y="104" width="12" height="10" fill="#071a34" rx="1" />
            <rect x="78" y="102" width="8" height="12" fill="#1d4ed8" rx="1" />
            <rect x="92" y="104" width="10" height="8" fill="#071a34" rx="1" />
            <rect x="108" y="60" width="10" height="12" fill="#071a34" rx="1" />
            <rect x="124" y="62" width="12" height="8" fill="#1d4ed8" rx="1" />
            <rect x="140" y="60" width="8" height="10" fill="#071a34" rx="1" />
            <rect x="108" y="78" width="12" height="10" fill="#1d4ed8" rx="1" />
            <rect x="126" y="76" width="8" height="12" fill="#071a34" rx="1" />
            <rect x="138" y="78" width="10" height="8" fill="#071a34" rx="1" />
            <rect x="60" y="122" width="10" height="12" fill="#1d4ed8" rx="1" />
            <rect x="76" y="120" width="12" height="8" fill="#071a34" rx="1" />
            <rect x="94" y="122" width="8" height="14" fill="#071a34" rx="1" />
            <rect x="60" y="140" width="14" height="8" fill="#071a34" rx="1" />
            <rect x="80" y="138" width="8" height="10" fill="#1d4ed8" rx="1" />
            <rect x="94" y="140" width="10" height="8" fill="#071a34" rx="1" />
            <rect x="108" y="108" width="10" height="10" fill="#071a34" rx="1" />
            <rect x="124" y="108" width="14" height="8" fill="#1d4ed8" rx="1" />
            <rect x="142" y="108" width="6" height="12" fill="#071a34" rx="1" />
            <rect x="108" y="124" width="14" height="8" fill="#1d4ed8" rx="1" />
            <rect x="128" y="122" width="8" height="14" fill="#071a34" rx="1" />
            <rect x="140" y="126" width="8" height="8" fill="#071a34" rx="1" />
            <rect x="108" y="140" width="8" height="8" fill="#071a34" rx="1" />
            <rect x="122" y="140" width="12" height="8" fill="#1d4ed8" rx="1" />
            <rect x="138" y="138" width="10" height="10" fill="#071a34" rx="1" />
          </svg>
        </div>
        <div className="upi-qr-card__details">
          <p className="upi-qr-card__vpa">parivahan.mptransport@sbi</p>
          <p className="upi-qr-card__amount">{money(total, language)}</p>
          <div className="upi-qr-card__apps">
            <span>GPay</span>
            <span>PhonePe</span>
            <span>Paytm</span>
            <span>BHIM</span>
            <span>CRED</span>
          </div>
          <button
            type="button"
            className="button button--secondary button--full upi-qr-card__sim-btn"
            onClick={onSimulatePay}
          >
            <CheckCircle2 size={15} />
            {local(language, 'Simulate UPI App Scan & Pay', 'UPI ऐप से स्कैन और भुगतान सिमुलेट करें')}
          </button>
        </div>
      </div>
    </div>
  )
}

export function PaymentPage({ language, applicationId }: { language: Language; applicationId: string }) {
  const [progress, setProgress] = useState<LLJourneyProgress>(() => loadJourneyProgress(applicationId))
  const [method, setMethod] = useState<PaymentMethod>('upi')
  const [confirmed, setConfirmed] = useState(false)
  const ready = progress.readiness.status === 'passed' && progress.rehearsal.status === 'completed'

  if (!ready) return readinessGuard(language, applicationId, progress)
  if (isPaymentConfirmed(progress.payment)) {
    return (
      <>
        <Breadcrumbs language={language} applicationId={applicationId} current={local(language, 'Fee payment', 'शुल्क भुगतान')} />
        <section className="route-guard route-guard--success">
          <CheckCircle2 size={34} />
          <p className="eyebrow">{local(language, 'No action needed', 'कोई कार्रवाई आवश्यक नहीं')}</p>
          <h1 tabIndex={-1}>{local(language, 'Payment is already complete', 'भुगतान पहले ही पूरा हो चुका है')}</h1>
          <p>{local(language, 'Do not pay again. Your receipt is linked to this application.', 'दोबारा भुगतान न करें। आपकी रसीद इस आवेदन से जुड़ी है।')}</p>
          <FlowLink className="button button--primary" href={`/mp/application/${applicationId}/receipt`}>
            {local(language, 'View receipt', 'रसीद देखें')}
          </FlowLink>
        </section>
      </>
    )
  }
  if (progress.payment.status === 'redirecting') {
    return (
      <>
        <Breadcrumbs language={language} applicationId={applicationId} current={local(language, 'Fee payment', 'शुल्क भुगतान')} />
        <section className="route-guard">
          <ExternalLink size={34} />
          <p className="eyebrow">{local(language, 'Payment in progress', 'भुगतान प्रक्रिया चालू')}</p>
          <h1 tabIndex={-1}>{local(language, 'A payment attempt is already in progress', 'भुगतान प्रक्रिया पहले से चालू है')}</h1>
          <p>{local(language, 'To prevent duplicate charges, please finish or cancel the current payment first.', 'दोबारा पैसे कटने से बचने के लिए पहले चालू भुगतान पूरा करें या रद्द करें।')}</p>
          <FlowLink className="button button--primary" href={`/mp/application/${applicationId}/payment/redirect`}>
            {local(language, 'Continue to payment gateway', 'पेमेंट गेटवे पर जाएँ')}
          </FlowLink>
        </section>
      </>
    )
  }
  if (paymentNeedsReconciliation(progress.payment)) {
    return (
      <>
        <Breadcrumbs language={language} applicationId={applicationId} current={local(language, 'Fee payment', 'शुल्क भुगतान')} />
        <section className="route-guard">
          <Clock3 size={34} />
          <p className="eyebrow">{local(language, 'Checking payment', 'भुगतान की जाँच')}</p>
          <h1 tabIndex={-1}>{local(language, 'Checking earlier payment', 'पिछले भुगतान की जाँच हो रही है')}</h1>
          <p>{local(language, 'We are verifying your previous payment. To prevent paying twice, please check its status first.', 'हम आपके पिछले भुगतान की पुष्टि कर रहे हैं। दोहरे भुगतान से बचने के लिए पहले स्थिति जाँचें।')}</p>
          <FlowLink className="button button--primary" href={`/mp/application/${applicationId}/payment-status`}>
            {local(language, 'Check payment status', 'भुगतान स्थिति जाँचें')}
          </FlowLink>
        </section>
      </>
    )
  }

  const begin = () => {
    let current = progress
    if (current.payment.status === 'declined' || current.payment.status === 'cancelled') current = preparePaymentRetry(current)
    const updated = startSyntheticPayment(current, method, paymentAttemptId())
    saveJourneyProgress(updated)
    setProgress(updated)
    navigatePortal(`/mp/application/${applicationId}/payment/redirect`)
  }

  const instantUpiPay = () => {
    let current = progress
    if (current.payment.status === 'declined' || current.payment.status === 'cancelled') current = preparePaymentRetry(current)
    const started = startSyntheticPayment(current, 'upi', paymentAttemptId())
    const completed = finishSyntheticPayment(started, 'confirmed')
    saveJourneyProgress(completed)
    setProgress(completed)
    navigatePortal(`/mp/application/${applicationId}/payment/return`)
  }

  const total = feeTotal()
  return (
    <>
      <Breadcrumbs language={language} applicationId={applicationId} current={local(language, 'Fee payment', 'शुल्क भुगतान')} />
      <section className="page-title" data-tour="payment-overview">
        <div>
          <p className="eyebrow">{local(language, 'Fee payment', 'शुल्क भुगतान')}</p>
          <h1 tabIndex={-1}>{local(language, 'Review fee and choose payment method', 'शुल्क देखें और भुगतान का तरीका चुनें')}</h1>
          <p>{local(language, 'Your device check and practice are complete. Check the fee details before you pay.', 'आपकी डिवाइस जाँच और अभ्यास पूरे हैं। भुगतान से पहले शुल्क का विवरण जाँच लें।')}</p>
        </div>
      </section>
      {(progress.payment.status === 'declined' || progress.payment.status === 'cancelled') && (
        <div className="lf-alert" role="status">
          <CircleAlert size={20} />
          <div>
            <strong>{local(language, `Previous attempt: ${statusCopy(language, progress.payment.status)}`, `पिछला प्रयास: ${statusCopy(language, progress.payment.status)}`)}</strong>
            <p>{local(language, 'No fee was charged. You can safely try again.', 'कोई शुल्क नहीं कटा। आप सुरक्षित रूप से दोबारा कोशिश कर सकते हैं।')}</p>
          </div>
        </div>
      )}
      <div className="payment-layout">
        <section className="payment-summary" aria-labelledby="fee-summary-title">
          <div className="payment-summary__heading">
            <div>
              <p className="eyebrow">{local(language, 'Fee summary', 'शुल्क सारांश')}</p>
              <h2 id="fee-summary-title">{local(language, "Learner's Licence fee", 'लर्नर लाइसेंस शुल्क')}</h2>
            </div>
            <strong>{money(total, language)}</strong>
          </div>
          <ul>
            {MP_LL_DEMO_FEE.items.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>{local(language, item.labelEn, item.labelHi)}</strong>
                  <small>{local(language, item.explanationEn, item.explanationHi)}</small>
                </div>
                <span>{money(item.amountPaise, language)}</span>
              </li>
            ))}
          </ul>
          <dl>
            <div><dt>{local(language, 'Application number', 'आवेदन संख्या')}</dt><dd>{applicationId}</dd></div>
            <div><dt>{local(language, 'Device check', 'डिवाइस जाँच')}</dt><dd>{local(language, 'Passed', 'पास')}</dd></div>
            <div><dt>{local(language, 'Practice question', 'अभ्यास प्रश्न')}</dt><dd>{local(language, 'Completed', 'पूरा हुआ')}</dd></div>
          </dl>
          <div className="payment-summary__total">
            <span>{local(language, 'Total amount', 'कुल राशि')}</span>
            <strong>{money(total, language)}</strong>
          </div>

          <div className="payment-security-guarantee">
            <div className="payment-security-guarantee__img-wrap">
              <img
                src="/assets/payment-shield.png"
                alt="SafePay Guarantee"
                className="payment-security-guarantee__img"
              />
            </div>
            <div>
              <strong>{local(language, 'Parivahan SafePay Guarantee', 'परिवहन सेफ़पे गारंटी')}</strong>
              <small>{local(language, 'Protected against duplicate charges · Instant digital receipt · Device-verified', 'दोहरे शुल्क से सुरक्षा · तुरंत डिजिटल रसीद · डिवाइस सत्यापित')}</small>
            </div>
          </div>
        </section>

        <section className="payment-methods" aria-labelledby="payment-method-title">
          <p className="eyebrow">{local(language, 'Payment method', 'भुगतान का तरीका')}</p>
          <h2 id="payment-method-title">{local(language, 'Choose how to pay', 'भुगतान का तरीका चुनें')}</h2>
          <fieldset>
            <legend className="visually-hidden">{local(language, 'Payment method', 'भुगतान का तरीका')}</legend>
            {([
              ['upi', Smartphone, 'UPI (QR / App)', local(language, 'Instant Pay via UPI QR, GPay, PhonePe, Paytm', 'UPI QR, GPay, PhonePe, Paytm से तुरंत भुगतान')],
              ['card', CreditCard, local(language, 'Debit or Credit Card', 'डेबिट या क्रेडिट कार्ड'), local(language, 'Visa, Mastercard, RuPay', 'वीज़ा, मास्टरकार्ड, रुपे')],
              ['net-banking', Landmark, local(language, 'Net Banking', 'नेट बैंकिंग'), local(language, 'All major Indian banks (SBI, HDFC, ICICI, etc.)', 'सभी प्रमुख भारतीय बैंक (SBI, HDFC, ICICI)')],
            ] as const).map(([value, Icon, title, detail]) => (
              <label className={`payment-method ${method === value ? 'payment-method--selected' : ''}`} key={value}>
                <input type="radio" name="payment-method" value={value} checked={method === value} onChange={() => setMethod(value)} />
                <Icon size={22} />
                <span>
                  <strong>{title}</strong>
                  <small>{detail}</small>
                </span>
              </label>
            ))}
          </fieldset>

          {method === 'upi' && (
            <UpiQrPreview
              language={language}
              total={total}
              onSimulatePay={instantUpiPay}
            />
          )}

          <details className="context-help">
            <summary><TriangleAlert size={18} /> {local(language, 'What if the payment screen does not return?', 'अगर भुगतान के बाद स्क्रीन वापस न आए?')}</summary>
            <div>
              <p>{local(language, 'Do not pay again immediately. Open the payment status page to check whether your payment went through.', 'तुरंत दोबारा भुगतान न करें। भुगतान स्थिति पेज खोलकर देखें कि भुगतान सफल हुआ या नहीं।')}</p>
            </div>
          </details>
          <label className="consent-box" data-tour="payment-consent">
            <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
            <span>
              <strong>{local(language, 'I have checked the fee and application details.', 'मैंने शुल्क और आवेदन का विवरण देख लिया है।')}</strong>
              <small>{local(language, 'This demo opens a simulated payment gateway. Do not enter real bank or card details.', 'यह डेमो एक सिम्युलेटेड पेमेंट गेटवे खोलेगा। अपने असली बैंक या कार्ड का विवरण न डालें।')}</small>
            </span>
          </label>
        </section>
      </div>
      <div className="journey-contract" aria-label={local(language, 'What is safe right now', 'अभी क्या सुरक्षित है')}>
        <div className="journey-contract__shield-wrap">
          <img
            src="/assets/payment-shield.png"
            alt="Payment Protection"
            className="journey-contract__shield-img"
          />
        </div>
        <div>
          <strong>{local(language, 'What is safe right now', 'अभी क्या सुरक्षित है')}</strong>
          <ul>
            <li>{local(language, 'Application saved securely on this device', 'आवेदन इस डिवाइस पर सुरक्षित सहेजा गया')}</li>
            <li>{local(language, 'No fee charged until authorized in sandbox', 'सैंडबॉक्स में अनुमति से पहले कोई शुल्क नहीं कटेगा')}</li>
            <li>{local(language, 'Device check and practice complete', 'डिवाइस जाँच और अभ्यास पूरा हुआ')}</li>
          </ul>
        </div>
      </div>
      <div className="lf-actions">
        <button className="button button--primary" disabled={!confirmed || paymentBlocksNewAttempt(progress.payment)} onClick={begin} data-tour="payment-start-gateway">
          {local(language, 'Pay now via Gateway', 'गेटवे से भुगतान करें')} <ExternalLink size={18} />
        </button>
        <FlowLink className="button button--secondary" href={`/mp/application/${applicationId}`}>
          <ArrowLeft size={18} /> {local(language, 'Back to application status', 'आवेदन स्थिति पर लौटें')}
        </FlowLink>
      </div>
    </>
  )
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
  return (
    <>
      <Breadcrumbs language={language} applicationId={applicationId} current={local(language, 'Payment gateway', 'पेमेंट गेटवे')} />
      <section className="redirect-panel" data-tour="payment-redirect-overview">
        <span><ExternalLink size={32} /></span>
        <p className="eyebrow">{local(language, 'Opening payment gateway', 'पेमेंट गेटवे खुल रहा है')}</p>
        <h1 tabIndex={-1}>{local(language, 'Opening payment gateway', 'पेमेंट गेटवे खुल रहा है')}</h1>
        <p>{local(language, 'You are moving to the secure payment page to complete this demo payment.', 'डेमो भुगतान पूरा करने के लिए आपको सुरक्षित पेमेंट पेज पर भेजा जा रहा है।')}</p>
        <dl>
          <div><dt>{local(language, 'Amount', 'राशि')}</dt><dd>{money(progress.payment.amountPaise, language)}</dd></div>
          <div><dt>{local(language, 'Method', 'माध्यम')}</dt><dd>{(progress.payment.method ?? 'UPI').toUpperCase()}</dd></div>
          <div><dt>{local(language, 'Application', 'आवेदन')}</dt><dd>{applicationId}</dd></div>
        </dl>
        <div className="lf-actions">
          <button className="button button--primary" onClick={open} data-tour="payment-redirect-continue">
            {local(language, 'Continue to payment gateway', 'पेमेंट गेटवे पर जाएँ')} <ArrowRight size={18} />
          </button>
          <FlowLink className="button button--secondary" href={`/mp/application/${applicationId}/payment`}>
            {local(language, 'Back to fee details', 'शुल्क विवरण पर लौटें')}
          </FlowLink>
        </div>
      </section>
    </>
  )
}

export function GatewayPage({ language, applicationId }: { language: Language; applicationId: string }) {
  const [progress, setProgress] = useState(() => loadJourneyProgress(applicationId))
  const [credential, setCredential] = useState(progress.payment.method === 'upi' ? 'demo@licenceflow' : progress.payment.method === 'card' ? '4242 4242 4242 4242' : 'LicenceFlow Demo Bank')
  const [outcome, setOutcome] = useState<PaymentOutcome>('confirmed')
  const [error, setError] = useState('')

  const authorize = (event: FormEvent) => {
    event.preventDefault()
    if (credential.trim().length < 4) {
      setError(local(language, 'Enter a demo value to continue.', 'आगे बढ़ने के लिए डेमो मान दर्ज करें।'))
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

  if (progress.payment.status !== 'redirecting') {
    return (
      <div className="gateway-shell">
        <main className="gateway-card">
          <CircleAlert size={34} />
          <h1>{local(language, 'This demo session is no longer active', 'यह डेमो सत्र अब सक्रिय नहीं है')}</h1>
          <p>{local(language, 'Return to the portal to check your saved payment status.', 'सहेजी गई स्थिति देखने के लिए पोर्टल पर लौटें।')}</p>
          <FlowLink className="button button--primary" href={`/mp/application/${applicationId}/payment-status`}>
            {local(language, 'Check payment status', 'भुगतान स्थिति जाँचें')}
          </FlowLink>
        </main>
      </div>
    )
  }

  const methodLabel = progress.payment.method === 'upi' ? 'UPI ID' : progress.payment.method === 'card' ? local(language, 'Demo card number', 'डेमो कार्ड नंबर') : local(language, 'Demo bank', 'डेमो बैंक')
  return (
    <div className="gateway-shell">
      <header className="gateway-header">
        <div>
          <span><LockKeyhole size={20} /></span>
          <div>
            <strong>{local(language, 'LicenceFlow Demo Gateway', 'लाइसेंसफ्लो डेमो गेटवे')}</strong>
            <small>{local(language, 'Demo payment session', 'डेमो भुगतान सत्र')}</small>
          </div>
        </div>
        <span className="gateway-sandbox">DEMO</span>
      </header>
      <main className="gateway-card" data-tour="gateway-overview">
        <div className="gateway-merchant">
          <Building2 size={26} />
          <div>
            <small>{local(language, 'Paying', 'भुगतान')}</small>
            <strong>{local(language, 'MP Transport Department (Demo)', 'म.प्र. परिवहन विभाग (डेमो)')}</strong>
          </div>
          <b>{money(progress.payment.amountPaise, language)}</b>
        </div>
        <form onSubmit={authorize}>
          <div className="field">
            <label htmlFor="gateway-credential">{methodLabel}</label>
            <input id="gateway-credential" value={credential} onChange={(event) => { setCredential(event.target.value); setError('') }} aria-describedby="gateway-safety" autoComplete="off" />
          </div>
          {error && <p className="field-error" role="alert">{error}</p>}
          <p id="gateway-safety" className="gateway-safety">
            <ShieldCheck size={17} /> {local(language, 'Use only demo details. Do not enter real bank or card numbers.', 'केवल डेमो जानकारी भरें। असली बैंक या कार्ड नंबर न डालें।')}
          </p>
          <details className="gateway-test-controls">
            <summary>{local(language, 'Demo test outcomes', 'डेमो परिणाम चुनें')} <ChevronDown size={17} /></summary>
            <label htmlFor="gateway-outcome">{local(language, 'Choose result to simulate', 'सिम्युलेट करने के लिए परिणाम चुनें')}</label>
            <select id="gateway-outcome" value={outcome} onChange={(event) => setOutcome(event.target.value as PaymentOutcome)}>
              <option value="confirmed">{local(language, 'Successful payment', 'सफल भुगतान')}</option>
              <option value="pending">{local(language, 'Payment pending', 'भुगतान लंबित')}</option>
              <option value="declined">{local(language, 'Payment failed', 'भुगतान विफल')}</option>
              <option value="cancelled">{local(language, 'Payment cancelled', 'भुगतान रद्द')}</option>
              <option value="timed-out">{local(language, 'Gateway timeout', 'समय समाप्त')}</option>
              <option value="unknown">{local(language, 'Status lost', 'स्थिति खो गई')}</option>
            </select>
          </details>
          <button className="button button--primary button--full" type="submit" data-tour="gateway-complete">
            {local(language, 'Complete demo payment', 'डेमो भुगतान पूरा करें')} <ArrowRight size={18} />
          </button>
          <button className="gateway-cancel" type="button" onClick={cancel}>
            {local(language, 'Cancel and go back', 'रद्द करें और वापस जाएँ')}
          </button>
        </form>
      </main>
      <footer>{local(language, 'Demo payment system · No real money is charged', 'डेमो भुगतान प्रणाली · कोई वास्तविक शुल्क नहीं')}</footer>
    </div>
  )
}

export function PaymentReturnPage({ language, applicationId, onStageChange }: { language: Language; applicationId: string; onStageChange?: StageChange }) {
  const [progress, setProgress] = useState(() => loadJourneyProgress(applicationId))
  const payment = progress.payment
  const confirmed = isPaymentConfirmed(payment)
  const uncertain = paymentNeedsReconciliation(payment)
  const retryable = payment.status === 'declined' || payment.status === 'cancelled'
  const Icon = confirmed ? CheckCircle2 : uncertain ? Clock3 : retryable ? XCircle : RefreshCcw
  const title = confirmed
    ? local(language, 'Payment successful', 'भुगतान सफल रहा')
    : uncertain
      ? local(language, 'Checking payment status', 'भुगतान स्थिति जाँची जा रही है')
      : retryable
        ? local(language, 'Payment was not completed', 'भुगतान पूरा नहीं हुआ')
        : local(language, 'Return to payment status', 'भुगतान स्थिति पर लौटें')
  const body = confirmed
    ? local(language, 'Your receipt is ready. You do not need to pay again.', 'आपकी रसीद तैयार है। दोबारा भुगतान करने की जरूरत नहीं है।')
    : uncertain
      ? local(language, 'Please do not pay again. We are checking your transaction.', 'कृपया दोबारा भुगतान न करें। हम आपके लेन-देन की जाँच कर रहे हैं।')
      : local(language, 'No money was deducted. Your application remains saved.', 'कोई शुल्क नहीं कटा। आपका आवेदन सुरक्षित है।')

  const retry = () => {
    const updated = preparePaymentRetry(progress)
    saveJourneyProgress(updated)
    setProgress(updated)
    navigatePortal(`/mp/application/${applicationId}/payment`)
  }
  useEffect(() => {
    if (confirmed) onStageChange?.('Road-safety tutorial')
  }, [confirmed])
  return (
    <>
      <Breadcrumbs language={language} applicationId={applicationId} current={local(language, 'Payment result', 'भुगतान परिणाम')} />
      <section className={`payment-return payment-return--${payment.status}`} data-tour="payment-return-overview">
        <span><Icon size={36} /></span>
        <p className="eyebrow">{local(language, `Payment status · ${statusCopy(language, payment.status)}`, `भुगतान स्थिति · ${statusCopy(language, payment.status)}`)}</p>
        <h1 tabIndex={-1}>{title}</h1>
        <p>{body}</p>
        <div className="journey-contract">
          <div className="journey-contract__shield-wrap">
            <img
              src="/assets/payment-shield.png"
              alt="Security shield"
              className="journey-contract__shield-img"
            />
          </div>
          <div>
            <strong>{local(language, 'What is safe right now', 'अभी क्या सुरक्षित है')}</strong>
            <ul>
              <li>{local(language, 'Application saved securely', 'आवेदन सुरक्षित सहेजा गया')}</li>
              <li>{confirmed ? local(language, 'Payment confirmed once (Protected)', 'भुगतान एक बार पुष्ट (सुरक्षित)') : uncertain ? local(language, 'Protected from duplicate payment', 'दोहरे भुगतान से सुरक्षित') : local(language, 'No charge made in this demo', 'इस डेमो में कोई शुल्क नहीं कटा')}</li>
              <li>{local(language, 'Device check and practice remain passed', 'डिवाइस जाँच और अभ्यास पूरा हुआ')}</li>
            </ul>
          </div>
        </div>
        <div className="lf-actions">
          {confirmed && (
            <><FlowLink className="button button--primary" href={`/mp/application/${applicationId}/tutorial`} dataTour="payment-continue-tutorial">
              {local(language, 'Continue to road-safety learning', 'सड़क सुरक्षा सीख पर आगे बढ़ें')} <ArrowRight size={18} />
            </FlowLink><FlowLink className="button button--secondary" href={`/mp/application/${applicationId}/receipt`}><ReceiptText size={18} /> {local(language, 'View receipt', 'रसीद देखें')}</FlowLink></>
          )}
          {uncertain && (
            <FlowLink className="button button--primary" href={`/mp/application/${applicationId}/payment-status`}>
              {local(language, 'Check payment status', 'भुगतान स्थिति जाँचें')} <ArrowRight size={18} />
            </FlowLink>
          )}
          {retryable && (
            <button className="button button--primary" onClick={retry}>
              {local(language, 'Try paying again', 'दोबारा भुगतान करें')} <RefreshCcw size={18} />
            </button>
          )}
          <FlowLink className="text-button" href={`/mp/application/${applicationId}`}>
            {local(language, 'Application status', 'आवेदन स्थिति')}
          </FlowLink>
        </div>
      </section>
    </>
  )
}
