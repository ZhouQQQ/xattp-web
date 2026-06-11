import { test, expect } from '@playwright/test';

test.describe('Tool - Mr deploy check', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/mr-deploy-check');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Mr deploy check - IT Tools');
  });

  test('', async ({ page }) => {

  });
});