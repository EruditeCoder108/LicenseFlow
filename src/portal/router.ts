export type PortalRoute =
  | { name: 'home' }
  | { name: 'login' }
  | { name: 'services' }
  | { name: 'll-start' }
  | { name: 'll-application'; step: 'category' | 'identity' | 'personal' | 'address' | 'vehicles' | 'fitness' | 'review' }
  | { name: 'll-submitted' }
  | { name: 'application'; applicationId: string }
  | { name: 'uploads'; applicationId: string }
  | { name: 'readiness'; applicationId: string }
  | { name: 'rehearsal'; applicationId: string }
  | { name: 'payment'; applicationId: string }
  | { name: 'payment-redirect'; applicationId: string }
  | { name: 'gateway'; applicationId: string }
  | { name: 'payment-return'; applicationId: string }
  | { name: 'payment-status'; applicationId: string }
  | { name: 'receipt'; applicationId: string }
  | { name: 'tutorial'; applicationId: string }
  | { name: 'test-entry'; applicationId: string }
  | { name: 'test'; applicationId: string }
  | { name: 'protected-test'; applicationId: string }
  | { name: 'test-interruption'; applicationId: string }
  | { name: 'result'; applicationId: string }
  | { name: 'result-review'; applicationId: string }
  | { name: 'service'; serviceId: string }
  | { name: 'not-found' }

export function normalizePath(pathname: string): string {
  const clean = pathname.split('?')[0]?.split('#')[0] ?? '/'
  const withLeadingSlash = clean.startsWith('/') ? clean : `/${clean}`
  return withLeadingSlash.length > 1 ? withLeadingSlash.replace(/\/+$/, '') : '/'
}

export function parsePortalRoute(pathname: string): PortalRoute {
  const path = normalizePath(pathname)
  if (path === '/') return { name: 'home' }
  if (path === '/login') return { name: 'login' }
  if (path === '/mp' || path === '/mp/services') return { name: 'services' }
  if (path === '/mp/ll/start') return { name: 'll-start' }
  if (path === '/mp/ll/submitted') return { name: 'll-submitted' }

  const parts = path.split('/').filter(Boolean)
  if (parts[0] === 'sandbox-gateway' && parts[1] && parts.length === 2) {
    return { name: 'gateway', applicationId: decodeURIComponent(parts[1]) }
  }
  if (parts[0] !== 'mp') return { name: 'not-found' }
  const applicationSteps = ['category', 'identity', 'personal', 'address', 'vehicles', 'fitness', 'review'] as const
  if (parts[1] === 'll' && parts[2] === 'application' && parts[3] && parts.length === 4 && applicationSteps.includes(parts[3] as typeof applicationSteps[number])) {
    return { name: 'll-application', step: parts[3] as typeof applicationSteps[number] }
  }
  if (parts[1] === 'application' && parts[2] && parts[3] === 'uploads' && parts.length === 4) {
    return { name: 'uploads', applicationId: decodeURIComponent(parts[2]) }
  }
  if (parts[1] === 'application' && parts[2] && parts[3] === 'readiness' && parts.length === 4) {
    return { name: 'readiness', applicationId: decodeURIComponent(parts[2]) }
  }
  if (parts[1] === 'application' && parts[2] && parts[3] === 'rehearsal' && parts.length === 4) {
    return { name: 'rehearsal', applicationId: decodeURIComponent(parts[2]) }
  }
  if (parts[1] === 'application' && parts[2] && parts[3] === 'payment' && parts[4] === 'redirect' && parts.length === 5) {
    return { name: 'payment-redirect', applicationId: decodeURIComponent(parts[2]) }
  }
  if (parts[1] === 'application' && parts[2] && parts[3] === 'payment' && parts[4] === 'return' && parts.length === 5) {
    return { name: 'payment-return', applicationId: decodeURIComponent(parts[2]) }
  }
  if (parts[1] === 'application' && parts[2] && parts[3] === 'payment' && parts.length === 4) {
    return { name: 'payment', applicationId: decodeURIComponent(parts[2]) }
  }
  if (parts[1] === 'application' && parts[2] && parts[3] === 'payment-status' && parts.length === 4) {
    return { name: 'payment-status', applicationId: decodeURIComponent(parts[2]) }
  }
  if (parts[1] === 'application' && parts[2] && parts[3] === 'receipt' && parts.length === 4) {
    return { name: 'receipt', applicationId: decodeURIComponent(parts[2]) }
  }
  if (parts[1] === 'application' && parts[2] && parts[3] === 'tutorial' && parts.length === 4) {
    return { name: 'tutorial', applicationId: decodeURIComponent(parts[2]) }
  }
  if (parts[1] === 'application' && parts[2] && parts[3] === 'test-entry' && parts.length === 4) {
    return { name: 'test-entry', applicationId: decodeURIComponent(parts[2]) }
  }
  if (parts[1] === 'application' && parts[2] && parts[3] === 'test' && parts.length === 4) {
    return { name: 'test', applicationId: decodeURIComponent(parts[2]) }
  }
  if (parts[1] === 'application' && parts[2] && parts[3] === 'protected-test' && parts.length === 4) {
    return { name: 'protected-test', applicationId: decodeURIComponent(parts[2]) }
  }
  if (parts[1] === 'application' && parts[2] && parts[3] === 'test-interruption' && parts.length === 4) {
    return { name: 'test-interruption', applicationId: decodeURIComponent(parts[2]) }
  }
  if (parts[1] === 'application' && parts[2] && parts[3] === 'result' && parts[4] === 'review' && parts.length === 5) {
    return { name: 'result-review', applicationId: decodeURIComponent(parts[2]) }
  }
  if (parts[1] === 'application' && parts[2] && parts[3] === 'result' && parts.length === 4) {
    return { name: 'result', applicationId: decodeURIComponent(parts[2]) }
  }
  if (parts[1] === 'application' && parts[2] && parts.length === 3) {
    return { name: 'application', applicationId: decodeURIComponent(parts[2]) }
  }
  if (parts[1] === 'service' && parts[2] && parts.length === 3) {
    return { name: 'service', serviceId: decodeURIComponent(parts[2]) }
  }
  return { name: 'not-found' }
}

export function navigatePortal(href: string): void {
  if (window.location.pathname === href) return
  window.history.pushState({}, '', href)
  window.dispatchEvent(new PopStateEvent('popstate'))
}
