/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

import packageJson from "./package.json";

export default defineConfig({
    plugins: [react({ include: /\.(js|jsx|ts|tsx)$/ })],
    resolve: {
        alias: [{ find: "@", replacement: resolve(__dirname, "./src") }],
    },
    build: {
        lib: {
            entry: resolve(__dirname, "src/index.js"),
            name: packageJson.name,
            fileName: "index",
        },
        rollupOptions: {
            external: [...Object.keys(packageJson.peerDependencies)],
        },
    },
    // test: {
    //     name: "renderer",
    //     watch: false,
    //     globals: true,
    //     environment: "jsdom",
    //     include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    //     deps: {
    //         // Required for vitest-canvas-mock
    //         inline: ["vitest-canvas-mock"],
    //     },
    //     reporters: ["default"],
    //     coverage: {
    //         provider: "v8",
    //         reportsDirectory: "../../coverage/packages/renderer",
    //     },
    //     environmentOptions: {
    //         jsdom: {
    //             resources: "usable",
    //         },
    //     },
    //     cache: {
    //         dir: "../../node_modules/.vitest",
    //     },
    //     setupFiles: ["./vitest.setup.ts"],
    // },
});
