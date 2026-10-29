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

test("lesson controls support listening, restarting and trying another word", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Começar a aprender" }).click();
  await expect(
    page.getByText("Escreve a palavra, uma letra de cada vez."),
  ).toBeVisible();
  await expect(page.getByText("Ouves")).toHaveCount(0);
  await page.getByRole("button", { name: "Ouvir palavra" }).click();
  await expect(page.getByText("Ouves")).toBeVisible();
  await page.getByTestId("learning-input-area").focus();
  await page.keyboard.press("C");
  await expect(page.getByLabel("Letra 1 de 4, C")).toBeVisible();
  await page.getByRole("button", { name: "Recomeçar palavra" }).click();
  await expect(page.getByLabel("Letra 1 de 4, vazia")).toBeVisible();
  await page.getByRole("button", { name: "Tentar outra palavra" }).click();
  await expect(page.getByLabel("Palavra alvo MALA")).toBeVisible();
  await expect(page.getByText("Neste dispositivo: 0 conclusões")).toBeVisible();
});

test("completing a word exposes a focused next action on narrow screens", async ({
  page,
}) => {
  for (const [index, viewport] of [
    { width: 390, height: 844 },
    { width: 375, height: 667 },
    { width: 320, height: 568 },
  ].entries()) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page
      .getByRole("button", { name: /Começar a aprender|Continuar em CASA/ })
      .click();
    for (const key of ["C", "A", "S", "A"]) {
      await page.getByRole("button", { name: `Tecla ${key}` }).click();
    }
    const next = page.getByRole("button", { name: "Próxima palavra" });
    await expect(next).toBeFocused();
    await expect(next).toBeInViewport();
    await expect(page.getByLabel("Palavra alvo CASA")).toBeInViewport();
    await expect(
      page.getByRole("list", { name: "Letras da palavra CASA" }),
    ).toBeInViewport();
    if (index === 0) await page.keyboard.press("Enter");
    else if (index === 1) await page.keyboard.press("Space");
    else await next.click();
    await expect(page.getByLabel("Palavra alvo MALA")).toBeVisible();
    await expect(page.getByText("Palavra 2 de 5: MALA.")).toBeAttached();
    await page.evaluate(() =>
      localStorage.removeItem("teclaler.lastItem.pt-PT.1"),
    );
  }
});

test("finishing the starter stage exposes the next stage action", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Começar a aprender" }).click();
  for (const word of ["CASA", "MALA", "PATO", "SAPO", "BOLA"]) {
    await page.getByTestId("learning-input-area").focus();
    await page.keyboard.type(word);
    if (word !== "BOLA") await page.keyboard.press("Enter");
  }
  await expect(
    page.getByRole("heading", { name: "Etapa concluída!" }),
  ).toBeVisible();
  const nextStage = page.getByRole("button", { name: "Etapa seguinte" });
  await expect(nextStage).toBeFocused();
  await expect(nextStage).toBeInViewport();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Palavra alvo MESA")).toBeVisible();
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

  await page.getByRole("button", { name: "Fechar" }).click();
  await page.getByTestId("learning-input-area").focus();
  await page.keyboard.type("CASA");
  const completion = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(completion.violations).toEqual([]);
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

test("starter lesson keeps the full on-screen keyboard in a compact desktop viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/");
  await page.getByRole("button", { name: "Começar a aprender" }).click();
  await expect(page.getByRole("button", { name: "Apagar" })).toBeInViewport();
});

test("mobile lesson keeps the word and typing position above the keyboard", async ({
  page,
}) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 375, height: 667 },
    { width: 320, height: 568 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page
      .getByRole("button", { name: /Começar a aprender|Continuar em CASA/ })
      .click();
    const target = page.getByLabel("Palavra alvo CASA");
    const boxes = page.getByRole("list", { name: "Letras da palavra CASA" });
    await expect(target).toBeInViewport();
    await expect(boxes).toBeInViewport();
    const boxesBounds = await boxes.boundingBox();
    const keyboardBounds = await page
      .getByRole("button", { name: "Tecla Q" })
      .boundingBox();
    expect(boxesBounds!.y + boxesBounds!.height).toBeLessThan(
      keyboardBounds!.y,
    );
    if (viewport.height > 720) {
      await expect(
        page.getByRole("button", { name: "Ouvir palavra" }),
      ).toBeInViewport();
    }
  }
});
