import { test, expect } from '@playwright/test';

test.describe('Tool - Ecu mock', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ecu-mock');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Ecu mock - IT Tools');
  });

  test('', async ({ page }) => {

  });
});