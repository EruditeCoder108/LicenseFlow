import { lazy, Suspense, useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import {
  Accessibility,
  Activity,
  ArrowLeft,
  ArrowRight,
  Award,
  BarChart3,
  Bell,
  Bike,
  BookOpenCheck,
  Building2,
  CalendarDays,
  Camera,
  CarFront,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  ClipboardCheck,
  CreditCard,
  Cpu,
  ExternalLink,
  FileClock,
  FileText,
  Globe,
  Headphones,
  IndianRupee,
  Info,
  Languages,
  Landmark,
  Leaf,
  LogIn,
  MapPinned,
  Menu,
  Mic2,
  MonitorCheck,
  Phone,
  PlayCircle,
  Printer,
  RotateCcw,
  Route as RouteIcon,
  Scale,
  Search,
  ShieldCheck,
  SignpostBig,
  Smartphone,
  Sparkles,
  TrafficCone,
  TrendingUp,
  Truck,
  Upload,
  UserRound,
  UserRoundCheck,
  Wifi,
  X,
  type LucideIcon,
} from 'lucide-react'
import { getService, serviceCategories, serviceCategoryLabels, services, type ServiceDefinition } from './portal/config'
import { navigatePortal, parsePortalRoute, type PortalRoute } from './portal/router'
import { createEmptyDraft, createPreparedDraft, loadApplicationDraft, saveApplicationDraft, type LLApplicationDraft } from './portal/application'
import { isPaymentConfirmed, paymentNeedsReconciliation } from './portal/payment'
import { loadJourneyProgress } from './portal/progress'
import { loadExamSession } from './portal/examSession'
import { clearDemoSession, loadDemoSession, saveDemoSession, type DemoSession } from './portal/auth'
import { deriveJourneyState, getRouteAccess } from './portal/journeyState'
import { JudgeTourCoachmark, JudgeTourFloatingPill, JudgeTourHeroCard, useJudgeTour } from './portal/judgeTour'

const ApplicationFlow = lazy(() => import('./portal/ApplicationFlow').then((module) => ({ default: module.ApplicationFlow })))
const SubmittedPage = lazy(() => import('./portal/ApplicationFlow').then((module) => ({ default: module.SubmittedPage })))
const UploadsPage = lazy(() => import('./portal/ApplicationFlow').then((module) => ({ default: module.UploadsPage })))
const DeviceReadinessPage = lazy(() => import('./portal/ReadinessJourney').then((module) => ({ default: module.DeviceReadinessPage })))
const RehearsalPage = lazy(() => import('./portal/ReadinessJourney').then((module) => ({ default: module.RehearsalPage })))
const GatewayPage = lazy(() => import('./portal/PaymentJourney').then((module) => ({ default: module.GatewayPage })))
const PaymentPage = lazy(() => import('./portal/PaymentJourney').then((module) => ({ default: module.PaymentPage })))
const PaymentRedirectPage = lazy(() => import('./portal/PaymentJourney').then((module) => ({ default: module.PaymentRedirectPage })))
const PaymentReturnPage = lazy(() => import('./portal/PaymentJourney').then((module) => ({ default: module.PaymentReturnPage })))
const TutorialPage = lazy(() => import('./portal/TestJourney').then((module) => ({ default: module.TutorialPage })))
const TestEntryPage = lazy(() => import('./portal/TestJourney').then((module) => ({ default: module.TestEntryPage })))
const TestPage = lazy(() => import('./portal/TestJourney').then((module) => ({ default: module.TestPage })))
const InterruptionPage = lazy(() => import('./portal/TestJourney').then((module) => ({ default: module.InterruptionPage })))
const ResultPage = lazy(() => import('./portal/TestJourney').then((module) => ({ default: module.ResultPage })))
const ResultReviewPage = lazy(() => import('./portal/TestJourney').then((module) => ({ default: module.ResultReviewPage })))
const AccountDialog = lazy(() => import('./portal/AuthPages').then((module) => ({ default: module.AccountDialog })))
const LoginPage = lazy(() => import('./portal/AuthPages').then((module) => ({ default: module.LoginPage })))
const ApplicationLookupPage = lazy(() => import('./portal/StatusUtilities').then((module) => ({ default: module.ApplicationLookupPage })))
const FeeAndReceiptHub = lazy(() => import('./portal/StatusUtilities').then((module) => ({ default: module.FeeAndReceiptHub })))
const PaymentReceiptPage = lazy(() => import('./portal/StatusUtilities').then((module) => ({ default: module.PaymentReceiptPage })))
const PaymentStatusPage = lazy(() => import('./portal/StatusUtilities').then((module) => ({ default: module.PaymentStatusPage })))

type Language = 'en' | 'hi'
type TextScale = 'normal' | 'large'
export type HomeDestination = 'vehicle' | 'permit' | 'safety' | 'information'

const copy = (language: Language, en: string, hi: string) => language === 'en' ? en : hi

function useAccessibleDialog(onClose: () => void) {
  const dialogRef = useRef<HTMLElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(typeof document !== 'undefined' && document.activeElement instanceof HTMLElement ? document.activeElement : null)

  useEffect(() => {
    const dialog = dialogRef.current
    const focusableSelector = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    const focusFirst = () => (dialog?.querySelector<HTMLElement>('[autofocus]') ?? dialog?.querySelector<HTMLElement>(focusableSelector) ?? dialog)?.focus()
    const frame = window.requestAnimationFrame(focusFirst)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !dialog) return
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector)).filter((element) => !element.hasAttribute('disabled') && element.getClientRects().length > 0)
      if (!focusable.length) {
        event.preventDefault()
        dialog.focus()
        return
      }
      const first = focusable[0]!
      const last = focusable.at(-1)!
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previousFocusRef.current?.focus({ preventScroll: true })
    }
  }, [onClose])

  return dialogRef
}

type DemoApplication = {
  version: 1
  id: string
  applicant: string
  lastStage: string
  savedAt: string
}

const CITIZEN_APP_STORAGE_KEY = 'mp-ll-citizen-application-v2'
const DEMO_APP_STORAGE_KEY = 'mp-ll-demo-application-v2'
const LEGACY_APP_STORAGE_KEY = 'mp-ll-demo-application-v1'

const iconByName: Record<ServiceDefinition['icon'], LucideIcon> = {
  learner: UserRoundCheck,
  status: FileClock,
  upload: Upload,
  payment: CreditCard,
  tutorial: BookOpenCheck,
  test: MonitorCheck,
  print: Printer,
  phone: Phone,
  calendar: CalendarDays,
  document: FileText,
  car: CarFront,
}

function usePathname() {
  const [pathname, setPathname] = useState(() => window.location.pathname)
  useEffect(() => {
    const update = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', update)
    return () => window.removeEventListener('popstate', update)
  }, [])
  return pathname
}

function PortalLink({ href, className, children, onNavigate, dataTour }: { href: string; className?: string; children: ReactNode; onNavigate?: () => void; dataTour?: string }) {
  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigatePortal(href)
    onNavigate?.()
  }
  return <a href={href} className={className} onClick={open} data-tour={dataTour}>{children}</a>
}

function PortalMark({ language = 'en', national = false }: { language?: Language; national?: boolean }) {
  return (
    <div className="portal-mark">
      <img
        src="/assets/licenceflow-logo.webp"
        alt="LicenceFlow Logo"
        className="portal-mark__logo"
        width={44}
        height={44}
      />
      <span className="portal-mark__text">
        <span>{national ? copy(language, 'Independent public-service prototype', 'स्वतंत्र सार्वजनिक-सेवा प्रोटोटाइप') : copy(language, 'Madhya Pradesh journey simulation', 'मध्य प्रदेश यात्रा सिमुलेशन')}</span>
        <strong>{national ? copy(language, 'LicenceFlow Transport Demo', 'LicenceFlow परिवहन डेमो') : copy(language, 'Learner’s Licence Services', 'लर्नर लाइसेंस सेवाएँ')}</strong>
        <small>{national ? copy(language, 'Not a government website', 'सरकारी वेबसाइट नहीं') : copy(language, 'Synthetic data · prototype only', 'सिंथेटिक डेटा · केवल प्रोटोटाइप')}</small>
      </span>
    </div>
  )
}

