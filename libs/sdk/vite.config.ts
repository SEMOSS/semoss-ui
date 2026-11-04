import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createViteLibConfig } from "@semoss/config";

/**
 * One entry per generated REST module (`@semoss/sdk/api/*`), read from the
 * generator's manifest. Without generated code there are none.
 */
function generatedApiEntries(): Record<string, string> {
	const manifestPath = join(
		import.meta.dirname,
		"src",
		"generated",
		"manifest.json",
	);
	if (!existsSync(manifestPath)) {
		return {};
	}
	const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
		files: Record<string, string>;
	};
	return Object.fromEntries(
		Object.keys(manifest.files)
			.filter((file) => file.startsWith("api/"))
			.map((file) => {
				const name = `generated/${file.replace(/\.ts$/, "")}`;
				return [name, `src/${name}.ts`];
			}),
	);
}

export default createViteLibConfig({
	rootDir: import.meta.dirname,
	entry: {
		index: "src/index.ts",
		"js-frameworks/react/index": "src/js-frameworks/react/index.ts",
		...generatedApiEntries(),
	},
	external: ["react", /^react\//],
});
