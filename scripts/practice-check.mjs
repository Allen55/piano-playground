// Browser check for /practice/: run `npm run dev`, then `node scripts/practice-check.mjs` (Windows + Chrome).
import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", headless: true, args: ["--no-sandbox"] });
const errors = [];
const stage = ".pg-stage:not([hidden])";
const score = page => page.evaluate(s => Object.fromEntries([...document.querySelectorAll(`${s} [data-score]`)].map(b => [b.dataset.score, Number(b.textContent)])), stage);
const marks = page => page.evaluate(s => [...document.querySelectorAll(`${s} [data-mark]`)].map(k => `${k.dataset.midi}:${k.dataset.mark}`).sort(), stage);

async function open(page, notes, intervals) {
  await page.goto(`${BASE}/practice/`, { waitUntil: "networkidle" });
  await page.evaluate(([n, i]) => {
    if (n) localStorage.setItem("practice-note-filters", JSON.stringify(n)); else localStorage.removeItem("practice-note-filters");
    if (i) localStorage.setItem("practice-interval-filters", JSON.stringify(i)); else localStorage.removeItem("practice-interval-filters");
  }, [notes, intervals]);
  await page.reload({ waitUntil: "networkidle" });
}
const NOTES = { treble: true, bass: true, position: "both", outside: "include", range: "full", low: "E4", high: "F3", key: "c" };

