/**
 * Writes PNGs to public/images/admin-preview/*.png and copies the dashboard shot to
 * public/images/marketing/admin-panel.png (landing “panel admin” preview).
 *
 * Auth: this app uses JWT sessions (not DB Session rows). Playwright signs in via /login.
 *
 * Needs: app running (ADMIN_CAPTURE_BASE_URL), user created (e.g. npm run db:reset:demos).
 * Env: ADMIN_CAPTURE_EMAIL (default demo.pro@menuly.test), ADMIN_CAPTURE_PASSWORD (default DemoPro123!).
 *
 * If PNGs look unstyled: restart `next start` / dev after `next build` — stale HTML can reference old
 * `/_next/static/css/*.css` hashes that return 400 while disk has new chunks.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const baseUrl = process.env.ADMIN_CAPTURE_BASE_URL || "http://localhost:3005";
const email = process.env.ADMIN_CAPTURE_EMAIL || "demo.pro@menuly.test";
const password =
  process.env.ADMIN_CAPTURE_PASSWORD || "DemoPro123!";

const routes = [
  { slug: "dashboard", path: "/app" },
  { slug: "menu-editor", path: "/app/items?tab=categories" },
  { slug: "translations", path: "/app/items?tab=translations" },
  { slug: "qr-builder", path: "/app/items?tab=qr" },
  { slug: "items", path: "/app/items?tab=products" },
  { slug: "resource", path: "/app/settings" },
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 960 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();

/** Let Next.js + CSS settle before screenshots (JWT login + Tailwind hydration). */
async function settlePage(page) {
  await page.waitForLoadState("load");
  try {
    await page.waitForLoadState("networkidle", { timeout: 20_000 });
  } catch {
    /* long-polling / analytics can prevent “idle”; still take the shot */
  }
  await page.evaluate(() => document.fonts?.ready ?? Promise.resolve());
  await page.waitForTimeout(1800);
}

/** Fail fast when Next CSS chunks 404/400 (mismatched build vs running server). */
async function assertTailwindApplied(page) {
  const detail = await page.evaluate(async () => {
    const hrefs = [
      ...document.querySelectorAll('link[rel="stylesheet"][href*="/_next/static/css/"]'),
    ].map((l) => new URL(l.getAttribute("href"), location.origin).href);
    for (const href of hrefs) {
      const res = await fetch(href, { method: "GET", cache: "reload" });
      if (!res.ok) return `HTTP ${res.status} for ${href}`;
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("css")) return `unexpected ${ct} for ${href}`;
    }
    if (getComputedStyle(document.body).display !== "flex") {
      return "body is not display:flex (global layout CSS did not apply)";
    }
    return null;
  });
  if (detail) {
    throw new Error(
      `${detail} — restart the Next.js process after npm run build so RSC HTML matches files under .next/static.`,
    );
  }
}

await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
await page.locator("#email").fill(email);
await page.locator("#password").fill(password);
await page.getByRole("button", { name: "Sign in" }).click();
try {
  await page.waitForURL(
    (url) => url.pathname.startsWith("/app"),
    { timeout: 25_000 },
  );
} catch {
  throw new Error(
    `Login did not reach /app (check ${email} exists and ADMIN_CAPTURE_PASSWORD matches; run npm run db:reset:demos if needed).`,
  );
}

await settlePage(page);
await assertTailwindApplied(page);

for (const route of routes) {
  await page.goto(`${baseUrl}${route.path}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await settlePage(page);
  const out = `public/images/admin-preview/${route.slug}.png`;
  await page.screenshot({
    path: out,
    fullPage: false,
  });
  if (route.slug === "dashboard") {
    const marketingDir = path.join("public", "images", "marketing");
    fs.mkdirSync(marketingDir, { recursive: true });
    const marketingPanel = path.join(marketingDir, "admin-panel.png");
    fs.copyFileSync(out, marketingPanel);
  }
}

await browser.close();
console.log("Captured admin previews.");
