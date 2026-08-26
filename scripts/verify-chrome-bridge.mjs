#!/usr/bin/env node
/**
 * Chrome bridge smoke verification for Ticket #29 (Part C support).
 *
 * Launches desktop Chrome (falls back to bundled Chromium) with the unpacked
 * extension from dist-extension/, discovers its runtime extension ID, starts
 * the approved localhost:5173 dev server with that ID, and verifies the real
 * external-messaging handshake end-to-end. Saves screenshots as evidence.
 *
 * Usage: node scripts/verify-chrome-bridge.mjs [--headed=false]
 */
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const extPath = path.join(root, "dist-extension");
const outDir = path.join(root, "test-results", "acceptance");
const headless = process.argv.includes("--headed=false") || process.env.HEADLESS === "1";
mkdirSync(outDir, { recursive: true });

function log(message) {
  console.log(`[chrome-verify] ${message}`);
}

async function waitForServer(url, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Dev server did not become reachable at ${url}`);
}

async function launchBrowserContext(userDataDir, { withExtension }) {
  const options = {
    channel: "chromium",
    headless,
    viewport: null,
    timeout: 30_000,
  };
  if (withExtension) {
    options.args = [`--disable-extensions-except=${extPath}`, `--load-extension=${extPath}`];
  }
  // Prefer bundled Chromium (verified working with MV3 extensions here);
  // fall back to installed Google Chrome.
  let context;
  try {
    context = await chromium.launchPersistentContext(userDataDir, options);
    log(`launched browser for ${path.basename(userDataDir)} (bundled Chromium)`);
    return context;
  } catch {
    log("bundled Chromium unavailable, trying installed Google Chrome…");
    return chromium.launchPersistentContext(userDataDir, {
      ...options,
      channel: "chrome",
    });
  }
}

async function getExtensionId(context) {
  const [worker] = context.serviceWorkers();
  if (worker?.url().startsWith("chrome-extension://")) {
    return new URL(worker.url()).host;
  }

  const extensionsPage = await context.newPage();
  try {
    await extensionsPage.goto("chrome://extensions/", { waitUntil: "domcontentloaded" });
    const extension = extensionsPage
      .locator("extensions-item")
      .filter({ hasText: "Deep Work Course Guard" });
    await extension.waitFor({ timeout: 5_000 });
    const extensionId = await extension.getAttribute("id");
    if (extensionId && /^[a-p]{32}$/.test(extensionId)) return extensionId;
  } finally {
    await extensionsPage.close();
  }

  // MV3 workers can idle out; wait as a final fallback after checking the
  // browser's loaded-extension registry.
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    const [worker] = context.serviceWorkers();
    if (worker?.url().startsWith("chrome-extension://")) {
      return new URL(worker.url()).host;
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  const waitedWorker = await context.waitForEvent("serviceworker", { timeout: 20_000 });
  return new URL(waitedWorker.url()).host;
}

function startViteDev(extensionId) {
  const child = spawn("npx", ["vite", "--host", "127.0.0.1", "--port", "5173", "--strictPort"], {
    cwd: root,
    env: { ...process.env, VITE_COURSE_GUARD_EXTENSION_ID: extensionId },
    stdio: "ignore",
  });
  return child;
}

const results = [];
function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  log(`${ok ? "PASS" : "FAIL"} — ${name}${detail ? ` (${detail})` : ""}`);
}

const viteProcesses = [];
try {
  // ---- Scenario 1: extension loaded → live handshake connects -------------
  log("launching Chrome with the unpacked Course Guard extension…");
  const dirWithExt = mkdtempSync(path.join(tmpdir(), "dw-ext-on-"));
  const context = await launchBrowserContext(dirWithExt, { withExtension: true });
  const extensionId = await getExtensionId(context);
  record("Unpacked extension loaded, runtime ID discovered", Boolean(extensionId), extensionId);

  const popup = await context.newPage();
  const popupErrors = [];
  popup.on("pageerror", (error) => popupErrors.push(error.message));
  popup.on("console", (entry) => {
    if (entry.type() === "error") popupErrors.push(entry.text());
  });
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.getByRole("button", { name: "Start guard" }).waitFor();
  const startedAtMs = Date.now() - 60_000;
  await popup.evaluate(
    async ({ startedAtMs }) => {
      await chrome.storage.local.set({
        guardState: {
          courseOrigin: "https://learn.example.com",
          courseUrl: "https://learn.example.com/lesson",
          interruptionCount: 0,
          latestInCourseTabId: 1,
          latestInCourseUrl: "https://learn.example.com/lesson",
          lastSession: null,
          phase: "watching",
          returnCount: 0,
          sessionId: `guard-${startedAtMs}`,
          sessionStartedAtMs: startedAtMs,
        },
      });
    },
    { startedAtMs },
  );
  await popup.evaluate(() => {
    const toggle = document.querySelector("#toggle");
    if (!(toggle instanceof HTMLButtonElement)) {
      throw new Error("Generated popup is missing its toggle button.");
    }
    toggle.dataset.action = "stop";
    toggle.dataset.active = "true";
    toggle.textContent = "Stop guard";
  });
  await popup.getByRole("button", { name: "Stop guard" }).click();
  await popup.getByRole("button", { name: "Start guard" }).waitFor();
  const guardState = await popup.evaluate(async () => {
    const stored = await chrome.storage.local.get("guardState");
    return stored.guardState;
  });
  const popupStopped =
    guardState?.phase === "idle" && guardState.lastSession?.completionStatus === "completed";
  record(
    "Generated popup: Stop guard persists a completed idle session",
    popupStopped,
    popupStopped ? "" : JSON.stringify(guardState),
  );
  record("Generated popup has no browser page errors", popupErrors.length === 0, popupErrors.join(" | "));
  await popup.screenshot({ path: path.join(outDir, "00-popup-stopped.png"), fullPage: true });

  log(`starting approved dev server with VITE_COURSE_GUARD_EXTENSION_ID=${extensionId}…`);
  const vite = startViteDev(extensionId);
  viteProcesses.push(vite);
  await waitForServer("http://127.0.0.1:5173");

  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (entry) => {
    if (entry.type() === "error") pageErrors.push(entry.text());
  });
  await page.goto("http://localhost:5173/#/town-hall", { waitUntil: "domcontentloaded" });

  // The authoritative handshake: app must flip to connected on its own.
  try {
    await page.getByText("Extension connected").first().waitFor({ timeout: 25_000 });
  } catch {
    await page.screenshot({
      path: path.join(outDir, "debug-handshake-timeout.png"),
      fullPage: true,
    });
    const bodyText = await page.locator("body").innerText();
    throw new Error(
      `Handshake did not connect. Page errors: ${JSON.stringify(pageErrors)}. Body text: ${bodyText.slice(0, 600)}`,
    );
  }
  record("Bridge handshake: Town Hall reached 'Extension connected' via real extension", true);
  await page.screenshot({ path: path.join(outDir, "01-townhall-connected.png"), fullPage: false });

  await page.goto("http://localhost:5173/#/plaza", { waitUntil: "domcontentloaded" });
  // Connected + idle phase renders the "Ready" status pill.
  await page.locator(".plaza-status-pill", { hasText: "Ready" }).waitFor({ timeout: 15_000 });
  record("Plaza status pill shows Ready (connected, idle)", true);
  await page.screenshot({ path: path.join(outDir, "02-plaza-connected.png") });
  await context.close();

  // ---- Scenario 2: no extension → honest disconnected state ---------------
  log("launching a clean Chrome profile WITHOUT the extension…");
  const dirNoExt = mkdtempSync(path.join(tmpdir(), "dw-ext-off-"));
  const bareContext = await launchBrowserContext(dirNoExt, { withExtension: false });
  const barePage = await bareContext.newPage();

  // Reuse the already-running dev server; the ID env stays set, which mirrors a
  // production misinstall (app built with an ID the visitor has not installed).
  await barePage.goto("http://localhost:5173/#/town-hall", { waitUntil: "domcontentloaded" });
  await barePage.getByText(/isn't reachable right now/i).waitFor({ timeout: 25_000 });
  record("Without extension: Town Hall shows honest disconnected recovery copy", true);
  await barePage.screenshot({ path: path.join(outDir, "03-townhall-disconnected.png") });

  await barePage.goto("http://localhost:5173/#/course-guard", { waitUntil: "domcontentloaded" });
  const startButton = barePage.getByRole("button", { name: /start course guard/i });
  const disabled = (await startButton.count()) > 0 ? await startButton.isDisabled() : null;
  record(
    "Without extension: Course Guard start disabled or absent (no false active state)",
    disabled !== false,
    disabled === null ? "control not rendered" : "disabled",
  );
  await bareContext.close();

  // ---- Summary -------------------------------------------------------------
  const failed = results.filter((entry) => !entry.ok);
  console.log("\n=== Chrome bridge smoke summary ===");
  for (const entry of results) {
    console.log(
      `${entry.ok ? "✅" : "❌"} ${entry.name}${entry.detail ? ` — ${entry.detail}` : ""}`,
    );
  }
  console.log(`\nEvidence screenshots: ${outDir}`);
  if (failed.length > 0) process.exitCode = 1;
} finally {
  for (const child of viteProcesses) child.kill("SIGTERM");
}
