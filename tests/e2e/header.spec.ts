import { test, expect } from "@playwright/test";

test("header présente nav principale et icônes utilitaires", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Tootoons" })).toBeVisible();
  await expect(page.getByRole("link", { name: /boutique/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /panier/i })).toBeVisible();
});
