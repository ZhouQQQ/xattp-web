import { test, expect } from '@playwright/test';

test.describe('Tool - Rental cabinet mock', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/rental-cabinet-mock');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Rental cabinet mock - IT Tools');
  });

  test('', async ({ page }) => {

  });
});