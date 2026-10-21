import { mergeConfig } from "vite";
import { globSync } from "node:fs";
import { createViteLibConfig } from "@semoss/config";

/**
 * Entry points: the public root (`src/index.ts`) plus one entry per backend
 * resource file under `src/routes/**`, which mirrors the full URL. Each
 * resource becomes its own subpath export
 * (`@semoss/monolith/api/auth/admin/project`), so consumers only ship what
 * they import.
 */
const entry: Record<string, string> = { index: "src/index.ts" };
for (const file of globSync("src/routes/**/*.ts", {
	cwd: import.meta.dirname,
})) {
	entry[file.replace(/^src\//, "").replace(/\.ts$/, "")] = file;
}

const base = createViteLibConfig({
	rootDir: import.meta.dirname,
	entry,
	external: [],
	enableReact: false,
});

export default (env: Parameters<typeof base>[0]) =>
	mergeConfig(base(env), {
		build: {
			rolldownOptions: {
				output: {
					// One output file per source file, so the shared transport is
					// emitted once instead of being duplicated into every entry.
					preserveModules: true,
					preserveModulesRoot: "src",
					entryFileNames: "[name].mjs",
				},
			},
		},
	});
