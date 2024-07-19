/* eslint-disable @typescript-eslint/no-var-requires */
const { resolve } = require("@rollup/plugin-node-resolve");
const { commonjs } = require("@rollup/plugin-commonjs");
const { typescript } = require("@rollup/plugin-typescript");
const { bundleSize } = require("rollup-plugin-bundle-size");
const { postcss } = require("rollup-plugin-postcss");
const { del } = require("rollup-plugin-delete");

const { packageJson } = require("./package.json");

const config = [
    // Outputs separate declarations files and builds
    {
        input: "src/index.ts",
        output: [
            {
                file: packageJson.main,
                format: "cjs",
                sourcemap: true,
            },
            {
                file: packageJson.module,
                format: "esm",
                sourcemap: true,
            },
        ],
        plugins: [
            del({ targets: "dist" }),
            resolve(),
            commonjs(),
            typescript({ tsconfig: "./tsconfig.json" }),
            postcss(),
            bundleSize(),
        ],
        external: ["react", "react-dom"],
    },
];

module.exports = config;
