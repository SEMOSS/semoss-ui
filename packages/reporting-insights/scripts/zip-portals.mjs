/**
 * Zips the built `portals/` folder into `portals.zip` for upload to SEMOSS.
 *
 * The archive contains a top-level `portals/` directory (portals/index.html,
 * portals/assets/…) — the same layout SEMOSS expects when importing an app — and
 * avoids the macOS `__MACOSX` resource-fork entries that the `zip` CLI adds.
 *
 * Run automatically at the end of `pnpm build`.
 */
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import JSZip from 'jszip';

const ROOT = 'portals';
const OUT = 'portals.zip';

if (!existsSync(ROOT)) {
    console.error(`✗ "${ROOT}/" not found — run the build first.`);
    process.exit(1);
}

const zip = new JSZip();

function walk(dir, folder) {
    for (const name of readdirSync(dir).sort()) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) walk(full, folder.folder(name));
        else folder.file(name, readFileSync(full));
    }
}

walk(ROOT, zip.folder(ROOT));

const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
});
writeFileSync(OUT, buffer);
console.log(`✓ ${OUT} ready for SEMOSS upload (${(buffer.length / 1024).toFixed(0)} KB)`);
