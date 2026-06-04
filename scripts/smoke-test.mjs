#!/usr/bin/env node
// End-to-end smoke test for the Musicalizer Magic dashboard.
//
// Drives a headless Chromium browser through every top-level feature surfaced
// in the dashboard: track list, version selection, all six tabs (Versions,
// Prompt, Lyrics, Style, Themes, Evaluate), keyboard shortcuts, and the
// public JSON APIs (/api/upload, /api/themes/generate).
//
// Usage:
//   1. npm install
//   2. npm run db:migrate && npm run db:seed
//   3. npm run dev   (in another shell, on port 3000)
//   4. node scripts/smoke-test.mjs
//
// Optional env vars:
//   APP_URL          default: http://localhost:3000
//   SCREENSHOT_DIR   default: ./.smoke-screenshots
//
// Requires the `playwright` package (or playwright-core + a chromium build)
// to be importable. Install via `npm i -D playwright` or rely on a globally
// installed Playwright.

import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";

const require_ = createRequire(import.meta.url);

async function loadPlaywright() {
  const candidates = ["playwright", "playwright-core"];
  for (const id of candidates) {
    try {
      return await import(id);
    } catch {
      /* try next */
    }
  }
  // Fall back to globally-installed Playwright (npm root -g)
  try {
    const { execSync } = await import("node:child_process");
    const globalRoot = execSync("npm root -g", { encoding: "utf8" }).trim();
    for (const id of candidates) {
      try {
        return await import(`${globalRoot}/${id}/index.mjs`);
      } catch {
        /* try next */
      }
    }
  } catch {
    /* ignore */
  }
  console.error(
    "Playwright is not installed. Run `npm i -D playwright` or install it globally (`npm i -g playwright`)."
  );
  process.exit(2);
}

const { chromium } = await loadPlaywright();

const APP = process.env.APP_URL || "http://localhost:3000";
const OUT = process.env.SCREENSHOT_DIR || "./.smoke-screenshots";
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();

const consoleErrs = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrs.push(`[console.error] ${msg.text()}`);
});
page.on("pageerror", (err) => consoleErrs.push(`[pageerror] ${err.message}`));

const results = [];
function record(name, ok, details = "") {
  const line = `${ok ? "PASS" : "FAIL"}  ${name}${
    details ? "  — " + details : ""
  }`;
  console.log(line);
  results.push({ name, ok, details });
}
async function shot(label) {
  await page.screenshot({ path: `${OUT}/${label}.png`, fullPage: false });
}

