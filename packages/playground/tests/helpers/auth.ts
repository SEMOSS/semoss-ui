/**
 * Auth helpers for the playground E2E suite.
 *
 * Two login modes are supported:
 *   - Scripted (`performLogin`): reads credentials from env vars or a TTY
 *     prompt and types them into the native login form headlessly. Used by
 *     `global-setup.ts` and by the standalone login script under `--scripted`.
 *   - Manual  (`performManualLogin`): opens a real Chromium window and waits
 *     for the user to finish logging in by hand — necessary for SSO/MFA.
 *     This is the default mode of the standalone login script.
 *
 * Both modes persist the browser session to `AUTH_STATE_PATH` on success so
 * subsequent Playwright runs can skip login entirely.
 */
import { chromium } from "@playwright/test";
import prompts from "prompts";
import fs from "node:fs";
import path from "node:path";
import { AUTH_STATE_PATH } from "../playwright.config";

export interface Credentials {
	username: string;
	password: string;
}

/**
 * Returns playground credentials for the scripted login path. Prefers
 * `PLAYGROUND_USER` / `PLAYGROUND_PASS` env vars (for CI). Falls back to an
 * interactive terminal prompt. Throws if neither source is available.
 */
export async function getCredentials(): Promise<Credentials> {
	if (process.env.PLAYGROUND_USER && process.env.PLAYGROUND_PASS) {
		return {
			username: process.env.PLAYGROUND_USER,
			password: process.env.PLAYGROUND_PASS,
		};
	}

	if (!process.stdin.isTTY) {
		throw new Error(
			"No credentials available and no TTY for interactive prompt. " +
				"Set PLAYGROUND_USER and PLAYGROUND_PASS env vars, or run `pnpm run login -- --scripted` from an interactive shell first.",
		);
	}

	const response = await prompts(
		[
			{
				type: "text",
				name: "username",
				message: "Playground username:",
				validate: (v: string) => v.length > 0 || "Required",
			},
			{
				type: "password",
				name: "password",
				message: "Playground password:",
				validate: (v: string) => v.length > 0 || "Required",
			},
		],
		{
			onCancel: () => {
				throw new Error("Login cancelled");
			},
		},
	);

	return response as Credentials;
}

export function hasAuthState(): boolean {
	if (!fs.existsSync(AUTH_STATE_PATH)) return false;
	try {
		const raw = fs.readFileSync(AUTH_STATE_PATH, "utf-8");
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed.cookies) && parsed.cookies.length > 0;
	} catch {
		return false;
	}
}

export function clearAuthState(): void {
	if (fs.existsSync(AUTH_STATE_PATH)) {
		fs.unlinkSync(AUTH_STATE_PATH);
	}
}

/**
 * Scripted login: launches Chromium (headless by default), navigates to
 * `#/login`, types the given or resolved credentials into the native
 * username/password form, waits for the app to load, and writes the storage
 * state to `AUTH_STATE_PATH`.
 *
 * Pass `headless: false` to watch the flow in a real window. Pass explicit
 * `credentials` to skip env-var / TTY resolution entirely (used in tests).
 *
 * Callers:
 *   - `global-setup.ts` — triggers this when no saved session exists.
 *   - `scripts/login.ts` — when the user passes `--scripted`.
 *
 * Only works against native username+password login forms. For SSO / MFA,
 * use `performManualLogin` instead.
 */
export async function performLogin(opts: {
	baseURL: string;
	headless?: boolean;
	credentials?: Credentials;
}): Promise<void> {
	const creds = opts.credentials ?? (await getCredentials());

	fs.mkdirSync(path.dirname(AUTH_STATE_PATH), { recursive: true });

	const browser = await chromium.launch({ headless: opts.headless ?? true });
	const context = await browser.newContext();
	const page = await context.newPage();

	try {
		await page.goto(new URL("#/login", opts.baseURL).toString(), {
			waitUntil: "domcontentloaded",
		});

		await page.getByPlaceholder("Username").fill(creds.username);
		await page.getByPlaceholder("Password").fill(creds.password);
		await page.getByRole("button", { name: /login|sign in/i }).click();

		await page.waitForURL(/#\/(new|agent|room)/, { timeout: 20_000 });
		await page.getByText(/Welcome,/i).waitFor({ timeout: 20_000 });

		await context.storageState({ path: AUTH_STATE_PATH });
	} finally {
		await context.close();
		await browser.close();
	}
}

const SUCCESS_URL_REGEX = /#\/(new|agent|room)/;
const DEFAULT_MANUAL_TIMEOUT_MS = 5 * 60_000;

function resolveManualTimeout(explicit?: number): number {
	if (typeof explicit === "number" && explicit > 0) return explicit;
	const raw = process.env.PLAYGROUND_LOGIN_TIMEOUT_MS;
	if (raw) {
		const parsed = Number(raw);
		if (Number.isFinite(parsed) && parsed > 0) return parsed;
	}
	return DEFAULT_MANUAL_TIMEOUT_MS;
}

/**
 * Manual login: opens a real (always headful) Chromium window against
 * `baseURL`, then waits for the human to sign in by hand — which makes SSO,
 * MFA, and tenant-specific flows possible without scripting them.
 *
 * Behavior:
 *   - If `baseURL` already lands on a signed-in route (URL matches
 *     `#/(new|agent|room)`), skips the wait and writes state immediately —
 *     i.e. a still-valid session refreshes instantly.
 *   - Otherwise races three outcomes:
 *       1. Success: URL matches `#/(new|agent|room)` AND a `Welcome,` text
 *          node is visible (both must hold).
 *       2. The user closes the tab → rejects "login window was closed".
 *       3. The browser disconnects → same rejection.
 *   - After success, waits up to 2s for network idle so any post-login token
 *     refresh can settle before `storageState` is captured. The wait is
 *     best-effort; tenants with long-poll endpoints never reach networkidle
 *     and the timeout is swallowed.
 *
 * Timeout: defaults to 5 minutes. Override per-call via `timeoutMs`, or
 * globally via the `PLAYGROUND_LOGIN_TIMEOUT_MS` env var (milliseconds).
 *
 * This is the default mode for `scripts/login.ts` (`pnpm run login`).
 */
export async function performManualLogin(opts: {
	baseURL: string;
	timeoutMs?: number;
}): Promise<void> {
	const timeout = resolveManualTimeout(opts.timeoutMs);

	fs.mkdirSync(path.dirname(AUTH_STATE_PATH), { recursive: true });

	const browser = await chromium.launch({ headless: false });
	const context = await browser.newContext();
	const page = await context.newPage();

	try {
		await page.goto(opts.baseURL, { waitUntil: "domcontentloaded" });

		if (!SUCCESS_URL_REGEX.test(page.url())) {
			const success = Promise.all([
				page.waitForURL(SUCCESS_URL_REGEX, { timeout }),
				page.getByText(/Welcome,/i).waitFor({ timeout }),
			]);

			const closed = new Promise<never>((_, reject) => {
				page.on("close", () =>
					reject(
						new Error("login window was closed before completion"),
					),
				);
				browser.on("disconnected", () =>
					reject(
						new Error("login window was closed before completion"),
					),
				);
			});

			await Promise.race([success, closed]);
		}

		// swallow: some tenants never hit networkidle due to background polling
		await page
			.waitForLoadState("networkidle", { timeout: 2000 })
			.catch(() => {});

		await context.storageState({ path: AUTH_STATE_PATH });
	} finally {
		await context.close();
		await browser.close();
	}
}
