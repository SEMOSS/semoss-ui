import commonjs from "@rollup/plugin-commonjs";
import image from "@rollup/plugin-image";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";

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
    input: "src/index.ts",
    output: {
        file: "dist/index.umd.js",
        format: "umd",
        name: "SemossRenderer",
        sourcemap: isProduction,
        // Disable code splitting for UMD
        inlineDynamicImports: true,
        globals: {
            react: "React",
            "react-dom": "ReactDOM",
            mobx: "mobx",
            "mobx-react-lite": "mobxReactLite",
            "@emotion/react": "emotionReact",
            "@emotion/styled": "emotionStyled",
            "@mui/material": "muiMaterial",
            "@mui/icons-material": "muiIconsMaterial",
            "react-router-dom": "reactRouterDom",
            "@mui/x-data-grid": "muiXDataGrid",
            "@mui/x-date-pickers": "muiXDatePickers",
            "dayjs": "dayjs",
            "mermaid": "mermaid",
            "@semoss/sdk": "semossSDK",
            "@semoss/ui": "semossUI",
        },
    },
    plugins: [
        stripUseClient(),
        resolve({
            browser: true,
            preferBuiltins: false,
        }),
        commonjs(),
        image(),
        json(),
        typescript({
            tsconfig: "./tsconfig.json",
            declaration: false, // Disable declaration generation for UMD
            declarationDir: undefined,
        }),
        isProduction && terser(),
    ],
    external: [
        "@emotion/react",
        "@emotion/styled",
        "@mui/icons-material",
        "@mui/material",
        "@mui/x-data-grid",
        "@mui/x-date-pickers",
        /@semoss\/sdk/,
        "@semoss/ui",
        "mobx",
        "mobx-react-lite",
        "react",
        "react-dom",
        "react-router-dom",
        "dayjs",
        "mermaid",
    ],
    // Additional options to prevent code splitting
    preserveEntrySignatures: false,
});