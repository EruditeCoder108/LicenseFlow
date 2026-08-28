import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { RaahiAssistant } from './RaahiAssistant'

describe('Raahi assistant UI', () => {
  it('renders a separate accessible guide launcher without opening a modal overlay', () => {
    const html = renderToStaticMarkup(<RaahiAssistant pathname="/mp/services" language="en" applicationStage="Not started" />)
    expect(html).toContain('Ask Raahi')
    expect(html).toContain('/assets/raahi/raahi-working.webp')
    expect(html).toContain('aria-expanded="false"')
    expect(html).not.toContain('raahi-chat__panel')
  })

  it('does not market the built-in guide as connected AI', () => {
    const closedHtml = renderToStaticMarkup(<RaahiAssistant pathname="/mp/services" language="en" />)
    expect(closedHtml).not.toContain('AI page guide')
    expect(closedHtml).not.toContain('&gt;AI&lt;')
  })

  it('stays out of the interface while the judge walkthrough is active', () => {
    expect(renderToStaticMarkup(<RaahiAssistant pathname="/" language="en" hidden />)).toBe('')
  })
})
