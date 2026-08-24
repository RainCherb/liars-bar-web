/**
 * Визуальный обход игры: headless Chromium делает скриншоты всех экранов
 * и состояний. Запуск: node scripts/screenshots.mjs
 */
import { spawn, execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const PORT = 8321;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = "shots";
mkdirSync(OUT, { recursive: true });

const consoleErrors = [];
const layoutErrors = [];

async function waitForServer(url, timeoutMs = 45000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error("server not up");
}

/** Ждёт наш ход ИЛИ финал партии. Возвращает "turn" | "over". */
async function waitTurnOrOver(page, timeoutMs = 60000) {
  try {
    await page.waitForFunction(
      () => {
        const t = document.body.innerText;
        return (
          t.includes("Ваш ход") || t.includes("ВЫЖИЛИ") || t.includes("КОНЕЦ НОЧИ")
        );
      },
      { timeout: timeoutMs },
    );
  } catch {
    await page.screenshot({ path: `${OUT}/99-stuck-state.png` });
    throw new Error("waitTurnOrOver: timeout (см. 99-stuck-state.png)");
  }
  return page.evaluate(() => {
    const t = document.body.innerText;
    return t.includes("ВЫЖИЛИ") || t.includes("КОНЕЦ НОЧИ") ? "over" : "turn";
  });
}

async function shot(page, name) {
  await page.screenshot({ path: `${OUT}/${name}.png` });
  // Детекция горизонтального переполнения — главный признак сломанной вёрстки.
  const over = await page.evaluate(() => {
    const doc = document.documentElement;
    const w = doc.scrollWidth - doc.clientWidth;
    return w > 1 ? `${w}px` : null;
  });
  if (over) {
    const message = `HORIZONTAL OVERFLOW ${over} on ${name}`;
    layoutErrors.push(message);
    console.log(`  !! ${message}`);
  }
  console.log("shot:", name);
}

async function startGame(page) {
  await page.getByRole("button", { name: "Сесть за стол" }).click();
  await page.waitForSelector(".hand .playing-card", { timeout: 15000 });
}

execSync("npm run build", { stdio: "inherit" });

const server = spawn(
  "npx",
  ["vite", "preview", "--host", "127.0.0.1", "--port", String(PORT), "--strictPort"],
  { shell: true },
);

try {
  await waitForServer(BASE);
  const browser = await chromium.launch();

  // ---------- Desktop ----------
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => consoleErrors.push("pageerror: " + e.message));
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push("console: " + m.text());
  });

  await page.goto(BASE);
  await page.waitForTimeout(900);
  await shot(page, "01-menu");

  await page.locator(".menu__char", { hasText: "Kudo" }).click();
  await page.locator(".menu__diff button", { hasText: "Акула бара" }).click();
  await page.locator(".menu__bots button", { hasText: "дуэль" }).click();
  await page.waitForTimeout(300);
  await shot(page, "02-menu-configured");

  await page.getByRole("button", { name: "Правила" }).click();
  await page.waitForTimeout(400);
  await shot(page, "03-rules-modal");
  await page.getByRole("button", { name: "Понятно" }).click();

  // Старт дуэли
  await startGame(page);
  await page.waitForTimeout(1200);
  await shot(page, "04-game-start-duel");

  // Начинающий раунд выбирается случайно: после замедления ботов не предполагаем,
  // что первый ход обязательно уже принадлежит человеку.
  if ((await waitTurnOrOver(page)) === "over") {
    throw new Error("Партия завершилась до первого хода игрока");
  }

  // Выбор карты
  await page.locator(".hand__slot .playing-card").first().click();
  await page.waitForTimeout(350);
  await shot(page, "05-card-selected");
  await page.locator(".hand__slot .playing-card").first().click();

  // Первый обмен ходами
  await page.locator(".hand__slot .playing-card").nth(1).click();
  await page.getByRole("button", { name: /^Положить/ }).click();
  await page.waitForTimeout(1400);
  await shot(page, "06-bot-thinking");

  let over = (await waitTurnOrOver(page)) === "over";
  await shot(page, "07-my-turn-again");

  if (!over) {
    // Обвиняем бота → вскрытие → рулетка
    const danger = page.locator(".btn--danger");
    if (!(await danger.isDisabled())) {
      await danger.click();
      await page.waitForTimeout(700);
      await shot(page, "08-reveal-overlay");
      await page.waitForTimeout(1400);
      await page.waitForSelector(".overlay--roulette", { timeout: 5000 });
      await page.waitForSelector('.overlay--roulette[data-stage="spin"]', {
        timeout: 3000,
      });
      await shot(page, "09-roulette-spin");
      await page.waitForSelector('.overlay--roulette[data-stage="result"]', {
        timeout: 3000,
      });
      await shot(page, "10-roulette-result");
      await page.waitForFunction(
        () => !document.querySelector(".overlay--roulette"),
        { timeout: 9000 },
      );
      await page.waitForTimeout(500);
    }
    await shot(page, "11-after-shot-state");

    over = (await waitTurnOrOver(page)) === "over";
  }

  if (!over) {
    // Мультивыкладка
    const slots = page.locator(".hand__slot .playing-card");
    const cnt = Math.min(3, await slots.count());
    for (let i = 0; i < cnt; i++) await slots.nth(i).click();
    await page.waitForTimeout(250);
    await shot(page, "12-multi-selected");
    await page.getByRole("button", { name: /^Положить/ }).click();
    await page.waitForTimeout(1200);
    await shot(page, "13-multi-played");

    over = (await waitTurnOrOver(page)) === "over";
  }

  if (!over) {
    // Правила поверх партии (пауза)
    await page.locator('.topbar__right button[title*="Правила"]').click();
    await page.waitForTimeout(400);
    await shot(page, "15-rules-in-game-paused");
    await page.getByRole("button", { name: "Понятно" }).click();
  } else {
    await shot(page, "16-gameover");
  }
  await ctx.close();

  // ---------- Mobile portrait ----------
  const mctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const mp = await mctx.newPage();
  mp.on("pageerror", (e) => consoleErrors.push("m-pageerror: " + e.message));
  await mp.goto(BASE);
  await mp.waitForTimeout(800);
  await shot(mp, "20-menu-mobile");
  await startGame(mp);
  await mp.waitForTimeout(1100);
  await shot(mp, "21-game-mobile");
  await mp.locator(".hand__slot .playing-card").first().click();
  await mp.waitForTimeout(250);
  await shot(mp, "22-mobile-selected");
  await mp.locator(".log-toggle").click();
  await mp.waitForTimeout(300);
  await shot(mp, "23-mobile-log-open");
  await mp.locator(".log-toggle").click();

  // Пауза на мобильном
  await mp.getByRole("button", { name: "Пауза" }).click();
  await mp.waitForTimeout(350);
  await shot(mp, "25-mobile-pause");
  await mp.getByRole("button", { name: "Продолжить" }).click();
  await mp.waitForTimeout(300);

  // Ждём свой ход и пробуем вскрытие с рулеткой на мобильном
  try {
    await mp.waitForFunction(
      () => document.body.innerText.includes("Ваш ход"),
      { timeout: 45000 },
    );
    const danger = mp.locator(".btn--danger");
    if (!(await danger.isDisabled())) {
      await danger.click();
      await mp.waitForTimeout(800);
      await shot(mp, "26-mobile-reveal");
      await mp.waitForSelector(".overlay--roulette", { timeout: 5000 });
      await mp.waitForSelector('.overlay--roulette[data-stage="spin"]', {
        timeout: 3000,
      });
      await shot(mp, "27-mobile-roulette");
    }
  } catch (error) {
    consoleErrors.push(`mobile roulette: ${error instanceof Error ? error.message : String(error)}`);
  }
  await mctx.close();

  // ---------- Mobile landscape ----------
  const lctx = await browser.newContext({
    viewport: { width: 844, height: 390 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const lp = await lctx.newPage();
  await lp.goto(BASE);
  await lp.waitForTimeout(600);
  await startGame(lp);
  await lp.waitForTimeout(1000);
  await shot(lp, "24-game-mobile-landscape");
  await lctx.close();

  // ---------- Small phone (320px) + tablet ----------
  for (const [name, w, h] of [
    ["30-game-320px", 320, 568],
    ["31-game-tablet", 768, 1024],
  ]) {
    const sctx = await browser.newContext({
      viewport: { width: w, height: h },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    const sp = await sctx.newPage();
    await sp.goto(BASE);
    await sp.waitForTimeout(500);
    await shot(sp, `${name}-menu`);
    await startGame(sp);
    await sp.waitForTimeout(1000);
    await shot(sp, name);
    await sctx.close();
  }

  await browser.close();
} finally {
  try {
    execSync(`taskkill /pid ${server.pid} /T /F`);
  } catch {}
}

if (consoleErrors.length) {
  console.log("\nCONSOLE/PAGE ERRORS:");
  for (const e of consoleErrors) console.log(" -", e);
} else {
  console.log("\nNo console errors.");
}

if (layoutErrors.length || consoleErrors.length) {
  process.exitCode = 1;
}
