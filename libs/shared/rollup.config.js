import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";
import del from "rollup-plugin-delete";
import postcss from "rollup-plugin-postcss";

const isProduction = process.env.NODE_ENV === "production";

export default defineConfig({
	input: {
		index: "src/index.ts",
		api: "src/api/index.ts",
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
		postcss({
			extract: true,
			minimize: false,
			modules: false,
		}),
		typescript({
			tsconfig: "./tsconfig.json",
			declaration: true,
			declarationDir: "./dist/types",
		}),
		isProduction && terser(),
	],
	external: [
		"react",
		"react-dom",
		"@semoss/sdk",
		"@semoss/ui",
		"@semoss/i18n",
		"monaco-editor",
		"@monaco-editor/react",
		/node_modules\/.*worker\.js/,
	],
	watch: {
		clearScreen: false,
	},
});
