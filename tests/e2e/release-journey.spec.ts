import { expect, test, type Page } from '@playwright/test'

async function reachPayment(page: Page) {
  await page.goto('/mp/ll/start')
  await page.getByRole('button', { name: 'Load prepared review application' }).click()
  await page.getByRole('button', { name: 'Use Demo Simulation' }).click()
  await page.getByRole('button', { name: 'Open demo question' }).click()
  await page.getByLabel('Signal and check for nearby road users').check()
  await page.getByRole('button', { name: 'Save demo answer' }).click()
  await page.getByRole('button', { name: 'Continue to fee payment' }).click()
  await expect(page).toHaveURL(/\/payment$/)
}

async function reachTestEntry(page: Page) {
  await reachPayment(page)
  await page.getByRole('button', { name: 'Simulate UPI App Scan & Pay' }).click()
  await page.getByRole('link', { name: 'Continue to road-safety learning' }).click()
  await page.getByRole('button', { name: 'Skip tutorial and continue' }).click()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('homepage is transparent and the state dialog contains and restores focus', async ({ page }) => {
  await expect(page.getByRole('banner').getByText('Not a government website')).toBeVisible()
  await expect(page.getByText('87.4%')).toHaveCount(0)
  await expect(page.getByText('29,68,35,596')).toHaveCount(0)

  const trigger = page.getByRole('button', { name: 'Driving licence services' }).first()
  await trigger.focus()
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Select your state' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Close state selection' })).toBeFocused()

  await page.keyboard.press('Shift+Tab')
  await expect(dialog.locator('button, a, select').last()).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
})

test('prepared judge journey reaches a passing result and can reset cleanly', async ({ page, isMobile }) => {
  test.setTimeout(isMobile ? 90_000 : 60_000)
  await reachTestEntry(page)

  await expect(page.getByRole('heading', { name: 'Final system check before your 15-question demo test' })).toBeVisible()
  await page.getByRole('checkbox', { name: /I understand this is a demo test/ }).check()
  await page.getByRole('button', { name: 'Enter focused mode and start 15-question test' }).click()
  await expect(page.getByRole('button', { name: 'Read question aloud' })).toBeVisible()
  const paperIds = await page.evaluate(() => {
    const raw = localStorage.getItem('mp-ll-exam-session-v1:MP-LL-DEMO-2408')
    return raw ? JSON.parse(raw).exam.paperQuestionIds as string[] : []
  })
  expect(paperIds).toHaveLength(15)
  expect(new Set(paperIds).size).toBe(15)
  await page.getByRole('button', { name: 'Preview passing result' }).click()
  await expect(page.getByRole('heading', { name: 'Congratulations! You passed the demo test' })).toBeVisible()
  await expect(page.getByText('15 / 15', { exact: true })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Congratulations! You passed the demo test' })).toBeVisible()
  await page.getByRole('button', { name: 'Reset demo data' }).click()
  await page.getByRole('button', { name: 'Yes, clear all data' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.evaluate(() => Object.keys(localStorage).filter((key) => !key.startsWith('mp-portal-')))).resolves.toEqual([])
})

test('a failed sandbox payment gives a safe retry path without a duplicate charge', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Focused recovery case runs once on desktop Chrome.')
  await reachPayment(page)
  await page.getByRole('checkbox', { name: /I have checked the fee and application details/ }).check()
  await page.getByRole('button', { name: 'Pay now via Gateway' }).click()
  await page.getByRole('button', { name: 'Continue to payment gateway' }).click()
  await page.getByText('Demo test outcomes').click()
  await page.getByLabel('Choose result to simulate').selectOption('declined')
  await page.getByRole('button', { name: 'Complete demo payment' }).click()
  await expect(page.getByRole('heading', { name: 'Payment was not completed' })).toBeVisible()
  await expect(page.getByText('No money was deducted. Your application remains saved.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Try paying again' })).toBeVisible()
})