function PortalHeader({ pathname, language, textScale, national, session, onLanguage, onTextScale, onHelp, onAccount }: {
  pathname: string
  language: Language
  textScale: TextScale
  national: boolean
  session: DemoSession | null
  onLanguage: () => void
  onTextScale: () => void
  onHelp: () => void
  onAccount: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const close = () => setMenuOpen(false)

  const isHome = pathname === '/'
  const isServices = pathname === '/mp/services'
  const isLLStart = pathname === '/mp/ll/start' || pathname.startsWith('/mp/ll/application')
  const isAppStatus = pathname.includes('application-status') || pathname.startsWith('/mp/application/')
  const isFeePayment = pathname.includes('fee-payment')

  return (
    <>
      <a className="skip-link" href="#main-content">{copy(language, 'Skip to main content', 'मुख्य सामग्री पर जाएँ')}</a>
      <div className="government-bar">
        <div className="portal-container government-bar__inner">
          <span>{copy(language, 'Build What Moves India · Independent hackathon prototype', 'बिल्ड व्हॉट मूव्स इंडिया · स्वतंत्र हैकाथॉन प्रोटोटाइप')}</span>
          <div className="government-tools" aria-label={copy(language, 'Accessibility tools', 'सुलभता विकल्प')}>
            <button onClick={onTextScale} aria-label={textScale === 'normal' ? copy(language, 'Increase text size', 'अक्षर बड़े करें') : copy(language, 'Use standard text size', 'सामान्य अक्षर आकार रखें')}>
              <Accessibility size={16} aria-hidden="true" /> {textScale === 'normal' ? 'A+' : 'A'}
            </button>
            <button onClick={onLanguage}><Languages size={16} aria-hidden="true" /> {language === 'en' ? 'हिंदी' : 'English'}</button>
            <button onClick={onHelp}><CircleHelp size={16} aria-hidden="true" /> {copy(language, 'Help', 'सहायता')}</button>
            {session ? <button onClick={onAccount}><UserRoundCheck size={16} aria-hidden="true" /> {copy(language, 'Account', 'खाता')}</button> : <PortalLink href="/login" className="government-login"><LogIn size={16} aria-hidden="true" /> {copy(language, 'Login', 'लॉगिन')}</PortalLink>}
          </div>
        </div>
      </div>
      <header className="portal-header">
        <div className="portal-container portal-header__identity">
          <PortalLink href={national ? '/' : '/mp/services'} onNavigate={close}><PortalMark language={language} national={national} /></PortalLink>
          <button className="mobile-menu-button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-controls="portal-navigation" aria-label={menuOpen ? copy(language, 'Close navigation menu', 'नेविगेशन बंद करें') : copy(language, 'Open navigation menu', 'नेविगेशन खोलें')}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}<span>{copy(language, 'Menu', 'मेन्यू')}</span>
          </button>
        </div>
        <nav id="portal-navigation" className={`portal-nav ${menuOpen ? 'portal-nav--open' : ''}`} aria-label={copy(language, 'Primary navigation', 'मुख्य नेविगेशन')}>
          <div className="portal-container portal-nav__inner">
            {national ? <>
              <PortalLink href="/" className={isHome ? 'portal-nav__link--active' : ''} aria-current={isHome ? 'page' : undefined} onNavigate={close}>{copy(language, 'Home', 'होम')}</PortalLink>
              <a href="#citizen-services" onClick={close}>{copy(language, 'Online services', 'ऑनलाइन सेवाएँ')}</a>
              <a href="#ecosystem" onClick={close}>{copy(language, 'Other services', 'अन्य सेवाएँ')}</a>
              <a href="#notices" onClick={close}>{copy(language, 'Updates', 'अपडेट')}</a>
              <a href="#information" onClick={close}>{copy(language, 'Information', 'जानकारी')}</a>
              <PortalLink href="/mp/services" className="portal-nav__pill-link" onNavigate={close}>{copy(language, 'MP DL Services', 'म.प्र. ड्राइविंग सेवाएँ')} <ArrowRight size={13} /></PortalLink>
              <button onClick={() => { close(); onHelp() }}>{copy(language, 'Help', 'सहायता')}</button>
            </> : <>
              <PortalLink href="/" className={isHome ? 'portal-nav__link--active' : ''} aria-current={isHome ? 'page' : undefined} onNavigate={close}>{copy(language, 'Home', 'होम')}</PortalLink>
              <PortalLink href="/mp/services" className={isServices ? 'portal-nav__link--active' : ''} aria-current={isServices ? 'page' : undefined} onNavigate={close}>{copy(language, 'Services', 'सेवाएँ')}</PortalLink>
              <PortalLink href="/mp/ll/start" className={isLLStart ? 'portal-nav__link--active' : ''} aria-current={isLLStart ? 'page' : undefined} onNavigate={close}>{copy(language, 'Apply for LL', 'एलएल के लिए आवेदन')}</PortalLink>
              <PortalLink href="/mp/service/application-status" className={isAppStatus ? 'portal-nav__link--active' : ''} aria-current={isAppStatus ? 'page' : undefined} onNavigate={close}>{copy(language, 'Application status', 'आवेदन की स्थिति')}</PortalLink>
              <PortalLink href="/mp/service/fee-payment" className={isFeePayment ? 'portal-nav__link--active' : ''} aria-current={isFeePayment ? 'page' : undefined} onNavigate={close}>{copy(language, 'Fees & receipts', 'शुल्क और रसीदें')}</PortalLink>
              <button onClick={() => { close(); onHelp() }}>{copy(language, 'Help', 'सहायता')}</button>
            </>}
          </div>
        </nav>
      </header>
    </>
  )
}

function Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => {
          const current = index === items.length - 1
          return (
            <li key={item.label}>
              {item.href && !current ? (
                <PortalLink href={item.href}>{item.label}</PortalLink>
              ) : (
                <span aria-current={current ? 'page' : undefined}>{item.label}</span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function NationalHomePage({ onUnavailable, onDrivingServices, onPrototypeDetails, language, tour }: { onUnavailable: (destination: HomeDestination) => void; onDrivingServices: () => void; onPrototypeDetails: () => void; language: Language; tour: ReturnType<typeof useJudgeTour> }) {
  const [activeNoticeTab, setActiveNoticeTab] = useState<'notifications' | 'advisories' | 'media'>('notifications')

  const serviceCategoriesList = [
    {
      id: 'driving',
      icon: UserRound,
      title: 'Driving licence services',
      titleHi: 'ड्राइविंग लाइसेंस सेवाएँ',
      body: 'Learner licence, permanent DL, renewal and test booking.',
      bodyHi: 'लर्नर लाइसेंस, स्थायी डीएल, नवीनीकरण और परीक्षा स्लॉट।',
      image: '/assets/service-driving-licence.webp',
      href: '/mp/services',
    },
    {
      id: 'vehicle',
      icon: CarFront,
      title: 'Vehicle registration services',
      titleHi: 'वाहन पंजीकरण सेवाएँ',
      body: 'Registration, ownership, permits and vehicle records.',
      bodyHi: 'पंजीकरण, स्वामित्व, परमिट और वाहन रिकॉर्ड।',
      image: '/assets/service-vehicle-reg.webp',
    },
    {
      id: 'permit',
      icon: Truck,
      title: 'Commercial transport services',
      titleHi: 'वाणिज्यिक परिवहन सेवाएँ',
      body: 'National permits, fitness and transport operations.',
      bodyHi: 'राष्ट्रीय परमिट, फिटनेस और परिवहन संचालन।',
      image: '/assets/service-commercial.webp',
    },
    {
      id: 'safety',
      icon: TrafficCone,
      title: 'Road safety services',
      titleHi: 'सड़क सुरक्षा सेवाएँ',
      body: 'Rules, signs, safe-driving guidance and resources.',
      bodyHi: 'नियम, संकेत, सुरक्षित ड्राइविंग मार्गदर्शन और संसाधन।',
      image: '/assets/service-road-safety.webp',
    },
  ]

  const ecosystemApps = [
    {
      id: 'mparivahan',
      icon: Smartphone,
      title: 'mParivahan NextGen',
      titleHi: 'एम-परिवहन नेक्स्ट-जेन',
      tag: 'Mobile App',
      tagHi: 'मोबाइल ऐप',
      tagType: 'blue',
      badgeBg: '#e0f2fe',
      badgeColor: '#0369a1',
      image: '/assets/ecosystem-mparivahan.webp',
      desc: 'Keep your digital RC and Driving Licence on your phone. These digital documents are valid across India.',
      descHi: 'अपने फोन पर डिजिटल RC और Driving Licence रखें। ये डिजिटल दस्तावेज़ पूरे भारत में मान्य हैं।',
    },
    {
      id: 'echallan',
      icon: CreditCard,
      title: 'eChallan Digital System',
      titleHi: 'ई-चालान डिजिटल प्रणाली',
      tag: 'Traffic Enforcement',
      tagHi: 'यातायात अनुपालन',
      tagType: 'amber',
      badgeBg: '#fef3c7',
      badgeColor: '#b45309',
      image: '/assets/ecosystem-echallan.webp',
      desc: 'Check traffic challans, pay fines online and track disputes.',
      descHi: 'ट्रैफिक चालान देखें, जुर्माना ऑनलाइन भरें और विवाद की स्थिति देखें।',
    },
    {
      id: 'pucc',
      icon: Activity,
      title: 'PUCC Online Emissions',
      titleHi: 'पीयूसीसी ऑनलाइन उत्सर्जन',
      tag: 'Pollution Control',
      tagHi: 'प्रदूषण नियंत्रण',
      tagType: 'green',
      badgeBg: '#dcfce7',
      badgeColor: '#15803d',
      image: '/assets/ecosystem-pucc.webp',
      desc: 'Pollution Under Control Certificate check, test history and authorized testing stations.',
      descHi: 'प्रदूषण जांच प्रमाण पत्र की वैधता, टेस्ट इतिहास और अधिकृत केंद्र खोजें।',
    },
    {
      id: 'green',
      icon: Leaf,
      title: 'Vahan Green Sewa',
      titleHi: 'वाहन हरित सेवा',
      tag: 'Clean Mobility',
      tagHi: 'स्वच्छ परिवहन',
      tagType: 'purple',
      badgeBg: '#f3e8ff',
      badgeColor: '#7e22ce',
      image: '/assets/ecosystem-green-sewa.webp',
      desc: 'EV registration incentives, green tax exemption status and CNG/LPG retrofitting approvals.',
      descHi: 'ईवी पंजीकरण सब्सिडी, हरित कर छूट और सीएनजी रेट्रोफिटिंग अनुमोदन।',
    },
  ]

  const engineeringPrinciples = [
    {
      icon: RotateCcw,
      principle: 'Resume, don’t restart',
      principleHi: 'जारी रखें, रीसेट नहीं',
      outcome: 'An interruption should pause the test—not erase the journey.',
      outcomeHi: 'रुकावट से परीक्षा रुकनी चाहिए—पूरी यात्रा मिटनी नहीं चाहिए।',
      proof: 'Forms, synthetic payment, tutorial progress and examination checkpoints survive refreshes and interruptions.',
      proofHi: 'फॉर्म, भुगतान, ट्यूटोरियल और परीक्षा चेकपॉइंट्स रिफ्रेश व बाधाओं के बाद भी सुरक्षित रहते हैं।',
      checkpointFlow: true,
    },
    {
      icon: Scale,
      principle: 'Fair by construction',
      principleHi: 'संरचना से ही निष्पक्ष',
      outcome: 'A retest changes the questions, not the difficulty.',
      outcomeHi: 'पुनः परीक्षा में प्रश्न बदलते हैं, कठिनाई का स्तर नहीं।',
      proof: 'Every attempt receives a seeded 15-question paper maintaining the difficulty blueprint from 50 reviewed questions.',
      proofHi: 'प्रत्येक प्रयास में 50 परीक्षित प्रश्नों से समान कठिनाई संरचना वाला 15-प्रश्नों का संतुलित पेपर मिलता है।',
      checkpointFlow: false,
    },
    {
      icon: ShieldCheck,
      principle: 'Observe, don’t accuse',
      principleHi: 'समझें, आरोप न लगाएँ',
      outcome: 'A camera signal is context—not a verdict.',
      outcomeHi: 'कैमरा संकेत केवल संदर्भ है—दोष का प्रमाण नहीं।',
      proof: 'Short disruptions receive guidance; sustained pauses safely. One camera event never fails a candidate.',
      proofHi: 'हल्की रुकावट पर मार्गदर्शन मिलता है; बड़ी बाधा पर सुरक्षित ठहराव, स्वतः फेल नहीं।',
      checkpointFlow: false,
    },
    {
      icon: Cpu,
      principle: 'Private by architecture',
      principleHi: 'संरचनात्मक गोपनीयता',
      outcome: 'Camera analysis stays on the applicant’s device.',
      outcomeHi: 'कैमरा विश्लेषण आवेदक की डिवाइस पर ही रहता है।',
      proof: 'Local on-device vision model; records no video, transmits no biometric data, and keeps state in browser storage.',
      proofHi: 'स्थानीय ऑन-डिवाइस विज़न मॉडल; कोई वीडियो रिकॉर्ड या बायोमेट्रिक डेटा प्रसारित नहीं होता।',
      checkpointFlow: false,
    },
  ]

  const noticeItems = {
    notifications: [
      {
        tag: 'DEMO SCOPE',
        date: '2026-08-25',
        title: 'One complete prototype journey is available for review',
        titleHi: 'समीक्षा के लिए एक पूरी प्रोटोटाइप यात्रा उपलब्ध है',
        desc: 'The Madhya Pradesh Learner’s Licence flow is interactive; identity, payment, government records and licence issuance remain simulated.',
        descHi: 'मध्य प्रदेश लर्नर लाइसेंस प्रवाह इंटरैक्टिव है; पहचान, भुगतान, सरकारी रिकॉर्ड और लाइसेंस जारी करना सिम्युलेटेड है।',
      },
      {
        tag: 'RELIABILITY',
        date: '2026-08-25',
        title: 'Technical interruptions pause the demo without consuming the attempt',
        titleHi: 'तकनीकी रुकावट पर डेमो प्रयास समाप्त नहीं होता',
        desc: 'Saved answers, the synthetic payment state and the current question survive the demonstrated recovery checkpoint.',
        descHi: 'डेमो रिकवरी चेकपॉइंट में सहेजे उत्तर, सिंथेटिक भुगतान और वर्तमान प्रश्न सुरक्षित रहते हैं।',
      },
      {
        tag: 'RELEASE NOTE',
        date: '2026-08-25',
        title: 'Face-detection model files are served with this prototype',
        titleHi: 'चेहरा पहचान मॉडल फाइलें इसी प्रोटोटाइप से मिलती हैं',
        desc: 'The tested MediaPipe model and WebAssembly assets no longer depend on a separate model CDN during the camera check.',
        descHi: 'कैमरा जाँच के दौरान परीक्षण किया गया MediaPipe मॉडल और WebAssembly फाइलें अलग मॉडल CDN पर निर्भर नहीं हैं।',
      },
    ],
    advisories: [
      {
        tag: 'JUDGE REVIEW',
        date: '2026-08-25',
        title: 'Review shortcuts are always visible and explicitly labelled',
        titleHi: 'समीक्षा शॉर्टकट हमेशा दिखते हैं और स्पष्ट रूप से लेबल किए गए हैं',
        desc: 'Judges can bypass the temporary tutorial and preview a passing result without those actions being presented as citizen behaviour.',
        descHi: 'जज अस्थायी ट्यूटोरियल छोड़कर पास परिणाम देख सकते हैं; ये विकल्प नागरिक प्रक्रिया के रूप में प्रस्तुत नहीं किए जाते।',
      },
      {
        tag: 'PRIVACY',
        date: '2026-08-25',
        title: 'Camera signals are observations, not proof of identity or cheating',
        titleHi: 'कैमरा संकेत पहचान या नकल का प्रमाण नहीं हैं',
        desc: 'This prototype does not record video, perform face recognition or automatically fail an applicant from one camera event.',
        descHi: 'यह प्रोटोटाइप वीडियो रिकॉर्ड, चेहरा पहचान या एक कैमरा घटना से आवेदक को स्वतः असफल नहीं करता।',
      },
    ],
    media: [
      {
        tag: 'TEMPORARY VIDEO',
        date: '2026-08-25',
        title: 'YouTube road-safety material is used for the current demo',
        titleHi: 'वर्तमान डेमो में YouTube सड़क-सुरक्षा सामग्री उपयोग होती है',
        desc: 'It demonstrates full-watch enforcement and resume behaviour. It is not claimed as an official LicenceFlow production course.',
        descHi: 'यह पूरा देखने और फिर शुरू करने का व्यवहार दिखाता है। इसे आधिकारिक LicenceFlow पाठ्यक्रम नहीं कहा गया है।',
      },
      {
        tag: 'REFERENCE',
        date: '2026-08-25',
        title: 'The prototype includes the Parivahan STALL sample question bank',
        titleHi: 'प्रोटोटाइप में परिवहन STALL नमूना प्रश्न बैंक शामिल है',
        desc: 'It is provided as a study reference; LicenceFlow’s 50 text questions are separately worded for this demonstration.',
        descHi: 'यह अध्ययन संदर्भ है; LicenceFlow के 50 टेक्स्ट प्रश्न इस डेमो के लिए अलग शब्दों में हैं।',
      },
    ],
  }

  const informationLinks = [
    { icon: SignpostBig, en: 'Know road signs', hi: 'सड़क संकेत जानें' },
    { icon: FileText, en: 'Forms and documents', hi: 'फॉर्म और दस्तावेज़' },
    { icon: MapPinned, en: 'Find a transport office', hi: 'परिवहन कार्यालय खोजें' },
    { icon: RouteIcon, en: 'Citizen service guide', hi: 'नागरिक सेवा मार्गदर्शिका' },
  ]

  const partnerBadges = [
    { name: 'Parivahan / Sarathi', role: 'Service-flow reference' },
    { name: 'MoRTH CMVR', role: 'Rule-domain reference' },
    { name: 'WCAG', role: 'Accessibility guidance' },
    { name: 'MediaPipe', role: 'On-device face signals' },
    { name: 'Vite + React', role: 'Prototype application stack' },
    { name: 'OpenAI Sites', role: 'Hackathon hosting' },
  ]

  return (
    <div className="national-home">
      <section className="national-hero" aria-labelledby="home-title" data-tour="home-overview">
        <img src="/assets/parivahan-transport-hero.webp" alt="Indian road transport connecting citizens, buses and commercial vehicles" fetchPriority="high" />
        <div className="national-hero__shade" aria-hidden="true" />
        <div className="national-hero__content">
          <p className="eyebrow">{copy(language, 'LicenceFlow public-service prototype', 'LicenceFlow सार्वजनिक-सेवा प्रोटोटाइप')}</p>
          <h1 id="home-title" tabIndex={-1}>{copy(language, 'Road transport services in one place', 'सड़क परिवहन सेवाएँ एक ही स्थान पर')}</h1>
          <p>{copy(language, 'Find licence, vehicle, permit and road-safety services with clear guidance at every step.', 'लाइसेंस, वाहन, परमिट और सड़क सुरक्षा सेवाएँ हर चरण पर स्पष्ट मार्गदर्शन के साथ पाएँ।')}</p>
          <div className="national-hero__actions">
            <a className="button button--light" href="#citizen-services">{copy(language, 'Explore services', 'सेवाएँ देखें')} <ArrowRight size={18} /></a>
            <button className="button national-hero__secondary" type="button" onClick={onDrivingServices} data-tour="hero-driving-services">{copy(language, 'Driving licence services', 'ड्राइविंग लाइसेंस सेवाएँ')}</button>
          </div>
        </div>
      </section>

      {/* Hero Onboarding Card on Homepage */}
      <JudgeTourHeroCard tour={tour} language={language} />

      {/* Engineering Evidence Dossier Strip */}
      <section className="engineering-dossier-strip" aria-label={copy(language, 'Engineering decisions', 'इंजीनियरिंग निर्णय')}>
        <div className="engineering-dossier-header">
          <div className="engineering-dossier-header__title-group">
            <p className="eyebrow">{copy(language, 'Engineering Decisions', 'इंजीनियरिंग निर्णय')}</p>
            <h2>{copy(language, 'Designed around the moments that usually make applicants start again', 'उन रुकावटों के लिए डिज़ाइन किया गया जहाँ अक्सर दोबारा शुरू करना पड़ता है')}</h2>
          </div>
          <p className="engineering-dossier-header__desc">
            {copy(language, 'LicenceFlow protects continuity, fairness and privacy when the journey becomes unreliable.', 'लाइसेंसफ़्लो निरंतरता, निष्पक्षता और गोपनीयता की सुरक्षा करता है जब परिस्थितियाँ अस्थिर हो जाएँ।')}
          </p>
        </div>

        <div className="engineering-dossier-grid">
          {engineeringPrinciples.map((item, idx) => {
            const Icon = item.icon
            return (
              <article className="engineering-dossier-card" key={idx}>
                <div className="engineering-dossier-card__header">
                  <span className="engineering-dossier-card__marker" aria-hidden="true">
                    <Icon size={16} />
                  </span>
                  <strong className="engineering-dossier-card__principle">
                    {copy(language, item.principle, item.principleHi)}
                  </strong>
                </div>
                <p className="engineering-dossier-card__outcome">
                  {copy(language, item.outcome, item.outcomeHi)}
                </p>
                <div className="engineering-dossier-card__proof">
                  <p>{copy(language, item.proof, item.proofHi)}</p>
                  {item.checkpointFlow && (
                    <div className="engineering-dossier-card__flow" aria-label={copy(language, 'Preserved journey stages', 'सुरक्षित यात्रा चरण')}>
                      <span>Form</span>
                      <span className="flow-arrow">→</span>
                      <span>Payment</span>
                      <span className="flow-arrow">→</span>
                      <span>Learning</span>
                      <span className="flow-arrow">→</span>
                      <span>Test</span>
                      <span className="flow-arrow">→</span>
                      <span>Result</span>
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {/* 4 Primary Service Cards with 3D Showcase */}
      <section id="citizen-services" className="home-section" aria-labelledby="citizen-services-title" data-tour="home-service-cards">
        <div className="home-section__heading">
          <div>
            <p className="eyebrow">{copy(language, 'Online services', 'ऑनलाइन सेवाएँ')}</p>
            <h2 id="citizen-services-title">{copy(language, 'What would you like to do?', 'आप क्या करना चाहते हैं?')}</h2>
          </div>
          <p>{copy(language, 'Choose a service area to see the available citizen services.', 'उपलब्ध नागरिक सेवाएँ देखने के लिए एक सेवा क्षेत्र चुनें।')}</p>
        </div>
        <div className="home-service-grid">
          {serviceCategoriesList.map((service) => {
            const Icon = service.icon
            const content = (
              <>
                <div className="home-service-card__showcase" aria-hidden="true">
                  <img src={service.image} alt="" loading="lazy" />
                </div>
                <div className="home-service-card__body">
                  <div className="home-service-card__header">
                    <span className="home-service-card__icon"><Icon size={18} /></span>
                    <strong>{copy(language, service.title, service.titleHi)}</strong>
                  </div>
                  <p>{copy(language, service.body, service.bodyHi)}</p>
                  <div className="home-service-card__footer">
                    <span>{copy(language, 'Access service', 'सेवा खोलें')}</span>
                    <ArrowRight size={16} />
                  </div>
                </div>
              </>
            )
            return service.href ? (
              <button type="button" onClick={onDrivingServices} className="home-service-card" key={service.id} data-tour="home-driving-services-card">
                {content}
              </button>
            ) : (
              <button type="button" className="home-service-card" key={service.id} onClick={() => onUnavailable(service.id as HomeDestination)}>
                {content}
              </button>
            )
          })}
        </div>
      </section>

      {/* Parivahan Digital Ecosystem Cards */}
      <section id="ecosystem" className="home-section" aria-labelledby="ecosystem-title">
        <div className="home-section__heading">
          <div>
            <p className="eyebrow">{copy(language, 'Other online services', 'अन्य ऑनलाइन सेवाएँ')}</p>
            <h2 id="ecosystem-title">{copy(language, 'Other Parivahan apps and services', 'अन्य परिवहन ऐप्स और सेवाएँ')}</h2>
          </div>
          <p>{copy(language, 'Use other online transport services for challans, pollution checks, mobile documents and green vehicles.', 'चालान, प्रदूषण जाँच, मोबाइल दस्तावेज़ और ग्रीन वाहन सेवाएँ ऑनलाइन देखें।')}</p>
        </div>
        <div className="ecosystem-grid">
          {ecosystemApps.map((app) => {
            const AppIcon = app.icon
            return (
              <button
                type="button"
                className="ecosystem-card"
                key={app.id}
                onClick={() => onUnavailable('information')}
              >
                <div className="ecosystem-card__backdrop" aria-hidden="true">
                  <img src={app.image} alt="" loading="lazy" />
                </div>
                <div className="ecosystem-card__content">
                  <div className="ecosystem-card__header-row">
                    <span className="ecosystem-card__icon" style={{ background: app.badgeBg, color: app.badgeColor }}>
                      <AppIcon size={18} />
                    </span>
                    <span className={`tag-pill tag-pill--${app.tagType}`}>{copy(language, app.tag, app.tagHi)}</span>
                  </div>
                  <strong className="ecosystem-card__title">{copy(language, app.title, app.titleHi)}</strong>
                  <p className="ecosystem-card__desc">{copy(language, app.desc, app.descHi)}</p>
                  <div className="ecosystem-card__footer">
                    <span>{copy(language, 'Open service', 'सेवा खोलें')}</span>
                    <ArrowRight size={16} />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* Tabbed Notice Board / Circulars */}
      <section id="notices" className="home-section notice-board-section" aria-labelledby="notice-board-title">
        <div className="home-section__heading">
          <div>
            <p className="eyebrow">{copy(language, 'Updates', 'अपडेट')}</p>
            <h2 id="notice-board-title">{copy(language, 'Latest updates and notices', 'नवीनतम अपडेट और सूचनाएँ')}</h2>
          </div>
          <div className="notice-tab-group" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeNoticeTab === 'notifications'}
              className={`notice-tab-button ${activeNoticeTab === 'notifications' ? 'notice-tab-button--active' : ''}`}
              onClick={() => setActiveNoticeTab('notifications')}
            >
              <Bell size={16} />
              <span>{copy(language, 'Notifications', 'सूचनाएँ')}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeNoticeTab === 'advisories'}
              className={`notice-tab-button ${activeNoticeTab === 'advisories' ? 'notice-tab-button--active' : ''}`}
              onClick={() => setActiveNoticeTab('advisories')}
            >
              <Award size={16} />
              <span>{copy(language, 'Advisories', 'परामर्श व उपलब्धियाँ')}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeNoticeTab === 'media'}
              className={`notice-tab-button ${activeNoticeTab === 'media' ? 'notice-tab-button--active' : ''}`}
              onClick={() => setActiveNoticeTab('media')}
            >
              <PlayCircle size={16} />
              <span>{copy(language, 'Guides & videos', 'गाइड और वीडियो')}</span>
            </button>
          </div>
        </div>

        <div className="notice-board-feed">
          {noticeItems[activeNoticeTab].map((item, idx) => (
            <article className="notice-feed-card" key={idx}>
              <div className="notice-feed-card__meta">
                <span className="tag-pill tag-pill--blue">{item.tag}</span>
                <time dateTime={item.date}>{item.date}</time>
              </div>
              <strong className="notice-feed-card__title">{copy(language, item.title, item.titleHi)}</strong>
              <p className="notice-feed-card__desc">{copy(language, item.desc, item.descHi)}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Informational Guidance */}
      <section id="information" className="home-information" aria-labelledby="information-title">
        <div className="home-information__intro">
          <p className="eyebrow">{copy(language, 'Information', 'जानकारी')}</p>
          <h2 id="information-title">{copy(language, 'Know what you need before you start', 'शुरू करने से पहले जानें कि क्या चाहिए')}</h2>
          <p>{copy(language, 'Get simple help with documents, road rules and finding the right office.', 'दस्तावेज़, सड़क नियम और सही कार्यालय खोजने के लिए सरल मदद पाएँ।')}</p>
        </div>
        <div className="home-information__links">
          {informationLinks.map(({ icon: Icon, en, hi }) => (
            <button type="button" key={en} onClick={() => onUnavailable('information')}>
              <Icon size={22} />
              <span>{copy(language, en, hi)}</span>
              <ArrowRight size={18} />
            </button>
          ))}
        </div>
      </section>

      {/* Quick Actions & FAQ Section */}
      <section id="updates" className="home-updates" aria-label={copy(language, 'Updates and help', 'अपडेट और सहायता')}>
        <article>
          <div className="home-section__heading">
            <div>
              <p className="eyebrow">{copy(language, 'Quick actions', 'त्वरित कार्य')}</p>
              <h2>{copy(language, 'Continue a service', 'सेवा जारी रखें')}</h2>
            </div>
          </div>
          <div className="home-action-list">
            <PortalLink href="/mp/service/application-status">
              <FileClock size={21} />
              <span>
                <strong>{copy(language, 'Check application status', 'आवेदन की स्थिति देखें')}</strong>
                <small>{copy(language, 'Use an application number to view progress.', 'प्रगति देखने के लिए आवेदन संख्या का उपयोग करें।')}</small>
              </span>
              <ArrowRight size={19} />
            </PortalLink>
            <PortalLink href="/mp/service/fee-payment">
              <IndianRupee size={21} />
              <span>
                <strong>{copy(language, 'Fee and receipt services', 'शुल्क और रसीद सेवाएँ')}</strong>
                <small>{copy(language, 'Review payment status and receipts.', 'भुगतान स्थिति और रसीदें देखें।')}</small>
              </span>
              <ArrowRight size={19} />
            </PortalLink>
          </div>
        </article>
        <article>
          <div className="home-section__heading">
            <div>
              <p className="eyebrow">{copy(language, 'Frequently asked questions', 'अक्सर पूछे जाने वाले प्रश्न')}</p>
              <h2>{copy(language, 'Common questions', 'सामान्य प्रश्न')}</h2>
            </div>
          </div>
          <div className="home-faq">
            <details>
              <summary>{copy(language, 'How do I apply for a Learner’s Licence in MP?', 'मध्य प्रदेश में लर्नर लाइसेंस के लिए आवेदन कैसे करें?')}</summary>
              <p>{copy(language, 'Open Driving licence services, choose Apply for a new Learner’s Licence, complete your e-KYC, and take the online proctored test.', 'ड्राइविंग लाइसेंस सेवाएँ खोलें, नया लर्नर लाइसेंस आवेदन चुनें, ई-केवाईसी पूरा करें और ऑनलाइन टेस्ट दें।')}</p>
            </details>
            <details>
              <summary>{copy(language, 'Can I check my application progress later?', 'क्या मैं अपना आवेदन बाद में देख सकता/सकती हूँ?')}</summary>
              <p>{copy(language, 'Yes. Application status shows completed milestones, fees and the next action required.', 'हाँ। आवेदन स्थिति में पूरा काम, शुल्क और अगला जरूरी चरण दिखाई देता है।')}</p>
            </details>
            <details>
              <summary>{copy(language, 'Where can I get help on any page?', 'किसी पेज पर सहायता कहाँ मिलेगी?')}</summary>
              <p>{copy(language, 'Use Help in the top navigation bar for step-by-step requirements and what to expect next.', 'उस पेज की आवश्यकताएँ और अगला चरण समझने के लिए ऊपर सहायता चुनें।')}</p>
            </details>
          </div>
        </article>
      </section>

      <section className="national-partner-strip" aria-label={copy(language, 'Design and technology references', 'डिज़ाइन और तकनीकी संदर्भ')}>
        <p className="partner-strip__heading">{copy(language, 'References used — no partnership or endorsement implied', 'उपयोग किए गए संदर्भ — साझेदारी या समर्थन का दावा नहीं')}</p>
        <div className="partner-badge-grid">
          {partnerBadges.map((partner, idx) => (
            <div className="partner-badge-item" key={idx}>
              <div className="partner-badge-icon">
                <Landmark size={20} />
              </div>
              <div className="partner-badge-text">
                <strong>{partner.name}</strong>
                <small>{partner.role}</small>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function StatusPill({ delivery, language = 'en' }: { delivery: ServiceDefinition['delivery']; language?: Language }) {
  const label = delivery === 'working-journey'
    ? copy(language, 'Available', 'उपलब्ध')
    : delivery === 'working-utility'
      ? copy(language, 'Available', 'उपलब्ध')
      : copy(language, 'Information', 'जानकारी')
  return <span className={`status-pill status-pill--${delivery}`}><span aria-hidden="true" />{label}</span>
}

function ServiceCard({ service, language }: { service: ServiceDefinition; language: Language }) {
  const Icon = iconByName[service.icon]
  return (
    <PortalLink href={service.route ?? `/mp/service/${service.id}`} className="service-card">
      <span className="service-card__icon" aria-hidden="true"><Icon size={24} /></span>
      <span className="service-card__body">
        <span className="service-card__title">{language === 'en' ? service.name : service.nameHi}</span>
        <span className="service-card__summary">{language === 'en' ? service.summary : service.summaryHi}</span>
      </span>
      <ArrowRight className="service-card__arrow" size={19} aria-hidden="true" />
    </PortalLink>
  )
}

function parseApplicationRecord(raw: string | null): DemoApplication | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<DemoApplication>
    if (parsed.version !== undefined && parsed.version !== 1) return null
    if (typeof parsed.id !== 'string' || !/^MP-LL-[A-Z0-9-]{4,24}$/i.test(parsed.id)) return null
    if (typeof parsed.applicant !== 'string' || parsed.applicant.length > 100) return null
    if (typeof parsed.lastStage !== 'string' || parsed.lastStage.length > 100) return null
    if (typeof parsed.savedAt !== 'string' || Number.isNaN(Date.parse(parsed.savedAt))) return null
    return { version: 1, id: parsed.id, applicant: parsed.applicant, lastStage: parsed.lastStage, savedAt: parsed.savedAt }
  } catch {
    return null
  }
}

function loadDemoApplication(): DemoApplication | null {
  try {
    // Prioritize active citizen application record so demo doesn't overwrite it
    const citizen = parseApplicationRecord(localStorage.getItem(CITIZEN_APP_STORAGE_KEY))
    if (citizen) return citizen
    const demo = parseApplicationRecord(localStorage.getItem(DEMO_APP_STORAGE_KEY))
    if (demo) return demo
    return parseApplicationRecord(localStorage.getItem(LEGACY_APP_STORAGE_KEY))
  } catch {
    return null
  }
}

function saveDemoApplicationRecord(application: DemoApplication): boolean {
  try {
    const isDemo = application.id === 'MP-LL-DEMO-2408'
    const targetKey = isDemo ? DEMO_APP_STORAGE_KEY : CITIZEN_APP_STORAGE_KEY
    localStorage.setItem(targetKey, JSON.stringify(application))
    return true
  } catch {
    return false
  }
}

function readPreference(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}

function savePreference(key: string, value: string): void {
  try { localStorage.setItem(key, value) } catch { /* Preferences may remain in memory when storage is unavailable. */ }
}

const stageLabelsHi: Record<string, string> = {
  'Applicant category': 'आवेदक श्रेणी',
  'Photo and signature': 'फोटो और हस्ताक्षर',
  'Device readiness': 'डिवाइस अनुकूलता जाँच',
  'Test rehearsal': 'परीक्षा अभ्यास',
  'Fee payment': 'शुल्क भुगतान',
  'Road-safety tutorial': 'सड़क सुरक्षा ट्यूटोरियल',
  'LL test in progress': 'एलएल परीक्षा जारी है',
  'Result and receipt': 'परिणाम और रसीद',
}

function citizenApplicantName(value: string): string {
  return value.replace(/\s*\(synthetic\)$/i, '').trim()
}

function citizenStageName(value: string, language: Language): string {
  return language === 'hi' ? stageLabelsHi[value] ?? value : value
}

function ServicesPage({ language, demoApplication }: { language: Language; demoApplication: DemoApplication | null }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<'All' | ServiceDefinition['category']>('All')

  const journey = useMemo(() => {
    if (!demoApplication) return null
    const draft = loadApplicationDraft(demoApplication.id)
    const progress = loadJourneyProgress(demoApplication.id)
    const examSession = loadExamSession(demoApplication.id, progress)
    return deriveJourneyState({ applicationId: demoApplication.id, draft, progress, examSession })
  }, [demoApplication])

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    return services.filter((service) => {
      const inCategory = category === 'All' || service.category === category
      const inSearch = !needle || `${service.name} ${service.nameHi} ${service.summary}`.toLocaleLowerCase().includes(needle)
      return inCategory && inSearch
    })
  }, [query, category])

  const groups = serviceCategories
    .map((item) => ({ category: item, items: filtered.filter((service) => service.category === item) }))
    .filter((group) => group.items.length)

  const featuredSpotlights = [
    {
      id: 'apply-ll',
      href: '/mp/ll/start',
      title: 'Apply for Learner’s Licence (LL)',
      titleHi: 'लर्नर लाइसेंस (LL) के लिए आवेदन करें',
      tag: 'Main service',
      tagHi: 'मुख्य सेवा',
      tagType: 'blue',
      badgeBg: '#e0f2fe',
      badgeColor: '#0369a1',
      icon: Sparkles,
      image: '/assets/service-apply-ll.webp',
      desc: 'Complete e-KYC, fill in your details and take the online test from home.',
      descHi: 'e-KYC पूरा करें, अपनी जानकारी भरें और घर से ऑनलाइन टेस्ट दें।',
      action: 'Start application',
      actionHi: 'आवेदन शुरू करें',
    },
    {
      id: 'mock-test',
      href: '/mp/service/mock-test',
      title: 'Tutorial & practice test',
      titleHi: 'ट्यूटोरियल व अभ्यास टेस्ट',
      tag: 'Practice',
      tagHi: 'अभ्यास',
      tagType: 'green',
      badgeBg: '#dcfce7',
      badgeColor: '#15803d',
      icon: BookOpenCheck,
      image: '/assets/service-mock-test.webp',
      desc: 'Learn road signs and traffic rules, then practise sample questions before the test.',
      descHi: 'सड़क संकेत और ट्रैफिक नियम सीखें, फिर टेस्ट से पहले नमूना प्रश्नों का अभ्यास करें।',
      action: 'Start practice',
      actionHi: 'अभ्यास शुरू करें',
    },
    {
      id: 'print-ll',
      href: '/mp/service/print-ll',
      title: 'Download Learner’s Licence',
      titleHi: 'लर्नर लाइसेंस डाउनलोड करें',
      tag: 'Download',
      tagHi: 'डाउनलोड',
      tagType: 'purple',
      badgeBg: '#f3e8ff',
      badgeColor: '#7e22ce',
      icon: Printer,
      image: '/assets/service-print-ll.webp',
      desc: 'Download or print your Learner’s Licence after it is issued.',
      descHi: 'लर्नर लाइसेंस जारी होने के बाद उसे डाउनलोड या प्रिंट करें।',
      action: 'Download licence',
      actionHi: 'लाइसेंस डाउनलोड करें',
    },
  ]

  const categoryFilterOptions: { key: 'All' | ServiceDefinition['category']; labelEn: string; labelHi: string; count: number }[] = [
    { key: 'All', labelEn: 'All services', labelHi: 'सभी सेवाएँ', count: services.length },
    { key: 'Learner licence', labelEn: "Learner's Licence", labelHi: 'लर्नर लाइसेंस', count: services.filter((s) => s.category === 'Learner licence').length },
    { key: 'Application utilities', labelEn: 'Application & status', labelHi: 'आवेदन व स्थिति', count: services.filter((s) => s.category === 'Application utilities').length },
    { key: 'Other licence services', labelEn: 'Other DL services', labelHi: 'अन्य लाइसेंस सेवाएँ', count: services.filter((s) => s.category === 'Other licence services').length },
  ]

  return (
    <>
      <Breadcrumbs items={[{ label: copy(language, 'Home', 'होम'), href: '/' }, { label: copy(language, 'Driving licence services', 'ड्राइविंग लाइसेंस सेवाएँ') }]} />

      {/* MP Services Hero Showcase Banner */}
      <section className="mp-services-hero" aria-labelledby="mp-services-hero-title" data-tour="services-overview">
        <div className="mp-services-hero__content">
          <div className="mp-services-hero__eyebrow">
            <span className="pulse-dot" />
            <span>{copy(language, 'Madhya Pradesh Transport Department • Online services', 'मध्य प्रदेश परिवहन विभाग • ऑनलाइन सेवाएँ')}</span>
          </div>
          <h1 id="mp-services-hero-title" tabIndex={-1}>
            {copy(language, 'Driving licence services', 'ड्राइविंग लाइसेंस सेवाएँ')}
          </h1>
          <p className="mp-services-hero__lead">
            {copy(
              language,
              'Apply for a Learner’s Licence, complete e-KYC, pay the fee and take the online test from home.',
              'लर्नर लाइसेंस के लिए आवेदन करें, e-KYC पूरा करें, शुल्क भरें और घर से ऑनलाइन टेस्ट दें।'
            )}
          </p>

          <div className="mp-services-hero__badges">
            <div className="mp-hero-badge">
              <ShieldCheck size={16} />
              <span>{copy(language, 'Online service', 'ऑनलाइन सेवा')}</span>
            </div>
            <div className="mp-hero-badge">
              <CheckCircle2 size={16} />
              <span>{copy(language, 'Aadhaar e-KYC', 'आधार e-KYC')}</span>
            </div>
            <div className="mp-hero-badge">
              <CheckCircle2 size={16} />
              <span>{copy(language, 'Digital licence download', 'डिजिटल लाइसेंस डाउनलोड')}</span>
            </div>
          </div>

          {demoApplication && journey ? (
            <div className="mp-services-hero__saved-bar">
              <div className="mp-saved-bar__info">
                <span className="mp-saved-bar__tag"><CheckCircle2 size={15} /> {copy(language, 'Saved application', 'सहेजा आवेदन')}</span>
                <strong>{demoApplication.id} • {citizenApplicantName(demoApplication.applicant)}</strong>
                <small>{copy(language, 'Next action: ', 'अगला कार्य: ')}{copy(language, journey.nextAction.title.en, journey.nextAction.title.hi)}</small>
              </div>
              <PortalLink href={journey.resumeHref} className="button button--light mp-saved-bar__cta">
                {copy(language, 'Resume application', 'आवेदन जारी रखें')} <ArrowRight size={18} />
              </PortalLink>
            </div>
          ) : (
            <div className="mp-services-hero__quick-actions">
              <PortalLink href="/mp/ll/start" className="button button--light">
                {copy(language, 'Start new application', 'नया आवेदन शुरू करें')} <ArrowRight size={18} />
              </PortalLink>
              <PortalLink href="/mp/service/application-status" className="button button--secondary button--hero-glass">
                {copy(language, 'Check application status', 'आवेदन की स्थिति देखें')}
              </PortalLink>
            </div>
          )}
        </div>

        <div className="mp-services-hero__visual" aria-hidden="true">
          <img src="/assets/mp-services-hero.webp" alt="" loading="eager" />
        </div>
      </section>

      {/* Featured High-Intent Spotlight Action Cards */}
      <section className="featured-services-section" aria-labelledby="featured-services-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{copy(language, 'Quick access', 'त्वरित पहुँच')}</p>
            <h2 id="featured-services-title">{copy(language, 'Popular driving licence services', 'लोकप्रिय ड्राइविंग लाइसेंस सेवाएँ')}</h2>
          </div>
        </div>

        <div className="featured-services-grid">
          {featuredSpotlights.map((spotlight) => (
            <PortalLink
              href={spotlight.href}
              className={`featured-spotlight-card featured-spotlight-card--${spotlight.id}`}
              key={spotlight.id}
              dataTour={spotlight.id === 'apply-ll' ? 'apply-ll-service' : undefined}
            >
              <div className="featured-spotlight-card__main">
                <div className="featured-spotlight-card__content">
                  <div className="featured-spotlight-card__meta">
                    <span className={`spotlight-badge spotlight-badge--${spotlight.tagType}`}>
                      {copy(language, spotlight.tag, spotlight.tagHi)}
                    </span>
                  </div>
                  <h3 className="featured-spotlight-card__title">
                    {copy(language, spotlight.title, spotlight.titleHi)}
                  </h3>
                  <p className="featured-spotlight-card__desc">
                    {copy(language, spotlight.desc, spotlight.descHi)}
                  </p>
                </div>
                <div className="featured-spotlight-card__illustration-zone" aria-hidden="true">
                  <img
                    src={spotlight.image}
                    alt=""
                    loading="lazy"
                    className={`spotlight-img spotlight-img--${spotlight.id}`}
                  />
                </div>
              </div>
              <div className="featured-spotlight-card__footer">
                <span className="spotlight-cta-text">{copy(language, spotlight.action, spotlight.actionHi)}</span>
                <ArrowRight className="spotlight-cta-arrow" size={16} aria-hidden="true" />
              </div>
            </PortalLink>
          ))}
        </div>
      </section>

      {/* Full Directory of Services with 1-Tap Category Filters */}
      <section className="services-section" aria-labelledby="services-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{copy(language, 'All services', 'सभी सेवाएँ')}</p>
            <h2 id="services-title">{copy(language, 'Find a driving licence service', 'ड्राइविंग लाइसेंस सेवा खोजें')}</h2>
          </div>
          <span className="result-count" aria-live="polite">
            {copy(language, `${filtered.length} services available`, `${filtered.length} सेवाएँ उपलब्ध`)}
          </span>
        </div>

        {/* Filter Strip */}
        <div className="services-filter-strip">
          <label className="services-filter-search">
            <Search size={18} aria-hidden="true" />
            <span className="visually-hidden">{copy(language, 'Search services', 'सेवाएँ खोजें')}</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy(language, 'Search services...', 'सेवाएँ खोजें...')}
            />
            {query && (
              <button type="button" className="filter-search-clear" onClick={() => setQuery('')} aria-label="Clear search">
                ×
              </button>
            )}
          </label>

          <div className="services-filter-pills" role="tablist" aria-label="Filter services by category">
            {categoryFilterOptions.map((opt) => {
              const active = category === opt.key
              return (
                <button
                  type="button"
                  role="tab"
                  aria-selected={active}
                  key={opt.key}
                  className={`category-pill-btn ${active ? 'category-pill-btn--active' : ''}`}
                  onClick={() => setCategory(opt.key)}
                >
                  <span>{copy(language, opt.labelEn, opt.labelHi)}</span>
                  <span className="category-pill-count">{opt.count}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Directory Groups with Discrete Elevated Cards */}
        {groups.length ? (
          <div className="service-directory">
            {groups.map((group) => (
              <section key={group.category} className="service-group">
                <div className="service-group__header">
                  <h3>{serviceCategoryLabels[group.category][language]}</h3>
                  <span className="service-group__badge">
                    {group.items.length} {copy(language, 'services', 'सेवाएँ')}
                  </span>
                </div>
                <div className="service-grid">
                  {group.items.map((service) => (
                    <ServiceCard key={service.id} service={service} language={language} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="no-results">
            <Search size={32} />
            <h3>{copy(language, 'No matching service found', 'कोई सेवा नहीं मिली')}</h3>
            <p>{copy(language, 'Try adjusting your search terms or select another category filter.', 'दूसरा शब्द खोजें या अन्य श्रेणी फ़िल्टर चुनें।')}</p>
            <button className="text-button" onClick={() => { setQuery(''); setCategory('All') }}>
              {copy(language, 'Clear search and filters', 'खोज और फ़िल्टर हटाएँ')}
            </button>
          </div>
        )}
      </section>
    </>
  )
}

const launchPhases = [
  {
    step: 1,
    titleEn: 'Application details',
    titleHi: 'आवेदन की जानकारी',
    descEn: 'Identity and applicant information',
    descHi: 'पहचान और आवेदक की जानकारी',
  },
  {
    step: 2,
    titleEn: 'Documents & photo',
    titleHi: 'दस्तावेज़ और फोटो',
    descEn: 'Photo, signature and required documents',
    descHi: 'फोटो, हस्ताक्षर और आवश्यक दस्तावेज़',
  },
  {
    step: 3,
    titleEn: 'Device check & fee',
    titleHi: 'डिवाइस जाँच और शुल्क',
    descEn: 'Check your test setup before payment',
    descHi: 'भुगतान से पहले टेस्ट सेटअप की जाँच करें',
  },
  {
    step: 4,
    titleEn: 'Learn and take the test',
    titleHi: 'सीखें और टेस्ट दें',
    descEn: "Prepare, then take the online learner test",
    descHi: 'तैयारी करें, फिर ऑनलाइन लर्नर टेस्ट दें',
  },
]

const llProcessSteps = [
  { en: 'Applicant details', hi: 'आवेदक की जानकारी' },
  { en: 'Identity method', hi: 'पहचान का तरीका' },
  { en: 'Documents and photo', hi: 'दस्तावेज़ और फोटो' },
  { en: 'Device check', hi: 'डिवाइस जाँच' },
  { en: 'Demo payment', hi: 'डेमो शुल्क भुगतान' },
  { en: 'Tutorial and test', hi: 'ट्यूटोरियल और टेस्ट' },
]

function LLStartPage({ onCreate, language, demoApplication }: { onCreate: (kind: 'full' | 'judge') => void; language: Language; demoApplication: DemoApplication | null }) {
  const [confirmNewApplication, setConfirmNewApplication] = useState(false)

  const journey = useMemo(() => {
    if (!demoApplication) return null
    const draft = loadApplicationDraft(demoApplication.id)
    const progress = loadJourneyProgress(demoApplication.id)
    const examSession = loadExamSession(demoApplication.id, progress)
    return deriveJourneyState({ applicationId: demoApplication.id, draft, progress, examSession })
  }, [demoApplication])

  const newApplicationCard = (
    <article className={`ll-launch-card${demoApplication ? '' : ' ll-launch-card--primary'}`}>
      <div className="ll-launch-card__header">
        <span className={`ll-launch-card__badge ${demoApplication ? 'll-launch-card__badge--secondary' : 'll-launch-card__badge--primary'}`}>
          {copy(language, demoApplication ? 'Another application' : 'New application', demoApplication ? 'दूसरा आवेदन' : 'नया आवेदन')}
        </span>
      </div>
      <div className="ll-launch-card__body">
        <h2>{copy(language, demoApplication ? 'Start a different application' : 'Start a new application', demoApplication ? 'अलग आवेदन शुरू करें' : 'नया आवेदन शुरू करें')}</h2>
        <p>{copy(language, 'Start with your details and identity step. We save your progress on this device.', 'अपनी जानकारी और पहचान के चरण से शुरू करें। आपकी प्रगति इस डिवाइस पर सहेजी जाती है।')}</p>
        <span className="ll-launch-card__meta-note">
          <CheckCircle2 size={15} aria-hidden="true" />
          {copy(language, 'Progress is saved on this device', 'प्रगति इस डिवाइस पर सहेजी जाती है')}
        </span>
      </div>
      <div className="ll-launch-card__footer">
        {!demoApplication ? (
          <button className="button button--primary ll-launch-card__action" onClick={() => onCreate('full')} data-tour="start-fresh-application">
            {copy(language, 'Start new application', 'नया आवेदन शुरू करें')} <ArrowRight className="ll-launch-arrow" size={18} />
          </button>
        ) : (
          <button className="button button--secondary ll-launch-card__action" onClick={() => setConfirmNewApplication(true)} aria-expanded={confirmNewApplication} data-tour="start-fresh-application">
            {copy(language, 'Start another', 'दूसरा शुरू करें')} <ArrowRight className="ll-launch-arrow" size={18} />
          </button>
        )}
      </div>
      {demoApplication && confirmNewApplication && (
        <div className="ll-replace-draft" role="alert">
          <div>
            <strong>{copy(language, 'Replace the saved application on this device?', 'इस डिवाइस पर सहेजे गए आवेदन को बदलें?')}</strong>
            <p>{copy(language, 'The existing local draft will no longer appear as your current application.', 'मौजूदा स्थानीय ड्राफ्ट आपका वर्तमान आवेदन नहीं रहेगा।')}</p>
          </div>
          <div className="ll-replace-draft__actions">
            <button className="text-button" onClick={() => setConfirmNewApplication(false)}>{copy(language, 'Keep saved application', 'सहेजा आवेदन रखें')}</button>
            <button className="button button--primary" onClick={() => onCreate('full')} data-tour="confirm-fresh-application">{copy(language, 'Start another', 'दूसरा शुरू करें')}</button>
          </div>
        </div>
      )}
    </article>
  )

  const existingApplicationCard = demoApplication ? (
    <article className="ll-launch-card ll-launch-card--primary ll-launch-card--saved">
      <div className="ll-launch-card__header">
        <span className="ll-launch-card__badge ll-launch-card__badge--primary">
          {copy(language, 'Saved application', 'सहेजा गया आवेदन')}
        </span>
      </div>
      <div className="ll-launch-card__body">
        <h2>{copy(language, 'Continue where you stopped', 'जहाँ रुके थे वहीं से जारी रखें')}</h2>
        <dl className="ll-saved-facts">
          <div><dt>{copy(language, 'Application number', 'आवेदन संख्या')}</dt><dd>{demoApplication.id}</dd></div>
          <div><dt>{copy(language, 'Next action', 'अगला काम')}</dt><dd>{journey ? copy(language, journey.nextAction.title.en, journey.nextAction.title.hi) : citizenStageName(demoApplication.lastStage, language)}</dd></div>
        </dl>
        <span className="ll-launch-card__meta-note">
          <CheckCircle2 size={15} aria-hidden="true" />
          {copy(language, 'Saved on this device', 'इस डिवाइस पर सहेजा गया')}
        </span>
      </div>
      <div className="ll-launch-card__footer">
        <PortalLink href={journey?.resumeHref ?? `/mp/application/${demoApplication.id}`} className="button button--primary ll-launch-card__action">
          {copy(language, 'Continue saved application', 'सहेजा आवेदन जारी रखें')} <ArrowRight className="ll-launch-arrow" size={18} />
        </PortalLink>
      </div>
    </article>
  ) : (
    <article className="ll-launch-card ll-launch-card--existing">
      <div className="ll-launch-card__header">
        <span className="ll-launch-card__badge ll-launch-card__badge--secondary">
          {copy(language, 'Existing application', 'मौजूदा आवेदन')}
        </span>
      </div>
      <div className="ll-launch-card__body">
        <h2>{copy(language, 'Find an application', 'आवेदन खोजें')}</h2>
        <p>{copy(language, 'Enter your application number to check progress or continue where you stopped.', 'आवेदन संख्या दर्ज करके प्रगति देखें या जहाँ रुके थे वहीं से जारी रखें।')}</p>
        <span className="ll-launch-card__meta-note">
          <FileText size={15} aria-hidden="true" />
          {copy(language, 'Application number required', 'आवेदन संख्या आवश्यक है')}
        </span>
      </div>
      <div className="ll-launch-card__footer">
        <PortalLink href="/mp/service/application-status" className="button button--secondary ll-launch-card__action">
          {copy(language, 'Enter application number', 'आवेदन संख्या दर्ज करें')} <ArrowRight className="ll-launch-arrow" size={18} />
        </PortalLink>
      </div>
    </article>
  )

  return (
    <>
      <Breadcrumbs items={[{ label: copy(language, 'Services', 'सेवाएँ'), href: '/mp/services' }, { label: copy(language, 'Apply for Learner’s Licence', 'लर्नर लाइसेंस के लिए आवेदन') }]} />
      <section className="page-title ll-launch-title" data-tour="ll-start-overview">
        <div>
          <p className="eyebrow">{copy(language, 'Madhya Pradesh · Learner’s Licence', 'मध्य प्रदेश · लर्नर लाइसेंस')}</p>
          <h1 tabIndex={-1}>{copy(language, 'Apply for a Learner’s Licence', 'लर्नर लाइसेंस के लिए आवेदन करें')}</h1>
          <p>{copy(language, 'Start a new application or continue one already saved.', 'नया आवेदन शुरू करें या पहले से सहेजा आवेदन जारी रखें।')}</p>
        </div>
      </section>

      <section className={`ll-launch-actions${demoApplication ? ' ll-launch-actions--saved' : ''}`} aria-label={copy(language, 'Choose what you want to do', 'चुनें कि आप क्या करना चाहते हैं')}>
        {demoApplication ? <>{existingApplicationCard}{newApplicationCard}</> : <>{newApplicationCard}{existingApplicationCard}</>}
      </section>

      <aside className="judge-launch-shortcut" aria-label={copy(language, 'Judge review shortcut', 'जज समीक्षा शॉर्टकट')}>
        <span><ClipboardCheck size={22} aria-hidden="true" /></span>
        <div>
          <strong>{copy(language, 'Judge review shortcut', 'जज समीक्षा शॉर्टकट')}</strong>
          <p>{copy(language, 'Load a clearly labelled synthetic application and begin at the device-readiness innovation. No citizen data is used.', 'स्पष्ट रूप से लेबल किया गया सिंथेटिक आवेदन लोड करें और डिवाइस-जाँच नवाचार से शुरू करें। किसी नागरिक का डेटा उपयोग नहीं होता।')}</p>
        </div>
        <button type="button" className="button button--secondary" onClick={() => onCreate('judge')} data-tour="load-prepared-app">
          {copy(language, 'Load prepared review application', 'तैयार समीक्षा आवेदन लोड करें')} <ArrowRight size={18} />
        </button>
      </aside>

      <section className="ll-launch-journey" aria-labelledby="ll-journey-title">
        <div className="ll-launch-journey__heading">
          <p className="eyebrow">{copy(language, 'What happens after you start', 'शुरू करने के बाद क्या होगा')}</p>
          <h2 id="ll-journey-title">{copy(language, 'Your application steps', 'आवेदन के चरण')}</h2>
        </div>
        <div className="ll-journey-timeline">
          {launchPhases.map((phase) => (
            <div className="ll-journey-node" key={phase.step}>
              <div className="ll-journey-node__indicator">
                <span className="ll-journey-node__num">{phase.step}</span>
              </div>
              <div className="ll-journey-node__body">
                <strong>{copy(language, phase.titleEn, phase.titleHi)}</strong>
                <p>{copy(language, phase.descEn, phase.descHi)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <details className="ll-launch-details">
        <summary>
          <div className="ll-launch-details__summary-main">
            <span className="ll-launch-details__summary-title">
              <CircleHelp size={20} aria-hidden="true" />
              <strong>{copy(language, 'See all steps and what you need', 'सभी चरण और जरूरी चीजें देखें')}</strong>
            </span>
            <span className="ll-launch-details__summary-preview">
              {copy(language, 'Identity details · Photo/signature · Camera-enabled device', 'पहचान विवरण · फोटो/हस्ताक्षर · कैमरा युक्त डिवाइस')}
            </span>
          </div>
          <span className="ll-launch-details__summary-toggle">
            <span>{copy(language, 'View full process', 'पूरी प्रक्रिया देखें')}</span>
            <ChevronDown size={18} aria-hidden="true" />
          </span>
        </summary>
        <div className="ll-launch-details__body">
          <section aria-labelledby="ll-full-process-title">
            <p className="eyebrow">{copy(language, 'All steps', 'सभी चरण')}</p>
            <h2 id="ll-full-process-title">{copy(language, 'Application steps', 'आवेदन के चरण')}</h2>
            <ol className="ll-process-sequence">
              {llProcessSteps.map((step, idx) => (
                <li key={idx}>
                  <span className="ll-step-idx">{idx + 1}</span>
                  <span>{copy(language, step.en, step.hi)}</span>
                </li>
              ))}
            </ol>
          </section>
          <section aria-labelledby="ll-requirements-title">
            <p className="eyebrow">{copy(language, 'Keep ready', 'तैयार रखें')}</p>
            <h2 id="ll-requirements-title">{copy(language, 'Before you start', 'शुरू करने से पहले')}</h2>
            <ul className="ll-ready-list">
              <li>
                <Camera size={18} aria-hidden="true" />
                <div>
                  <strong>{copy(language, 'Camera-enabled device', 'कैमरा युक्त डिवाइस')}</strong>
                  <p>{copy(language, 'Needed later for the device check before the test.', 'टेस्ट से पहले डिवाइस जाँच के लिए बाद में जरूरत होगी।')}</p>
                </div>
              </li>
              <li>
                <Wifi size={18} aria-hidden="true" />
                <div>
                  <strong>{copy(language, 'Stable internet connection', 'स्थिर इंटरनेट कनेक्शन')}</strong>
                  <p>{copy(language, 'If the internet stops, continue from your last saved step.', 'इंटरनेट बंद हो जाए तो आखिरी सहेजे चरण से जारी रखें।')}</p>
                </div>
              </li>
              <li>
                <FileText size={18} aria-hidden="true" />
                <div>
                  <strong>{copy(language, 'Demo applicant details', 'डेमो आवेदक जानकारी')}</strong>
                  <p>{copy(language, 'Personal, address, vehicle class information, and demo photo/signature.', 'व्यक्तिगत, पता, वाहन वर्ग की जानकारी, और डेमो फोटो/हस्ताक्षर।')}</p>
                </div>
              </li>
            </ul>
          </section>
        </div>
      </details>
    </>
  )
}

function ApplicationPage({ application, language }: { application: DemoApplication; language: Language }) {
  const progress = loadJourneyProgress(application.id)
  const savedDraft = loadApplicationDraft(application.id)
  const examSession = loadExamSession(application.id, progress)
  const journey = deriveJourneyState({
    applicationId: application.id,
    draft: savedDraft,
    progress,
    examSession,
  })

  const activity = [
    { title: copy(language, 'Application saved', 'आवेदन सहेजा गया'), detail: copy(language, 'Application details and declaration were recorded.', 'आवेदन जानकारी और घोषणा दर्ज हुई।'), time: application.savedAt },
    ...(progress.readiness.completedAt ? [{ title: copy(language, 'Device check passed', 'डिवाइस जाँच सफल'), detail: copy(language, 'Camera, microphone, browser and connection checks completed.', 'कैमरा, माइक्रोफोन, ब्राउज़र और कनेक्शन जाँच पूरी हुई।'), time: progress.readiness.completedAt }] : []),
    ...(progress.rehearsal.completedAt ? [{ title: copy(language, 'Test practice completed', 'परीक्षा अभ्यास पूरा'), detail: copy(language, 'Answer saving and recovery behavior was practiced.', 'उत्तर सहेजने और रिकवरी का अभ्यास हुआ।'), time: progress.rehearsal.completedAt }] : []),
    ...progress.payment.activity.map((item) => ({ title: item[language === 'en' ? 'titleEn' : 'titleHi'], detail: item[language === 'en' ? 'detailEn' : 'detailHi'], time: item.at })),
    ...(progress.tutorial.completedAt ? [{ title: copy(language, 'Tutorial completed', 'ट्यूटोरियल पूरा'), detail: copy(language, 'Road-safety learning material was completed.', 'सड़क सुरक्षा अध्ययन सामग्री पूरी हुई।'), time: progress.tutorial.completedAt }] : []),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

  return (
    <>
      <Breadcrumbs items={[{ label: copy(language, 'Services', 'सेवाएँ'), href: '/mp/services' }, { label: copy(language, 'Application status', 'आवेदन की स्थिति') }]} />
      <section className="page-title">
        <div>
          <p className="eyebrow">{copy(language, 'Application', 'आवेदन')} · {application.id}</p>
          <h1 tabIndex={-1}>{copy(language, 'Application status', 'आवेदन की स्थिति')}</h1>
          <p>{copy(language, 'See what is complete, what is pending and the next action required.', 'देखें कि क्या पूरा हुआ है, क्या बाकी है और अगला जरूरी काम क्या है।')}</p>
        </div>
        <span className="saved-indicator"><CheckCircle2 size={17} /> {copy(language, 'Last saved', 'अंतिम बार सहेजा')} {new Date(application.savedAt).toLocaleTimeString(language === 'en' ? 'en-IN' : 'hi-IN', { hour: '2-digit', minute: '2-digit' })}</span>
      </section>

      {journey.mode === 'prepared-demo' && (
        <section className="reference-banner" style={{ margin: '0 0 20px' }}>
          <CheckCircle2 size={16} />
          <div>
            <strong>{copy(language, 'Prepared review demo', 'तैयार समीक्षा डेमो')}</strong>
            <p>{copy(language, 'Prepared demo details and sample documents have been loaded so you can review the test-readiness, payment, and test experience quickly.', 'तैयार डेमो जानकारी और नमूना दस्तावेज़ लोड किए गए हैं ताकि आप डिवाइस जाँच, भुगतान और परीक्षा अनुभव की त्वरित समीक्षा कर सकें।')}</p>
          </div>
        </section>
      )}

      <section className="next-action-card">
        <span><MonitorCheck size={25} /></span>
        <div>
          <p className="eyebrow">{copy(language, 'What’s next', 'आगे क्या करना है')}</p>
          <h2>{copy(language, journey.nextAction.title.en, journey.nextAction.title.hi)}</h2>
          <p>{copy(language, journey.nextAction.body.en, journey.nextAction.body.hi)}</p>
        </div>
        <PortalLink className="button button--primary" href={journey.nextAction.href}>
          {copy(language, journey.nextAction.action.en, journey.nextAction.action.hi)} <ArrowRight size={18} />
        </PortalLink>
      </section>

      <div className="status-overview-grid">
        <section className="content-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{copy(language, 'Application progress', 'आवेदन की प्रगति')}</p>
              <h2>{copy(language, 'Current stages', 'वर्तमान चरण')}</h2>
            </div>
            <span className="progress-count">{copy(language, `${journey.completedStageCount} of ${journey.totalStageCount} complete`, `${journey.totalStageCount} में से ${journey.completedStageCount} पूरी`)}</span>
          </div>
          <ol className="stage-tracker">
            {journey.stages.map((stage, index) => {
              const isNeedsAction = stage.status === 'needs_action' || stage.status === 'in_progress'
              return (
                <li key={stage.id} className={`stage-tracker__item stage-tracker__item--${stage.status}`}>
                  <span className="stage-tracker__marker">{stage.status === 'completed' ? <Check size={16} /> : index + 1}</span>
                  <div>
                    <strong>{copy(language, stage.title.en, stage.title.hi)}</strong>
                    <small>{stage.detail ? copy(language, stage.detail.en, stage.detail.hi) : copy(language, 'Locked', 'लॉक्ड')}</small>
                  </div>
                  {isNeedsAction && <span className="stage-label">{copy(language, 'Next', 'अगला')}</span>}
                </li>
              )
            })}
          </ol>
        </section>
        <section className="content-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{copy(language, 'What happened', 'अब तक क्या हुआ')}</p>
              <h2>{copy(language, 'Application activity', 'आवेदन गतिविधि')}</h2>
            </div>
          </div>
          <ol className="status-activity">
            {activity.map((item) => (
              <li key={`${item.title}-${item.time}`}>
                <span><Check size={15} /></span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                  <time dateTime={item.time}>{new Date(item.time).toLocaleString(language === 'en' ? 'en-IN' : 'hi-IN', { dateStyle: 'medium', timeStyle: 'short' })}</time>
                </div>
              </li>
            ))}
          </ol>
          <div className="status-utilities">
            <PortalLink href={`/mp/application/${application.id}/payment-status`}><IndianRupee size={18} /> {copy(language, 'Verify payment status', 'भुगतान स्थिति जाँचें')}</PortalLink>
            <PortalLink href={`/mp/application/${application.id}/receipt`}><Printer size={18} /> {copy(language, 'Open receipt', 'रसीद खोलें')}</PortalLink>
          </div>
        </section>
      </div>
    </>
  )
}

function ServicePage({ service, language }: { service: ServiceDefinition; language: Language }) {
  const Icon = iconByName[service.icon]
  const available = service.delivery !== 'information-only'
  return (
    <>
      <Breadcrumbs items={[{ label: copy(language, 'Home', 'होम'), href: '/' }, { label: copy(language, 'Driving licence services', 'ड्राइविंग लाइसेंस सेवाएँ'), href: '/mp/services' }, { label: language === 'en' ? service.name : service.nameHi }]} />
      <section className="page-title page-title--service"><span className="page-title__icon"><Icon size={28} /></span><div><p className="eyebrow">{copy(language, 'Service information', 'सेवा जानकारी')}</p><h1 tabIndex={-1}>{language === 'en' ? service.name : service.nameHi}</h1><p>{language === 'en' ? service.summary : service.summaryHi}</p></div></section>
      <div className="content-with-aside">
        <div className="content-stack"><section className="content-card"><div className="section-heading"><div><p className="eyebrow">{copy(language, 'About this service', 'इस सेवा के बारे में')}</p><h2>{copy(language, 'Who can use it', 'इसका उपयोग कौन कर सकता है')}</h2></div><StatusPill delivery={service.delivery} language={language} /></div><p className="prose">{service.audience}</p><h3>{copy(language, 'What you may need', 'आपको क्या चाहिए')}</h3><ul className="check-list">{service.requirements.map((item) => <li key={item}><CheckCircle2 size={18} /><span>{item}</span></li>)}</ul></section></div>
        <aside className="start-panel"><p className="eyebrow">{copy(language, 'Online service', 'ऑनलाइन सेवा')}</p><h2>{available ? copy(language, 'Continue online', 'ऑनलाइन आगे बढ़ें') : copy(language, 'Information available', 'जानकारी उपलब्ध है')}</h2><p>{available ? copy(language, 'Open the guided licence journey to continue with this service.', 'इस सेवा को जारी रखने के लिए निर्देशित लाइसेंस प्रक्रिया खोलें।') : copy(language, 'Read the requirements here. The online transaction is not available from this page.', 'यहाँ आवश्यकताएँ पढ़ें। इस पेज से ऑनलाइन लेन-देन उपलब्ध नहीं है।')}</p>{available && <PortalLink href="/mp/ll/start" className="button button--primary button--full">{copy(language, 'Continue', 'आगे बढ़ें')} <ArrowRight size={18} /></PortalLink>}<PortalLink href="/mp/services" className="button button--secondary button--full"><ArrowLeft size={18} /> {copy(language, 'All services', 'सभी सेवाएँ')}</PortalLink></aside>
      </div>
    </>
  )
}

function NotFoundPage({ language }: { language: Language }) {
  return <section className="not-found"><FileText size={38} /><p className="eyebrow">{copy(language, 'Page not found', 'पेज नहीं मिला')}</p><h1 tabIndex={-1}>{copy(language, 'We could not find the page you requested', 'आपके द्वारा माँगा गया पेज नहीं मिला')}</h1><p>{copy(language, 'The address may be incorrect or the page may have moved.', 'पता गलत हो सकता है या पेज का स्थान बदल गया हो सकता है।')}</p><PortalLink href="/" className="button button--primary">{copy(language, 'Return to home', 'होम पर लौटें')}</PortalLink></section>
}

type HelpContent = { title: string; intro: string; action: string; need: string; next: string; issue: string }

function getHelpContent(route: PortalRoute, language: Language): HelpContent {
  if (route.name === 'login') return {
    title: copy(language, 'Help with signing in', 'साइन इन सहायता'),
    intro: copy(language, 'This page provides review access to the prototype using the published hackathon credentials.', 'यह पेज प्रकाशित हैकाथॉन क्रेडेंशियल से प्रोटोटाइप की समीक्षा का प्रवेश देता है।'),
    action: copy(language, 'Enter the username, password and the captcha shown, then choose Sign in.', 'यूज़रनेम, पासवर्ड और दिखाया गया कैप्चा दर्ज करें, फिर साइन इन चुनें।'),
    need: copy(language, 'Use the fixed review credentials displayed above the form. Do not use a personal password.', 'फॉर्म के ऊपर दिए निश्चित समीक्षा क्रेडेंशियल का उपयोग करें। निजी पासवर्ड उपयोग न करें।'),
    next: copy(language, 'A successful sign-in opens the driving licence services page.', 'सफल साइन इन के बाद ड्राइविंग लाइसेंस सेवा पेज खुलेगा।'),
    issue: copy(language, 'Check uppercase letters in the captcha or refresh it and try again.', 'कैप्चा के बड़े अक्षर जाँचें या उसे बदलकर फिर प्रयास करें।'),
  }
  if (route.name === 'home') return {
    title: copy(language, 'Help with the Parivahan homepage', 'परिवहन होमपेज की सहायता'),
    intro: copy(language, 'This page brings the main road-transport service areas and public information together.', 'यह पेज मुख्य सड़क परिवहन सेवा क्षेत्रों और नागरिक जानकारी को एक स्थान पर लाता है।'),
    action: copy(language, 'Choose Driving licence services to apply for a Learner’s Licence, check an application or continue the licence journey.', 'लर्नर लाइसेंस आवेदन, आवेदन स्थिति या लाइसेंस प्रक्रिया जारी रखने के लिए ड्राइविंग लाइसेंस सेवाएँ चुनें।'),
    need: copy(language, 'You do not need an application number just to browse the homepage.', 'होमपेज देखने के लिए आवेदन संख्या की जरूरत नहीं है।'),
    next: copy(language, 'The selected service area opens its service directory and instructions.', 'चुना गया सेवा क्षेत्र अपनी सेवा सूची और निर्देश खोलेगा।'),
    issue: copy(language, 'If you are not sure where to begin, open Driving licence services and read the available options.', 'शुरुआत समझ न आए तो ड्राइविंग लाइसेंस सेवाएँ खोलें और उपलब्ध विकल्प पढ़ें।'),
  }
  if (route.name === 'services') return {
    title: copy(language, 'Help with the services page', 'सेवा पेज की सहायता'),
    intro: copy(language, 'This page lists the licence services included in this Madhya Pradesh portal.', 'इस पेज पर मध्य प्रदेश पोर्टल में उपलब्ध लाइसेंस सेवाएँ दी गई हैं।'),
    action: copy(language, 'Search for a service, choose a category, or open your current application.', 'सेवा खोजें, श्रेणी चुनें या अपना वर्तमान आवेदन खोलें।'),
    need: copy(language, 'You do not need an application number to browse services.', 'सेवाएँ देखने के लिए आवेदन संख्या की जरूरत नहीं है।'),
    next: copy(language, 'The selected service opens with its instructions or saved status.', 'चुनी गई सेवा उसके निर्देश या सहेजी गई स्थिति के साथ खुलेगी।'),
    issue: copy(language, 'If nothing appears, clear the search and choose “All services”.', 'कुछ न दिखे तो खोज हटाएँ और “सभी सेवाएँ” चुनें।'),
  }
  if (route.name === 'll-start') return {
    title: copy(language, 'Help before starting', 'आवेदन शुरू करने से पहले सहायता'),
    intro: copy(language, 'This page gives you two clear choices: start a new application or find and continue an existing one.', 'यह पेज दो स्पष्ट विकल्प देता है: नया आवेदन शुरू करें या मौजूदा आवेदन खोजकर जारी रखें।'),
    action: copy(language, 'Choose the highlighted action that matches your situation. Open the expandable process only when you need more detail.', 'अपनी स्थिति के अनुसार प्रमुख विकल्प चुनें। अधिक जानकारी चाहिए तभी विस्तार योग्य प्रक्रिया खोलें।'),
    need: copy(language, 'A new application starts without an application number. To find an existing application, keep its application number ready.', 'नया आवेदन शुरू करने के लिए आवेदन संख्या नहीं चाहिए। मौजूदा आवेदन खोजने के लिए उसकी आवेदन संख्या तैयार रखें।'),
    next: copy(language, 'A new application opens the applicant-category step. An existing application opens its saved status and next action.', 'नया आवेदन आवेदक-श्रेणी प्रक्रिया खोलेगा। मौजूदा आवेदन उसकी सहेजी स्थिति और अगला काम खोलेगा।'),
    issue: copy(language, 'If you are unsure what is required, expand “View the full process and what you will need” on this page.', 'जरूरी चीजें समझ न आएँ तो इसी पेज पर “पूरी प्रक्रिया और जरूरी चीजें देखें” खोलें।'),
  }
  if (route.name === 'll-application') return {
    title: copy(language, 'Help with this application step', 'इस आवेदन प्रक्रिया में सहायता'),
    intro: copy(language, 'Only the information for the current step is shown. Your other sections remain saved.', 'अभी केवल वर्तमान प्रक्रिया की जानकारी दिखाई गई है। बाकी भाग सहेजे रहते हैं।'),
    action: copy(language, 'Complete every field marked with an asterisk, then choose Save and continue.', 'तारांकन वाले सभी खाने भरें, फिर “सहेजें और आगे बढ़ें” चुनें।'),
    need: route.step === 'category'
      ? copy(language, 'Choose whether the applicant already holds an Indian DL or LL.', 'चुनें कि आवेदक के पास पहले से भारतीय डीएल या एलएल है या नहीं।')
      : copy(language, 'Use the labels and helper text shown beside each field.', 'हर खाने के साथ दिए लेबल और सहायता पाठ का उपयोग करें।'),
    next: copy(language, 'Your answers are saved and the next application section opens.', 'आपके उत्तर सहेजे जाएँगे और आवेदन का अगला भाग खुलेगा।'),
    issue: copy(language, 'If Continue does not work, read the red message beside the incomplete field.', '“आगे बढ़ें” काम न करे तो अधूरे खाने के पास लाल संदेश पढ़ें।'),
  }
  if (route.name === 'application') return {
    title: copy(language, 'Help with application status', 'आवेदन स्थिति की सहायता'),
    intro: copy(language, 'This page separates completed, pending and not-started stages.', 'यह पेज पूरी, लंबित और शुरू न हुई प्रक्रियाएँ अलग-अलग दिखाता है।'),
    action: copy(language, 'Use the button in “Next required action”.', '“अगला जरूरी काम” में दिया बटन चुनें।'),
    need: copy(language, 'Your application number is already linked to this saved application.', 'आपकी आवेदन संख्या इस सहेजे गए आवेदन से पहले ही जुड़ी है।'),
    next: copy(language, 'The exact pending stage will open.', 'सही लंबित प्रक्रिया खुलेगी।'),
    issue: copy(language, 'A grey stage is not an error; it becomes available after earlier stages are complete.', 'धूसर प्रक्रिया गलती नहीं है; पिछली प्रक्रियाएँ पूरी होने के बाद वह उपलब्ध होगी।'),
  }
  if (route.name === 'uploads') return {
    title: copy(language, 'Help with uploads', 'अपलोड की सहायता'),
    intro: copy(language, 'This page reviews the photograph, signature and supporting-document evidence attached to the saved application.', 'यह पेज सहेजे आवेदन से जुड़ी फोटो, हस्ताक्षर और सहायक दस्तावेज की जाँच करता है।'),
    action: copy(language, 'Open each item, review the preview and confirm it only when the sample is readable.', 'हर वस्तु खोलें, उसका पूर्वावलोकन देखें और नमूना साफ होने पर ही पुष्टि करें।'),
    need: copy(language, 'For this prototype, use only the prepared synthetic files. Do not upload real identity documents.', 'इस प्रोटोटाइप में केवल तैयार सिंथेटिक फाइलें उपयोग करें। वास्तविक पहचान दस्तावेज अपलोड न करें।'),
    next: copy(language, 'After all required items are confirmed, the application tracker unlocks the device-readiness stage.', 'सभी जरूरी वस्तुएँ पुष्ट होने के बाद आवेदन स्थिति पेज डिवाइस जाँच चरण खोलेगा।'),
    issue: copy(language, 'If a preview is unclear, remove that sample and add the prepared file again.', 'पूर्वावलोकन साफ न हो तो नमूना हटाकर तैयार फाइल फिर जोड़ें।'),
  }
  if (route.name === 'tutorial') return {
    title: copy(language, 'Help with road-safety preparation', 'सड़क सुरक्षा तैयारी की सहायता'),
    intro: copy(language, 'This page teaches the safety ideas used by the synthetic learning check.', 'यह पेज सिंथेटिक सीखने की जाँच में उपयोग होने वाले सुरक्षा विचार समझाता है।'),
    action: copy(language, 'Read the three short topics, answer the learning question and check your answer.', 'तीन छोटे विषय पढ़ें, सीखने के प्रश्न का उत्तर दें और उत्तर जाँचें।'),
    need: copy(language, 'No camera or official test attempt is used on this page.', 'इस पेज पर कैमरा या आधिकारिक परीक्षा प्रयास उपयोग नहीं होता।'),
    next: copy(language, 'A correct learning answer opens the secure-test instructions.', 'सही उत्तर सुरक्षित परीक्षा के निर्देश खोलेगा।'),
    issue: copy(language, 'If the answer is incorrect, read the explanation and choose again.', 'उत्तर गलत हो तो समझाइश पढ़ें और फिर चुनें।'),
  }
  if (route.name === 'result') return {
    title: copy(language, 'Help with the result and Journey Receipt', 'परिणाम और यात्रा रसीद की सहायता'),
    intro: copy(language, 'This page separates the synthetic knowledge score, technical recovery and integrity observations.', 'यह पेज सिंथेटिक ज्ञान अंक, तकनीकी वापसी और अखंडता अवलोकन अलग-अलग दिखाता है।'),
    action: copy(language, 'Review or print the demonstration result. On a shared computer, use Clear this device when finished.', 'प्रदर्शन परिणाम देखें या प्रिंट करें। साझा कंप्यूटर पर काम पूरा होने के बाद “इस डिवाइस का डेटा हटाएँ” चुनें।'),
    need: copy(language, 'Remember that the displayed document is marked invalid and creates no government record.', 'ध्यान रखें कि दिखाया दस्तावेज अमान्य चिह्नित है और कोई सरकारी रिकॉर्ड नहीं बनाता।'),
    next: copy(language, 'You may return to application status, restart the simulation or safely clear the browser data.', 'आप आवेदन स्थिति पर लौट सकते हैं, सिमुलेशन फिर शुरू कर सकते हैं या ब्राउज़र डेटा सुरक्षित हटा सकते हैं।'),
    issue: copy(language, 'If printing is unavailable, use the browser print menu. Do not treat the output as a licence.', 'प्रिंट बटन काम न करे तो ब्राउज़र का प्रिंट मेनू उपयोग करें। आउटपुट को लाइसेंस न मानें।'),
  }
  if (route.name === 'readiness' || route.name === 'rehearsal' || route.name === 'test-entry' || route.name === 'test' || route.name === 'test-interruption') return {
    title: copy(language, 'Technical help for the online test', 'ऑनलाइन परीक्षा की तकनीकी सहायता'),
    intro: copy(language, 'Help can explain the device check, saving, pause and recovery. It cannot help answer a test question.', 'सहायता डिवाइस जाँच, उत्तर सहेजने, रुकने और फिर शुरू करने की प्रक्रिया समझा सकती है। यह प्रश्न का उत्तर नहीं बताती।'),
    action: copy(language, 'Follow the instruction currently shown on screen and allow camera or microphone only when asked.', 'स्क्रीन पर दिखा वर्तमान निर्देश मानें और माँगे जाने पर ही कैमरा या माइक्रोफोन की अनुमति दें।'),
    need: copy(language, 'Use a supported browser, a working camera and microphone, and a stable connection.', 'समर्थित ब्राउज़र, काम करने वाला कैमरा-माइक्रोफोन और स्थिर कनेक्शन रखें।'),
    next: copy(language, 'A successful check continues the test journey; a problem pauses it with a fix.', 'सफल जाँच के बाद परीक्षा आगे बढ़ेगी; समस्या होने पर सुधार के निर्देश के साथ रुक जाएगी।'),
    issue: copy(language, 'Close other apps using the camera, check browser permission, then run the check again.', 'कैमरा उपयोग कर रहे दूसरे ऐप बंद करें, ब्राउज़र अनुमति जाँचें और फिर से जाँच चलाएँ।'),
  }
  if (route.name === 'payment' || route.name === 'payment-redirect' || route.name === 'payment-return' || route.name === 'payment-status' || route.name === 'receipt') return {
    title: copy(language, 'Help with fee payment', 'शुल्क भुगतान की सहायता'),
    intro: copy(language, 'This page shows the fee and payment status for the application.', 'यह पेज आवेदन का शुल्क और भुगतान स्थिति दिखाता है।'),
    action: copy(language, 'Check the amount and application number before continuing.', 'आगे बढ़ने से पहले राशि और आवेदन संख्या जाँचें।'),
    need: copy(language, 'The device compatibility check must be complete before payment.', 'भुगतान से पहले डिवाइस अनुकूलता जाँच पूरी होनी चाहिए।'),
    next: copy(language, 'After payment, return to the portal and verify the status before trying again.', 'भुगतान के बाद पोर्टल पर लौटें और दोबारा प्रयास से पहले स्थिति जाँचें।'),
    issue: copy(language, 'If the result is pending, do not pay again. Use payment-status verification.', 'स्थिति लंबित हो तो दोबारा भुगतान न करें। भुगतान स्थिति जाँचें।'),
  }
  return {
    title: copy(language, 'Help with this page', 'इस पेज की सहायता'),
    intro: copy(language, 'This page is one part of the Learner’s Licence application journey.', 'यह पेज लर्नर लाइसेंस आवेदन प्रक्रिया का एक भाग है।'),
    action: copy(language, 'Read the page heading, complete the requested action and use the main button to continue.', 'पेज का शीर्षक पढ़ें, बताया गया काम पूरा करें और मुख्य बटन से आगे बढ़ें।'),
    need: copy(language, 'Keep your saved application number available.', 'अपनी सहेजी गई आवेदन संख्या पास रखें।'),
    next: copy(language, 'The portal will open the next available stage.', 'पोर्टल अगली उपलब्ध प्रक्रिया खोलेगा।'),
    issue: copy(language, 'Return to Application status if you are unsure what to do next.', 'अगला काम समझ न आए तो आवेदन स्थिति पेज पर लौटें।'),
  }
}

function HelpDialog({ onClose, route, language }: { onClose: () => void; route: PortalRoute; language: Language }) {
  const dialogRef = useAccessibleDialog(onClose)
  const help = getHelpContent(route, language)
  const sections = [
    [copy(language, 'What this page is', 'यह पेज क्या है'), help.intro],
    [copy(language, 'What you need to do', 'आपको क्या करना है'), help.action],
    [copy(language, 'What you need', 'आपको क्या चाहिए'), help.need],
    [copy(language, 'What happens next', 'इसके बाद क्या होगा'), help.next],
    [copy(language, 'If something does not work', 'अगर कुछ काम न करे'), help.issue],
  ]
  return <div className="dialog-layer" onMouseDown={onClose}><section ref={dialogRef} tabIndex={-1} className="help-dialog" role="dialog" aria-modal="true" aria-labelledby="help-title" onMouseDown={(event) => event.stopPropagation()}><div className="dialog-heading"><div><p className="eyebrow">{copy(language, 'Page help', 'पेज सहायता')}</p><h2 id="help-title">{help.title}</h2></div><button className="icon-button" onClick={onClose} aria-label={copy(language, 'Close help', 'सहायता बंद करें')} autoFocus><X size={21} /></button></div><div className="help-list help-list--steps">{sections.map(([title, body], index) => <article key={title}><span aria-hidden="true">{index + 1}</span><div><strong>{title}</strong><p>{body}</p></div></article>)}</div><button className="button button--primary button--full" onClick={onClose}>{copy(language, 'I understand', 'मैं समझ गया/गई')}</button></section></div>
}

function PrototypeDetailsDialog({ onClose, language }: { onClose: () => void; language: Language }) {
  const dialogRef = useAccessibleDialog(onClose)
  return <div className="dialog-layer" onMouseDown={onClose}><section ref={dialogRef} tabIndex={-1} className="help-dialog prototype-dialog" role="dialog" aria-modal="true" aria-labelledby="prototype-title" onMouseDown={(event) => event.stopPropagation()}><div className="dialog-heading"><div><p className="eyebrow">{copy(language, 'Safe demo', 'सुरक्षित डेमो')}</p><h2 id="prototype-title">{copy(language, 'What is real and what is simulated?', 'क्या वास्तविक है और क्या सिम्युलेट किया गया है?')}</h2></div><button className="icon-button" onClick={onClose} aria-label={copy(language, 'Close details', 'जानकारी बंद करें')} autoFocus><X size={21} /></button></div><dl className="prototype-facts"><div><dt>{copy(language, 'Runs on this device', 'इस डिवाइस पर वास्तविक रूप से चलता है')}</dt><dd>{copy(language, 'Form saving, camera and microphone checks, saving test answers and restart recovery.', 'फॉर्म सहेजना, कैमरा-माइक्रोफोन जाँच, उत्तर सहेजना और टेस्ट फिर शुरू करना।')}</dd></div><div><dt>{copy(language, 'Simulated for demo', 'डेमो के लिए सिम्युलेट किया गया')}</dt><dd>{copy(language, 'Identity verification, government records, fees, payment approval and official licence issuance.', 'पहचान सत्यापन, सरकारी रिकॉर्ड, शुल्क, भुगतान स्वीकृति और आधिकारिक लाइसेंस जारी करना।')}</dd></div></dl><p className="prototype-dialog__note">{copy(language, 'This independent hackathon prototype is not connected to Sarathi, NIC, UIDAI, a bank or the Government of Madhya Pradesh.', 'यह स्वतंत्र हैकाथॉन प्रोटोटाइप सारथी, एनआईसी, यूआईडीएआई, किसी बैंक या मध्य प्रदेश शासन से जुड़ा नहीं है।')}</p><button className="button button--primary button--full" onClick={onClose}>{copy(language, 'Close', 'बंद करें')}</button></section></div>
}

function UnavailableServiceDialog({ destination, language, onClose }: { destination: HomeDestination; language: Language; onClose: () => void }) {
  const titles: Record<HomeDestination, [string, string]> = {
    vehicle: ['Vehicle registration services', 'वाहन पंजीकरण सेवाएँ'],
    permit: ['Commercial transport services', 'वाणिज्यिक परिवहन सेवाएँ'],
    safety: ['Road safety services', 'सड़क सुरक्षा सेवाएँ'],
    information: ['Information service', 'जानकारी सेवा'],
  }
  const dialogRef = useAccessibleDialog(onClose)
  const titlePair = titles[destination] ?? ['Service', 'सेवा']
  return (
    <div className="dialog-layer" onMouseDown={onClose}>
      <section ref={dialogRef} tabIndex={-1} className="help-dialog service-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="service-preview-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="dialog-heading">
          <div>
            <p className="eyebrow">{copy(language, 'Service directory', 'सेवा सूची')}</p>
            <h2 id="service-preview-title">{copy(language, titlePair[0], titlePair[1])}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label={copy(language, 'Close', 'बंद करें')} autoFocus>
            <X size={21} />
          </button>
        </div>
        <div className="service-preview-dialog__body">
          <CircleHelp size={28} />
          <div>
            <strong>{copy(language, 'This service is not available in this demo.', 'यह सेवा इस डेमो में उपलब्ध नहीं है।')}</strong>
            <p>{copy(language, 'You can view it in the service directory, but online applications are not available in this demo.', 'आप इसे सेवा सूची में देख सकते हैं, लेकिन इस डेमो में ऑनलाइन आवेदन उपलब्ध नहीं है।')}</p>
          </div>
        </div>
        <PortalLink href="/mp/services" className="button button--primary button--full" onNavigate={onClose}>
          {copy(language, 'Open driving licence services', 'ड्राइविंग लाइसेंस सेवाएँ खोलें')}
        </PortalLink>
      </section>
    </div>
  )
}

function StateSelectionDialog({ language, onClose }: { language: Language; onClose: () => void }) {
  const [selectedState, setSelectedState] = useState('Madhya Pradesh')
  const configured = selectedState === 'Madhya Pradesh'
  const otherStates = [
    'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
    'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat',
    'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh',
    'Lakshadweep', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry',
    'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  ]

  const dialogRef = useAccessibleDialog(onClose)

  const proceed = () => {
    if (configured) {
      onClose()
      navigatePortal('/mp/services')
    }
  }

  return (
    <div className="dialog-layer" onMouseDown={onClose} data-tour="state-selection-dialog">
      <section
        ref={dialogRef}
        tabIndex={-1}
        className="help-dialog state-selection-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="state-selection-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-heading">
          <div>
            <p className="eyebrow">{copy(language, 'Driving licence services', 'ड्राइविंग लाइसेंस सेवाएँ')}</p>
            <h2 id="state-selection-title">{copy(language, 'Select your state', 'अपना राज्य चुनें')}</h2>
            <p className="state-selection-dialog__subtitle">
              {copy(language, 'Select your state or territory to continue to citizen services.', 'नागरिक सेवाओं के लिए अपने राज्य या केंद्र शासित प्रदेश का चयन करें।')}
            </p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label={copy(language, 'Close state selection', 'राज्य चयन बंद करें')}>
            <X size={20} />
          </button>
        </div>

        <label className="state-select-field" htmlFor="portal-state-select">
          <span>{copy(language, 'State or Union Territory', 'राज्य या केंद्र शासित प्रदेश')}</span>
          <div className="state-select-wrap">
            <select
              id="portal-state-select"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              autoFocus
            >
              <option value="Madhya Pradesh">Madhya Pradesh (Interactive Demo)</option>
              {otherStates.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            <ChevronDown size={18} className="state-select-chevron" aria-hidden="true" />
          </div>
        </label>

        <div className={`state-notice ${configured ? 'state-notice--demo' : 'state-notice--external'}`}>
          {configured ? <CheckCircle2 size={16} /> : <Info size={16} />}
          <span>
            {configured
              ? copy(language, 'Configured with the complete interactive demonstration (Application, Device Check, Payment & Test).', 'पूर्ण इंटरैक्टिव डेमो के साथ कॉन्फ़िगर किया गया (आवेदन, डिवाइस जाँच, भुगतान एवं परीक्षा)।')
              : copy(language, `You will be directed to the official MoRTH Parivahan portal for ${selectedState}.`, `${selectedState} के लिए आपको आधिकारिक MoRTH परिवहन पोर्टल पर ले जाया जाएगा।`)}
          </span>
        </div>

        <div className="state-selection-actions">
          {configured ? (
            <button className="button button--primary button--full" onClick={proceed} data-tour="state-selection-continue">
              {copy(language, 'Continue to Madhya Pradesh services', 'मध्य प्रदेश सेवाओं पर जाएँ')} <ArrowRight size={18} />
            </button>
          ) : (
            <a className="button button--primary button--full" href="https://parivahan.gov.in/" target="_blank" rel="noreferrer">
              {copy(language, `Open official Parivahan portal for ${selectedState}`, `${selectedState} के लिए आधिकारिक पोर्टल खोलें`)} <ExternalLink size={18} />
            </a>
          )}
        </div>
      </section>
    </div>
  )
}

function PortalFooter({ language, national, onPrototypeDetails }: { language: Language; national: boolean; onPrototypeDetails: () => void }) {
  return (
    <footer className="portal-footer">
      <div className="portal-container portal-footer__grid">
        <div className="portal-footer__brand">
          <PortalMark language={language} national={national} />
          <p>{copy(language, 'Independent hackathon prototype inspired by Indian public digital-service patterns.', 'भारतीय सार्वजनिक डिजिटल-सेवा पैटर्न से प्रेरित स्वतंत्र हैकाथॉन प्रोटोटाइप।')}</p>
          <p className="portal-footer__tagline">{copy(language, 'No government department has issued or endorsed the records shown here.', 'यहाँ दिखाए रिकॉर्ड किसी सरकारी विभाग ने जारी या अनुमोदित नहीं किए हैं।')}</p>
        </div>
        <div>
          <strong>{copy(language, 'Citizen Services', 'नागरिक सेवाएँ')}</strong>
          <PortalLink href="/mp/services">{copy(language, 'Driving licence services', 'ड्राइविंग लाइसेंस सेवाएँ')}</PortalLink>
          <PortalLink href="/mp/ll/start">{copy(language, 'Apply for Learner’s Licence', 'लर्नर लाइसेंस के लिए आवेदन')}</PortalLink>
          <PortalLink href="/mp/service/application-status">{copy(language, 'Application status', 'आवेदन स्थिति')}</PortalLink>
          <PortalLink href="/mp/service/fee-payment">{copy(language, 'Fees and receipts', 'शुल्क और रसीदें')}</PortalLink>
        </div>
        <div>
          <strong>{copy(language, 'Resources & Acts', 'संसाधन और अधिनियम')}</strong>
          <a href="#information">{copy(language, 'Citizen service guide', 'नागरिक सेवा मार्गदर्शिका')}</a>
          <a href="#information">{copy(language, 'Central Motor Vehicles Act', 'केंद्रीय मोटर वाहन अधिनियम')}</a>
          <a href="#information">{copy(language, 'Know Road Signs', 'सड़क संकेत जानें')}</a>
          <a href="#information">{copy(language, 'Find Transport Office (RTO)', 'परिवहन कार्यालय खोजें')}</a>
        </div>
        <div>
          <strong>{copy(language, 'Portal & Support', 'पोर्टल एवं सहायता')}</strong>
          <PortalLink href="/">{copy(language, 'Home', 'होम')}</PortalLink>
          <button type="button" onClick={onPrototypeDetails}>{copy(language, 'About this demo', 'इस डेमो के बारे में')}</button>
          <span>{copy(language, 'English/Hindi • Screen-reader friendly', 'द्विभाषी • स्क्रीन-रीडर सुलभ')}</span>
          <div className="portal-footer__counter">
            <small>{copy(language, 'Prototype storage:', 'प्रोटोटाइप स्टोरेज:')}</small>
            <strong>{copy(language, 'This browser only', 'केवल यह ब्राउज़र')}</strong>
          </div>
        </div>
      </div>
      <div className="portal-footer__bottom">
        <div className="portal-container portal-footer__bottom-inner">
          <span>{copy(language, 'Independent hackathon demo for Build What Moves India.', 'बिल्ड व्हॉट मूव्स इंडिया के लिए स्वतंत्र हैकाथॉन डेमो।')}</span>
          <span className="portal-footer__timestamp">{copy(language, 'Last Updated: August 2026 | Designed with public digital-service patterns', 'अंतिम अपडेट: अगस्त 2026 | सार्वजनिक डिजिटल सेवा मानकों पर आधारित')}</span>
        </div>
      </div>
    </footer>
  )
}

function RouteLoading({ language }: { language: Language }) {
  return <section className="route-guard" role="status" aria-live="polite"><FileClock size={30} /><p className="eyebrow">{copy(language, 'Loading service', 'सेवा लोड हो रही है')}</p><h1>{copy(language, 'Opening the saved page…', 'सहेजा पेज खोला जा रहा है…')}</h1><p>{copy(language, 'Your application remains saved on this device.', 'आपका आवेदन इस डिवाइस पर सुरक्षित है।')}</p></section>
}

function PortalApp() {
  const pathname = usePathname()
  const route = parsePortalRoute(pathname)
  const [language, setLanguage] = useState<Language>(() => readPreference('mp-portal-language') === 'hi' ? 'hi' : 'en')
  const [textScale, setTextScale] = useState<TextScale>(() => readPreference('mp-portal-text-scale') === 'large' ? 'large' : 'normal')
  const [helpOpen, setHelpOpen] = useState(false)
  const [prototypeDetailsOpen, setPrototypeDetailsOpen] = useState(false)
  const [unavailableDestination, setUnavailableDestination] = useState<HomeDestination | null>(null)
  const [stateSelectionOpen, setStateSelectionOpen] = useState(false)
  const [session, setSession] = useState<DemoSession | null>(() => loadDemoSession())
  const [accountOpen, setAccountOpen] = useState(false)
  const [demoApplication, setDemoApplication] = useState<DemoApplication | null>(() => loadDemoApplication())
  const tour = useJudgeTour(pathname, demoApplication?.id)

  useEffect(() => {
    document.documentElement.lang = language === 'hi' ? 'hi' : 'en-IN'
    savePreference('mp-portal-language', language)
  }, [language])
  useEffect(() => {
    document.documentElement.dataset.textScale = textScale
    savePreference('mp-portal-text-scale', textScale)
  }, [textScale])
  useEffect(() => {
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'instant' : 'smooth' })
    window.requestAnimationFrame(() => document.querySelector<HTMLElement>('main h1')?.focus({ preventScroll: true }))
  }, [pathname])

  const createApplication = (kind: 'full' | 'judge') => {
    const draft = kind === 'judge' ? createPreparedDraft() : createEmptyDraft()
    saveApplicationDraft(draft)
    const application: DemoApplication = {
      version: 1,
      id: draft.applicationId,
      applicant: kind === 'judge' ? 'Aarav Verma' : 'New applicant',
      lastStage: kind === 'judge' ? 'Device check & test practice' : 'Applicant category',
      savedAt: new Date().toISOString(),
    }
    saveDemoApplicationRecord(application)
    setDemoApplication(application)
    navigatePortal(kind === 'judge' ? `/mp/application/${application.id}/readiness` : '/mp/ll/application/category')
  }

  const syncApplication = (draft: LLApplicationDraft, lastStage: string) => {
    const name = [draft.firstName, draft.lastName].filter(Boolean).join(' ') || 'Applicant'
    const application: DemoApplication = { version: 1, id: draft.applicationId, applicant: name, lastStage, savedAt: new Date().toISOString() }
    saveDemoApplicationRecord(application)
    setDemoApplication(application)
  }

  const updateApplicationStage = (lastStage: string) => {
    setDemoApplication((current) => {
      if (!current) return current
      const updated = { ...current, lastStage, savedAt: new Date().toISOString() }
      saveDemoApplicationRecord(updated)
      return updated
    })
  }

  useEffect(() => {
    const appId = ('applicationId' in route && route.applicationId) ? route.applicationId : demoApplication?.id
    if (!appId) return
    const draft = loadApplicationDraft(appId)
    const progress = loadJourneyProgress(appId)
    const examSession = loadExamSession(appId, progress)
    const journey = deriveJourneyState({ applicationId: appId, draft, progress, examSession })
    const access = getRouteAccess({ route, journey })
    if (!access.allowed && access.redirectHref && access.redirectHref !== pathname) {
      navigatePortal(access.redirectHref)
    }
  }, [pathname, route, demoApplication])

  let page: ReactNode
  if (route.name === 'home') page = <NationalHomePage language={language} tour={tour} onUnavailable={setUnavailableDestination} onDrivingServices={() => setStateSelectionOpen(true)} onPrototypeDetails={() => setPrototypeDetailsOpen(true)} />
  else if (route.name === 'login') page = <LoginPage language={language} onSignedIn={(nextSession) => { saveDemoSession(nextSession); setSession(nextSession) }} />
  else if (route.name === 'services') page = <ServicesPage language={language} demoApplication={demoApplication} />
  else if (route.name === 'll-start') page = <LLStartPage language={language} onCreate={createApplication} demoApplication={demoApplication} />
  else if (route.name === 'll-application') page = <ApplicationFlow language={language} step={route.step} onSubmitted={(draft: LLApplicationDraft) => { syncApplication(draft, 'Documents & photo'); navigatePortal('/mp/ll/submitted') }} />
  else if (route.name === 'll-submitted') page = <SubmittedPage language={language} onContinue={(draft: LLApplicationDraft) => { syncApplication(draft, 'Documents & photo'); navigatePortal(`/mp/application/${draft.applicationId}/uploads`) }} />
  else if (route.name === 'uploads') page = <UploadsPage language={language} applicationId={route.applicationId} onComplete={(draft: LLApplicationDraft) => { syncApplication(draft, 'Device check & test practice'); navigatePortal(`/mp/application/${draft.applicationId}/readiness`) }} />
  else if (route.name === 'readiness') page = <DeviceReadinessPage language={language} applicationId={route.applicationId} onStageChange={updateApplicationStage} />
  else if (route.name === 'rehearsal') page = <RehearsalPage language={language} applicationId={route.applicationId} onStageChange={updateApplicationStage} />
  else if (route.name === 'payment') page = <PaymentPage language={language} applicationId={route.applicationId} />
  else if (route.name === 'payment-redirect') page = <PaymentRedirectPage language={language} applicationId={route.applicationId} />
  else if (route.name === 'gateway') page = <GatewayPage language={language} applicationId={route.applicationId} />
  else if (route.name === 'payment-return') page = <PaymentReturnPage language={language} applicationId={route.applicationId} onStageChange={updateApplicationStage} />
  else if (route.name === 'payment-status') page = <PaymentStatusPage language={language} applicationId={route.applicationId} />
  else if (route.name === 'receipt') page = <PaymentReceiptPage language={language} applicationId={route.applicationId} />
  else if (route.name === 'tutorial') page = <TutorialPage applicationId={route.applicationId} onStageChange={updateApplicationStage} language={language} />
  else if (route.name === 'test-entry') page = <TestEntryPage applicationId={route.applicationId} onStageChange={updateApplicationStage} language={language} />
  else if (route.name === 'test') page = <TestPage applicationId={route.applicationId} onStageChange={updateApplicationStage} language={language} />
  else if (route.name === 'test-interruption') page = <InterruptionPage applicationId={route.applicationId} onStageChange={updateApplicationStage} language={language} />
  else if (route.name === 'result') page = <ResultPage applicationId={route.applicationId} onStageChange={updateApplicationStage} language={language} />
  else if (route.name === 'result-review') page = <ResultReviewPage applicationId={route.applicationId} onStageChange={updateApplicationStage} language={language} />
  else if (route.name === 'application') page = <ApplicationPage language={language} application={demoApplication ?? { version: 1, id: route.applicationId, applicant: copy(language, 'Sample applicant', 'नमूना आवेदक'), lastStage: copy(language, 'Device compatibility', 'डिवाइस अनुकूलता'), savedAt: new Date().toISOString() }} />
  else if (route.name === 'service') {
    const service = getService(route.serviceId)
    page = route.serviceId === 'application-status'
      ? <ApplicationLookupPage language={language} knownApplicationId={demoApplication?.id} />
      : route.serviceId === 'fee-payment'
        ? <FeeAndReceiptHub language={language} applicationId={demoApplication?.id} />
        : service ? <ServicePage service={service} language={language} /> : <NotFoundPage language={language} />
  } else page = <NotFoundPage language={language} />

  if (route.name === 'gateway' || route.name === 'rehearsal' || route.name === 'test' || route.name === 'test-interruption') {
    return (
      <div className="portal-app portal-app--focused-route">
        <Suspense fallback={<RouteLoading language={language} />}>{page}</Suspense>
        <JudgeTourCoachmark tour={tour} language={language} />
      </div>
    )
  }

  const national = route.name === 'home' || route.name === 'login'
  return (
    <div className="portal-app">
      <PortalHeader
        pathname={pathname}
        language={language}
        textScale={textScale}
        national={national}
        session={session}
        onLanguage={() => setLanguage((value) => value === 'en' ? 'hi' : 'en')}
        onTextScale={() => setTextScale((value) => value === 'normal' ? 'large' : 'normal')}
        onHelp={() => setHelpOpen(true)}
        onAccount={() => setAccountOpen(true)}
      />
      <main id="main-content" className={`portal-container portal-main ${route.name === 'home' ? 'portal-main--home' : ''}`}>
        <Suspense fallback={<RouteLoading language={language} />}>{page}</Suspense>
      </main>
      <PortalFooter language={language} national={national} onPrototypeDetails={() => setPrototypeDetailsOpen(true)} />
      <JudgeTourFloatingPill tour={tour} language={language} />
      <JudgeTourCoachmark tour={tour} language={language} />
      {helpOpen && <HelpDialog route={route} language={language} onClose={() => setHelpOpen(false)} />}
      {prototypeDetailsOpen && <PrototypeDetailsDialog language={language} onClose={() => setPrototypeDetailsOpen(false)} />}
      {unavailableDestination && <UnavailableServiceDialog destination={unavailableDestination} language={language} onClose={() => setUnavailableDestination(null)} />}
      {stateSelectionOpen && <StateSelectionDialog language={language} onClose={() => setStateSelectionOpen(false)} />}
      {accountOpen && session && (
        <Suspense fallback={null}>
          <AccountDialog language={language} session={session} onClose={() => setAccountOpen(false)} onSignOut={() => { clearDemoSession(); setSession(null); setAccountOpen(false); navigatePortal('/') }} />
        </Suspense>
      )}
    </div>
  )
}

export default PortalApp
