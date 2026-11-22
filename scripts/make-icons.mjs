// Renders the brand app icon (public/brand/closet-scout-app-icon.svg) to the PNG sizes
// iPhone and Android need. Uses the preinstalled Playwright Chromium.
import { createRequire } from "node:module";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Playwright is not a project dependency: use the copy installed on the machine.
const { chromium } = createRequire(import.meta.url)("playwright");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svg = readFileSync(join(root, "public/brand/closet-scout-app-icon.svg"), "utf8");
const out = join(root, "public/icons");
mkdirSync(out, { recursive: true });

const targets = [
  { name: "icon-1024.png", size: 1024, pad: 0 },
  { name: "icon-512.png", size: 512, pad: 0 },
  { name: "icon-192.png", size: 192, pad: 0 },
  { name: "apple-touch-icon.png", size: 180, pad: 0 },
  // Maskable: the mark inside the 80% safe zone, the blue ground filling the square.
  { name: "icon-maskable-512.png", size: 512, pad: 0.1 },
];

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const t of targets) {
  const inner = Math.round(t.size * (1 - 2 * t.pad));
  const offset = Math.round(t.size * t.pad);
  await page.setViewportSize({ width: t.size, height: t.size });
  await page.setContent(`<html><body style="margin:0;background:#2459C2;width:${t.size}px;height:${t.size}px;overflow:hidden">
    <div style="position:absolute;left:${offset}px;top:${offset}px;width:${inner}px;height:${inner}px">${svg.replace(/width="1024" height="1024"/, `width="${inner}" height="${inner}"`)}</div></body></html>`);
  await page.screenshot({ path: join(out, t.name), omitBackground: false });
  console.log("wrote", t.name);
}
await browser.close();
