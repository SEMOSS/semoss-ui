import type { MCPToolRequest } from "./types";

/**
 * Reads the `semoss-env` tag the platform injects into a published portal's
 * index.html, which carries the app id and the backend module path:
 *
 * ```html
 * <script id="semoss-env" type="application/json">{"APP": "<id>","MODULE": "/Monolith"}</script>
 * ```
 *
 * Every way this comes up empty is a normal state, not an error: there is no
 * document when running server-side, no tag during development (the app supplies
 * MODULE and APP through `.env`), and no tag in a portal that has not been
 * published yet. So this reports only what it found and never throws.
 *
 * Only non-empty strings are returned. A tag carrying half the payload must not
 * blank out a value that `.env` or an earlier `Env.update()` already supplied --
 * an empty `MODULE` sends every request to the page origin instead of the
 * backend.
 */
const readDocumentEnv = (): Partial<{ APP: string; MODULE: string }> => {
	if (typeof document === "undefined") {
		return {};
	}

	const raw = document.getElementById("semoss-env")?.textContent?.trim();
	if (!raw) {
		return {};
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		console.warn(
			"Ignoring the semoss-env tag: contents are not valid JSON",
		);
		return {};
	}

	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
		console.warn("Ignoring the semoss-env tag: expected a JSON object");
		return {};
	}

	const source = parsed as Record<string, unknown>;
	const env: Partial<{ APP: string; MODULE: string }> = {};
	if (typeof source.APP === "string" && source.APP.trim()) {
		env.APP = source.APP.trim();
	}
	if (typeof source.MODULE === "string" && source.MODULE.trim()) {
		env.MODULE = source.MODULE.trim();
	}
	return env;
};

/**
 * Singleton object holding environment information
 */
const envStore: {
	APP: string;
	MODULE: string;
	ACCESS_KEY: string;
	SECRET_KEY: string;
	BEARER_TOKEN: string;
	BEARER_PROVIDER: string;
	CSRF: boolean;
	REDIRECT_URL: string;
	TOOL: MCPToolRequest | null;
} = {
	APP: "",
	MODULE: "",
	ACCESS_KEY: "",
	SECRET_KEY: "",
	BEARER_TOKEN: "",
	BEARER_PROVIDER: "",
	CSRF: false,
	REDIRECT_URL: "",
	TOOL: null,
};

export const Env = {
	/**
	 * Get the APP ID
	 */
	get APP() {
		return envStore.APP;
	},

	/**
	 * Module for the backend
	 */
	get MODULE() {
		return envStore.MODULE;
	},

	/**
	 * Access key to authenticate with. Should only be set in development mode
	 */
	get ACCESS_KEY() {
		return envStore.ACCESS_KEY;
	},

	/**
	 * Secret key to authenticate with. Should only be set in development mode
	 */
	get SECRET_KEY() {
		return envStore.SECRET_KEY;
	},

	/**
	 * Bearer token passed from embed host
	 */
	get BEARER_TOKEN() {
		return envStore.BEARER_TOKEN;
	},

	/**
	 * Bearer provider passed from embed host
	 */
	get BEARER_PROVIDER() {
		return envStore.BEARER_PROVIDER;
	},

	/**
	 * CSRF token for the current session
	 */
	get CSRF() {
		return envStore.CSRF;
	},

	/**
	 * Host-configured URL to redirect to on an auth redirect, overriding the response's own value
	 */
	get REDIRECT_URL() {
		return envStore.REDIRECT_URL;
	},

	/**
	 * Current tool information
	 */
	get TOOL() {
		return envStore.TOOL;
	},

	/**
	 * Update the environment variables
	 * @param updated - updated variables
	 */
	update(updated: Partial<typeof envStore>) {
		Object.assign(envStore, updated);
	},

	/**
	 * Apply whatever the page's `semoss-env` tag supplies, leaving every value it
	 * does not carry untouched.
	 *
	 * <p>
	 * Runs once when this module is first loaded, so a published portal is
	 * configured by the act of importing the SDK. That matters because an app that
	 * never constructs an `Insight` would otherwise leave `MODULE` empty, and every
	 * request would go to the page origin rather than the backend -- a 404 with no
	 * hint as to why. `Insight.initialize()` calls it again, which costs nothing and
	 * picks up a tag injected after load.
	 *
	 * <p>
	 * Development is unaffected. This runs at import, before an app's own module
	 * body executes, so an explicit `Env.update({ MODULE })` from `.env` still wins.
	 */
	refreshFromDocument() {
		this.update(readDocumentEnv());
	},
};

// Configure from the page as soon as the SDK is loaded. See refreshFromDocument.
Env.refreshFromDocument();
