import commonjs from "@rollup/plugin-commonjs";
import image from "@rollup/plugin-image";
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
		image(),
		json(),
		typescript({
			tsconfig: "./tsconfig.json",
		}),
		isProduction && terser(),
	],
	external: [
		"@emotion/react",
		"@emotion/styled",
		"@mui/icons-material",
		"@mui/material",
		/@semoss\/sdk/,
		"@semoss/ui",
		"@semoss/shared",
		"@semoss/shared/monaco",
		"@semoss/shared/auditlog",
		"@semoss/shared/form",
		"mobx",
		"mobx-react-lite",
		"react",
		"react-dom",
		"react-router-dom",
	],
	watch: {
		clearScreen: false,
	},
});
