import { test, expect } from "@playwright/test";

test("home affiche hero + CTA boutique", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    /personnalisables/i,
  );
  await expect(
    page.getByRole("link", { name: /découvrir la boutique/i }),
  ).toBeVisible();
});
