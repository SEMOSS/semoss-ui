/**
 * After `vite build --config vite.config.portal.ts`, this script inlines all
 * JS and CSS assets into a single self-contained index.html so that
 * portalGenerator.ts can import it with `?raw` and embed it directly in the
 * published portal zip.
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, 'dist');

let html = readFileSync(join(distDir, 'index.html'), 'utf-8');

// Inline stylesheet links
html = html.replace(
    /<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*\/?>/g,
    (_, href) => {
        const filePath = join(distDir, href.replace(/^\.\//, ''));
        const css = readFileSync(filePath, 'utf-8');
        return `<style>${css}</style>`;
    },
);

// Inline module script tags
html = html.replace(
    /<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g,
    (_, src) => {
        const filePath = join(distDir, src.replace(/^\.\//, ''));
        const js = readFileSync(filePath, 'utf-8');
        return `<script type="module">${js}</script>`;
    },
);

// Remove modulepreload hints (no longer needed after inlining)
html = html.replace(/<link rel="modulepreload"[^>]*\/?>/g, '');

writeFileSync(join(distDir, 'index.html'), html, 'utf-8');
console.log('✓ Portal HTML inlined →', join(distDir, 'index.html'));
