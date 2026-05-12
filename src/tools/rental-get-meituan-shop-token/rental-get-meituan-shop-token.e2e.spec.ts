import { test, expect } from '@playwright/test';

test.describe('Tool - Rental get meituan shop token', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/rental-get-meituan-shop-token');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('获取美团店铺token - 小安测试工具平台');
  });

  test('', async ({ page }) => {

  });
});