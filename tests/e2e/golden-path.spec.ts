import { test, expect, type Page } from "@playwright/test";
import sharp from "sharp";
import jsQR from "jsqr";

// Full restaurant journey: register, build a menu with two sections, translate,
// export the QR and open the public menu as an anonymous guest.
// Needs a disposable database (see tests/e2e/README.md). Never point it at production.

const stamp = Date.now();
const user = { name: "QA Menuly", email: `qa+${stamp}@example.com`, password: "QaMenuly-2026!" };
const venue = { name: "Bar La Plaza QA", slug: `bar-qa-${stamp}` };

test.describe.configure({ mode: "serial" });

// QR styles offered by the editor; every combination must stay scannable.
const dotStyles = ["square", "rounded", "dots"];
const cornerStyles = ["square", "rounded", "dot"];
const colors: Array<[string, string]> = [
  ["#111111", "#ffffff"],
  ["#6b5be2", "#ffffff"],
  ["#111111", "#ffd400"],
  ["#dddddd", "#ffffff"], // too low contrast: must fall back to black on white
];

async function decode(png: Buffer, size: number) {
  const { data, info } = await sharp(png).resize(size, size).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return jsQR(new Uint8ClampedArray(data), info.width, info.height)?.data ?? null;
}


async function openTab(page: Page, tab: string) {
  await page.goto(`/app/items?tab=${tab}`);
  await page.waitForLoadState("networkidle");
}

async function openCreateForm(page: Page) {
  const add = page.getByText(/^añadir plato$|^add dish$/i);
  if (await add.isVisible()) await add.click();
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
  await expect
    .poll(() => page.evaluate(() => JSON.stringify((window as unknown as { dataLayer?: unknown[] }).dataLayer ?? [])))
    .toContain("sign_up");
  const banner = page.getByRole("button", { name: /solo esenciales|essential only/i });
  if (await banner.isVisible()) await banner.click();

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
      await openCreateForm(page);
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

  test("printable menu and table cards download as PDF", async ({ page }) => {
    await openTab(page, "qr");
    const links = await page.locator('a[href*="/api/menu/print"]').evaluateAll((els) =>
      els.map((el) => el.getAttribute("href") ?? "")
    );
    expect(links).toHaveLength(2);
    for (const href of links) {
      const res = await page.request.get(href);
      expect(res.status(), href).toBe(200);
      expect(res.headers()["content-type"]).toBe("application/pdf");
      const body = await res.body();
      expect(body.subarray(0, 4).toString()).toBe("%PDF");
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

  test("venue details show on the public menu", async ({ page, browser }) => {
    await page.goto("/app/settings");
    await page.fill('input[name="contactPhone"]', "965 000 000");
    await page.fill('input[name="whatsapp"]', "600 123 456");
    await page.fill('textarea[name="hours"]', "L-V 8:00-16:00");
    await page.fill('input[name="wifiName"]', "BarQA");
    await page.getByRole("button", { name: /guardar ficha|save details/i }).click();
    await page.waitForURL(/saved=venue/);

    const guest = await browser.newContext({ storageState: undefined });
    const menu = await guest.newPage();
    await menu.goto(`/m/${venue.slug}`);
    await expect(menu.getByRole("heading", { name: /visítanos|visit us/i })).toBeVisible();
    await expect(menu.locator('a[href="https://wa.me/34600123456"]')).toBeVisible();
    await expect(menu.getByText("L-V 8:00-16:00")).toBeVisible();
    await guest.close();
  });

  test("sold out today shows on the public menu", async ({ page, browser }) => {
    await openTab(page, "products");
    const row = page.locator(`[id^="item-"]`).filter({ hasText: "Croquetas de jamón" }).first();
    await row.getByRole("button", { name: /marcar agotado|mark sold out/i }).click();
    await expect(row.getByText(/agotado hoy|sold out today/i)).toBeVisible();
    await expect(row.getByRole("button", { name: /volver a ofrecer|available again/i })).toBeVisible();

    const guest = await browser.newContext({ storageState: undefined });
    const menu = await guest.newPage();
    await menu.goto(`/m/${venue.slug}`);
    await expect(menu.getByText(/^agotado$/i).first()).toBeVisible();
    await guest.close();
  });

  test("guests can search dishes across sections", async ({ browser }) => {
    const guest = await browser.newContext({ storageState: undefined, viewport: { width: 390, height: 844 } });
    const menu = await guest.newPage();
    await menu.goto(`/m/${venue.slug}`);
    await menu.getByRole("button", { name: /buscar en la carta|search the menu/i }).click();
    await menu.getByRole("searchbox").fill("pulpo");
    await expect(menu.getByText(/1 resultado/)).toBeVisible();
    await expect(menu.getByText("Pulpo a la gallega")).toBeVisible();
    await menu.getByRole("searchbox").fill("zzz");
    await expect(menu.getByText(/no hay platos/i)).toBeVisible();
    await guest.close();
  });

  test("section schedule hides it outside its days and shows the fixed price", async ({ page, browser }) => {
    const madridDay = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(
      new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", weekday: "short" }).format(new Date())
    ) + 1;
    await openTab(page, "categories");
    const sectionRow = (name: string) =>
      page.locator("div.rounded-md.border.p-3").filter({ has: page.locator(`input[name="name"][value="${name}"]`) });

    const principales = sectionRow("Principales");
    await principales.locator("summary").click();
    for (let day = 1; day <= 7; day++) {
      if (day !== madridDay) await principales.locator(`input[name="days"][value="${day}"]`).check();
    }
    await principales.getByRole("button", { name: /guardar horario|save schedule/i }).click();
    await page.waitForLoadState("networkidle");

    const entrantes = sectionRow("Entrantes");
    await entrantes.locator("summary").click();
    await entrantes.locator('input[name="fixedPrice"]').fill("14,50");
    await entrantes.locator('input[name="note"]').fill("Primero, segundo y postre");
    await entrantes.getByRole("button", { name: /guardar horario|save schedule/i }).click();
    await page.waitForLoadState("networkidle");

    const guest = await browser.newContext({ storageState: undefined });
    const menu = await guest.newPage();
    await menu.goto(`/m/${venue.slug}`);
    await expect(menu.getByText(/14,50\s*€ · Primero, segundo y postre/)).toBeVisible();
    await expect(menu.getByText("Pulpo a la gallega")).toHaveCount(0);
    await guest.close();
  });

  test("all QR styles scan", async ({ page }) => {
    await page.goto("/app/items?tab=qr");
    const href = await page.locator('a[href*="/api/qr/export"][href*="format=png"]').first().getAttribute("href");
    const resourceId = new URL(href!, "http://x").searchParams.get("resourceId")!;
    const failures: string[] = [];
    for (const dotStyle of dotStyles) {
      for (const cornerStyle of cornerStyles) {
        for (const [dotsColor, bgColor] of colors) {
          for (const logoUrl of ["", "/qr-icons/coffee.svg"]) {
            const qs = new URLSearchParams({ resourceId, format: "png", dotStyle, cornerStyle, dotsColor, bgColor, logoUrl });
            const res = await page.request.get(`/api/qr/export?${qs}`);
            const png = Buffer.from(await res.body());
            for (const size of [240, 800]) {
              const text = await decode(png, size);
              if (!text || !text.includes("/m/")) failures.push(`${qs} @${size}`);
            }
          }
        }
      }
    }
    expect(failures).toEqual([]);
  });
});
