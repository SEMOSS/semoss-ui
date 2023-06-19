import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import alias from "@rollup/plugin-alias";

import bundleSize from "rollup-plugin-bundle-size";
import postcss from "rollup-plugin-postcss";
import dts from "rollup-plugin-dts";
import del from "rollup-plugin-delete";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require("./package.json");

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
    // Bundles into one declaration file
    {
        input: "./dist/types/index.d.ts",
        output: [{ file: "dist/index.d.ts", format: "es" }],
        external: [/\.css$/],
        plugins: [
            alias(),
            dts(),
            del({ targets: "dist/types", hook: "buildEnd" }),
        ],
    },
];

export default config;
