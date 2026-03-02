import { test, expect } from '@playwright/test';

test.describe('Tool - Merge request check', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/merge-request-check');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Merge request check - IT Tools');
  });

  test('', async ({ page }) => {

  });
});