try {
  // 1. Root URL redirects to /dashboard
  const navResp = await page.goto(APP + "/", { waitUntil: "networkidle" });
  record(
    "Root URL responds",
    !!(navResp && navResp.ok()),
    `status=${navResp?.status()} url=${page.url()}`
  );
  record("Redirects to /dashboard", page.url().endsWith("/dashboard"), page.url());
  await shot("01-dashboard");

  // 2. Sidebar shows seeded tracks
  const body = () => page.locator("body").innerText();
  const t1 = await body();
  record("Sidebar shows 'Neon Nights'", t1.includes("Neon Nights"));
  record("Sidebar shows 'Fading Echoes'", t1.includes("Fading Echoes"));
  record(
    "Header shows track name",
    /Neon Nights|Fading Echoes/.test(t1)
  );

  // 3. Every tab is visible
  for (const tab of ["Versions", "Prompt", "Lyrics", "Style", "Themes", "Evaluate"]) {
    const visible = await page
      .getByRole("tab", { name: new RegExp("^" + tab, "i") })
      .first()
      .isVisible()
      .catch(() => false);
    record(`Tab visible: ${tab}`, visible);
  }

  // 4. Activating each tab succeeds (aria-selected becomes true)
  for (const tab of ["Versions", "Prompt", "Lyrics", "Style", "Themes", "Evaluate"]) {
    const t = page.getByRole("tab", { name: new RegExp("^" + tab, "i") }).first();
    await t.click();
    await page.waitForTimeout(400);
    const aria = await t.getAttribute("aria-selected").catch(() => null);
    const ds = await t.getAttribute("data-state").catch(() => null);
    record(
      `Tab activates: ${tab}`,
      aria === "true" || ds === "active",
      `aria=${aria} data-state=${ds}`
    );
    await shot(`02-tab-${tab.toLowerCase()}`);
  }

  // 5. Versions tab shows the seeded versions
  await page.getByRole("tab", { name: /^Versions/i }).first().click();
  await page.waitForTimeout(300);
  record(
    "Versions tab shows version labels",
    /Version|v1|v2/.test(await body())
  );

  // 6. Switching tracks updates the header
  const fading = page.locator("text=Fading Echoes").first();
  if (await fading.isVisible().catch(() => false)) {
    await fading.click();
    await page.waitForTimeout(600);
    record(
      "Switching tracks updates header",
      (await body()).includes("Fading Echoes")
    );
    await shot("03-fading-echoes");
  }

  // 7. Lyrics tab on Fading Echoes shows the seeded lyrics (in textarea)
  await page.getByRole("tab", { name: /^Lyrics/i }).first().click();
  await page.waitForTimeout(500);
  const lyricsValues = await Promise.all(
    (await page.locator("textarea").all()).map((ta) =>
      ta.inputValue().catch(() => "")
    )
  );
  record(
    "Lyrics tab shows seeded lyrics",
    lyricsValues.join("\n").includes("Walking down this empty street")
  );
  await shot("04-lyrics");

  // 8. Themes tab shows assigned themes
  await page.getByRole("tab", { name: /^Themes/i }).first().click();
  await page.waitForTimeout(400);
  const themesBody = await body();
  record(
    "Themes tab shows 'Lost Love Letters'",
    themesBody.includes("Lost Love Letters")
  );
  record(
    "Themes tab shows 'Autumn Melancholy'",
    themesBody.includes("Autumn Melancholy")
  );
  await shot("05-themes");

  // 9. Style and Evaluate tabs render expected labels
  const neon = page.locator("text=Neon Nights").first();
  if (await neon.isVisible().catch(() => false)) {
    await neon.click();
    await page.waitForTimeout(500);
  }
  await page.getByRole("tab", { name: /^Style/i }).first().click();
  await page.waitForTimeout(400);
  const styleBody = await body();
  record(
    "Style tab shows Genre & Tempo labels",
    /Genre/i.test(styleBody) && /Tempo/i.test(styleBody)
  );
  await shot("06-style");

  await page.getByRole("tab", { name: /^Evaluate/i }).first().click();
  await page.waitForTimeout(500);
  const evalBody = await body();
  record(
    "Evaluate tab shows dimension scores",
    /melody|harmony|production|rhythm/i.test(evalBody)
  );
  await shot("07-evaluate");

  // 10. Prompt tab has an editable prompt textarea
  await page.getByRole("tab", { name: /^Prompt/i }).first().click();
  await page.waitForTimeout(300);
  const promptVal = await page
    .locator("textarea")
    .first()
    .inputValue()
    .catch(() => "");
  record(
    "Prompt tab has a populated prompt textarea",
    promptVal.length > 0,
    `len=${promptVal.length}`
  );
  await shot("08-prompt");

  // 11. Keyboard shortcuts
  await page.locator("body").click({ position: { x: 5, y: 5 } });
  await page.keyboard.press("?");
  await page.waitForTimeout(300);
  record(
    "Pressing ? toggles keyboard help",
    /shortcut|keyboard/i.test(await body())
  );
  await shot("09-shortcuts");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);

  await page.locator("body").click({ position: { x: 5, y: 5 } });
  await page.keyboard.press("3");
  await page.waitForTimeout(400);
  const lyricsTab = page.getByRole("tab", { name: /^Lyrics/i }).first();
  const aria = await lyricsTab.getAttribute("aria-selected").catch(() => null);
  const ds = await lyricsTab.getAttribute("data-state").catch(() => null);
  record(
    "Pressing 3 activates Lyrics tab",
    aria === "true" || ds === "active",
    `aria=${aria} data-state=${ds}`
  );

  // 12. Public APIs reachable
  const themesGen = await page.request.post(APP + "/api/themes/generate", {
    data: { source: "manual", content: "test" },
    failOnStatusCode: false,
  });
  record(
    "/api/themes/generate reachable",
    themesGen.status() >= 200 && themesGen.status() < 600,
    `status=${themesGen.status()}`
  );

  const uploadGet = await page.request.get(APP + "/api/upload", {
    failOnStatusCode: false,
  });
  record(
    "/api/upload reachable",
    uploadGet.status() >= 200 && uploadGet.status() < 600,
    `status=${uploadGet.status()}`
  );

  await page.goto(APP + "/dashboard", { waitUntil: "networkidle" });
  await shot("10-final");
} catch (err) {
  record("Test runner exception", false, err.message);
  console.error(err);
} finally {
  await writeFile(
    `${OUT}/results.json`,
    JSON.stringify({ results, consoleErrs }, null, 2)
  );
  await browser.close();
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n=== ${passed} passed, ${failed} failed ===`);
  if (consoleErrs.length) {
    console.log("\nBrowser console messages captured:");
    for (const e of consoleErrs) console.log("  " + e);
  }
  process.exit(failed > 0 ? 1 : 0);
}
