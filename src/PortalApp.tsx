import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react'
import {
  Accessibility,
  ArrowLeft,
  ArrowRight,
  Bike,
  BookOpenCheck,
  CalendarDays,
  Camera,
  CarFront,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  ClipboardCheck,
  CreditCard,
  FileClock,
  FileText,
  Headphones,
  IndianRupee,
  Languages,
  Landmark,
  LogIn,
  MapPinned,
  Menu,
  Mic2,
  MonitorCheck,
  Phone,
  Printer,
  Route as RouteIcon,
  Search,
  ShieldCheck,
  SignpostBig,
  TrafficCone,
  Truck,
  Upload,
  UserRoundCheck,
  Wifi,
  X,
  type LucideIcon,
} from 'lucide-react'
import { getService, serviceCategories, serviceCategoryLabels, services, type ServiceDefinition } from './portal/config'
import { navigatePortal, parsePortalRoute, type PortalRoute } from './portal/router'
import { ApplicationFlow, SubmittedPage, UploadsPage } from './portal/ApplicationFlow'
import { createEmptyDraft, createPreparedDraft, loadApplicationDraft, saveApplicationDraft, type LLApplicationDraft } from './portal/application'
import { DeviceReadinessPage, RehearsalPage } from './portal/ReadinessJourney'
import { GatewayPage, PaymentPage, PaymentRedirectPage, PaymentReturnPage } from './portal/PaymentJourney'
import { isPaymentConfirmed, paymentNeedsReconciliation } from './portal/payment'
import { loadJourneyProgress } from './portal/progress'
import { InterruptionPage, ResultPage, TestEntryPage, TestPage, TutorialPage } from './portal/TestJourney'
import { loadExamSession } from './portal/examSession'
import { AccountDialog, LoginPage } from './portal/AuthPages'
import { clearDemoSession, loadDemoSession, saveDemoSession, type DemoSession } from './portal/auth'
import { ApplicationLookupPage, FeeAndReceiptHub, PaymentReceiptPage, PaymentStatusPage } from './portal/StatusUtilities'

type Language = 'en' | 'hi'
type TextScale = 'normal' | 'large'

const copy = (language: Language, en: string, hi: string) => language === 'en' ? en : hi

type DemoApplication = {
  id: string
  applicant: string
  lastStage: string
  savedAt: string
}

const APP_STORAGE_KEY = 'mp-ll-demo-application-v1'

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

function PortalLink({ href, className, children, onNavigate }: { href: string; className?: string; children: ReactNode; onNavigate?: () => void }) {
  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigatePortal(href)
    onNavigate?.()
  }
  return <a href={href} className={className} onClick={open}>{children}</a>
}

function PortalMark({ language = 'en', national = false }: { language?: Language; national?: boolean }) {
  return (
    <div className="portal-mark">
      <span className="portal-mark__symbol" aria-hidden="true"><Landmark size={27} /></span>
      <span className="portal-mark__text">
        <span>{national ? copy(language, 'Ministry of Road Transport & Highways', 'सड़क परिवहन और राजमार्ग मंत्रालय') : copy(language, 'Madhya Pradesh Transport Department', 'मध्य प्रदेश परिवहन विभाग')}</span>
        <strong>{national ? copy(language, 'Parivahan Sewa', 'परिवहन सेवा') : copy(language, 'Sarathi Citizen Services', 'सारथी नागरिक सेवाएँ')}</strong>
        <small>{national ? copy(language, 'Government transport services', 'सरकारी परिवहन सेवाएँ') : copy(language, 'Driving licence services', 'ड्राइविंग लाइसेंस सेवाएँ')}</small>
      </span>
    </div>
  )
}

