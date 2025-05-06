import { defineConfig } from "rollup";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";

import postcss from "rollup-plugin-postcss";
import del from "rollup-plugin-delete";
import { terser } from "rollup-plugin-terser";

export default defineConfig({
    input: {
        index: "src/index.ts",
        "js-frameworks/react/index": "src/js-frameworks/react/index.ts",
    },
    output: {
        dir: "dist",
        format: "esm",
        sourcemap: true,
        plugins: [terser()],
        entryFileNames: "[name].mjs",
    },
    plugins: [
        del({ targets: "dist" }),
        resolve(),
        commonjs(),
        typescript({
            tsconfig: "./tsconfig.json",
            outputToFilesystem: true,
        }),
        postcss(),
    ],
    external: ["react"],
});
