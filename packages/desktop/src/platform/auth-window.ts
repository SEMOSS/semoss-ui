import { moduleUrlFor } from "@/config/profiles";
import type { DesktopInstanceProfile, InstanceConfig } from "@/types";

const AUTH_WINDOW_LABEL = "semoss-auth";

const isTauriRuntime = (): boolean =>
	"__TAURI_INTERNALS__" in window || "__TAURI__" in window;

const wait = (milliseconds: number): Promise<void> =>
	new Promise((resolve) => window.setTimeout(resolve, milliseconds));

interface OpenAuthWindowOptions {
	profile: DesktopInstanceProfile;
	provider: string;
	readConfig: () => Promise<InstanceConfig>;
	timeoutMs?: number;
}

const waitForAuthentication = async (
	readConfig: () => Promise<InstanceConfig>,
	timeoutMs: number,
): Promise<void> => {
	const startedAt = Date.now();
	while (Date.now() - startedAt < timeoutMs) {
		const config = await readConfig();
		if (Object.keys(config.logins || {}).length > 0) {
			return;
		}
		await wait(1000);
	}
	throw new Error(
		"Authentication timed out. Close the login window and retry.",
	);
};

export const openAuthWindow = async ({
	profile,
	provider,
	readConfig,
	timeoutMs = 5 * 60 * 1000,
}: OpenAuthWindowOptions): Promise<void> => {
	const url = `${moduleUrlFor(profile)}/api/auth/login/${encodeURIComponent(provider)}`;

	if (!isTauriRuntime()) {
		const popup = window.open(
			url,
			AUTH_WINDOW_LABEL,
			"popup=yes,width=480,height=680",
		);
		if (!popup) {
			throw new Error("The authentication window was blocked.");
		}
		await waitForAuthentication(readConfig, timeoutMs);
		popup.close();
		return;
	}

	const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
	const existing = await WebviewWindow.getByLabel(AUTH_WINDOW_LABEL);
	if (existing) {
		await existing.close();
	}

	const authWindow = new WebviewWindow(AUTH_WINDOW_LABEL, {
		url,
		title: "Sign in to SEMOSS",
		width: 480,
		height: 680,
		center: true,
		resizable: true,
		focus: true,
	});

	await new Promise<void>((resolve, reject) => {
		authWindow.once("tauri://created", () => resolve());
		authWindow.once("tauri://error", (event) =>
			reject(new Error(String(event.payload))),
		);
	});

	try {
		await waitForAuthentication(readConfig, timeoutMs);
	} finally {
		await authWindow.close().catch(() => undefined);
	}
};
