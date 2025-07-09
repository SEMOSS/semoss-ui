import { defineConfig } from "rollup";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import image from "@rollup/plugin-image";
import json from '@rollup/plugin-json';

import packageJson from "./package.json" with { type: "json" };

import del from "rollup-plugin-delete";

const isProduction = process.env.NODE_ENV === "production";

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
        resolve(),
        commonjs(),
        image(),
        json(),
        typescript({
            tsconfig: "./tsconfig.json",
        }),
        isProduction && terser(),
    ],
    external: [...Object.keys(packageJson.peerDependencies)],
    watch: {
        clearScreen: false,
    },
});
