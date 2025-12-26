import { test, expect } from '@playwright/test';

test.describe('Tool - Clear realname', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/clear-realname');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Clear realname - IT Tools');
  });

  test('', async ({ page }) => {

  });
});