test('the synthetic interruption survives reload and resumes at question four', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Focused recovery case runs once on desktop Chrome.')
  await reachTestEntry(page)
  await page.getByRole('checkbox', { name: /I understand this is a demo test/ }).check()
  await page.getByRole('button', { name: 'Enter focused mode and start 15-question test' }).click()
  for (let question = 0; question < 3; question += 1) {
    await page.getByRole('radio').first().check()
    await page.getByRole('button', { name: 'Lock answer and continue' }).click()
  }
  await expect(page.getByRole('heading', { name: 'The test paused safely without losing progress' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'The test paused safely without losing progress' })).toBeVisible()
  await page.getByRole('button', { name: 'Return to focused mode and resume' }).click()
  await expect(page.getByText('Question 4 of 15', { exact: true }).first()).toBeVisible()
})

test('Raahi mascot guide: full walkthrough shows and operates the complete journey', async ({ page, isMobile }) => {
  test.setTimeout(isMobile ? 180_000 : 120_000)
  await page.goto('/')

  // Verify hero onboarding prompt is visible on first visit
  await expect(page.getByRole('heading', { name: 'Meet Raahi — Your guide through LicenceFlow' })).toBeVisible()

  await page.getByRole('button', { name: 'Take the detailed tour' }).click()
  await expect(page.locator('.judge-tour-card__dialogue')).toContainText('guide you through the complete demo')

  // The guide is non-modal: no backdrop click dismissal, blur, or scroll lock.
  const scrim = page.locator('.judge-tour-scrim')
  await expect(scrim).toHaveCSS('pointer-events', 'none')
  await expect(scrim).toHaveCSS('backdrop-filter', 'none')
  await scrim.evaluate((element) => (element as HTMLElement).click())
  await expect(page.locator('.judge-tour-card')).toBeVisible()
  const scrollBefore = await page.evaluate(() => window.scrollY)
  await page.mouse.move(8, 8)
  await page.mouse.wheel(0, 700)
  await expect.poll(() => page.evaluate(() => window.scrollY)).not.toBe(scrollBefore)
  await expect(page.locator('.judge-tour-root')).not.toHaveClass(/judge-tour-root--exploring/, { timeout: 1_000 })
  await expect(page.locator('.judge-tour-root')).toHaveCSS('opacity', '1')

  const seen = new Set<string>()
  const title = page.locator('.judge-tour-card__title')
  const action = page.locator('.judge-tour-card .judge-tour-btn--action')
  for (let safety = 0; safety < 70; safety += 1) {
    await expect(title).toBeVisible()
    const currentTitle = (await title.textContent())?.trim() ?? ''
    seen.add(currentTitle)
    if (currentTitle === 'Full journey complete') {
      await action.click({ force: isMobile })
      break
    }
    if (await action.isDisabled()) {
      await expect(title).not.toHaveText(currentTitle, { timeout: 5_000 })
      continue
    }
    await action.click({ force: isMobile, timeout: 5_000 })
  }

  expect(seen).toContain('1 of 7 · Licence details')
  expect(seen).toContain('Choose a service area')
  expect(seen).toContain('2 of 7 · Identity check')
  expect(seen).toContain('6 of 7 · Health declaration')
  expect(seen).toContain('Add demo documents')
  expect(seen).toContain('Check the device before payment')
  expect(seen).toContain('Demo device check completed')
  expect(seen).toContain('One demo question')
  expect(seen).toContain('Demo payment gateway')
  expect(seen).toContain('Road-safety tutorial')
  expect(seen).toContain('Test interface')
  expect(seen).toContain('Learn from the result')
  expect(seen).toContain('Full journey complete')
  await expect(page.locator('.judge-tour-card')).toHaveCount(0)
  await expect(page).toHaveURL(/\/result$/)

  // Verify floating replay pill is visible on Result screen
  await expect(page.getByRole('button', { name: /Start the full Judge Walkthrough with Raahi/ })).toBeVisible()
})

