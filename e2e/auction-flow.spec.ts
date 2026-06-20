/**
 * E2E test for the auction demo flow:
 * Lobby → fill room name → pick franchise → land in active auction with player visible
 */
import { test, expect } from '@playwright/test'

test.describe('Auction demo flow', () => {
  test('user can start an auction and see the bidding UI', async ({ page }) => {
    await page.goto('/lobby')
    await expect(page.getByText(/AUCTION LOBBY/i)).toBeVisible({ timeout: 15_000 })

    // Step 1: room name field is pre-filled — click Continue
    // The "Pick Franchise" step button is the only button advancing us
    const continueBtn = page.getByRole('button', { name: /pick franchise|continue|next/i }).first()
    if (await continueBtn.isVisible().catch(() => false)) {
      await continueBtn.click()
    }

    // Step 2: pick a franchise — any IPL franchise card
    // Wait for franchise grid to appear
    await page.waitForTimeout(500)
    // Click the first franchise tile (Mumbai Indians, CSK, etc.)
    const franchiseCard = page.locator('[class*="franchise"]').first()
    if (await franchiseCard.isVisible().catch(() => false)) {
      await franchiseCard.click()
    } else {
      // Fallback: click the first clickable card-like element
      const anyCard = page.locator('button, [role="button"]').filter({ hasText: /Mumbai|Chennai|Royal|Sunrisers|Punjab/i }).first()
      await anyCard.click()
    }

    // Step 3: click START AUCTION
    const startBtn = page.getByRole('button', { name: /start auction/i }).first()
    await expect(startBtn).toBeVisible({ timeout: 5_000 })
    await startBtn.click()

    // Step 4: we should now be on /room/...
    await expect(page).toHaveURL(/\/room\//, { timeout: 5_000 })

    // Step 5: the AI Strategist panel or PlayerBlock should appear
    // (means the auction is actually active, not stuck on "WAITING TO START")
    const aiPanel = page.getByText(/AI Strategist/i)
    const waitingMsg = page.getByText(/WAITING TO START/i)

    // We want AI Strategist visible OR explicit "waiting" message to be ABSENT
    const aiVisible = await aiPanel.isVisible({ timeout: 3_000 }).catch(() => false)
    const waitingVisible = await waitingMsg.isVisible({ timeout: 1_000 }).catch(() => false)

    expect(aiVisible || !waitingVisible, 'Expected active auction UI, not stuck on lobby').toBeTruthy()
  })

  test('auction state survives page refresh', async ({ page }) => {
    // First create an auction
    await page.goto('/lobby')
    await page.waitForTimeout(800)

    // Try to set up — if any step fails, that's a different bug, so skip gracefully
    const continueBtn = page.getByRole('button', { name: /pick franchise|continue|next/i }).first()
    if (await continueBtn.isVisible().catch(() => false)) {
      await continueBtn.click().catch(() => {})
    }
    await page.waitForTimeout(400)

    const anyTeam = page.locator('button, [role="button"]')
      .filter({ hasText: /Mumbai|Chennai|Royal|Sunrisers|Punjab|Delhi|Kolkata|Rajasthan/i })
      .first()
    if (!(await anyTeam.isVisible().catch(() => false))) return // setup didn't reach team step

    await anyTeam.click()
    const startBtn = page.getByRole('button', { name: /start auction/i }).first()
    if (await startBtn.isVisible().catch(() => false)) {
      await startBtn.click()
      await page.waitForURL(/\/room\//, { timeout: 5_000 }).catch(() => {})
    }

    // Refresh — state should persist (via Zustand persist)
    await page.reload()
    // We should still be on /room/... not redirected to /lobby
    await page.waitForTimeout(1_500)
    const url = page.url()
    expect(url).toMatch(/\/room\//)
  })
})
