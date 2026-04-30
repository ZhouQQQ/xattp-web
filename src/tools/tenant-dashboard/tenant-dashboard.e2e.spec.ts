import { test, expect } from '@playwright/test';

test.describe('Tool - Tenant dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tenant-dashboard');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Tenant dashboard - IT Tools');
  });

  test('', async ({ page }) => {

  });
});