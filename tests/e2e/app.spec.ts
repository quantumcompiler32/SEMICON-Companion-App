import { test, expect } from "@playwright/test";
test("mobile itinerary, quick capture, reload, offline PWA startup", async ({
  page,
  context,
}) => {
  await page.clock.install({ time: new Date("2026-10-13T20:30:00Z") });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Your day, in focus/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Group B", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Independent Tour Time" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Quick note", exact: false })
    .last()
    .click();
  await page
    .getByLabel("Your note", { exact: true })
    .fill("Control code needs validation before deployment.");
  await page.getByRole("button", { name: "Save note", exact: true }).click();
  await expect(
    page.getByText("Note saved locally.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Add connection", exact: false })
    .last()
    .click();
  await page.getByLabel("Full name", { exact: true }).fill("Test Engineer");
  await page.getByLabel("Company", { exact: true }).fill("Siemens");
  await page
    .getByLabel("Technical advice received")
    .fill("Study control systems");
  await page
    .getByRole("button", { name: "Save connection", exact: true })
    .click();
  await expect(
    page.getByText("Connection saved locally.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("button", { name: "Connections" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Test Engineer" }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("button", { name: "More", exact: true })
    .click();
  await page.getByRole("button", { name: "Notes", exact: true }).click();
  await expect(
    page.getByText("Control code needs validation before deployment.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
    )
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText("Offline", { exact: true })).toBeVisible();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("button", { name: "Schedule" })
    .click();
  await expect(
    page.getByRole("heading", { name: /Breakout #2 · AT3/ }),
  ).toBeVisible();
  await context.setOffline(false);
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("button", { name: "Home" })
    .click();
  await page.clock.setSystemTime(new Date("2026-10-13T21:30:00Z"));
  await page.clock.runFor(1000);
  await expect(
    page.getByRole("heading", { name: /Breakout #2 · AT3/ }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
});
test("conflicts, honest map state, and ChatGPT copy fallback", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Navigate to Next Stop" }).click();
  await expect(
    page.getByRole("heading", { name: "The official map belongs here." }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("button", { name: "Schedule" })
    .click();
  await page
    .getByRole("button", { name: "Optional sessions", exact: true })
    .click();
  await expect(
    page.getByText("School schedule conflict", { exact: true }),
  ).toHaveCount(4);
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("button", { name: "More", exact: true })
    .click();
  await page.getByRole("button", { name: "Resources", exact: true }).click();
  await page.getByRole("button", { name: "Ask ChatGPT", exact: true }).click();
  await expect(page.getByLabel("Prepared question")).toHaveValue(/SO-101/);
  await expect(
    page.getByText(/Opening ChatGPT does not guarantee/),
  ).toBeVisible();
});

test("PDF viewer persists offline, zooms, and uses a precached worker", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Navigate to Next Stop" }).click();
  await page
    .getByLabel("Import official map")
    .setInputFiles("tests/fixtures/renderer-test.pdf");
  await expect
    .poll(() =>
      page.locator("canvas").evaluate((c) => (c as HTMLCanvasElement).width),
    )
    .toBeGreaterThan(0);
  await expect(page.getByText(/Unable to display/)).toHaveCount(0);
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect(page.getByText("125%", { exact: true })).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
    )
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: "Navigate to Next Stop" }).click();
  await expect
    .poll(() =>
      page.locator("canvas").evaluate((c) => (c as HTMLCanvasElement).width),
    )
    .toBeGreaterThan(0);
  await expect(page.getByText(/Unable to display/)).toHaveCount(0);
  expect(errors).toEqual([]);
  await context.setOffline(false);
});