function PortalHeader({ language, textScale, national, session, onLanguage, onTextScale, onHelp, onAccount }: {
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
  return (
    <>
      <a className="skip-link" href="#main-content">{copy(language, 'Skip to main content', 'मुख्य सामग्री पर जाएँ')}</a>
      <div className="government-bar">
        <div className="portal-container government-bar__inner">
          <span>{national ? 'भारत सरकार' : 'मध्य प्रदेश शासन'} <i aria-hidden="true" /> {national ? 'Government of India' : 'Government of Madhya Pradesh'}</span>
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
              <PortalLink href="/" onNavigate={close}>{copy(language, 'Home', 'होम')}</PortalLink>
              <a href="#citizen-services" onClick={close}>{copy(language, 'Online services', 'ऑनलाइन सेवाएँ')}</a>
              <a href="#information" onClick={close}>{copy(language, 'Information', 'जानकारी')}</a>
              <a href="#updates" onClick={close}>{copy(language, 'Updates', 'अपडेट')}</a>
              <button onClick={() => { close(); onHelp() }}>{copy(language, 'Help & support', 'सहायता')}</button>
            </> : <>
              <PortalLink href="/" onNavigate={close}>{copy(language, 'Home', 'होम')}</PortalLink>
              <PortalLink href="/mp/services" onNavigate={close}>{copy(language, 'Services', 'सेवाएँ')}</PortalLink>
              <PortalLink href="/mp/ll/start" onNavigate={close}>{copy(language, 'Apply for LL', 'एलएल के लिए आवेदन')}</PortalLink>
              <PortalLink href="/mp/service/application-status" onNavigate={close}>{copy(language, 'Application status', 'आवेदन की स्थिति')}</PortalLink>
              <PortalLink href="/mp/service/fee-payment" onNavigate={close}>{copy(language, 'Fee & receipts', 'शुल्क और रसीदें')}</PortalLink>
              <button onClick={() => { close(); onHelp() }}>{copy(language, 'Help & support', 'सहायता')}</button>
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
      <ol>{items.map((item, index) => <li key={`${item.label}-${index}`}>{item.href ? <PortalLink href={item.href}>{item.label}</PortalLink> : <span aria-current="page">{item.label}</span>}</li>)}</ol>
    </nav>
  )
}

type HomeDestination = 'vehicle' | 'permit' | 'safety' | 'information'

function NationalHomePage({ language, onUnavailable }: { language: Language; onUnavailable: (destination: HomeDestination) => void }) {
  const secondaryServices: Array<{ id: HomeDestination; icon: LucideIcon; title: string; titleHi: string; body: string; bodyHi: string }> = [
    { id: 'vehicle', icon: CarFront, title: 'Vehicle registration services', titleHi: 'वाहन पंजीकरण सेवाएँ', body: 'Registration, ownership, permits and vehicle records.', bodyHi: 'पंजीकरण, स्वामित्व, परमिट और वाहन रिकॉर्ड।' },
    { id: 'permit', icon: Truck, title: 'Commercial transport services', titleHi: 'वाणिज्यिक परिवहन सेवाएँ', body: 'National permits, fitness and transport operations.', bodyHi: 'राष्ट्रीय परमिट, फिटनेस और परिवहन संचालन।' },
    { id: 'safety', icon: TrafficCone, title: 'Road safety services', titleHi: 'सड़क सुरक्षा सेवाएँ', body: 'Rules, signs, safe-driving guidance and resources.', bodyHi: 'नियम, संकेत, सुरक्षित ड्राइविंग मार्गदर्शन और संसाधन।' },
  ]
  const informationLinks = [
    { icon: SignpostBig, en: 'Know road signs', hi: 'सड़क संकेत जानें' },
    { icon: FileText, en: 'Forms and documents', hi: 'फॉर्म और दस्तावेज़' },
    { icon: MapPinned, en: 'Find a transport office', hi: 'परिवहन कार्यालय खोजें' },
    { icon: RouteIcon, en: 'Citizen service guide', hi: 'नागरिक सेवा मार्गदर्शिका' },
  ]
  return <div className="national-home">
    <section className="national-hero" aria-labelledby="home-title">
      <img src="/assets/parivahan-transport-hero.png" alt="Indian road transport connecting citizens, buses and commercial vehicles" fetchPriority="high" />
      <div className="national-hero__shade" aria-hidden="true" />
      <div className="national-hero__content">
        <p className="eyebrow">{copy(language, 'Parivahan citizen services', 'परिवहन नागरिक सेवाएँ')}</p>
        <h1 id="home-title" tabIndex={-1}>{copy(language, 'Road transport services in one place', 'सड़क परिवहन सेवाएँ एक ही स्थान पर')}</h1>
        <p>{copy(language, 'Find licence, vehicle, permit and road-safety services with clear guidance at every step.', 'लाइसेंस, वाहन, परमिट और सड़क सुरक्षा सेवाएँ हर चरण पर स्पष्ट मार्गदर्शन के साथ पाएँ।')}</p>
        <div className="national-hero__actions">
          <a className="button button--light" href="#citizen-services">{copy(language, 'Explore services', 'सेवाएँ देखें')} <ArrowRight size={18} /></a>
          <PortalLink className="button national-hero__secondary" href="/mp/services">{copy(language, 'Driving licence services', 'ड्राइविंग लाइसेंस सेवाएँ')}</PortalLink>
        </div>
      </div>
    </section>

    <section id="citizen-services" className="home-section" aria-labelledby="citizen-services-title">
      <div className="home-section__heading"><div><p className="eyebrow">{copy(language, 'Online services', 'ऑनलाइन सेवाएँ')}</p><h2 id="citizen-services-title">{copy(language, 'What would you like to do?', 'आप क्या करना चाहते हैं?')}</h2></div><p>{copy(language, 'Choose a service area to see the available citizen services.', 'उपलब्ध नागरिक सेवाएँ देखने के लिए एक सेवा क्षेत्र चुनें।')}</p></div>
      <div className="home-service-grid">
        <PortalLink href="/mp/services" className="home-service-card home-service-card--primary">
          <span className="home-service-card__icon"><Bike size={28} /></span>
          <span><strong>{copy(language, 'Driving licence services', 'ड्राइविंग लाइसेंस सेवाएँ')}</strong><small>{copy(language, 'Learner’s licence, application status, test and related services.', 'लर्नर लाइसेंस, आवेदन स्थिति, परीक्षा और संबंधित सेवाएँ।')}</small></span>
          <ArrowRight size={21} />
        </PortalLink>
        {secondaryServices.map(({ id, icon: Icon, title, titleHi, body, bodyHi }) => <button type="button" className="home-service-card" key={id} onClick={() => onUnavailable(id)}>
          <span className="home-service-card__icon"><Icon size={26} /></span>
          <span><strong>{copy(language, title, titleHi)}</strong><small>{copy(language, body, bodyHi)}</small></span>
          <ArrowRight size={21} />
        </button>)}
      </div>
    </section>

    <section id="information" className="home-information" aria-labelledby="information-title">
      <div className="home-information__intro"><p className="eyebrow">{copy(language, 'Information services', 'जानकारी सेवाएँ')}</p><h2 id="information-title">{copy(language, 'Understand the process before you begin', 'शुरू करने से पहले प्रक्रिया समझें')}</h2><p>{copy(language, 'Simple guides help you prepare the correct documents, understand road rules and find the right office.', 'सरल मार्गदर्शिकाएँ सही दस्तावेज़ तैयार करने, सड़क नियम समझने और सही कार्यालय खोजने में मदद करती हैं।')}</p></div>
      <div className="home-information__links">{informationLinks.map(({ icon: Icon, en, hi }) => <button type="button" key={en} onClick={() => onUnavailable('information')}><Icon size={22} /><span>{copy(language, en, hi)}</span><ArrowRight size={18} /></button>)}</div>
    </section>

    <section id="updates" className="home-updates" aria-label={copy(language, 'Updates and help', 'अपडेट और सहायता')}>
      <article><div className="home-section__heading"><div><p className="eyebrow">{copy(language, 'Quick actions', 'त्वरित कार्य')}</p><h2>{copy(language, 'Continue a service', 'सेवा जारी रखें')}</h2></div></div><div className="home-action-list"><PortalLink href="/mp/service/application-status"><FileClock size={21} /><span><strong>{copy(language, 'Check application status', 'आवेदन की स्थिति देखें')}</strong><small>{copy(language, 'Use an application number to view progress.', 'प्रगति देखने के लिए आवेदन संख्या का उपयोग करें।')}</small></span><ArrowRight size={19} /></PortalLink><PortalLink href="/mp/service/fee-payment"><IndianRupee size={21} /><span><strong>{copy(language, 'Fee and receipt services', 'शुल्क और रसीद सेवाएँ')}</strong><small>{copy(language, 'Review payment status and receipts.', 'भुगतान स्थिति और रसीदें देखें।')}</small></span><ArrowRight size={19} /></PortalLink></div></article>
      <article><div className="home-section__heading"><div><p className="eyebrow">{copy(language, 'Frequently asked questions', 'अक्सर पूछे जाने वाले प्रश्न')}</p><h2>{copy(language, 'Common questions', 'सामान्य प्रश्न')}</h2></div></div><div className="home-faq"><details><summary>{copy(language, 'How do I apply for a Learner’s Licence?', 'लर्नर लाइसेंस के लिए आवेदन कैसे करें?')}</summary><p>{copy(language, 'Open Driving licence services, choose Apply for a new Learner’s Licence, and follow the guided steps.', 'ड्राइविंग लाइसेंस सेवाएँ खोलें, नया लर्नर लाइसेंस आवेदन चुनें और बताए गए चरण पूरे करें।')}</p></details><details><summary>{copy(language, 'Can I check my application later?', 'क्या मैं अपना आवेदन बाद में देख सकता/सकती हूँ?')}</summary><p>{copy(language, 'Yes. Application status shows completed work and the next action required.', 'हाँ। आवेदन स्थिति में पूरा काम और अगला जरूरी चरण दिखाई देता है।')}</p></details><details><summary>{copy(language, 'Where can I get help on a page?', 'किसी पेज पर सहायता कहाँ मिलेगी?')}</summary><p>{copy(language, 'Use Help in the top bar for an explanation of that page, what you need and what happens next.', 'उस पेज की जानकारी, आवश्यक चीजें और अगला चरण समझने के लिए ऊपर सहायता चुनें।')}</p></details></div></article>
    </section>
  </div>
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

function loadDemoApplication(): DemoApplication | null {
  try {
    const value = localStorage.getItem(APP_STORAGE_KEY)
    return value ? JSON.parse(value) as DemoApplication : null
  } catch {
    return null
  }
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

  return <>
    <Breadcrumbs items={[{ label: copy(language, 'Home', 'होम'), href: '/' }, { label: copy(language, 'Driving licence services', 'ड्राइविंग लाइसेंस सेवाएँ') }]} />
    <section className="page-title page-title--dashboard">
      <div>
        <p className="eyebrow">{copy(language, 'Citizen services', 'नागरिक सेवाएँ')}</p>
        <h1 tabIndex={-1}>{copy(language, 'Driving licence services', 'ड्राइविंग लाइसेंस सेवाएँ')}</h1>
        <p>{copy(language, 'Choose a service or continue an application already saved on this device.', 'कोई सेवा चुनें या इस डिवाइस पर पहले से सहेजा गया आवेदन जारी रखें।')}</p>
      </div>
    </section>

    <section className="application-panel" aria-labelledby="application-panel-title">
      <div className="section-heading">
        <div><p className="eyebrow">{copy(language, 'Current application', 'वर्तमान आवेदन')}</p><h2 id="application-panel-title">{demoApplication ? copy(language, 'Continue where you left off', 'जहाँ छोड़ा था वहीं से जारी रखें') : copy(language, 'No application in progress', 'कोई आवेदन प्रगति पर नहीं है')}</h2></div>
        {demoApplication && <span className="saved-indicator"><CheckCircle2 size={17} /> {copy(language, 'Saved on this device', 'इस डिवाइस पर सहेजा गया')}</span>}
      </div>
      {demoApplication ? <div className="active-application">
        <div><small>{copy(language, 'Application number', 'आवेदन संख्या')}</small><strong>{demoApplication.id}</strong></div>
        <div><small>{copy(language, 'Applicant', 'आवेदक')}</small><strong>{citizenApplicantName(demoApplication.applicant)}</strong></div>
        <div><small>{copy(language, 'Next action', 'अगला काम')}</small><strong>{citizenStageName(demoApplication.lastStage, language)}</strong></div>
        <PortalLink href={`/mp/application/${demoApplication.id}`} className="button button--primary">{copy(language, 'Continue application', 'आवेदन जारी रखें')} <ArrowRight size={18} /></PortalLink>
      </div> : <div className="empty-application"><ClipboardCheck size={28} aria-hidden="true" /><div><strong>{copy(language, 'Apply for a new Learner’s Licence', 'नए लर्नर लाइसेंस के लिए आवेदन करें')}</strong><p>{copy(language, 'Read the process and requirements before you begin.', 'शुरू करने से पहले प्रक्रिया और आवश्यकताएँ पढ़ें।')}</p></div><PortalLink href="/mp/ll/start" className="button button--primary">{copy(language, 'Start application', 'आवेदन शुरू करें')} <ArrowRight size={18} /></PortalLink></div>}
    </section>

    <section className="services-section" aria-labelledby="services-title">
      <div className="section-heading"><div><p className="eyebrow">{copy(language, 'Online services', 'ऑनलाइन सेवाएँ')}</p><h2 id="services-title">{copy(language, 'Select a service', 'सेवा चुनें')}</h2></div><span className="result-count" aria-live="polite">{copy(language, `${filtered.length} services`, `${filtered.length} सेवाएँ`)}</span></div>
      <div className="service-tools">
        <label className="service-search"><Search size={20} aria-hidden="true" /><span className="visually-hidden">{copy(language, 'Search services', 'सेवाएँ खोजें')}</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy(language, 'Search by service name', 'सेवा का नाम खोजें')} /></label>
        <label className="category-select"><span className="visually-hidden">{copy(language, 'Filter by category', 'श्रेणी के अनुसार चुनें')}</span><select value={category} onChange={(event) => setCategory(event.target.value as typeof category)}><option value="All">{copy(language, 'All services', 'सभी सेवाएँ')}</option>{serviceCategories.map((item) => <option key={item} value={item}>{serviceCategoryLabels[item][language]}</option>)}</select><ChevronDown size={18} aria-hidden="true" /></label>
      </div>
      {groups.length ? <div className="service-directory">{groups.map((group) => <section key={group.category} className="service-group"><h3>{serviceCategoryLabels[group.category][language]}</h3><div className="service-grid">{group.items.map((service) => <ServiceCard key={service.id} service={service} language={language} />)}</div></section>)}</div> : <div className="no-results"><Search size={28} /><h3>{copy(language, 'No matching service', 'कोई सेवा नहीं मिली')}</h3><p>{copy(language, 'Try another name or clear the filter.', 'दूसरा नाम खोजें या फ़िल्टर हटाएँ।')}</p><button className="text-button" onClick={() => { setQuery(''); setCategory('All') }}>{copy(language, 'Clear search and filters', 'खोज और फ़िल्टर हटाएँ')}</button></div>}
    </section>
  </>
}

const llStages = [
  { en: 'Fill in application details', hi: 'आवेदन की जानकारी भरें', detailEn: 'Applicant category, identity, personal details, address, vehicle class and self-declaration.', detailHi: 'आवेदक श्रेणी, पहचान, व्यक्तिगत जानकारी, पता, वाहन वर्ग और स्व-घोषणा।' },
  { en: 'Upload documents', hi: 'दस्तावेज़ अपलोड करें', detailEn: 'Provide the required supporting documents for your application.', detailHi: 'आवेदन के लिए जरूरी सहायक दस्तावेज़ दें।' },
  { en: 'Upload photograph and signature', hi: 'फोटो और हस्ताक्षर अपलोड करें', detailEn: 'Check each preview before saving it.', detailHi: 'सहेजने से पहले हर पूर्वावलोकन जाँचें।' },
  { en: 'Check device and pay the fee', hi: 'डिवाइस जाँचें और शुल्क भरें', detailEn: 'Confirm that the test can run on this device before payment.', detailHi: 'भुगतान से पहले जाँचें कि परीक्षा इस डिवाइस पर चल सकती है।' },
  { en: 'Complete learning and test', hi: 'अध्ययन और परीक्षा पूरी करें', detailEn: 'Study the road-safety material, then take the secured online test.', detailHi: 'सड़क सुरक्षा सामग्री पढ़ें और फिर सुरक्षित ऑनलाइन परीक्षा दें।' },
  { en: 'View result and licence', hi: 'परिणाम और लाइसेंस देखें', detailEn: 'Check the outcome and download the available document.', detailHi: 'परिणाम देखें और उपलब्ध दस्तावेज़ डाउनलोड करें।' },
]

function LLStartPage({ onCreate, language, demoApplication }: { onCreate: (kind: 'full' | 'judge') => void; language: Language; demoApplication: DemoApplication | null }) {
  const [confirmNewApplication, setConfirmNewApplication] = useState(false)
  const launchPhases = [
    { en: 'Application details', hi: 'आवेदन की जानकारी' },
    { en: 'Documents and photo', hi: 'दस्तावेज़ और फोटो' },
    { en: 'Device check and fee', hi: 'डिवाइस जाँच और शुल्क' },
    { en: 'Learning and test', hi: 'अध्ययन और परीक्षा' },
  ]

  const newApplicationCard = (
    <article className={`ll-launch-card ll-launch-card--new${demoApplication ? '' : ' ll-launch-card--primary'}`}>
      <div className="ll-launch-card__icon" aria-hidden="true"><ClipboardCheck size={27} /></div>
      <div className="ll-launch-card__copy">
        <p className="eyebrow">{copy(language, demoApplication ? 'Another application' : 'New application', demoApplication ? 'दूसरा आवेदन' : 'नया आवेदन')}</p>
        <h2>{copy(language, demoApplication ? 'Start a different application' : 'Start a new application', demoApplication ? 'अलग आवेदन शुरू करें' : 'नया आवेदन शुरू करें')}</h2>
        <p>{copy(language, 'Begin with applicant type and identity verification. Your progress is saved on this device.', 'आवेदक प्रकार और पहचान सत्यापन से शुरू करें। आपकी प्रगति इस डिवाइस पर सहेजी जाती है।')}</p>
      </div>
      {!demoApplication ? (
        <button className="button button--light ll-launch-card__action" onClick={() => onCreate('full')}>
          {copy(language, 'Start new application', 'नया आवेदन शुरू करें')} <ArrowRight className="ll-launch-arrow" size={19} />
        </button>
      ) : (
        <button className="button button--secondary ll-launch-card__action" onClick={() => setConfirmNewApplication(true)} aria-expanded={confirmNewApplication}>
          {copy(language, 'Start another', 'दूसरा शुरू करें')} <ArrowRight className="ll-launch-arrow" size={19} />
        </button>
      )}
      {demoApplication && confirmNewApplication && (
        <div className="ll-replace-draft" role="alert">
          <div><strong>{copy(language, 'Replace the saved application on this device?', 'इस डिवाइस पर सहेजे गए आवेदन को बदलें?')}</strong><p>{copy(language, 'The existing local draft will no longer appear as your current application.', 'मौजूदा स्थानीय ड्राफ्ट आपका वर्तमान आवेदन नहीं रहेगा।')}</p></div>
          <div className="ll-replace-draft__actions">
            <button className="text-button" onClick={() => setConfirmNewApplication(false)}>{copy(language, 'Keep saved application', 'सहेजा आवेदन रखें')}</button>
            <button className="button button--primary" onClick={() => onCreate('full')}>{copy(language, 'Start another', 'दूसरा शुरू करें')}</button>
          </div>
        </div>
      )}
    </article>
  )

  const existingApplicationCard = demoApplication ? (
    <article className="ll-launch-card ll-launch-card--primary ll-launch-card--saved">
      <div className="ll-launch-card__icon" aria-hidden="true"><FileClock size={27} /></div>
      <div className="ll-launch-card__copy">
        <p className="eyebrow">{copy(language, 'Saved application', 'सहेजा गया आवेदन')}</p>
        <h2>{copy(language, 'Continue where you stopped', 'जहाँ रुके थे वहीं से जारी रखें')}</h2>
        <dl className="ll-saved-facts">
          <div><dt>{copy(language, 'Application number', 'आवेदन संख्या')}</dt><dd>{demoApplication.id}</dd></div>
          <div><dt>{copy(language, 'Next action', 'अगला काम')}</dt><dd>{citizenStageName(demoApplication.lastStage, language)}</dd></div>
        </dl>
      </div>
      <PortalLink href={`/mp/application/${demoApplication.id}`} className="button button--light ll-launch-card__action">
        {copy(language, 'Continue saved application', 'सहेजा आवेदन जारी रखें')} <ArrowRight className="ll-launch-arrow" size={19} />
      </PortalLink>
    </article>
  ) : (
    <article className="ll-launch-card ll-launch-card--existing">
      <div className="ll-launch-card__icon" aria-hidden="true"><FileClock size={27} /></div>
      <div className="ll-launch-card__copy">
        <p className="eyebrow">{copy(language, 'Existing application', 'मौजूदा आवेदन')}</p>
        <h2>{copy(language, 'Find an application', 'आवेदन खोजें')}</h2>
        <p>{copy(language, 'Use your application number to check its status or continue the next available step.', 'आवेदन संख्या से स्थिति देखें या अगली उपलब्ध प्रक्रिया जारी रखें।')}</p>
      </div>
      <PortalLink href="/mp/service/application-status" className="button button--secondary ll-launch-card__action">
        {copy(language, 'Enter application number', 'आवेदन संख्या दर्ज करें')} <ArrowRight className="ll-launch-arrow" size={19} />
      </PortalLink>
    </article>
  )

  return (
    <>
      <Breadcrumbs items={[{ label: copy(language, 'Services', 'सेवाएँ'), href: '/mp/services' }, { label: copy(language, 'Apply for Learner’s Licence', 'लर्नर लाइसेंस के लिए आवेदन') }]} />
      <section className="page-title ll-launch-title"><div><p className="eyebrow">{copy(language, 'Madhya Pradesh · Learner’s Licence', 'मध्य प्रदेश · लर्नर लाइसेंस')}</p><h1 tabIndex={-1}>{copy(language, 'Apply for a Learner’s Licence', 'लर्नर लाइसेंस के लिए आवेदन करें')}</h1><p>{copy(language, 'Start a new application or continue one already saved.', 'नया आवेदन शुरू करें या पहले से सहेजा आवेदन जारी रखें।')}</p></div></section>

      <section className={`ll-launch-actions${demoApplication ? ' ll-launch-actions--saved' : ''}`} aria-label={copy(language, 'Choose what you want to do', 'चुनें कि आप क्या करना चाहते हैं')}>
        {demoApplication ? <>{existingApplicationCard}{newApplicationCard}</> : <>{newApplicationCard}{existingApplicationCard}</>}
      </section>

      <section className="ll-launch-journey" aria-labelledby="ll-journey-title">
        <div className="ll-launch-journey__heading"><p className="eyebrow">{copy(language, 'What happens after you start', 'शुरू करने के बाद क्या होगा')}</p><h2 id="ll-journey-title">{copy(language, 'Your application journey', 'आपकी आवेदन प्रक्रिया')}</h2></div>
        <ol>{launchPhases.map((phase, index) => <li key={phase.en}><span>{index + 1}</span><strong>{phase[language]}</strong></li>)}</ol>
      </section>

      <details className="ll-launch-details">
        <summary><span><CircleHelp size={22} aria-hidden="true" />{copy(language, 'View the full process and what you will need', 'पूरी प्रक्रिया और जरूरी चीजें देखें')}</span><ChevronDown size={22} aria-hidden="true" /></summary>
        <div className="ll-launch-details__body">
          <section aria-labelledby="ll-full-process-title"><p className="eyebrow">{copy(language, 'Application process', 'आवेदन प्रक्रिया')}</p><h2 id="ll-full-process-title">{copy(language, 'Steps to complete', 'पूरी की जाने वाली प्रक्रियाएँ')}</h2><ol className="process-list">{llStages.map((stage, index) => <li key={stage.en}><span>{index + 1}</span><div><strong>{stage[language]}</strong><p>{language === 'en' ? stage.detailEn : stage.detailHi}</p></div></li>)}</ol></section>
          <section aria-labelledby="ll-requirements-title"><p className="eyebrow">{copy(language, 'Before you begin', 'शुरू करने से पहले')}</p><h2 id="ll-requirements-title">{copy(language, 'Keep these ready', 'ये चीजें तैयार रखें')}</h2><div className="requirement-list"><div><FileText size={20} /><span><strong>{copy(language, 'Application details', 'आवेदन की जानकारी')}</strong><p>{copy(language, 'Personal, address and vehicle-class information.', 'व्यक्तिगत, पता और वाहन वर्ग की जानकारी।')}</p></span></div><div><Camera size={20} /><span><strong>{copy(language, 'Camera and microphone', 'कैमरा और माइक्रोफोन')}</strong><p>{copy(language, 'Needed later for the online-test compatibility check.', 'ऑनलाइन परीक्षा की अनुकूलता जाँच के लिए बाद में आवश्यक।')}</p></span></div><div><Wifi size={20} /><span><strong>{copy(language, 'Stable internet connection', 'स्थिर इंटरनेट कनेक्शन')}</strong><p>{copy(language, 'If the connection drops, return to the last saved stage.', 'कनेक्शन टूटने पर अंतिम सहेजी गई प्रक्रिया पर वापस आएँ।')}</p></span></div></div></section>
        </div>
      </details>
    </>
  )
}

function ApplicationPage({ application, language }: { application: DemoApplication; language: Language }) {
  const progress = loadJourneyProgress(application.id)
  const savedDraft = loadApplicationDraft()
  const uploadsComplete = Boolean(savedDraft?.documentsUploaded && savedDraft.photoUploaded && savedDraft.signatureUploaded)
  const examSession = loadExamSession(application.id, progress)
  const examCompleted = examSession.stage === 'result'
  const applicationStages: Array<[{ en: string; hi: string }, 'completed' | 'needs-action' | 'not-started']> = [
    [{ en: 'Application details', hi: 'आवेदन की जानकारी' }, 'completed'],
    [{ en: 'Identity verification', hi: 'पहचान सत्यापन' }, 'completed'],
    [{ en: 'Photo and documents', hi: 'फोटो और दस्तावेज़' }, uploadsComplete ? 'completed' : 'needs-action'],
    [{ en: 'Device compatibility', hi: 'डिवाइस अनुकूलता' }, progress.readiness.status === 'passed' ? 'completed' : 'needs-action'],
    [{ en: 'Test rehearsal', hi: 'परीक्षा अभ्यास' }, progress.rehearsal.status === 'completed' ? 'completed' : progress.readiness.status === 'passed' ? 'needs-action' : 'not-started'],
    [{ en: 'Fee payment', hi: 'शुल्क भुगतान' }, isPaymentConfirmed(progress.payment) ? 'completed' : progress.rehearsal.status === 'completed' ? 'needs-action' : 'not-started'],
    [{ en: 'Road-safety tutorial', hi: 'सड़क सुरक्षा ट्यूटोरियल' }, progress.tutorial.status === 'completed' ? 'completed' : isPaymentConfirmed(progress.payment) ? 'needs-action' : 'not-started'],
    [{ en: 'LL test', hi: 'एलएल परीक्षा' }, examCompleted ? 'completed' : progress.tutorial.status === 'completed' ? 'needs-action' : 'not-started'],
    [{ en: 'Result and licence', hi: 'परिणाम और लाइसेंस' }, examCompleted ? 'completed' : 'not-started'],
  ]
  const next = !uploadsComplete
    ? { title: copy(language, 'Complete document and image uploads', 'दस्तावेज़ और चित्र अपलोड पूरा करें'), body: copy(language, 'Check the document, photograph and signature previews before continuing.', 'आगे बढ़ने से पहले दस्तावेज़, फोटो और हस्ताक्षर पूर्वावलोकन जाँचें।'), route: 'uploads', action: copy(language, 'Open uploads', 'अपलोड खोलें') }
    : progress.readiness.status !== 'passed'
    ? { title: copy(language, 'Check this device before payment', 'भुगतान से पहले इस डिवाइस की जाँच करें'), body: copy(language, 'Check the camera, microphone, browser and connection so that test problems are found early.', 'कैमरा, माइक्रोफोन, ब्राउज़र और कनेक्शन जाँचें ताकि परीक्षा की समस्या पहले मिल सके।'), route: 'readiness', action: copy(language, 'Check device', 'डिवाइस जाँचें') }
    : progress.rehearsal.status !== 'completed'
      ? { title: copy(language, 'Complete the test rehearsal', 'परीक्षा अभ्यास पूरा करें'), body: copy(language, 'Learn how answers are saved and how a paused test can be resumed.', 'जानें कि उत्तर कैसे सहेजे जाते हैं और रुकी परीक्षा कैसे फिर शुरू होती है।'), route: 'rehearsal', action: copy(language, 'Start rehearsal', 'अभ्यास शुरू करें') }
      : !isPaymentConfirmed(progress.payment)
        ? paymentNeedsReconciliation(progress.payment)
          ? { title: copy(language, 'Check the earlier payment attempt', 'पिछले भुगतान प्रयास की जाँच करें'), body: copy(language, 'Its final status is uncertain. Do not pay again until the existing attempt is reconciled.', 'अंतिम स्थिति अनिश्चित है। मौजूदा प्रयास का मिलान होने तक दोबारा भुगतान न करें।'), route: 'payment-status', action: copy(language, 'Check payment', 'भुगतान जाँचें') }
          : { title: copy(language, 'Review and pay the fee', 'शुल्क देखें और भुगतान करें'), body: copy(language, 'Your device check and rehearsal are complete. Review the fee before continuing.', 'डिवाइस जाँच और अभ्यास पूरा है। आगे बढ़ने से पहले शुल्क देखें।'), route: 'payment', action: copy(language, 'Review fee', 'शुल्क देखें') }
        : progress.tutorial.status !== 'completed'
          ? { title: copy(language, 'Complete the road-safety tutorial', 'सड़क सुरक्षा ट्यूटोरियल पूरा करें'), body: copy(language, 'Study the required material before entering the online test.', 'ऑनलाइन परीक्षा शुरू करने से पहले जरूरी सामग्री पढ़ें।'), route: 'tutorial', action: copy(language, 'Open tutorial', 'ट्यूटोरियल खोलें') }
          : examSession.stage === 'result'
            ? { title: copy(language, 'View result and receipt', 'परिणाम और रसीद देखें'), body: copy(language, 'Review the test outcome and the completed journey record.', 'परीक्षा परिणाम और पूरी प्रक्रिया का रिकॉर्ड देखें।'), route: 'result', action: copy(language, 'View result', 'परिणाम देखें') }
            : { title: examSession.stage === 'interruption' ? copy(language, 'Resume the paused test', 'रुकी हुई परीक्षा फिर शुरू करें') : examSession.stage === 'exam' ? copy(language, 'Continue the saved test', 'सहेजी गई परीक्षा जारी रखें') : copy(language, 'Start the LL test', 'एलएल परीक्षा शुरू करें'), body: copy(language, 'Each confirmed answer is saved before the next question opens.', 'अगला प्रश्न खुलने से पहले हर पक्का उत्तर सहेजा जाता है।'), route: examSession.stage === 'interruption' ? 'test-interruption' : examSession.stage === 'exam' ? 'test' : 'test-entry', action: examSession.stage === 'exam-intro' ? copy(language, 'Enter test', 'परीक्षा में जाएँ') : copy(language, 'Continue test', 'परीक्षा जारी रखें') }
  const completed = 2 + (uploadsComplete ? 1 : 0) + (progress.readiness.status === 'passed' ? 1 : 0) + (progress.rehearsal.status === 'completed' ? 1 : 0) + (isPaymentConfirmed(progress.payment) ? 1 : 0) + (progress.tutorial.status === 'completed' ? 1 : 0) + (examCompleted ? 2 : 0)
  const activity = [
    { title: copy(language, 'Application saved', 'आवेदन सहेजा गया'), detail: copy(language, 'Application details and declaration were recorded.', 'आवेदन जानकारी और घोषणा दर्ज हुई।'), time: application.savedAt },
    ...(progress.readiness.completedAt ? [{ title: copy(language, 'Device check passed', 'डिवाइस जाँच सफल'), detail: copy(language, 'Camera, microphone, browser and connection checks completed.', 'कैमरा, माइक्रोफोन, ब्राउज़र और कनेक्शन जाँच पूरी हुई।'), time: progress.readiness.completedAt }] : []),
    ...(progress.rehearsal.completedAt ? [{ title: copy(language, 'Test rehearsal completed', 'परीक्षा अभ्यास पूरा'), detail: copy(language, 'Answer saving and recovery behavior was practiced.', 'उत्तर सहेजने और रिकवरी का अभ्यास हुआ।'), time: progress.rehearsal.completedAt }] : []),
    ...progress.payment.activity.map((item) => ({ title: item[language === 'en' ? 'titleEn' : 'titleHi'], detail: item[language === 'en' ? 'detailEn' : 'detailHi'], time: item.at })),
    ...(progress.tutorial.completedAt ? [{ title: copy(language, 'Tutorial completed', 'ट्यूटोरियल पूरा'), detail: copy(language, 'Road-safety learning material was completed.', 'सड़क सुरक्षा अध्ययन सामग्री पूरी हुई।'), time: progress.tutorial.completedAt }] : []),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  return (
    <>
      <Breadcrumbs items={[{ label: copy(language, 'Services', 'सेवाएँ'), href: '/mp/services' }, { label: copy(language, 'Application status', 'आवेदन की स्थिति') }]} />
      <section className="page-title"><div><p className="eyebrow">{copy(language, 'Application', 'आवेदन')} · {application.id}</p><h1 tabIndex={-1}>{copy(language, 'Application status', 'आवेदन की स्थिति')}</h1><p>{copy(language, 'See what is complete, what is pending and the next action required.', 'देखें कि क्या पूरा हुआ है, क्या बाकी है और अगला जरूरी काम क्या है।')}</p></div><span className="saved-indicator"><CheckCircle2 size={17} /> {copy(language, 'Last saved', 'अंतिम बार सहेजा')} {new Date(application.savedAt).toLocaleTimeString(language === 'en' ? 'en-IN' : 'hi-IN', { hour: '2-digit', minute: '2-digit' })}</span></section>
      <section className="next-action-card"><span><MonitorCheck size={25} /></span><div><p className="eyebrow">{copy(language, 'What’s next', 'आगे क्या करना है')}</p><h2>{next.title}</h2><p>{next.body}</p></div><PortalLink className="button button--primary" href={`/mp/application/${application.id}/${next.route}`}>{next.action} <ArrowRight size={18} /></PortalLink></section>
      <div className="status-overview-grid"><section className="content-card"><div className="section-heading"><div><p className="eyebrow">{copy(language, 'Application progress', 'आवेदन की प्रगति')}</p><h2>{copy(language, 'Current stages', 'वर्तमान चरण')}</h2></div><span className="progress-count">{copy(language, `${completed} of 9 complete`, `9 में से ${completed} पूरी`)}</span></div><ol className="stage-tracker">{applicationStages.map(([stage, status], index) => <li key={stage.en} className={`stage-tracker__item stage-tracker__item--${status}`}><span className="stage-tracker__marker">{status === 'completed' ? <Check size={16} /> : index + 1}</span><div><strong>{stage[language]}</strong><small>{status === 'completed' ? copy(language, 'Completed and saved', 'पूरा और सहेजा गया') : status === 'needs-action' ? copy(language, 'Action required now', 'अब यह काम करें') : copy(language, 'Not started', 'शुरू नहीं हुआ')}</small></div>{status === 'needs-action' && <span className="stage-label">{copy(language, 'Next', 'अगला')}</span>}</li>)}</ol></section><section className="content-card"><div className="section-heading"><div><p className="eyebrow">{copy(language, 'What happened', 'अब तक क्या हुआ')}</p><h2>{copy(language, 'Application activity', 'आवेदन गतिविधि')}</h2></div></div><ol className="status-activity">{activity.map((item) => <li key={`${item.title}-${item.time}`}><span><Check size={15} /></span><div><strong>{item.title}</strong><p>{item.detail}</p><time dateTime={item.time}>{new Date(item.time).toLocaleString(language === 'en' ? 'en-IN' : 'hi-IN', { dateStyle: 'medium', timeStyle: 'short' })}</time></div></li>)}</ol><div className="status-utilities"><PortalLink href={`/mp/application/${application.id}/payment-status`}><IndianRupee size={18} /> {copy(language, 'Verify payment status', 'भुगतान स्थिति जाँचें')}</PortalLink><PortalLink href={`/mp/application/${application.id}/receipt`}><Printer size={18} /> {copy(language, 'Open receipt', 'रसीद खोलें')}</PortalLink></div></section></div>
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
  if (route.name === 'readiness' || route.name === 'rehearsal' || route.name === 'test-entry' || route.name === 'test' || route.name === 'test-interruption') return {
    title: copy(language, 'Technical help for the online test', 'ऑनलाइन परीक्षा की तकनीकी सहायता'),
    intro: copy(language, 'Help can explain the device check, saving, pause and recovery. It cannot help answer a test question.', 'सहायता डिवाइस जाँच, उत्तर सहेजने, रुकने और फिर शुरू करने की प्रक्रिया समझा सकती है। यह प्रश्न का उत्तर नहीं बताती।'),
    action: copy(language, 'Follow the instruction currently shown on screen and allow camera or microphone only when asked.', 'स्क्रीन पर दिखा वर्तमान निर्देश मानें और माँगे जाने पर ही कैमरा या माइक्रोफोन की अनुमति दें।'),
    need: copy(language, 'Use a supported browser, a working camera and microphone, and a stable connection.', 'समर्थित ब्राउज़र, काम करने वाला कैमरा-माइक्रोफोन और स्थिर कनेक्शन रखें।'),
    next: copy(language, 'A successful check continues the test journey; a problem pauses it with a fix.', 'सफल जाँच के बाद परीक्षा आगे बढ़ेगी; समस्या होने पर सुधार के निर्देश के साथ रुक जाएगी।'),
    issue: copy(language, 'Close other apps using the camera, check browser permission, then run the check again.', 'कैमरा उपयोग कर रहे दूसरे ऐप बंद करें, ब्राउज़र अनुमति जाँचें और फिर से जाँच चलाएँ।'),
  }
  if (route.name === 'payment' || route.name === 'payment-redirect' || route.name === 'payment-return' || route.name === 'payment-status') return {
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
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])
  const help = getHelpContent(route, language)
  const sections = [
    [copy(language, 'What this page is', 'यह पेज क्या है'), help.intro],
    [copy(language, 'What you need to do', 'आपको क्या करना है'), help.action],
    [copy(language, 'What you need', 'आपको क्या चाहिए'), help.need],
    [copy(language, 'What happens next', 'इसके बाद क्या होगा'), help.next],
    [copy(language, 'If something does not work', 'अगर कुछ काम न करे'), help.issue],
  ]
  return <div className="dialog-layer" onMouseDown={onClose}><section className="help-dialog" role="dialog" aria-modal="true" aria-labelledby="help-title" onMouseDown={(event) => event.stopPropagation()}><div className="dialog-heading"><div><p className="eyebrow">{copy(language, 'Page help', 'पेज सहायता')}</p><h2 id="help-title">{help.title}</h2></div><button className="icon-button" onClick={onClose} aria-label={copy(language, 'Close help', 'सहायता बंद करें')} autoFocus><X size={21} /></button></div><div className="help-list help-list--steps">{sections.map(([title, body], index) => <article key={title}><span aria-hidden="true">{index + 1}</span><div><strong>{title}</strong><p>{body}</p></div></article>)}</div><button className="button button--primary button--full" onClick={onClose}>{copy(language, 'I understand', 'मैं समझ गया/गई')}</button></section></div>
}

function PrototypeDetailsDialog({ onClose, language }: { onClose: () => void; language: Language }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])
  return <div className="dialog-layer" onMouseDown={onClose}><section className="help-dialog prototype-dialog" role="dialog" aria-modal="true" aria-labelledby="prototype-title" onMouseDown={(event) => event.stopPropagation()}><div className="dialog-heading"><div><p className="eyebrow">{copy(language, 'Safe demonstration', 'सुरक्षित प्रदर्शन')}</p><h2 id="prototype-title">{copy(language, 'What is real and what is simulated?', 'क्या वास्तविक है और क्या सिम्युलेट किया गया है?')}</h2></div><button className="icon-button" onClick={onClose} aria-label={copy(language, 'Close details', 'जानकारी बंद करें')} autoFocus><X size={21} /></button></div><dl className="prototype-facts"><div><dt>{copy(language, 'Runs on this device', 'इस डिवाइस पर वास्तविक रूप से चलता है')}</dt><dd>{copy(language, 'Form saving, navigation, camera and microphone checks, test-answer checkpoints and recovery behavior.', 'फॉर्म सहेजना, नेविगेशन, कैमरा-माइक्रोफोन जाँच, परीक्षा उत्तर चेकपॉइंट और रिकवरी व्यवहार।')}</dd></div><div><dt>{copy(language, 'Simulated for safety', 'सुरक्षा के लिए सिम्युलेट किया गया')}</dt><dd>{copy(language, 'Identity verification, government records, fees, payment authorization, official test authority and licence issuance.', 'पहचान सत्यापन, सरकारी रिकॉर्ड, शुल्क, भुगतान प्राधिकरण, आधिकारिक परीक्षा और लाइसेंस जारी करना।')}</dd></div></dl><p className="prototype-dialog__note">{copy(language, 'This independent hackathon prototype is not connected to Sarathi, NIC, UIDAI, a bank or the Government of Madhya Pradesh.', 'यह स्वतंत्र हैकाथॉन प्रोटोटाइप सारथी, एनआईसी, यूआईडीएआई, किसी बैंक या मध्य प्रदेश शासन से जुड़ा नहीं है।')}</p><button className="button button--primary button--full" onClick={onClose}>{copy(language, 'Close', 'बंद करें')}</button></section></div>
}

