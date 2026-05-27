import { test, expect } from '@playwright/test';

test.describe('Tool - Json beautify', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/json-beautify');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Json beautify - IT Tools');
  });

  test('', async ({ page }) => {

  });
});