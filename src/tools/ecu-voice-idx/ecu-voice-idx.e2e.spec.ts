import { test, expect } from '@playwright/test';

test.describe('Tool - Ecu voice idx', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ecu-voice-idx');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Ecu voice idx - IT Tools');
  });

  test('', async ({ page }) => {

  });
});