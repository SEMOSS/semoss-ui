import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import image from "@rollup/plugin-image";
import url from "@rollup/plugin-url";

import bundleSize from "rollup-plugin-bundle-size";
import postcss from "rollup-plugin-postcss";
import del from "rollup-plugin-delete";
import { defineConfig } from "rollup";
import { terser } from "rollup-plugin-terser";
import json from "@rollup/plugin-json";

import packageJson from "./package.json";
import builtins from "rollup-plugin-node-builtins";
import babel from "@rollup/plugin-babel";

export default defineConfig({
    input: "src/index.ts",
    output: [
        {
            file: packageJson.main,
            format: "cjs",
            sourcemap: true,
            plugins: [terser()],
            inlineDynamicImports: true,
        },
        {
            file: packageJson.module,
            format: "esm",
            sourcemap: true,
            plugins: [terser()],
            inlineDynamicImports: true,
        },
    ],
    plugins: [
        del({ targets: "dist" }),
        typescript({
            tsconfig: "./tsconfig.json",
            outputToFilesystem: true,
        }),
        json(),
        resolve({ browser: true, preferBuiltins: true }),
        commonjs(),
        // builtins(),
        babel({
            exclude: "node_modules/**",
            presets: [
                [
                    "@babel/preset-env",
                    {
                        useBuiltIns: "entry",
                        corejs: 3,
                    },
                ],
            ],
        }),
        // image(),
        // url({
        //     include: ["**/*.png", "**/*.jpg", "**/*.svg"],
        //     limit: 8192,
        // }),
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
