import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

export default {
	input: "src/index.ts",
	output: {
		dir: "dist",
		format: "esm",
		sourcemap: true,
		entryFileNames: "[name].mjs",
	},
	plugins: [
		resolve(),
		commonjs(),
		typescript({ tsconfig: "./tsconfig.json" }),
	],
	external: [
		"@emotion/react",
		"@emotion/styled",
		"@mui/icons-material",
		"@mui/material",
		/@semoss\/sdk/,
		"@semoss/ui",
		"mobx",
		"mobx-react-lite",
		"react",
		"react-dom",
		"react-router-dom",
		"echarts",
	],
};
