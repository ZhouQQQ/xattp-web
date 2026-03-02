import { test, expect } from '@playwright/test';

test.describe('Tool - Xiaoan ecu mock', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/xiaoan-ecu-mock');
  });

  test('Has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Xiaoan ecu mock - IT Tools');
  });

  test('', async ({ page }) => {

  });
});