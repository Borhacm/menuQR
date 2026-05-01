import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";

const baseUrl = process.env.ADMIN_CAPTURE_BASE_URL || "http://localhost:3005";
const email = process.env.ADMIN_CAPTURE_EMAIL || "demo.pro@menuly.test";

const routes = [
  { slug: "dashboard", path: "/app" },
  { slug: "menu-editor", path: "/app/menus" },
  { slug: "translations", path: "/app/translations" },
  { slug: "qr-builder", path: "/app/qr" },
  { slug: "items", path: "/app/items" },
  { slug: "resource", path: "/app/settings" },
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 960 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();
const db = new PrismaClient();
const user = await db.user.findUnique({ where: { email } });
if (!user) {
  throw new Error(`User not found for admin preview capture: ${email}`);
}

const sessionToken = crypto.randomUUID().replace(/-/g, "");
await db.session.create({
  data: {
    sessionToken,
    userId: user.id,
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
  },
});
await context.addCookies([
  {
    name: "authjs.session-token",
    value: sessionToken,
    domain: "localhost",
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
  },
  {
    name: "next-auth.session-token",
    value: sessionToken,
    domain: "localhost",
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
  },
]);

for (const route of routes) {
  await page.goto(`${baseUrl}${route.path}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(700);
  await page.screenshot({
    path: `public/images/admin-preview/${route.slug}.png`,
    fullPage: false,
  });
}

await db.session.deleteMany({
  where: {
    sessionToken,
  },
});
await db.$disconnect();
await browser.close();
console.log("Captured admin previews.");
