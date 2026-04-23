#!/usr/bin/env tsx
/**
 * Standalone login script. Useful when you want to refresh the saved session
 * without running any tests — e.g. after a password change, or after clearing
 * the `.auth/` directory.
 *
 * Usage:
 *   pnpm login                  # interactive prompt, headless browser
 *   pnpm login --headed         # watch the login happen in a real browser
 *   PLAYGROUND_USER=... PLAYGROUND_PASS=... pnpm login
 */
import { clearAuthState, performLogin } from "../helpers/auth";

const DEFAULT_BASE_URL =
	"http://localhost:9090/SemossWeb/packages/playground/dist/";

async function main() {
	const headed = process.argv.includes("--headed");
	const baseURL = process.env.PLAYGROUND_BASE_URL || DEFAULT_BASE_URL;

	clearAuthState();

	console.log(`Logging in at ${baseURL}`);
	await performLogin({ baseURL, headless: !headed });
	console.log("Done — session saved to tests/.auth/user.json");
}

main().catch((err) => {
	console.error("\nLogin failed:", err.message);
	process.exit(1);
});
