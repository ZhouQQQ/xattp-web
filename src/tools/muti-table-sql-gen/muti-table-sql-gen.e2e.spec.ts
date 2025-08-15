import { test, expect } from '@playwright/test';

test.describe('Tool - Muti table sql gen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/muti-table-sql-gen');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Muti table sql gen - IT Tools');
  });

  test('', async ({ page }) => {

  });
});