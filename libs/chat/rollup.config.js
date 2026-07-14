import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";
import del from "rollup-plugin-delete";

const isProduction = process.env.NODE_ENV === "production";

// Plugin to strip 'use client' directives
const stripUseClient = () => ({
	name: "strip-use-client",
	transform(code, id) {
		if (id.includes("node_modules") && code.includes("'use client'")) {
			return {
				code: code.replace(/'use client';\s*/g, ""),
				map: null,
			};
		}
		return null;
	},
});

export default defineConfig({
	input: {
		index: "src/index.ts",
		components: "src/components/index.ts",
	},
	output: {
		dir: "dist",
		format: "esm",
		sourcemap: isProduction,
		entryFileNames: "[name].mjs",
	},
	plugins: [
		del({ targets: "dist" }),
		stripUseClient(),
		resolve(),
		commonjs(),
		json(),
		typescript({
			tsconfig: "./tsconfig.json",
		}),
		isProduction && terser(),
	],
	// @semoss/sdk, @semoss/ui, and @semoss/shared stay external (peer deps,
	// not bundled): useInsight() reads a React Context, which only works
	// if the host app's InsightProvider and this package resolve to the
	// exact same @semoss/sdk module instance (EngineSelect, reused from
	// @semoss/shared, also calls useInsight() internally via
	// useIteratorPixel). @semoss/ui/@semoss/shared are external too so
	// their CSS/components aren't duplicated against whatever copy the
	// host app already loads.
	external: [
		"react",
		"react-dom",
		"@semoss/sdk",
		"@semoss/sdk/react",
		"@semoss/ui",
		"@semoss/ui/next",
		"@semoss/shared",
	],
	watch: {
		clearScreen: false,
	},
	onwarn(warning, warn) {
		if (warning.code === "MODULE_LEVEL_DIRECTIVE") {
			return; // Ignore the warning
		}
		warn(warning); // Otherwise, call the default warn handler
	},
});
