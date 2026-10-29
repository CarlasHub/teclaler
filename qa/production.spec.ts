import { expect, test } from "@playwright/test";

test("Pages build loads without external app assets and works offline", async ({
  context,
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const response = await page.goto("/teclaler/", { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Vamos ler?" })).toBeVisible();
  expect(await page.locator("script[src]").count()).toBe(0);
  expect(await page.locator("style").count()).toBeGreaterThan(0);

  await page.waitForFunction(
    () => navigator.serviceWorker.controller !== null,
    null,
    { timeout: 30_000 },
  );
  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Vamos ler?" })).toBeVisible();
  const audioStatus = await page.evaluate(
    async () => (await fetch("/teclaler/audio/en-GB/words/house.wav")).status,
  );
  expect(audioStatus).toBe(200);
  await page.getByRole("button", { name: "Começar a aprender" }).click();
  await page
    .getByRole("button", { name: "Palavra seguinte sem concluir esta" })
    .click();
  await expect(page.getByLabel("Palavra alvo MALA")).toBeVisible();
  expect(pageErrors).toEqual([]);
});