function UnavailableServiceDialog({ destination, language, onClose }: { destination: HomeDestination; language: Language; onClose: () => void }) {
  const titles: Record<HomeDestination, [string, string]> = {
    vehicle: ['Vehicle registration services', 'वाहन पंजीकरण सेवाएँ'],
    permit: ['Commercial transport services', 'वाणिज्यिक परिवहन सेवाएँ'],
    safety: ['Road safety services', 'सड़क सुरक्षा सेवाएँ'],
    information: ['Information service', 'जानकारी सेवा'],
  }
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])
  return <div className="dialog-layer" onMouseDown={onClose}><section className="help-dialog service-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="service-preview-title" onMouseDown={(event) => event.stopPropagation()}><div className="dialog-heading"><div><p className="eyebrow">{copy(language, 'Service directory', 'सेवा सूची')}</p><h2 id="service-preview-title">{copy(language, titles[destination][0], titles[destination][1])}</h2></div><button className="icon-button" onClick={onClose} aria-label={copy(language, 'Close', 'बंद करें')} autoFocus><X size={21} /></button></div><div className="service-preview-dialog__body"><CircleHelp size={28} /><div><strong>{copy(language, 'This service area is being prepared.', 'यह सेवा क्षेत्र तैयार किया जा रहा है।')}</strong><p>{copy(language, 'You can view it in the service directory, but an online transaction is not available in this version.', 'आप इसे सेवा सूची में देख सकते हैं, लेकिन इस संस्करण में ऑनलाइन लेन-देन उपलब्ध नहीं है।')}</p></div></div><PortalLink href="/mp/services" className="button button--primary button--full" onNavigate={onClose}>{copy(language, 'Open driving licence services', 'ड्राइविंग लाइसेंस सेवाएँ खोलें')}</PortalLink></section></div>
}

