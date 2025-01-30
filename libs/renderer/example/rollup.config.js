import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";
import serve from "rollup-plugin-serve";
import livereload from "rollup-plugin-livereload";
import babel from "@rollup/plugin-babel";
import json from "@rollup/plugin-json";
import path from "path";
// import { terser } from "rollup-plugin-terser";
// import { terser } from "rollup-plugin-terser";
//
export default {
    input: "example/src/main.tsx",
    output: [
        {
            file: "example/bundle.js",
            format: "cjs",
            sourcemap: true,
            // plugins: [terser()],
            inlineDynamicImports: true,
        },
        {
            file: "example/bundle.esm.js",
            format: "esm",
            sourcemap: true,
            // plugins: [terser()],
            inlineDynamicImports: true,
        },
    ],
    plugins: [
        resolve({
            extensions: [".js", ".jsx", ".ts", ".tsx"],
            moduleDirectories: ["node_modules", path.resolve(__dirname, "..")],
        }),
        replace({
            "process.env.NODE_ENV": JSON.stringify("development"),
            preventAssignment: true,
        }),
        json(),

        babel({
            presets: ["@babel/preset-react", "@babel/preset-typescript"],
            babelHelpers: "bundled",
            extensions: [".js", ".jsx", ".ts", ".tsx"],
        }),
        commonjs(),
        serve({
            open: true,
            verbose: true,
            contentBase: ["example"],
            host: "localhost",
            port: 1422,
        }),
        livereload({ watch: "example" }),
    ],
    external: [/@babel\/runtime/, "../../src/index"],
    // external: ["react", "react-dom"],
};
