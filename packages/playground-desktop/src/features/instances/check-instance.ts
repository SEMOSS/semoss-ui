import { invokeCommand, isTauriRuntime } from "../../platform/tauri";

/**
 * Whether a SEMOSS instance answers at an address: its `/api/config` reads
 * as JSON. In the desktop app the Rust side reads it (no cookies, no CORS);
 * in a browser, the page does.
 *
 * @param moduleUrl - The instance's module address.
 * @throws Error saying why the instance did not answer.
 */
export const checkInstance = async (moduleUrl: string): Promise<void> => {
	if (isTauriRuntime()) {
		await invokeCommand("check_instance", { moduleUrl: moduleUrl });
		return;
	}
	const response = await fetch(`${moduleUrl}/api/config`, {
		credentials: "include",
	});
	if (!response.ok) {
		throw new Error(`The server answered ${response.status}.`);
	}
	await response.json();
};
