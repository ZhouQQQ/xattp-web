import { test, expect } from '@playwright/test';

test.describe('Tool - Rental switch', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/rental-switch');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Rental switch - IT Tools');
  });

  test('', async ({ page }) => {

  });
});