import { expect, test, type Page } from '@playwright/test'

async function reachPayment(page: Page) {
  await page.goto('/mp/ll/start')
  await page.getByRole('button', { name: 'Load prepared review application' }).click()
  await page.getByRole('button', { name: 'Use Demo Simulation' }).click()
  await page.getByRole('button', { name: 'Confirm check and try practice question' }).click()
  await page.getByLabel('Signal and check for nearby road users').check()
  await page.getByRole('button', { name: 'Save answer' }).click()
  await page.getByRole('button', { name: 'Continue to fee payment' }).click()
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
  await expect(page.getByText('Interactive prototype — not a government service.')).toBeVisible()
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

  await expect(page.getByRole('heading', { name: 'Instructions for the online test' })).toBeVisible()
  await page.getByRole('checkbox', { name: /I understand this is a demo test/ }).check()
  await page.getByRole('button', { name: 'Start 15-question test' }).click()
  await expect(page.getByRole('button', { name: 'Read question aloud' })).toBeVisible()
  const paperIds = await page.evaluate(() => {
    const raw = localStorage.getItem('mp-ll-exam-session-v1:MP-LL-DEMO-2408')
    return raw ? JSON.parse(raw).exam.paperQuestionIds as string[] : []
  })
  expect(paperIds).toHaveLength(15)
  expect(new Set(paperIds).size).toBe(15)
  await page.getByRole('button', { name: 'Preview passing result' }).click()
  await expect(page.getByRole('heading', { name: 'Congratulations! You passed the demo test' })).toBeVisible()
  await expect(page.getByText('15 of 15 answers correct')).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Congratulations! You passed the demo test' })).toBeVisible()
  await page.getByRole('button', { name: 'Reset demo and return home' }).click()
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
  await page.getByRole('button', { name: 'Start 15-question test' }).click()
  for (let question = 0; question < 3; question += 1) {
    await page.getByRole('radio').first().check()
    await page.getByRole('button', { name: /Save answer and/ }).click()
  }
  await expect(page.getByRole('heading', { name: 'The test paused safely without losing progress' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'The test paused safely without losing progress' })).toBeVisible()
  await page.getByRole('button', { name: 'Resume test now' }).click()
  await expect(page.getByText('Question 4 of 15')).toBeVisible()
})
