import { test, expect } from "@playwright/test";

test.describe("Basic User Flow", () => {
  test("should navigate to home page", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /build with/i })).toBeVisible();
  });

  test("should navigate to login page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /login/i }).click();
    await expect(page).toHaveURL(/.*login/);
    await expect(page.getByRole("heading", { name: /login/i })).toBeVisible();
  });

  test("should display project creation form", async ({ page }) => {
    // Mock authentication by setting localStorage
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "auth-storage",
        JSON.stringify({
          state: {
            session: {
              user: { id: "1", email: "test@example.com" },
              accessToken: "mock-token",
              expiresAt: Date.now() + 3600000,
            },
          },
        })
      );
    });

    await page.goto("/projects");
    await page.getByTestId("create-project-btn").click();
    await expect(page).toHaveURL(/\/projects\/new/);
    await expect(page.getByTestId("submit-project")).toBeVisible();
  });

});

