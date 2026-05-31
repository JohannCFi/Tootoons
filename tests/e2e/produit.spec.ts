import { test, expect } from "@playwright/test";

test("fiche produit charge sans crash", async ({ page }) => {
  await page.goto("/boutique");
  const firstCard = page.locator("a[href^='/produit/']").first();
  const hasProduct = await firstCard.count();
  test.skip(hasProduct === 0, "Aucun produit en base, test sauté");
  await firstCard.click();
  await expect(
    page.getByRole("button", { name: /ajouter au panier/i }),
  ).toBeVisible();
});