function PortalFooter({ language, national, onPrototypeDetails }: { language: Language; national: boolean; onPrototypeDetails: () => void }) {
  return <footer className="portal-footer"><div className="portal-container portal-footer__grid"><div><PortalMark language={language} national={national} /><p>{copy(language, 'Clear access to road transport information and citizen services.', 'सड़क परिवहन जानकारी और नागरिक सेवाओं तक स्पष्ट पहुँच।')}</p></div><div><strong>{copy(language, 'Citizen services', 'नागरिक सेवाएँ')}</strong><PortalLink href="/mp/services">{copy(language, 'Driving licence services', 'ड्राइविंग लाइसेंस सेवाएँ')}</PortalLink><PortalLink href="/mp/ll/start">{copy(language, 'Apply for Learner’s Licence', 'लर्नर लाइसेंस के लिए आवेदन')}</PortalLink><PortalLink href="/mp/service/application-status">{copy(language, 'Application status', 'आवेदन स्थिति')}</PortalLink></div><div><strong>{copy(language, 'Portal information', 'पोर्टल जानकारी')}</strong><PortalLink href="/">{copy(language, 'Home', 'होम')}</PortalLink><button type="button" onClick={onPrototypeDetails}>{copy(language, 'Prototype details', 'प्रोटोटाइप जानकारी')}</button><span>{copy(language, 'Accessibility and bilingual support', 'सुलभता और द्विभाषी सहायता')}</span></div></div><div className="portal-footer__bottom"><div className="portal-container">{copy(language, 'Independent hackathon prototype — not an official government service.', 'स्वतंत्र हैकाथॉन प्रोटोटाइप — यह आधिकारिक सरकारी सेवा नहीं है।')}</div></div></footer>
}

