import { test, expect } from '@playwright/test';

test.describe('Tool - Add tester', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/add-tester');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('添加体验权限 - 小安测试工具平台');
  });

  test('shows form fields', async ({ page }) => {
    await expect(page.getByPlaceholder('请输入 wxappid')).toBeVisible();
    await expect(page.getByPlaceholder('请输入微信号（体验成员）')).toBeVisible();
    await expect(page.getByRole('button', { name: '添加体验权限' })).toBeVisible();
  });
});