import { expect, test } from "@playwright/test";

test.describe("Tool - 批量中控模拟", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/xiaoan-ecu-mock-batch");
  });

  test("Has correct title", async ({ page }) => {
    await expect(page).toHaveTitle("批量中控模拟 - IT Tools");
  });
});