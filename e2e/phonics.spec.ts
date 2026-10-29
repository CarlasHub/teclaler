import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("a child can hear syllables in order, blend, and type the same word", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  await page.getByRole("button", { name: "Treinar sons" }).click();
  await expect(
    page.getByRole("heading", { name: "Treinar sons" }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Uma casa simples." }),
  ).toBeVisible();
  const first = page.getByRole("button", { name: "Ouvir sílaba 1: CA" });
  const second = page.getByRole("button", { name: "Ouvir sílaba 2: SA" });
  for (const part of [first, second]) {
    const box = await part.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
  await second.click();
  await expect(page.getByText("Começa por CA.")).toBeVisible();
  const blend = page.getByRole("button", { name: "Juntar palavra" });
  await expect(blend).toBeDisabled();
  await first.click();
  await second.click();
  await expect(blend).toBeEnabled();
  await blend.click();
  await expect(
    page.getByText("Juntaste a palavra. Agora podes escrevê-la!"),
  ).toBeVisible({ timeout: 15_000 });
  await page
    .getByRole("button", { name: /Agora escreve esta palavra/ })
    .click();
  await expect(page.getByLabel("Palavra alvo CASA")).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Teclado português" }),
  ).toBeInViewport();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
});

test("phonics opens from lesson settings and switches words and stages", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Começar a aprender" }).click();
  await page.getByRole("button", { name: "Definições" }).click();
  await page
    .getByRole("button", { name: "Treinar os sons desta palavra" })
    .click();
  await expect(page.getByRole("main", { name: "Treinar sons" })).toBeFocused();
  await page.getByRole("combobox", { name: "Etapa" }).selectOption("3");
  await expect(page.getByLabel("Palavra alvo LUA")).toBeVisible();
  await page.getByRole("button", { name: "Palavra seguinte de sons" }).click();
  await expect(page.getByLabel("Palavra alvo LEÃO")).toBeVisible();
  await expect(page.getByRole("img", { name: "Um leão." })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Ouvir sílaba 2: ÃO" }),
  ).toBeVisible();
});

test("phonics has no automated WCAG A/AA violations", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/");
  await page.getByRole("button", { name: "Treinar sons" }).click();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});
