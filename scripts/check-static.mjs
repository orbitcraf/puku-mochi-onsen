import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = await readFile(path.join(root, "index.html"), "utf8");
const css = await readFile(path.join(root, "styles.css"), "utf8");
const app = await readFile(path.join(root, "app.js"), "utf8");
const pageCount = (html.match(/<article\b[^>]*\bclass="[^"]*\bbook-page\b[^"]*"/g) || []).length;
if (pageCount !== 11) throw new Error(`Expected 11 book pages, found ${pageCount}`);

const imagePaths = [...html.matchAll(/<(?:img|source)\b[^>]*?\b(?:src|srcset)="([^"]+)"/g)]
  .flatMap((match) => match[1].split(",").map((entry) => entry.trim().split(/\s+/)[0]))
  .filter((src) => src.startsWith("assets/"));
for (const src of new Set(imagePaths)) {
  if (!existsSync(path.join(root, src))) throw new Error(`Missing image: ${src}`);
}

const assets = await readdir(path.join(root, "assets"));
const storyImages = assets.filter((name) => name.startsWith("onsen-") && name.endsWith(".webp"));
if (storyImages.length !== 11) throw new Error(`Expected 11 onsen illustrations, found ${storyImages.length}`);
if (!html.includes("おもいでを みる") || !html.includes("さいしょから ↻")) throw new Error("Ending controls are missing");
if (!html.includes("data-memory-page") || !app.includes("pointerup")) throw new Error("Memory cards or swipe navigation are missing");
if (/\b(?:AudioContext|HTMLAudioElement|\.play\(\))\b/i.test(html + css + app)) throw new Error("Audio feature detected");
if (/@keyframes|animation\s*:/i.test(css)) throw new Error("Decorative animation detected");
if (/(?:href|src)=["'](?:https?:\/\/|file:\/\/)|127\.0\.0\.1|localhost/i.test(html + css + app)) throw new Error("External or local-only URL detected in site files");

console.log(`Static check passed: ${pageCount} pages, ${storyImages.length} illustrations, ${new Set(imagePaths).size} referenced images.`);
