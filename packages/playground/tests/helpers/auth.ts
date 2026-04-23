import { chromium } from "@playwright/test";
import prompts from "prompts";
import fs from "node:fs";
import path from "node:path";
import { AUTH_STATE_PATH } from "../playwright.config";

export interface Credentials {
	username: string;
	password: string;
}

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
				"Set PLAYGROUND_USER and PLAYGROUND_PASS env vars, or run `pnpm login` from an interactive shell first.",
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
 * Launches a headful-by-default browser, logs in with the provided credentials,
 * and writes a storage state file that subsequent tests can reuse.
 *
 * Called from global-setup when no valid state file exists, and from the
 * standalone `pnpm login` script.
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
