import { test, expect } from "@playwright/test";

test("landing renders and links to auth", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("heading", { name: /multilingual qr menus/i })).toBeVisible();
  const cta = page.getByTestId("hero-start-free");
  await expect(cta).toHaveAttribute("href", "/register");
  await page.goto("/register");
  await expect(page).toHaveURL(/\/register$/, { timeout: 15000 });
});

test("ai parse endpoint requires auth", async ({ request }) => {
  const res = await request.post("/api/ai/parse-menu", {
    multipart: {
      image: {
        name: "x.jpg",
        mimeType: "image/jpeg",
        buffer: Buffer.from([0xff, 0xd8, 0xff]),
      },
    },
  });
  expect(res.status()).toBe(401);
});

test("qr export endpoint requires auth", async ({ request }) => {
  const res = await request.get("/api/qr/export?resourceId=test-resource&format=png");
  expect(res.status()).toBe(401);
});

test("track endpoint validates payload", async ({ request }) => {
  const res = await request.post("/api/track", { data: {} });
  expect(res.status()).toBe(400);
});
