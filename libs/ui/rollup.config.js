// const { withNx } = require("@nx/rollup/with-nx");
// const url = require("@rollup/plugin-url");
// const svg = require("@svgr/rollup");

// module.exports = withNx(
//     {
//         main: "./src/index.ts",
//         outputPath: "../../dist/libs/ui",
//         tsConfig: "./tsconfig.lib.json",
//         compiler: "babel",
//         external: ["react", "react-dom", "react/jsx-runtime"],
//         format: ["esm","cjs"],
//         // assets: [{ input: ".", output: ".", glob: "README.md" }],
//     },
//     {
//         // Provide additional rollup configuration here. See: https://rollupjs.org/configuration-options
//         plugins: [
//             svg({
//                 svgo: false,
//                 titleProp: true,
//                 ref: true,
//             }),
//             url({
//                 limit: 10000, // 10kB
//             }),
//         ],
//     },
// );

import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";

import bundleSize from "rollup-plugin-bundle-size";
import postcss from "rollup-plugin-postcss";
import del from "rollup-plugin-delete";
import { defineConfig } from "rollup";
import { terser } from "rollup-plugin-terser";

import packageJson from "./package.json";

export default defineConfig({
    input: "src/index.ts",
    output: [
        {
            file: packageJson.main,
            format: "cjs",
            sourcemap: true,
            plugins: [terser()],
        },
        {
            file: packageJson.module,
            format: "esm",
            sourcemap: true,
            plugins: [terser()],
        },
    ],
    plugins: [
        del({ targets: "dist" }),
        resolve(),
        commonjs(),
        typescript({
            tsconfig: "./tsconfig.json",
            outputToFilesystem: true,
        }),
        postcss(),
        bundleSize(),
    ],
    external: [
        "react",
        "react-dom",
        "@mui/material",
        "@mui/icons-material",
        "@emotion/react",
        "@emotion/styled",
    ],
});