try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 950 } });
  page.on("pageerror", e => errors.push(e.message));

  // Middle C in both clefs lights the same C4 key; letters ignore octave, keys don't.
  await open(page, { ...NOTES, range: "between", low: "C4", high: "C4" });
  const clefs = new Set();
  for (let i = 0; i < 4; i++) {
    clefs.add(await page.locator(`${stage} .pg-paper svg`).getAttribute("aria-label").then(l => l.split(" ")[0]));
    await page.locator(`${stage} .gp-overview [data-midi="72"]`).click();
    assert.deepEqual(await marks(page), ["60:correct", "72:wrong"]);
    await page.keyboard.press("Enter");
  }
  assert.deepEqual([...clefs].sort(), ["Bass", "Treble"]);
  await page.keyboard.press("c");
  assert.equal((await score(page)).correct, 1);
  assert.deepEqual(await marks(page), ["60:correct"]);

  // Pass → Reveal → Next keeps score and streak; wrong resets the streak.
  await page.keyboard.press("Enter");
  await page.keyboard.press("c");
  await page.keyboard.press("Enter");
  assert.deepEqual(await score(page), { correct: 2, answered: 6, streak: 2, passes: 0 });
  await page.keyboard.press("p");
  assert.match(await page.locator(`${stage} .pg-result`).textContent(), /Passed\. It is C4/);
  assert.deepEqual(await score(page), { correct: 2, answered: 6, streak: 2, passes: 1 });
  assert.equal(await page.locator(`${stage} .pg-next`).count(), 1);
  await page.keyboard.press("Enter");
  assert.equal(await page.locator(`${stage} .pg-result`).count(), 0);
  await page.getByRole("button", { name: "Reset score" }).first().click();
  assert.deepEqual(await score(page), { correct: 0, answered: 0, streak: 0, passes: 0 });

  // G major: F♯ choice, graded by spelling; key is F♯5.
  await open(page, { ...NOTES, bass: false, outside: "off", range: "between", low: "F5", high: "G5", key: "g" });
  assert.ok((await page.locator(`${stage} .pg-choice`).allTextContents()).includes("F♯"));
  await page.keyboard.press("f");
  assert.match(await page.locator(`${stage} .pg-result`).textContent(), /Correct\. It is F♯5, on the 5th \(top\) line/);
  assert.deepEqual(await marks(page), ["78:correct"]);

  // Conflicting filters explain themselves and stay editable.
  await open(page, { ...NOTES, bass: false, outside: "off", range: "atMost", high: "F3" });
  assert.match(await page.locator(`${stage} .pg-empty`).textContent(), /Clef: treble.*at or below F3/s);
  await page.getByRole("button", { name: "✓ Treble" }).click();
  await page.getByRole("button", { name: "Bass", exact: true }).click();
  assert.equal(await page.locator(`${stage} .pg-empty`).count(), 0);

  // Study mode lights the key before answering.
  await page.getByRole("button", { name: "Study" }).click();
  assert.equal((await marks(page)).filter(m => m.endsWith(":study")).length, 1);
  await page.getByRole("button", { name: "Quiz" }).click();

  // 88 keys from A0 to C8.
  const ends = await page.evaluate(s => { const k = [...document.querySelectorAll(`${s} .gp-overview [data-midi]`)].map(e => +e.dataset.midi); return [k.length, Math.min(...k), Math.max(...k)]; }, stage);
  assert.deepEqual(ends, [88, 21, 108]);
  await page.screenshot({ path: join(tmpdir(), "practice-desktop.png") });

  // Intervals: Identify full name, Build with spelling, Ear.
  await open(page, null, { exercise: "build", treble: true, bass: true, up: true, down: true, together: false, sizes: [3, 4, 5, 10], qualities: ["M", "m", "P", "A", "d"], answer: "full", spelling: true });
  await page.getByRole("tab", { name: "Intervals" }).click();
  for (let i = 0; i < 5; i++) {
    const start = Number(await page.locator(`${stage} [data-mark="start"]`).first().getAttribute("data-midi"));
    const prompt = await page.locator(`${stage} .pg-prompt`).textContent();
    const m = /(major|minor|perfect|augmented|diminished) (\w+) (above|below)/.exec(prompt);
    const semis = { major: { "3rd": 4, "10th": 16 }, minor: { "3rd": 3, "10th": 15 }, perfect: { "4th": 5, "5th": 7 }, augmented: { "3rd": 5, "4th": 6, "5th": 8, "10th": 17 }, diminished: { "3rd": 2, "4th": 4, "5th": 6, "10th": 14 } }[m[1]][m[2]];
    const target = start + (m[3] === "above" ? semis : -semis);
    await page.locator(`${stage} .gp-overview [data-midi="${target}"]`).click();
    const spellings = await page.locator(`${stage} .pg-spelling .pg-choice`).allTextContents();
    assert.ok(spellings.length >= 2, prompt);
    await page.locator(`${stage} .pg-spelling .pg-choice`).first().click();
    assert.match(await page.locator(`${stage} .pg-result`).textContent(), /Counting letter names/);
    await page.keyboard.press("Enter");
  }
  await page.getByRole("button", { name: "Ear training" }).click();
  await page.getByRole("button", { name: "Tritone" }).click();
  assert.equal(await page.locator(`${stage} .pg-paper g[data-pitch]`).count(), 0);
  await page.getByRole("button", { name: "Show staff & keyboard" }).click();
  assert.equal(await page.locator(`${stage} .pg-paper g[data-pitch]`).count(), 2);
  assert.equal((await marks(page)).length >= 2, true);

  // Phone: piano below the staff, zoomed strip with tappable keys, no sideways scroll.
  const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  phone.on("pageerror", e => errors.push(e.message));
  await open(phone, NOTES);
  const geo = await phone.evaluate(s => {
    const staff = document.querySelector(`${s} .pg-staff-card`).getBoundingClientRect();
    const piano = document.querySelector(`${s} .pg-piano-card`).getBoundingClientRect();
    const key = document.querySelector(`${s} .gp-zoom [data-midi="60"] rect`).getBoundingClientRect();
    return { below: piano.top >= staff.bottom, keyWidth: key.width, scroll: document.documentElement.scrollWidth, vw: innerWidth };
  }, stage);
  assert.ok(geo.below && geo.keyWidth >= 40 && geo.scroll <= geo.vw, JSON.stringify(geo));
  await phone.locator(`${stage} .gp-zoom`).evaluate(el => { el.scrollLeft = el.scrollWidth / 2 - el.clientWidth / 2; });
  const visibleKey = await phone.evaluate(s => {
    const z = document.querySelector(`${s} .gp-zoom`).getBoundingClientRect();
    return [...document.querySelectorAll(`${s} .gp-zoom [data-midi]`)].find(k => { const r = k.getBoundingClientRect(); return ![1, 3, 6, 8, 10].includes(+k.dataset.midi % 12) && r.left > z.left + 10 && r.right < z.right - 10; }).dataset.midi;
  }, stage);
  await phone.locator(`${stage} .gp-zoom [data-midi="${visibleKey}"]`).tap();
  assert.equal(await phone.locator(`${stage} .pg-result`).count(), 1);
  await phone.screenshot({ path: join(tmpdir(), "practice-mobile.png"), fullPage: true });

  assert.deepEqual(errors, []);
  console.log("Practice checks passed.", geo);
} finally { await browser.close(); }