test('Raahi mascot guide: dismiss, replay, and escape handling', async ({ page }) => {
  await page.goto('/')

  // Dismiss prompt
  await page.getByRole('button', { name: 'Explore myself' }).click()
  await expect(page.getByRole('heading', { name: 'Meet Raahi — Your guide through LicenceFlow' })).toHaveCount(0)

  // Launch via floating replay dock
  await page.getByRole('button', { name: /Start the full Judge Walkthrough with Raahi/ }).click()
  await expect(page.locator('.judge-tour-card__dialogue')).toContainText('guide you through the complete demo')

  // Move forward once, then close accidentally.
  await page.locator('.judge-tour-card .judge-tour-btn--action').click()
  await expect(page.locator('.judge-tour-card__title')).toHaveText('Choose a service area')

  // Press Escape to dismiss
  await page.keyboard.press('Escape')
  await expect(page.locator('.judge-tour-card')).toHaveCount(0)

  // Reopening resumes the same step instead of restarting at the top.
  await page.getByRole('button', { name: /Resume the Judge Walkthrough with Raahi/ }).click()
  await expect(page.locator('.judge-tour-card__title')).toHaveText('Choose a service area')
})

test('Raahi cinematic mode completes the full journey automatically', async ({ page, isMobile }) => {
  test.skip(isMobile, 'The timed capture rehearsal runs once on desktop Chrome.')
  test.setTimeout(60_000)
  await page.goto('/')

  const startedAt = Date.now()
  await page.getByRole('button', { name: 'Play automatic tour' }).click()
  await expect(page.locator('.judge-tour-root')).toHaveClass(/judge-tour-root--cinematic/)
  await expect(page.getByText('Raahi is completing the journey for you')).toBeVisible()
  await expect(page).toHaveURL(/\/result$/, { timeout: 50_000 })
  await expect(page.getByText('Recovered safely')).toBeVisible()
  await expect(page.locator('.judge-tour-card')).toHaveCount(0, { timeout: 8_000 })

  const elapsed = Date.now() - startedAt
  expect(elapsed).toBeGreaterThanOrEqual(25_000)
  expect(elapsed).toBeLessThanOrEqual(55_000)
})

test('mobile services and Raahi stay inside the viewport', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Mobile overflow regression runs on the phone profile.')
  await page.goto('/mp/services')

  await expect.poll(() => page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )).toBeLessThanOrEqual(0)

  await page.goto('/')
  await page.getByRole('button', { name: 'Take the detailed tour' }).click()
  const card = page.locator('.judge-tour-card')
  await expect(card).toBeVisible()

  const action = page.locator('.judge-tour-card .judge-tour-btn--action')
  await action.click({ force: true })
  await expect(page.locator('.judge-tour-card__title')).toHaveText('Choose a service area')
  await action.click({ force: true })
  await expect(page.locator('.judge-tour-card__title')).toHaveText('Start with driving licence services')
  await action.click({ force: true })
  await expect(page.locator('.judge-tour-card__title')).toHaveText('Choose Madhya Pradesh')
  await action.click({ force: true })
  await expect(page).toHaveURL('/mp/services')
  await expect(page.locator('.judge-tour-card__title')).toHaveText('Driving licence services')

  await expect.poll(() => page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )).toBeLessThanOrEqual(0)
  const box = await card.boundingBox()
  const avatar = await page.locator('.raahi-avatar-img').boundingBox()
  const viewport = page.viewportSize()
  expect(box).not.toBeNull()
  expect(avatar).not.toBeNull()
  expect(viewport).not.toBeNull()
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(viewport?.width ?? 0)
  expect(avatar?.x ?? -1).toBeGreaterThanOrEqual(0)
  expect((avatar?.x ?? 0) + (avatar?.width ?? 0)).toBeLessThanOrEqual(viewport?.width ?? 0)
})
