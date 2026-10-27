import { globSync } from "node:fs";
import { resolve } from "node:path";
import { createViteLibConfig } from "@semoss/config";

const apiRoot = resolve(import.meta.dirname, "src/api");
const groups = ["health"];

export default createViteLibConfig({
	rootDir: import.meta.dirname,
	entry: {
		index: "src/index.ts",
		"js-frameworks/react/index": "src/js-frameworks/react/index.ts",
		"api/index": "src/lib/api.ts",
		...Object.fromEntries(
			groups.flatMap((group) =>
				globSync(`${group}/**/*.ts`, { cwd: apiRoot })
					.filter((file) => !/\.(?:spec|test)\.ts$/.test(file))
					.sort()
					.map((file) => {
						const resource = file
							.replaceAll("\\", "/")
							.replace(/\.ts$/, "");
						const entry =
							resource === `${group}/${group}` ? group : resource;
						return [`api/${entry}`, resolve(apiRoot, file)];
					}),
			),
		),
	},
	external: ["react", /^react\//],
});
