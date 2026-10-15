import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { esmExternalRequirePlugin } from "rolldown/plugins";
import dts from "unplugin-dts/vite";
import {
	type Alias,
	type ConfigEnv,
	type DepOptimizationOptions,
	type LibraryOptions,
	loadEnv,
	mergeConfig,
	type PluginOption,
	type UserConfig,
} from "vite";
import svgr from "vite-plugin-svgr";
import type { ViteUserConfig } from "vitest/config";
import { basename, resolve } from "node:path";

interface SharedProxyOptions {
	/** Proxy websocket upgrades in addition to HTTP. */
	ws?: boolean;
	/** Module prefix to use when `env.MODULE` is unset (e.g. `/Monolith`). */
	fallbackModule?: string;
	/** Backend origin to use when `env.ENDPOINT` is unset. */
	fallbackEndpoint?: string;
}

/** Vitest defaults shared by every app/lib; per-package options are merged over these. */
const SHARED_TEST_DEFAULTS: NonNullable<ViteUserConfig["test"]> = {
	globals: true,
	environment: "jsdom",
	reporters: ["default"],
	pool: "vmForks",
	testTimeout: 10000,
	hookTimeout: 10000,
	coverage: {
		enabled: false,
		provider: "v8",
		reporter: ["text"],
		reportOnFailure: true,
		exclude: ["**/node_modules", "**/dist"],
	},
};

/**
 * Builds a Vite (and optionally Vitest) config from the shared SEMOSS defaults,
 * layering the per-package `options` on top. Returns the function form so each
 * package resolves its own env for the active `mode`.
 */
export function createViteConfig(options: {
	/** Absolute path to the consuming package root. Pass `import.meta.dirname`. */
	rootDir: string;
	/** Dev-server port. When omitted, no dev server is configured. */
	port?: number;
	/** Include `@vitejs/plugin-react`. Defaults to `true`. */
	enableReact?: boolean;
	/** Include `@tailwindcss/vite`. Defaults to `true`. */
	enableTailwind?: boolean;
	/** Include `vite-plugin-svgr`. Defaults to `false`. */
	enableSvgr?: boolean;
	/** Extra resolve aliases, applied before the built-in `@` -> `<rootDir>/src`. */
	alias?: Alias[];
	/** Build-time `define` values, computed from the loaded env. */
	define?: (
		env: Record<string, string>,
		isProduction: boolean,
	) => Record<string, string | undefined>;
	/** Assign modules to named chunks (e.g. `localeManualChunks`). */
	manualChunks?: (id: string) => string | undefined;
	/** Dev-server proxy configuration for the backend module. */
	proxy?: SharedProxyOptions;
	/** Dependency pre-bundling options. */
	optimizeDeps?: DepOptimizationOptions;
	/** Vitest config, merged over the shared test defaults. */
	test?: ViteUserConfig["test"];
}): (env: ConfigEnv) => ViteUserConfig {
	const {
		rootDir,
		port,
		enableReact = true,
		enableTailwind = true,
		enableSvgr = false,
		alias = [],
		define,
		manualChunks,
		proxy,
		optimizeDeps,
		test,
	} = options;

	return ({ mode }) => {
		const env = loadEnv(mode, process.cwd(), "");
		const isProduction = mode === "production";

		const plugins: PluginOption[] = [];
		if (enableTailwind) {
			plugins.push(tailwindcss());
		}
		if (enableSvgr) {
			plugins.push(svgr());
		}
		if (enableReact) {
			plugins.push(react({ include: /\.(js|jsx|ts|tsx)$/ }));
		}

		const aliases: Alias[] = [
			...alias,
			{ find: "@", replacement: resolve(rootDir, "./src") },
		];

		const build: UserConfig["build"] = { minify: isProduction };
		if (manualChunks) {
			build.rolldownOptions = {
				output: {
					codeSplitting: {
						groups: [
							{ name: (id: string) => manualChunks(id) ?? null },
						],
					},
				},
			};
		}

		const config: ViteUserConfig = {
			base: "./",
			plugins,
			resolve: { alias: aliases },
			define: {
				"import.meta.env.MODULE": JSON.stringify(env.MODULE),
				...define?.(env, isProduction),
			},
			build,
		};

		if (optimizeDeps) {
			config.optimizeDeps = optimizeDeps;
		}

		if (port !== undefined) {
			const module = env.MODULE || proxy?.fallbackModule;
			const endpoint = env.ENDPOINT || proxy?.fallbackEndpoint;

			config.server = {
				port: port,
				strictPort: true,
			};

			if (module && endpoint) {
				config.server.proxy = {
					[module]: {
						target: endpoint,
						changeOrigin: true,
						secure: false,
						preserveHeaderKeyCase: true,
						...(proxy?.ws ? { ws: true } : {}),
					},
				};
			}
		}

		// Vitest is standard for every package; name defaults to the folder.
		config.test = mergeConfig(
			{ ...SHARED_TEST_DEFAULTS, name: basename(rootDir) },
			test ?? {},
		);

		return config;
	};
}

/**
 * Builds a Vite library-mode config (multi-entry ESM + optional extracted CSS +
 * `.d.ts` via unplugin-dts) from the shared SEMOSS defaults. Returns the function
 * form so each package resolves `mode` for production minify/sourcemaps.
 */
export function createViteLibConfig(options: {
	/** Absolute path to the consuming package root. Pass `import.meta.dirname`. */
	rootDir: string;
	/** Named entry points, e.g. `{ index: "src/index.ts" }`. Keys become file names. */
	entry: Record<string, string>;
	/** Deps left unbundled (peer/runtime deps, workspace packages). */
	external: (string | RegExp)[];
	/** Include `@vitejs/plugin-react`. Defaults to `true`. */
	enableReact?: boolean;
	/** Include `@tailwindcss/vite`. Defaults to `false`. */
	enableTailwind?: boolean;
	/** Base name for the extracted CSS file (e.g. `"index"` -> `dist/index.css`). */
	cssFileName?: string;
	/** Emit `.d.ts` to `dist/types` via unplugin-dts. Defaults to `true`. */
	enableDts?: boolean;
	/** tsconfig used for declaration emit. Defaults to `"tsconfig.json"`. */
	tsconfigPath?: string;
}): (env: ConfigEnv) => ViteUserConfig {
	const {
		rootDir,
		entry,
		external,
		enableReact = true,
		enableTailwind = false,
		cssFileName,
		enableDts = true,
		tsconfigPath = "tsconfig.json",
	} = options;

	return ({ mode }) => {
		const isProduction = mode === "production";

		// Owns externals + rewrites bundled CJS `require("react")` to an ESM import (browser has no require).
		const plugins: PluginOption[] = [
			esmExternalRequirePlugin({ external }),
		];

		if (enableTailwind) {
			plugins.push(tailwindcss());
		}
		if (enableReact) {
			plugins.push(react({ include: /\.(js|jsx|ts|tsx)$/ }));
		}
		if (enableDts) {
			plugins.push(
				dts({ tsconfigPath, outDirs: "dist/types", entryRoot: "src" }),
			);
		}

		const lib: LibraryOptions = {
			entry,
			formats: ["es"],
			fileName: (_format, entryName) => `${entryName}.mjs`,
		};

		if (cssFileName) {
			lib.cssFileName = cssFileName;
		}

		return {
			base: "./",
			plugins,
			resolve: {
				alias: [{ find: "@", replacement: resolve(rootDir, "./src") }],
			},
			build: {
				lib,
				outDir: "dist",
				emptyOutDir: true,
				sourcemap: isProduction,
				minify: isProduction,
			},
		};
	};
}
