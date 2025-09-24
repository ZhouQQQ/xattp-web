import { test, expect } from '@playwright/test';

test.describe('Tool - Release merge check', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/release-merge-check');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Release merge check - IT Tools');
  });

  test('', async ({ page }) => {

  });
});