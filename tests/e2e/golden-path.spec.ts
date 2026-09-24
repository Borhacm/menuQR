import { test, expect, type Page } from "@playwright/test";

// Full restaurant journey: register, build a menu with two sections, translate,
// export the QR and open the public menu as an anonymous guest.
// Needs a disposable database (see tests/e2e/README.md). Never point it at production.

const stamp = Date.now();
const user = { name: "QA Menuly", email: `qa+${stamp}@example.com`, password: "QaMenuly-2026!" };
const venue = { name: "Bar La Plaza QA", slug: `bar-qa-${stamp}` };

test.describe.configure({ mode: "serial" });

async function openTab(page: Page, tab: string) {
  await page.goto(`/app/items?tab=${tab}`);
  await page.waitForLoadState("networkidle");
}

function productForm(page: Page) {
  return page.locator("form").filter({ has: page.getByRole("button", { name: /save product|guardar/i }) });
}

test("register goes through the venue wizard", async ({ page }) => {
  await page.goto("/register");
  await page.fill('input[name="name"]', user.name);
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/onboarding/, { timeout: 20_000 });

  await page.fill('input[name="name"]', venue.name);
  await page.fill('input[name="slug"]', venue.slug);
  await page.selectOption('select[name="defaultLocale"]', "es");
  await page.selectOption('select[name="defaultCurrency"]', "EUR");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/app/, { timeout: 20_000 });
  await expect(page.getByText(venue.name).first()).toBeVisible();
  await page.context().storageState({ path: "test-results/.golden-state.json" });
});

test("registering twice with the same email shows a message, not an error page", async ({ page }) => {
  await page.goto("/register");
  await page.fill('input[name="name"]', user.name);
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/error=email_taken/);
  await expect(page.getByRole("alert")).toBeVisible();
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
    await openTab(page, "products");
    const options = await productForm(page).locator('select[name="categoryId"] option').allInnerTexts();
    expect(options.join("|")).toContain("Principales");
  });

  test("free plan: allergens available, dish photos not hosted", async ({ page, baseURL }) => {
    await openTab(page, "products");
    const form = productForm(page);
    await expect(form.locator('input[name="allergens"]').first()).toBeEnabled();
    await expect(form.getByText(/fotos de platos|dish photos/i)).toBeVisible();
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
      "base64"
    );
    const res = await page.request.post("/api/uploads", {
      headers: { origin: baseURL ?? "" },
      multipart: { file: { name: "plato.png", mimeType: "image/png", buffer: png }, purpose: "item" },
    });
    expect(res.status()).toBe(403);
  });

  test("create dishes", async ({ page }) => {
    for (const [name, price, section] of [
      ["Croquetas de jamón", "8.50", "Entrantes"],
      ["Pulpo a la gallega", "16.00", "Principales"],
      ["Tarta de queso", "6.50", "Principales"],
    ]) {
      await openTab(page, "products");
      const form = productForm(page);
      await form.locator('input[name="name"]').fill(name);
      await form.locator('select[name="categoryId"]').selectOption({ label: section });
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
    const slug = venue.slug;
    const guest = await browser.newContext({ storageState: undefined, viewport: { width: 390, height: 844 } });
    const menu = await guest.newPage();
    const res = await menu.goto(`/m/${slug}`);
    expect(res?.status()).toBe(200);
    await expect(menu.getByText("Croquetas de jamón")).toBeVisible();
    await expect(menu.getByText(/principales/i).first()).toBeVisible();
    await guest.close();
  });
});
