import { expect, test } from "@playwright/test";

test.describe("companion-web smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("kr_onboarding_v1_done", "1");
    });
  });

  test("home gate → dashboard shell", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /enter battle/i })).toBeVisible();
    await page.getByRole("button", { name: /enter battle/i }).click();
    await expect(page.getByRole("heading", { name: /^battle$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /run battle/i })).toBeVisible();
  });

  test("gateway health includes database check", async ({ request }) => {
    const res = await request.get("http://127.0.0.1:8787/health");
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { checks?: { database?: string } };
    expect(body.checks?.database).toMatch(/^(ok|skipped|error)$/);
  });

  test("gateway exposes legal/public JSON", async ({ request }) => {
    const res = await request.get("http://127.0.0.1:8787/legal/public");
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { v?: unknown; ok?: unknown };
    expect(body).toMatchObject({ v: 1 });
    expect(typeof body.ok).toBe("boolean");
  });

  test("analytics/event returns 503 without Postgres (file-store smoke)", async ({ request }) => {
    const res = await request.post("http://127.0.0.1:8787/analytics/event", {
      data: { v: 1, name: "smoke.test", props: {} },
      headers: { accept: "application/json", "content-type": "application/json" }
    });
    expect(res.status()).toBe(503);
    const body = (await res.json()) as { ok?: unknown; error?: unknown };
    expect(body).toMatchObject({ ok: false, error: "ANALYTICS_REQUIRES_DATABASE" });
  });

  test("run battle reaches result panel", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /enter battle/i }).click();
    await page.getByRole("button", { name: /run battle/i }).click();
    await expect(page.locator("#kr-section-result")).toContainText(/Outcome|Victory|Defeat|DRAW/i, {
      timeout: 60_000
    });
  });
});
