import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const DEFAULT_BASE_URL =
	"http://localhost:9090/SemossWeb/packages/playground/dist/";

export const AUTH_STATE_PATH = path.resolve(__dirname, ".auth/user.json");

export default defineConfig({
	testDir: "./workflows",
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: 1,
	timeout: 60_000,
	expect: { timeout: 10_000 },
	reporter: [["list"], ["html", { open: "never" }]],

	globalSetup: require.resolve("./global-setup.ts"),

	use: {
		baseURL: process.env.PLAYGROUND_BASE_URL || DEFAULT_BASE_URL,
		storageState: AUTH_STATE_PATH,
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
		video: "retain-on-failure",
		actionTimeout: 15_000,
		navigationTimeout: 20_000,
	},

	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
});
