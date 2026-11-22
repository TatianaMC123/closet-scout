// End-to-end check on an iPhone-sized screen. Claude is mocked: no key or money is used.
// Run after `npm run build`: it serves dist/ with `vite preview` and clicks through the app.
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";

const { chromium, devices } = createRequire(import.meta.url)("playwright");
const PORT = 4179;
const BASE = `http://localhost:${PORT}/`;
const SHOTS = process.env.SHOTS_DIR || "screenshots";
mkdirSync(SHOTS, { recursive: true });

const server = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], { stdio: "ignore" });
let page;
const fail = async (msg) => {
  console.error("FAIL:", msg);
  try { await page?.screenshot({ path: `${SHOTS}/failure.png` }); } catch {}
  server.kill();
  process.exit(1);
};
process.on("unhandledRejection", (e) => fail(e?.message ?? String(e)));
const ok = (msg) => console.log("ok -", msg);

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(BASE)).ok) return; } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  fail("preview server did not start");
}

let alertCalls = 0;
function answerFor(prompt) {
  if (prompt.includes("Work out the sizes")) return {
    tops: "S (EU 36)", dresses: "S / EU 36", trousers: "EU 36", jeans: "W27 L32", shoes: "EU 38", otherSystems: "UK 8 / US 4 / FR 38 / IT 40",
    measurementsToAsk: ["Armpit to armpit: 47–50 cm", "Waist flat: 35–37 cm"], basedOn: "Height, weight and waist", notes: "Jackets: size up if you want an oversized fit.",
  };
  if (prompt.includes("Write 12 tailored searches")) return { searches: [
    { title: "Waxed field jacket", query: "barbour chaqueta encerada", brand: "Barbour", group: "clothing", maxPrice: 60, why: "Lasts for years.", sizeTip: "UK 10 ≈ S" },
    { title: "Pink wool cardigan", query: "cárdigan lana rosa", brand: "", group: "clothing", maxPrice: 25, why: "Goes with your jeans.", sizeTip: "S" },
  ] };
  if (prompt.includes("Choose the 5–10 Vinted searches")) {
    alertCalls++;
    return alertCalls === 1
      ? { alerts: [
          { title: "Camel wool jumper", query: "jersey lana camel", group: "clothing", maxPrice: 30, why: "A winter base." },
          { title: "Straight jeans", query: "vaqueros rectos", group: "trousers", maxPrice: 25, why: "Everyday." },
        ] }
      : { alerts: [
          { title: "Camel wool jumper", query: "jersey lana camel", group: "clothing", maxPrice: 30, why: "A winter base." },
          { title: "Trench coat", query: "gabardina trench", group: "clothing", maxPrice: 45, why: "For spring." },
        ] };
  }
  if (prompt.includes("Check a second-hand listing")) return {
    title: "Barbour Beadnell", verdict: "buy", fitScore: 8, styleScore: 9, fit: "UK 10 is your S.", style: "Your barn-jacket look.",
    price: "Fair.", goesWith: ["straight jeans"], watchOut: ["Rewax soon"], askSeller: ["¿Me podrías decir la medida de axila a axila?"],
  };
  return {};
}

await waitForServer();
const browser = await chromium.launch();
const context = await browser.newContext({ ...devices["iPhone 13"], deviceScaleFactor: 2, serviceWorkers: "allow" });
page = await context.newPage();
const stored = () => page.evaluate(() => new Promise((resolve) => {
  const r = indexedDB.open("keyval-store");
  r.onupgradeneeded = () => { r.transaction.abort(); resolve("no db yet"); };
  r.onsuccess = () => {
    const tx = r.result.transaction("keyval", "readonly").objectStore("keyval").get("closet-scout:profile");
    tx.onsuccess = () => { const k = r.result.transaction("keyval").objectStore("keyval").getAllKeys(); k.onsuccess = () => resolve({ keys: k.result, profile: tx.result ? { onboarded: tx.result.onboarded, searches: tx.result.searches?.length } : null }); };
    tx.onerror = () => resolve("read error");
  };
  r.onerror = () => resolve("open error");
}));

const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "warning" || m.type() === "error") console.log("browser:", m.text().slice(0, 300)); });

await context.route("https://api.anthropic.com/**", async (route) => {
  const req = route.request();
  if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" } });
  const cors = { "access-control-allow-origin": "*", "content-type": "application/json" };
  if (req.url().includes("/v1/models")) return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ data: [{ id: "claude-opus-5-5", type: "model" }], has_more: false, first_id: null, last_id: null }) });
  const body = JSON.parse(req.postData() || "{}");
  const text = body.messages?.[0]?.content?.find?.((c) => c.type === "text")?.text ?? "";
  if (body.fallbacks !== "default") fail("refusal fallback not requested");
  return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({
    id: "msg_test", type: "message", role: "assistant", model: body.model,
    content: [{ type: "text", text: JSON.stringify(answerFor(text)) }],
    stop_reason: "end_turn", stop_sequence: null, usage: { input_tokens: 10, output_tokens: 10 },
  }) });
});

