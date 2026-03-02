import { test, expect } from '@playwright/test';

test.describe('Tool - Rental ecu mock', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/rental-ecu-mock');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Rental ecu mock - IT Tools');
  });

  test('', async ({ page }) => {

  });
});