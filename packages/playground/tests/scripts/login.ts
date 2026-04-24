#!/usr/bin/env tsx
/**
 * Standalone login script. Useful when you want to refresh the saved session
 * without running any tests — e.g. after a password change, or after clearing
 * the `.auth/` directory.
 *
 * Usage (note: `pnpm login` without `run` hits pnpm's built-in npm-registry login —
 * always invoke this script as `pnpm run login`):
 *   pnpm run login                       # default: opens a real browser, log in by hand (SSO/MFA)
 *   pnpm run login -- --scripted         # prompt for user/pass (or use env vars), headless
 *   pnpm run login -- --scripted --headed  # scripted flow, but watch Playwright type the creds
 *   PLAYGROUND_USER=... PLAYGROUND_PASS=... pnpm run login -- --scripted
 */
import {
	clearAuthState,
	performLogin,
	performManualLogin,
} from "../helpers/auth";

const DEFAULT_BASE_URL =
	"http://localhost:9090/SemossWeb/packages/playground/dist/";

async function main() {
	const scripted = process.argv.includes("--scripted");
	const headed = process.argv.includes("--headed");
	const baseURL = process.env.PLAYGROUND_BASE_URL || DEFAULT_BASE_URL;

	clearAuthState();

	console.log(`Logging in at ${baseURL}`);

	if (scripted) {
		await performLogin({ baseURL, headless: !headed });
	} else {
		console.log(
			"A browser window will open. Log in there — I'll save your session once you're in the app.",
		);
		await performManualLogin({ baseURL });
	}

	console.log("Done — session saved to tests/.auth/user.json");
}

main().catch((err) => {
	console.error("\nLogin failed:", err.message);
	process.exit(1);
});
