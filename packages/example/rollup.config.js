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
import babel from "@rollup/plugin-babel";
import serve from "rollup-plugin-serve"
import replace from "@rollup/plugin-replace";

import packageJson from "./package.json";
import livereload from "rollup-plugin-livereload";

export default defineConfig({
    input: "src/index.tsx",
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
        replace({
          "process.env.NODE_ENV": JSON.stringify("development"),
          preventAssignment: true,
      }),
        json(),
        resolve(),
        commonjs(),
        postcss(),
        bundleSize(),
        serve({
          open: true,
          contentBase: ['', 'dist'],
          port: 1122,
        }),
        livereload({ watch: ['dist']})
    ],
    external: [
        // "react",
        // "react-dom",
    ],
});
