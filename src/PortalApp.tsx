import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react'
import {
  Accessibility,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
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
  Menu,
  Mic2,
  MonitorCheck,
  Phone,
  Printer,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRoundCheck,
  Wifi,
  X,
  type LucideIcon,
} from 'lucide-react'
import { getService, MP_PORTAL, serviceCategories, services, type ServiceDefinition } from './portal/config'
import { navigatePortal, parsePortalRoute } from './portal/router'

type Language = 'en' | 'hi'
type TextScale = 'normal' | 'large'

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

function PrototypeNotice() {
  return (
    <div className="prototype-notice" role="note">
      <div className="portal-container prototype-notice__inner">
        <BadgeCheck size={16} aria-hidden="true" />
        <span><strong>Independent hackathon prototype.</strong> All identity, payment, application, test and licence records are synthetic.</span>
      </div>
    </div>
  )
}

function PortalMark() {
  return (
    <div className="portal-mark">
      <span className="portal-mark__symbol" aria-hidden="true"><Landmark size={27} /></span>
      <span className="portal-mark__text">
        <span>सारथी नागरिक सेवाएँ</span>
        <strong>Sarathi Citizen Services</strong>
        <small>Modernized Madhya Pradesh LL prototype</small>
      </span>
    </div>
  )
}

function PortalHeader({ language, textScale, onLanguage, onTextScale, onHelp }: {
  language: Language
  textScale: TextScale
  onLanguage: () => void
  onTextScale: () => void
  onHelp: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const close = () => setMenuOpen(false)
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <PrototypeNotice />
      <div className="government-bar">
        <div className="portal-container government-bar__inner">
          <span>भारत सरकार <i aria-hidden="true" /> Government of India</span>
          <div className="government-tools" aria-label="Accessibility tools">
            <button onClick={onTextScale} aria-label={textScale === 'normal' ? 'Increase text size' : 'Use standard text size'}>
              <Accessibility size={16} aria-hidden="true" /> {textScale === 'normal' ? 'A+' : 'A'}
            </button>
            <button onClick={onLanguage}><Languages size={16} aria-hidden="true" /> {language === 'en' ? 'हिंदी' : 'English'}</button>
            <button onClick={onHelp}><CircleHelp size={16} aria-hidden="true" /> Help</button>
          </div>
        </div>
      </div>
      <header className="portal-header">
        <div className="portal-container portal-header__identity">
          <PortalLink href="/mp/services" onNavigate={close}><PortalMark /></PortalLink>
          <div className="state-lockup">
            <small>Selected jurisdiction</small>
            <strong>{language === 'en' ? MP_PORTAL.stateName : MP_PORTAL.stateNameHi}</strong>
            <span>{language === 'en' ? MP_PORTAL.department : MP_PORTAL.departmentHi}</span>
          </div>
          <button className="mobile-menu-button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-controls="portal-navigation" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}<span>Menu</span>
          </button>
        </div>
        <nav id="portal-navigation" className={`portal-nav ${menuOpen ? 'portal-nav--open' : ''}`} aria-label="Primary navigation">
          <div className="portal-container portal-nav__inner">
            <PortalLink href="/mp/services" onNavigate={close}>Services</PortalLink>
            <PortalLink href="/mp/ll/start" onNavigate={close}>Apply for LL</PortalLink>
            <PortalLink href="/mp/service/application-status" onNavigate={close}>Application status</PortalLink>
            <PortalLink href="/mp/service/fee-payment" onNavigate={close}>Fee & receipts</PortalLink>
            <button onClick={() => { close(); onHelp() }}>Help & support</button>
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

function StatusPill({ delivery }: { delivery: ServiceDefinition['delivery'] }) {
  const copy = delivery === 'working-journey' ? 'Main LL journey' : delivery === 'working-utility' ? 'LL utility' : 'Information only'
  return <span className={`status-pill status-pill--${delivery}`}><span aria-hidden="true" />{copy}</span>
}

function ServiceCard({ service, language }: { service: ServiceDefinition; language: Language }) {
  const Icon = iconByName[service.icon]
  return (
    <PortalLink href={service.route ?? `/mp/service/${service.id}`} className="service-card">
      <span className="service-card__icon" aria-hidden="true"><Icon size={24} /></span>
      <span className="service-card__body">
        <span className="service-card__title">{language === 'en' ? service.name : service.nameHi}</span>
        <span className="service-card__summary">{service.summary}</span>
        <StatusPill delivery={service.delivery} />
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

  return (
    <>
      <Breadcrumbs items={[{ label: 'Madhya Pradesh licence services' }]} />
      <section className="page-title page-title--dashboard">
        <div><p className="eyebrow">Madhya Pradesh · Learner's Licence</p><h1 tabIndex={-1}>Citizen licence services</h1><p>Apply, prepare, pay and complete the synthetic Learner's Licence journey with clear recovery at every stage.</p></div>
        <div className="jurisdiction-badge"><ShieldCheck size={20} /><span><small>Prototype coverage</small><strong>MP Learner's Licence only</strong></span></div>
      </section>

      <section className="core-problem" aria-labelledby="core-problem-title">
        <span className="core-problem__icon" aria-hidden="true"><Sparkles size={22} /></span>
        <div><h2 id="core-problem-title">Know whether the test can work before you pay</h2><p>Readiness, rehearsal and checkpoints protect the citizen when camera, browser or network technology fails.</p></div>
        <PortalLink href={demoApplication ? `/mp/application/${demoApplication.id}` : '/mp/ll/start'} className="button button--light">
          {demoApplication ? 'Continue demo application' : 'Start LL application'} <ArrowRight size={18} />
        </PortalLink>
      </section>

      <section className="application-panel" aria-labelledby="application-panel-title">
        <div className="section-heading"><div><p className="eyebrow">Your application</p><h2 id="application-panel-title">{demoApplication ? 'Progress saved safely' : 'No application started'}</h2></div>{demoApplication && <span className="saved-indicator"><CheckCircle2 size={17} /> Saved in this browser</span>}</div>
        {demoApplication ? (
          <div className="active-application">
            <div><small>Application number</small><strong>{demoApplication.id}</strong></div>
            <div><small>Applicant</small><strong>{demoApplication.applicant}</strong></div>
            <div><small>Next action</small><strong>{demoApplication.lastStage}</strong></div>
            <PortalLink href={`/mp/application/${demoApplication.id}`} className="button button--primary">Open application <ArrowRight size={18} /></PortalLink>
          </div>
        ) : (
          <div className="empty-application"><ClipboardCheck size={30} aria-hidden="true" /><div><strong>Start a full application or use the prepared judge journey.</strong><p>Both use synthetic citizen data. No Aadhaar or government record is requested.</p></div><PortalLink href="/mp/ll/start" className="button button--secondary">View LL process</PortalLink></div>
        )}
      </section>

      <section className="services-section" aria-labelledby="services-title">
        <div className="section-heading"><div><p className="eyebrow">Service catalogue</p><h2 id="services-title">What do you need help with?</h2></div><span className="result-count" aria-live="polite">{filtered.length} service{filtered.length === 1 ? '' : 's'}</span></div>
        <div className="service-tools">
          <label className="service-search"><Search size={20} aria-hidden="true" /><span className="visually-hidden">Search services</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search LL, payment, upload, test…" /></label>
          <label className="category-select"><span className="visually-hidden">Filter by category</span><select value={category} onChange={(event) => setCategory(event.target.value as typeof category)}><option>All</option>{serviceCategories.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={18} aria-hidden="true" /></label>
        </div>
        {filtered.length ? <div className="service-grid">{filtered.map((service) => <ServiceCard key={service.id} service={service} language={language} />)}</div> : <div className="no-results"><Search size={28} /><h3>No matching service</h3><p>Try “payment”, “test”, “upload” or clear the category filter.</p><button className="text-button" onClick={() => { setQuery(''); setCategory('All') }}>Clear search and filters</button></div>}
      </section>
    </>
  )
}

const llStages = [
  ['1', 'Application and synthetic identity', 'Applicant category, identity route, personal details, address, vehicle class and Form 1.'],
  ['2', 'Application completion', 'Acknowledgement, photo/signature or documents, and a clear stage tracker.'],
  ['3', 'Readiness before payment', 'Camera, microphone, connection, storage, framing, lighting and challenge-response checks.'],
  ['4', 'Learning and secure test', 'Tutorial, rehearsal, payment, authentication, checkpointed questions and safe recovery.'],
  ['5', 'Outcome and document', 'Knowledge result, technical events and integrity observations shown separately.'],
]

function LLStartPage({ onCreate }: { onCreate: (kind: 'full' | 'judge') => void }) {
  return (
    <>
      <Breadcrumbs items={[{ label: 'Services', href: '/mp/services' }, { label: "Apply for Learner's Licence" }]} />
      <section className="page-title"><div><p className="eyebrow">Madhya Pradesh · Complete citizen journey</p><h1 tabIndex={-1}>Apply for a Learner's Licence</h1><p>Understand every stage before entering synthetic identity information or granting camera access.</p></div></section>
      <div className="content-with-aside">
        <div className="content-stack">
          <section className="content-card"><div className="section-heading"><div><p className="eyebrow">Process</p><h2>What will happen</h2></div><span className="time-note">Full path available</span></div><ol className="process-list">{llStages.map(([number, title, description]) => <li key={number}><span>{number}</span><div><strong>{title}</strong><p>{description}</p></div></li>)}</ol></section>
          <section className="content-card"><div className="section-heading"><div><p className="eyebrow">Before you begin</p><h2>Prototype requirements</h2></div></div><div className="requirement-grid"><div><FileText size={21} /><strong>Synthetic records only</strong><p>Never enter a real Aadhaar number, bank detail or licence record.</p></div><div><Camera size={21} /><strong>Camera access later</strong><p>Requested only for readiness and the secure-test demonstration.</p></div><div><Mic2 size={21} /><strong>Microphone access later</strong><p>Local activity measurement; the prototype does not record speech.</p></div><div><Wifi size={21} /><strong>Recovery is built in</strong><p>Your safe checkpoint survives the demonstrated interruption.</p></div></div></section>
        </div>
        <aside className="start-panel" aria-labelledby="start-panel-title"><p className="eyebrow">Choose your path</p><h2 id="start-panel-title">Start safely</h2><p>The detailed route lets you explore every application stage. The prepared route begins with a saved synthetic draft so reviewers reach the innovation quickly.</p><button className="button button--primary button--full" onClick={() => onCreate('full')}>Start full application <ArrowRight size={18} /></button><button className="button button--secondary button--full" onClick={() => onCreate('judge')}>Continue prepared demo</button><div className="privacy-note"><ShieldCheck size={19} /><span><strong>No real government connection</strong><small>Aadhaar, payment, Sarathi status and LL issuance are mocked.</small></span></div></aside>
      </div>
    </>
  )
}

const applicationStages = [
  ['Application details', 'completed'], ['Identity route', 'completed'], ['Photo and documents', 'completed'], ['Device readiness', 'needs-action'], ['Test rehearsal', 'not-started'], ['Fee payment', 'not-started'], ['Road-safety tutorial', 'not-started'], ['LL test', 'not-started'], ['Result and LL', 'not-started'],
] as const

function ApplicationPage({ application }: { application: DemoApplication }) {
  const [readinessNotice, setReadinessNotice] = useState(false)
  return (
    <>
      <Breadcrumbs items={[{ label: 'Services', href: '/mp/services' }, { label: 'Application status' }]} />
      <section className="page-title"><div><p className="eyebrow">Synthetic application · {application.id}</p><h1 tabIndex={-1}>Your application is safe</h1><p>The saved draft, completed stages and payment state remain visible before you continue.</p></div><span className="saved-indicator"><CheckCircle2 size={17} /> Last saved {new Date(application.savedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span></section>
      <section className="next-action-card"><span><MonitorCheck size={25} /></span><div><p className="eyebrow">Next required action</p><h2>Check this device before payment</h2><p>We will test the camera, microphone, browser, storage and connection—and explain how to fix anything that could stop the exam.</p></div><button className="button button--primary" type="button" onClick={() => setReadinessNotice(true)}>Open Device Readiness <ArrowRight size={18} /></button></section>
      {readinessNotice && <div className="milestone-notice" role="status"><CheckCircle2 size={20} /><div><strong>Your application remains saved.</strong><p>The full readiness engine is the next implementation milestone; this foundation does not pretend the integration is already complete.</p></div><button className="text-button" onClick={() => setReadinessNotice(false)}>Dismiss</button></div>}
      <section className="content-card"><div className="section-heading"><div><p className="eyebrow">Live application tracker</p><h2>Application stages</h2></div><span className="status-pill status-pill--working-journey"><span /> 3 of 9 complete</span></div><ol className="stage-tracker">{applicationStages.map(([stage, status], index) => <li key={stage} className={`stage-tracker__item stage-tracker__item--${status}`}><span className="stage-tracker__marker">{status === 'completed' ? <Check size={16} /> : index + 1}</span><div><strong>{stage}</strong><small>{status === 'completed' ? 'Completed and saved' : status === 'needs-action' ? 'Action required now' : 'Not started'}</small></div>{status === 'needs-action' && <span className="stage-label">Next</span>}</li>)}</ol></section>
    </>
  )
}

function ServicePage({ service }: { service: ServiceDefinition }) {
  const Icon = iconByName[service.icon]
  const evidenceCopy = service.evidence === 'OFFICIAL_CURRENT' ? 'Structure verified from official guidance' : service.evidence === 'SYNTHETIC_PROTOTYPE' ? 'Synthetic prototype behavior' : service.evidence === 'INNOVATION_PROPOSAL' ? 'Proposed improved experience' : service.evidence === 'UNVERIFIED' ? 'Current MP details require verification' : 'Reference pattern—not asserted as current MP policy'
  return (
    <>
      <Breadcrumbs items={[{ label: 'Services', href: '/mp/services' }, { label: service.name }]} />
      <section className="page-title page-title--service"><span className="page-title__icon"><Icon size={28} /></span><div><p className="eyebrow">Madhya Pradesh · Service information</p><h1 tabIndex={-1}>{service.name}</h1><p>{service.summary}</p></div></section>
      <div className="content-with-aside">
        <div className="content-stack"><section className="content-card"><div className="section-heading"><div><p className="eyebrow">About this service</p><h2>Who this is for</h2></div><StatusPill delivery={service.delivery} /></div><p className="prose">{service.audience}</p><h3>What you would need</h3><ul className="check-list">{service.requirements.map((item) => <li key={item}><CheckCircle2 size={18} /><span>{item}</span></li>)}</ul></section><section className="evidence-card"><ShieldCheck size={22} /><div><strong>{evidenceCopy}</strong><p>This prototype never converts an unverified screen from another state into a Madhya Pradesh rule.</p></div></section></div>
        <aside className="start-panel"><p className="eyebrow">Round 1 status</p><h2>{service.delivery === 'information-only' ? 'Outside the MP LL prototype' : 'Connected to the LL journey'}</h2><p>{service.delivery === 'information-only' ? 'We show this destination for orientation without pretending the full transaction is implemented.' : 'This service will open at the correct stage of the complete synthetic LL application.'}</p>{service.delivery !== 'information-only' && <PortalLink href="/mp/ll/start" className="button button--primary button--full">Go to LL journey <ArrowRight size={18} /></PortalLink>}<PortalLink href="/mp/services" className="button button--secondary button--full"><ArrowLeft size={18} /> All services</PortalLink></aside>
      </div>
    </>
  )
}

function NotFoundPage() {
  return <section className="not-found"><FileText size={38} /><p className="eyebrow">Page not found</p><h1 tabIndex={-1}>This route is not part of the MP LL prototype</h1><p>Round 1 deliberately supports only the Madhya Pradesh Learner's Licence citizen journey.</p><PortalLink href="/mp/services" className="button button--primary">Return to services</PortalLink></section>
}

function HelpDialog({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])
  return <div className="dialog-layer" onMouseDown={onClose}><section className="help-dialog" role="dialog" aria-modal="true" aria-labelledby="help-title" onMouseDown={(event) => event.stopPropagation()}><div className="dialog-heading"><div><p className="eyebrow">Help & support</p><h2 id="help-title">What do you need to understand?</h2></div><button className="icon-button" onClick={onClose} aria-label="Close help" autoFocus><X size={21} /></button></div><div className="help-list"><article><CircleHelp size={20} /><div><strong>Questions about a form</strong><p>Every detailed field will include “Explain this” help in English and Hindi.</p></div></article><article><Headphones size={20} /><div><strong>A technical problem</strong><p>Readiness and recovery screens explain what happened, what remains safe and what to do next.</p></div></article><article><ShieldCheck size={20} /><div><strong>Real or simulated?</strong><p>Browser observations are marked real; Aadhaar, payment, government status, test authority and licence issuance are synthetic.</p></div></article></div><button className="button button--primary button--full" onClick={onClose}>Close help</button></section></div>
}

function PortalFooter() {
  return <footer className="portal-footer"><div className="portal-container portal-footer__grid"><div><PortalMark /><p>Independent citizen-experience prototype. Not affiliated with or endorsed by MoRTH, NIC, Sarathi or the Government of Madhya Pradesh.</p></div><div><strong>Prototype coverage</strong><span>Madhya Pradesh only</span><span>Learner's Licence only</span><span>Synthetic records only</span></div><div><strong>Citizen safeguards</strong><span>No real Aadhaar data</span><span>No real payment details</span><span>No continuous A/V recording</span></div></div><div className="portal-footer__bottom"><div className="portal-container">Built for the Build What Moves India hackathon · Technical failure should never become citizen failure.</div></div></footer>
}

function PortalApp() {
  const pathname = usePathname()
  const route = parsePortalRoute(pathname)
  const [language, setLanguage] = useState<Language>(() => localStorage.getItem('mp-portal-language') === 'hi' ? 'hi' : 'en')
  const [textScale, setTextScale] = useState<TextScale>(() => localStorage.getItem('mp-portal-text-scale') === 'large' ? 'large' : 'normal')
  const [helpOpen, setHelpOpen] = useState(false)
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
    const application: DemoApplication = { id: kind === 'judge' ? 'MP-LL-DEMO-2408' : `MP-LL-${String(Date.now()).slice(-8)}`, applicant: kind === 'judge' ? 'Aarav Verma (synthetic)' : 'New synthetic applicant', lastStage: kind === 'judge' ? 'Device readiness' : 'Application details', savedAt: new Date().toISOString() }
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(application))
    setDemoApplication(application)
    navigatePortal(`/mp/application/${application.id}`)
  }

  let page: ReactNode
  if (route.name === 'services') page = <ServicesPage language={language} demoApplication={demoApplication} />
  else if (route.name === 'll-start') page = <LLStartPage onCreate={createApplication} />
  else if (route.name === 'application') page = <ApplicationPage application={demoApplication ?? { id: route.applicationId, applicant: 'Synthetic applicant', lastStage: 'Device readiness', savedAt: new Date().toISOString() }} />
  else if (route.name === 'service') {
    const service = getService(route.serviceId)
    page = service ? <ServicePage service={service} /> : <NotFoundPage />
  } else page = <NotFoundPage />

  return <div className="portal-app"><PortalHeader language={language} textScale={textScale} onLanguage={() => setLanguage((value) => value === 'en' ? 'hi' : 'en')} onTextScale={() => setTextScale((value) => value === 'normal' ? 'large' : 'normal')} onHelp={() => setHelpOpen(true)} /><main id="main-content" className="portal-container portal-main">{page}</main><PortalFooter />{helpOpen && <HelpDialog onClose={() => setHelpOpen(false)} />}</div>
}

export default PortalApp
