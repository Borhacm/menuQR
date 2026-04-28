import { test, expect } from "@playwright/test";

test("landing renders and links to auth", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("heading", { name: /multilingual qr menus/i })).toBeVisible();
  await page.getByRole("link", { name: /sign up|crear cuenta/i }).first().click();
  await expect(page).toHaveURL(/\/register$/);
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
