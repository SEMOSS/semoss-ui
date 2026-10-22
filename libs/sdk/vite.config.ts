import { globSync } from "node:fs";
import { relative, resolve } from "node:path";
import { createViteLibConfig } from "@semoss/config";

const monolithRoot = resolve(import.meta.dirname, "../monolith/src");
const typesRoot = resolve(import.meta.dirname, "dist/types");

export default createViteLibConfig({
	rootDir: import.meta.dirname,
	entry: {
		index: "src/index.ts",
		"js-frameworks/react/index": "src/js-frameworks/react/index.ts",
		"monolith/index": resolve(monolithRoot, "index.ts"),
		...Object.fromEntries(
			globSync("routes/**/*.ts", { cwd: monolithRoot })
				.sort()
				.map((file) => [
					`monolith/${file.replaceAll("\\", "/").replace(/\.ts$/, "")}`,
					resolve(monolithRoot, file),
				]),
		),
	},
	external: ["react", /^react\//],
	dtsOptions: {
		entryRoot: "..",
		// Compile both source trees while preserving the SDK's existing type paths.
		beforeWriteFile(filePath) {
			const outputPath = relative(typesRoot, filePath).replaceAll(
				"\\",
				"/",
			);
			if (outputPath.startsWith("sdk/src/")) {
				return {
					filePath: resolve(
						typesRoot,
						outputPath.slice("sdk/src/".length),
					),
				};
			}
			if (outputPath.startsWith("monolith/src/")) {
				return {
					filePath: resolve(
						typesRoot,
						"monolith",
						outputPath.slice("monolith/src/".length),
					),
				};
			}
		},
	},
});