function PortalApp() {
  const pathname = usePathname()
  const route = parsePortalRoute(pathname)
  const [language, setLanguage] = useState<Language>(() => localStorage.getItem('mp-portal-language') === 'hi' ? 'hi' : 'en')
  const [textScale, setTextScale] = useState<TextScale>(() => localStorage.getItem('mp-portal-text-scale') === 'large' ? 'large' : 'normal')
  const [helpOpen, setHelpOpen] = useState(false)
  const [prototypeDetailsOpen, setPrototypeDetailsOpen] = useState(false)
  const [unavailableDestination, setUnavailableDestination] = useState<HomeDestination | null>(null)
  const [session, setSession] = useState<DemoSession | null>(() => loadDemoSession())
  const [accountOpen, setAccountOpen] = useState(false)
  const [demoApplication, setDemoApplication] = useState<DemoApplication | null>(() => loadDemoApplication())

  useEffect(() => {
    document.documentElement.lang = language === 'hi' ? 'hi' : 'en-IN'
    localStorage.setItem('mp-portal-language', language)
  }, [language])
  useEffect(() => {
    document.documentElement.dataset.textScale = textScale
    localStorage.setItem('mp-portal-text-scale', textScale)
  }, [textScale])
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    window.requestAnimationFrame(() => document.querySelector<HTMLElement>('main h1')?.focus({ preventScroll: true }))
  }, [pathname])

  const createApplication = (kind: 'full' | 'judge') => {
    const draft = kind === 'judge' ? createPreparedDraft() : createEmptyDraft()
    saveApplicationDraft(draft)
    const application: DemoApplication = { id: draft.applicationId, applicant: kind === 'judge' ? 'Aarav Verma' : 'New applicant', lastStage: kind === 'judge' ? 'Device readiness' : 'Applicant category', savedAt: new Date().toISOString() }
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(application))
    setDemoApplication(application)
    navigatePortal(kind === 'judge' ? `/mp/application/${application.id}` : '/mp/ll/application/category')
  }

  const syncApplication = (draft: LLApplicationDraft, lastStage: string) => {
    const name = [draft.firstName, draft.lastName].filter(Boolean).join(' ') || 'Applicant'
    const application: DemoApplication = { id: draft.applicationId, applicant: name, lastStage, savedAt: new Date().toISOString() }
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(application))
    setDemoApplication(application)
  }

  const updateApplicationStage = (lastStage: string) => {
    setDemoApplication((current) => {
      if (!current) return current
      const updated = { ...current, lastStage, savedAt: new Date().toISOString() }
      localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }

  let page: ReactNode
  if (route.name === 'home') page = <NationalHomePage language={language} onUnavailable={setUnavailableDestination} />
  else if (route.name === 'login') page = <LoginPage language={language} onSignedIn={(nextSession) => { saveDemoSession(nextSession); setSession(nextSession) }} />
  else if (route.name === 'services') page = <ServicesPage language={language} demoApplication={demoApplication} />
  else if (route.name === 'll-start') page = <LLStartPage language={language} onCreate={createApplication} demoApplication={demoApplication} />
  else if (route.name === 'll-application') page = <ApplicationFlow language={language} step={route.step} onSubmitted={(draft) => { syncApplication(draft, 'Photo and signature'); navigatePortal('/mp/ll/submitted') }} />
  else if (route.name === 'll-submitted') page = <SubmittedPage language={language} onContinue={(draft) => { syncApplication(draft, 'Photo and signature'); navigatePortal(`/mp/application/${draft.applicationId}/uploads`) }} />
  else if (route.name === 'uploads') page = <UploadsPage language={language} applicationId={route.applicationId} onComplete={(draft) => { syncApplication(draft, 'Device readiness'); navigatePortal(`/mp/application/${draft.applicationId}`) }} />
  else if (route.name === 'readiness') page = <DeviceReadinessPage language={language} applicationId={route.applicationId} onStageChange={updateApplicationStage} />
  else if (route.name === 'rehearsal') page = <RehearsalPage language={language} applicationId={route.applicationId} onStageChange={updateApplicationStage} />
  else if (route.name === 'payment') page = <PaymentPage language={language} applicationId={route.applicationId} />
  else if (route.name === 'payment-redirect') page = <PaymentRedirectPage language={language} applicationId={route.applicationId} />
  else if (route.name === 'gateway') page = <GatewayPage language={language} applicationId={route.applicationId} />
  else if (route.name === 'payment-return') page = <PaymentReturnPage language={language} applicationId={route.applicationId} onStageChange={updateApplicationStage} />
  else if (route.name === 'payment-status') page = <PaymentStatusPage language={language} applicationId={route.applicationId} />
  else if (route.name === 'receipt') page = <PaymentReceiptPage language={language} applicationId={route.applicationId} />
  else if (route.name === 'tutorial') page = <TutorialPage applicationId={route.applicationId} onStageChange={updateApplicationStage} />
  else if (route.name === 'test-entry') page = <TestEntryPage applicationId={route.applicationId} onStageChange={updateApplicationStage} />
  else if (route.name === 'test') page = <TestPage applicationId={route.applicationId} onStageChange={updateApplicationStage} />
  else if (route.name === 'test-interruption') page = <InterruptionPage applicationId={route.applicationId} onStageChange={updateApplicationStage} />
  else if (route.name === 'result') page = <ResultPage applicationId={route.applicationId} onStageChange={updateApplicationStage} />
  else if (route.name === 'application') page = <ApplicationPage language={language} application={demoApplication ?? { id: route.applicationId, applicant: copy(language, 'Sample applicant', 'नमूना आवेदक'), lastStage: copy(language, 'Device compatibility', 'डिवाइस अनुकूलता'), savedAt: new Date().toISOString() }} />
  else if (route.name === 'service') {
    const service = getService(route.serviceId)
    page = route.serviceId === 'application-status'
      ? <ApplicationLookupPage language={language} knownApplicationId={demoApplication?.id} />
      : route.serviceId === 'fee-payment'
        ? <FeeAndReceiptHub language={language} applicationId={demoApplication?.id} />
        : service ? <ServicePage service={service} language={language} /> : <NotFoundPage language={language} />
  } else page = <NotFoundPage language={language} />

  if (route.name === 'gateway') return page

  const national = route.name === 'home' || route.name === 'login'
  return <div className="portal-app"><PortalHeader language={language} textScale={textScale} national={national} session={session} onLanguage={() => setLanguage((value) => value === 'en' ? 'hi' : 'en')} onTextScale={() => setTextScale((value) => value === 'normal' ? 'large' : 'normal')} onHelp={() => setHelpOpen(true)} onAccount={() => setAccountOpen(true)} /><main id="main-content" className={`portal-container portal-main ${route.name === 'home' ? 'portal-main--home' : ''}`}>{page}</main><PortalFooter language={language} national={national} onPrototypeDetails={() => setPrototypeDetailsOpen(true)} />{helpOpen && <HelpDialog route={route} language={language} onClose={() => setHelpOpen(false)} />}{prototypeDetailsOpen && <PrototypeDetailsDialog language={language} onClose={() => setPrototypeDetailsOpen(false)} />}{unavailableDestination && <UnavailableServiceDialog destination={unavailableDestination} language={language} onClose={() => setUnavailableDestination(null)} />}{accountOpen && session && <AccountDialog language={language} session={session} onClose={() => setAccountOpen(false)} onSignOut={() => { clearDemoSession(); setSession(null); setAccountOpen(false); navigatePortal('/') }} />}</div>
}

export default PortalApp
