import { mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const sourceSvgPath = join(root, "build", "icon-source.svg");
const outputPngPath = join(root, "build", "icon.png");

const svg = await readFile(sourceSvgPath);
await mkdir(dirname(outputPngPath), { recursive: true });

// electron-builder derives .icns (mac) and .ico (win) from a single
// 1024x1024 PNG placed at build/icon.png — no separate per-platform assets
// needed.
await sharp(svg, { density: 384 }).resize(1024, 1024).png().toFile(outputPngPath);

console.log(`Wrote ${outputPngPath}`);
