export type PortalRoute =
  | { name: 'services' }
  | { name: 'll-start' }
  | { name: 'application'; applicationId: string }
  | { name: 'service'; serviceId: string }
  | { name: 'not-found' }

export function normalizePath(pathname: string): string {
  const clean = pathname.split('?')[0]?.split('#')[0] ?? '/'
  const withLeadingSlash = clean.startsWith('/') ? clean : `/${clean}`
  return withLeadingSlash.length > 1 ? withLeadingSlash.replace(/\/+$/, '') : '/'
}

export function parsePortalRoute(pathname: string): PortalRoute {
  const path = normalizePath(pathname)
  if (path === '/' || path === '/mp' || path === '/mp/services') return { name: 'services' }
  if (path === '/mp/ll/start') return { name: 'll-start' }

  const parts = path.split('/').filter(Boolean)
  if (parts[0] !== 'mp') return { name: 'not-found' }
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
