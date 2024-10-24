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
// packageJson from "./package.json";

const config = [
    // Outputs separate declarations files and builds
    {
        input: "src/index.ts",
        output: [
            {
                file: "dist/index.js",
                format: "cjs",
                sourcemap: true,
            },
            {
                file: "dist/index.esm.js",
                format: "esm",
                sourcemap: true,
            },
        ],
        plugins: [
            del({ targets: "dist" }),
            resolve(),
            commonjs(),
            typescript({ tsconfig: "tsconfig.json" }),
            postcss(),
            bundleSize(),
        ],
        external: ["react", "react-dom"],
    },
];

export default config;
