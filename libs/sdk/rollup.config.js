import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";
import del from "rollup-plugin-delete";

const isProduction = process.env.NODE_ENV === "production";

export default defineConfig({
	input: {
		index: "src/index.ts",
		"js-frameworks/react/index": "src/js-frameworks/react/index.ts",
	},
	output: {
		dir: "dist",
		format: "esm",
		sourcemap: isProduction,
		entryFileNames: "[name].mjs",
	},
	plugins: [
		del({ targets: "dist" }),
		resolve(),
		commonjs(),
		typescript({
			tsconfig: "./tsconfig.json",
		}),
		isProduction && terser(),
	],
	external: ["react"],
	watch: {
		clearScreen: false,
	},
});
