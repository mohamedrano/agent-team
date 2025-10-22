import { test, expect } from "@playwright/test";

test.describe("i18n direction", () => {
  test("should switch between RTL and LTR", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("language-switcher").waitFor();
    await page.getByTestId("lang-en").click();
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await page.getByTestId("lang-ar").click();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });
});
