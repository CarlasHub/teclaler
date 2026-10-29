import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("physical keyboard completes a word and settings keep focus inside the dialog", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Começar a aprender" }).click();
  const learningArea = page.getByTestId("learning-input-area");
  await expect(learningArea).toBeFocused();

  await page.keyboard.type("casa");
  await expect(page.getByText("Palavra completa")).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Palavra alvo MALA")).toBeVisible();
  await expect(learningArea).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Etapas" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("combobox", { name: "Idioma da lição" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  const settings = page.getByRole("button", { name: "Definições" });
  await expect(settings).toBeFocused();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Definições" });
  await expect(dialog).toBeFocused();
  await page.keyboard.type("m");
  await expect(page.getByLabel("Letra 1 de 4, vazia")).toBeVisible();
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("radio", { name: "British English" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(settings).toBeFocused();
});

test("the home journey is operable with Tab and Enter", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("main")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("combobox", { name: "Idioma da lição" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Começar a aprender" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: /Etapa 2 Sílabas simples/ }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Palavra alvo MESA")).toBeVisible();
  await page.getByRole("button", { name: "Etapas" }).click();
  await expect(
    page.getByRole("button", { name: "Continuar em MESA" }),
  ).toBeVisible();
});

test("lesson and settings have no automated WCAG A/AA violations", async ({
  page,
}) => {
  await page.goto("/");
  const home = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(home.violations).toEqual([]);
  await page.getByRole("button", { name: "Começar a aprender" }).click();
  const lesson = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(lesson.violations).toEqual([]);

  await page.getByRole("button", { name: "Definições" }).click();
  const settings = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(settings.violations).toEqual([]);
});

test("compact desktop keeps the target and accent keyboard in view", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem("teclaler.stage.pt-PT", "3");
    localStorage.setItem("teclaler.lastItem.pt-PT.3", "word-leão-pt-pt");
  });
  await page.reload();
  await page.getByRole("button", { name: "Continuar em LEÃO" }).click();
  await expect(page.getByLabel("Palavra alvo LEÃO")).toBeInViewport();
  const accentKey = page.getByRole("button", { name: "Tecla Ã" });
  await expect(accentKey).toBeInViewport();
  const keyBounds = await accentKey.boundingBox();
  expect(keyBounds?.height).toBeGreaterThanOrEqual(44);
});
