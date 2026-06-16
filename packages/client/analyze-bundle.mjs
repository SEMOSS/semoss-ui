import { readFileSync } from "fs";

const statsHtml = readFileSync("dist/stats.html", "utf8");
const indexHtml = readFileSync("dist/index.html", "utf8");

const startIdx = statsHtml.indexOf("const data = ") + "const data = ".length;
let depth = 0;
let jsonEnd = startIdx;

for (let i = startIdx; i < statsHtml.length; i++) {
    if (statsHtml[i] === "{") {
        depth++;
    } else if (statsHtml[i] === "}") {
        depth--;
        if (depth === 0) {
            jsonEnd = i + 1;
            break;
        }
    }
}

const data = JSON.parse(statsHtml.slice(startIdx, jsonEnd));
const nodeParts = data.nodeParts;
const chunkNodes = data.tree.children || [];

function getGzip(uid) {
    return nodeParts[uid]?.gzipLength || 0;
}

function sumGzip(node) {
    if (node.uid) {
        return getGzip(node.uid);
    }

    if (!node.children) {
        return 0;
    }

    return node.children.reduce((acc, child) => acc + sumGzip(child), 0);
}

function getChunkNodeByName(name) {
    return chunkNodes.find((chunk) => chunk.name === name);
}

const chunks = chunkNodes
    .map((chunk) => ({
        name: chunk.name,
        gzipKB: (sumGzip(chunk) / 1024).toFixed(1),
        children: chunk.children || [],
    }))
    .sort((a, b) => parseFloat(b.gzipKB) - parseFloat(a.gzipKB));

console.log("\n=== ALL CHUNKS BY GZIP SIZE ===");
chunks.slice(0, 20).forEach((chunk) => {
    const kb = parseFloat(chunk.gzipKB);
    if (kb > 5) {
        console.log(`${chunk.gzipKB.padStart(8)} kB  ${chunk.name}`);
    }
});

const entryMatch = indexHtml.match(
    /<script[^>]+src="\.\/(assets\/[^"]+\.js)"/,
);
const preloadMatches = [
    ...indexHtml.matchAll(/modulepreload" crossorigin href="\.\/(assets\/[^"]+\.js)"/g),
];

const entryChunkName = entryMatch?.[1] || "";
const preloadChunkNames = preloadMatches.map((match) => match[1]);
const entryChunkNode = getChunkNodeByName(entryChunkName);
const preloadChunkNodes = preloadChunkNames
    .map((name) => getChunkNodeByName(name))
    .filter(Boolean);

if (entryChunkNode) {
    const entryGzip = sumGzip(entryChunkNode) / 1024;
    const preloadGzip =
        preloadChunkNodes.reduce((acc, node) => acc + sumGzip(node), 0) / 1024;

    console.log(`\n=== ENTRY CHUNK: ${entryChunkName} (${entryGzip.toFixed(1)} kB gzip) ===`);
    console.log(`Preloaded JS total: ${preloadGzip.toFixed(1)} kB gzip`);
    console.log(
        `Initial JS (entry + preloads): ${(entryGzip + preloadGzip).toFixed(1)} kB gzip`,
    );
}

const mainChunk = entryChunkNode
    ? {
          name: entryChunkName,
          gzipKB: (sumGzip(entryChunkNode) / 1024).toFixed(1),
          children: entryChunkNode.children || [],
      }
    : chunks.find((chunk) => chunk.name.includes("index-") && parseFloat(chunk.gzipKB) > 100);

if (!mainChunk) {
    console.log("\nCould not find entry/main bundle. Showing largest chunks:");
    chunks.slice(0, 5).forEach((chunk) => console.log(chunk.gzipKB, chunk.name));
    process.exit(0);
}

console.log(`\n=== MAIN BUNDLE BREAKDOWN: ${mainChunk.name} (${mainChunk.gzipKB} kB gzip) ===`);

const pkgSizes = new Map();

function extractPkg(nodeName) {
    if (!nodeName) {
        return "unknown";
    }

    if (nodeName.startsWith("\0")) {
        return "<virtual>";
    }

    if (nodeName.includes("node_modules/.pnpm")) {
        const after = nodeName.split("node_modules/.pnpm/")[1] || "";
        const pkgId = after.split("/node_modules/")[0];

        const cleaned = pkgId
            .replace(/\+/g, "/")
            .replace(/@[0-9][^/]*/g, "")
            .replace(/_[a-z0-9]{10,}/gi, "")
            .replace(/\/+$/, "");

        const parts = cleaned.split("/");
        if (parts[0]?.startsWith("@")) {
            return parts.slice(0, 2).join("/");
        }

        return parts[0] || cleaned;
    }

    if (nodeName.includes("/src/")) {
        const srcPart = nodeName.split("/src/")[1] || "";
        const dir = srcPart.split("/")[0];
        return `src/${dir}`;
    }

    if (nodeName.includes("/libs/")) {
        const libPart = nodeName.split("/libs/")[1] || "";
        const dir = libPart.split("/")[0];
        return `libs/${dir}`;
    }

    return nodeName.split("/").slice(-2).join("/");
}

function collectByPkg(node, path) {
    if (node.uid) {
        const gzip = getGzip(node.uid);
        if (gzip > 0) {
            const pkg = extractPkg(`${path}/${node.name}`);
            pkgSizes.set(pkg, (pkgSizes.get(pkg) || 0) + gzip);
        }
        return;
    }

    if (!node.children) {
        return;
    }

    for (const child of node.children) {
        collectByPkg(child, `${path}/${child.name}`);
    }
}

for (const topNode of mainChunk.children) {
    collectByPkg(topNode, topNode.name);
}

const sorted = [...pkgSizes.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([pkg, size]) => ({ pkg, kb: (size / 1024).toFixed(1) }));

console.log("\nTop packages/dirs in main bundle (gzip kB):");
for (const { pkg, kb } of sorted.slice(0, 40)) {
    console.log(`${kb.padStart(8)} kB  ${pkg}`);
}

const total = [...pkgSizes.values()].reduce((acc, size) => acc + size, 0);
console.log(`\nTotal accounted: ${(total / 1024).toFixed(0)} kB gzip`);
