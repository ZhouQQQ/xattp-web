import { test, expect } from '@playwright/test';

test.describe('Tool - Text to speech', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/text-to-speech');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Text to speech - IT Tools');
  });

  test('', async ({ page }) => {

  });
});