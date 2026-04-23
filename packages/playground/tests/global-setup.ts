import type { FullConfig } from "@playwright/test";
import { hasAuthState, performLogin } from "./helpers/auth";

export default async function globalSetup(config: FullConfig): Promise<void> {
	if (hasAuthState()) {
		return;
	}

	const baseURL =
		config.projects[0]?.use?.baseURL ?? process.env.PLAYGROUND_BASE_URL;

	if (!baseURL) {
		throw new Error(
			"baseURL is not configured; set PLAYGROUND_BASE_URL or configure use.baseURL.",
		);
	}

	console.log(
		"\nNo saved Playground session found. Logging in to create one...\n" +
			"(Tip: set PLAYGROUND_USER / PLAYGROUND_PASS to skip the interactive prompt.)\n",
	);

	await performLogin({ baseURL, headless: true });

	console.log("Login successful — session saved to tests/.auth/user.json\n");
}