const t = (s) => page.getByText(s, { exact: false }).first();

// 1. Onboarding
await page.goto(BASE);
await t("Your size, your style, second-hand.").waitFor();
await page.screenshot({ path: `${SHOTS}/1-onboarding.png` });
ok("onboarding shows");
await page.getByLabel("Anthropic key").fill("sk-ant-test-key");
await page.getByRole("button", { name: "Start" }).click();
await page.getByRole("heading", { name: "Your measurements" }).waitFor();
ok("key tested and saved, Fit screen open");

// 2. Fit + size guide
await page.getByLabel("Height (cm)").fill("168");
await page.getByLabel("Weight (kg)").fill("60");
await page.getByLabel("Waist (cm)").fill("70");
await page.getByRole("button", { name: "Work out my sizes" }).click();
await t("W27 L32").waitFor();
await page.getByRole("heading", { name: "Your size cheat-sheet" }).scrollIntoViewIfNeeded();
await page.screenshot({ path: `${SHOTS}/2-fit.png` });
ok("size cheat-sheet shows");

// 3. Size calibration in Settings
await page.goto(BASE + "#settings");
const cal = page.getByLabel("Clothing (tops, jackets, dresses)");
await cal.fill("https://www.vinted.es/catalog?catalog[]=1904&size_ids[]=3&search_text=x");
await cal.press("Enter");
await t("Saved filters").waitFor();
ok("size filters saved");

// 4. Find
await page.goto(BASE + "#find");
await page.getByRole("button", { name: "Make my searches" }).click();
await t("Waxed field jacket").waitFor();
const href = await page.getByRole("link", { name: "Open on Vinted ↗" }).first().getAttribute("href");
const u = new URL(href);
if (u.hostname !== "www.vinted.es" || u.searchParams.get("order") !== "newest_first" || u.searchParams.get("price_to") !== "60" || !u.searchParams.getAll("size_ids[]").includes("3")) fail("search link wrong: " + href);
await page.screenshot({ path: `${SHOTS}/3-find.png` });
ok("search cards link to Vinted with price, sort and size filters");

// 5. Fresh finds + diff
await page.goto(BASE + "#fresh");
await page.getByRole("button", { name: "Choose my alert searches" }).click();
await t("Camel wool jumper").waitFor();
await page.getByRole("button", { name: "I saved it" }).first().click();
await t("1 of 2 saved in Vinted.").waitFor();
await page.getByRole("button", { name: "Update my alert searches" }).click();
await t("Suggested changes").waitFor();
await t("Trench coat").waitFor();
await page.getByRole("button", { name: "Apply changes" }).click();
await t("1 of 2 saved in Vinted.").waitFor();
if (await page.getByText("Straight jeans").count()) fail("removed alert still listed");
await page.screenshot({ path: `${SHOTS}/4-fresh.png` });
ok("alerts: saved tick, add/remove diff, apply keeps the saved tick");

// 6. Check a listing
await page.goto(BASE + "#check");
await page.getByLabel("Listing text (optional)").fill("Barbour Beadnell, UK 10, 45 €, axila a axila 52 cm");
await page.getByRole("button", { name: "Check this listing" }).click();
await t("Buy it").waitFor();
await page.getByRole("button", { name: "Add to shortlist" }).click();
await page.getByRole("listitem").filter({ hasText: "Barbour Beadnell" }).first().waitFor();
ok("listing verdict and shortlist");

// 7. Spanish
await page.goto(BASE + "#settings");
await page.getByLabel("Language / Idioma").selectOption("es");
await page.getByRole("link", { name: "Talla" }).waitFor();
await page.getByLabel("Language / Idioma").selectOption("en");
ok("language switch");

// 8. Profile survives a reload; app opens offline
await page.goto(BASE + "#find");
await page.evaluate(() => navigator.serviceWorker.ready);
await page.reload();
await t("Waxed field jacket").waitFor({ timeout: 8000 }).catch(async () => {
  console.log("stored after reload:", JSON.stringify(await stored()));
  console.log((await page.locator("body").innerText()).slice(0, 200));
  await fail("profile lost after reload");
});
await context.setOffline(true);
await page.reload();
await t("Waxed field jacket").waitFor();
await context.setOffline(false);
ok("profile kept after reload, app opens offline");

if (errors.length) fail("page errors: " + errors.join(" | "));
await browser.close();
server.kill();
console.log("all checks passed");
