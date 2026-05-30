import { test, expect } from "@playwright/test";

test("boutique liste les produits", async ({ page }) => {
  await page.goto("/boutique");
  await expect(page.getByRole("heading", { name: "Boutique" })).toBeVisible();
});
