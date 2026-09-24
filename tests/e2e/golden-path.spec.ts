import { test, expect, type Page } from "@playwright/test";

// Full restaurant journey: register, build a menu with two sections, translate,
// export the QR and open the public menu as an anonymous guest.
// Needs a disposable database (see tests/e2e/README.md). Never point it at production.

const stamp = Date.now();
const user = { name: "QA Menuly", email: `qa+${stamp}@example.com`, password: "QaMenuly-2026!" };

test.describe.configure({ mode: "serial" });

async function openTab(page: Page, tab: string) {
  await page.goto(`/app/items?tab=${tab}`);
  await page.waitForLoadState("networkidle");
}

function productForm(page: Page) {
  return page.locator("form").filter({ has: page.getByRole("button", { name: /save product|guardar/i }) });
}

test("register lands in the admin panel", async ({ page }) => {
  await page.goto("/register");
  await page.fill('input[name="name"]', user.name);
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/app/, { timeout: 20_000 });
  await page.context().storageState({ path: "test-results/.golden-state.json" });
});

test.describe("with an account", () => {
  test.use({ storageState: "test-results/.golden-state.json" });

  test("create two sections", async ({ page }) => {
    await openTab(page, "categories");
    for (const name of ["Entrantes", "Principales"]) {
      await page.getByPlaceholder("Drinks").fill(name);
      await page.getByRole("button", { name: /^add$|^añadir$/i }).click();
      await expect(page.locator(`input[name="name"][value="${name}"]`)).toHaveCount(1, { timeout: 10_000 });
    }
  });

  test("a dish can be assigned to the second section", async ({ page }) => {
    // Known bug: the "Categories" step creates Menu rows, but the product form lists Category rows,
    // so new sections never appear and every dish lands in the first one. Remove once fixed.
    test.fail();
    await openTab(page, "products");
    const options = await productForm(page).locator('select[name="categoryId"] option').allInnerTexts();
    expect(options.join("|")).toContain("Principales");
  });

  test("create dishes", async ({ page }) => {
    for (const [name, price] of [
      ["Croquetas de jamón", "8.50"],
      ["Pulpo a la gallega", "16.00"],
      ["Tarta de queso", "6.50"],
    ]) {
      await openTab(page, "products");
      const form = productForm(page);
      await form.locator('input[name="name"]').fill(name);
      await form.locator('input[name="priceValues"]').first().fill(price);
      await form.getByRole("button", { name: /save product|guardar/i }).click();
      await expect(page.getByText(name).first()).toBeVisible({ timeout: 10_000 });
    }
  });

  test("translations unlock styles, preview and QR", async ({ page }) => {
    await openTab(page, "translations");
    await page.getByRole("button", { name: /generate translations now|generar traducciones/i }).click();
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /^accept all$|^aceptar todo$/i }).first().click();
    await page.waitForLoadState("networkidle");
    await openTab(page, "qr");
    await expect(page.getByText(/design your qr|diseña tu qr/i)).toBeVisible();
  });

  test("QR exports in every format", async ({ page }) => {
    await openTab(page, "qr");
    const links = await page.locator('a[href*="/api/qr/export"]').evaluateAll((els) =>
      els.map((el) => el.getAttribute("href") ?? "")
    );
    expect(links).toHaveLength(3);
    for (const href of links) {
      const res = await page.request.get(href);
      expect(res.status(), href).toBe(200);
      expect((await res.body()).length).toBeGreaterThan(1000);
    }
  });

  test("public menu renders for an anonymous guest on mobile", async ({ page, browser }) => {
    await page.goto("/app/settings");
    const slug = await page.locator('input[name="slug"]').inputValue();
    const guest = await browser.newContext({ storageState: undefined, viewport: { width: 390, height: 844 } });
    const menu = await guest.newPage();
    const res = await menu.goto(`/m/${slug}`);
    expect(res?.status()).toBe(200);
    await expect(menu.getByText("Croquetas de jamón")).toBeVisible();
    await guest.close();
  });
});
