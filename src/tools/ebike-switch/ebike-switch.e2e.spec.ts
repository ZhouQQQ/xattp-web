import { test, expect } from '@playwright/test';

test.describe('Tool - Ebike switch', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ebike-switch');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Ebike switch - IT Tools');
  });

  test('', async ({ page }) => {

  });
});