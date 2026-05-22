import { test, expect } from '@playwright/test';

test.describe('Tool - Tenant gray plan', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tenant-gray-plan');
  });

  test("Has correct title", async ({ page }) => {
    await expect(page).toHaveTitle("租户灰度计划 - IT Tools");
  });
});