import { Env, setDownloadHandler, setSignInWindowOpener } from "@semoss/sdk";
import {
	getModuleUrl,
	type InstanceProfile,
} from "../features/instances/instance.store";
import { createTauriSignInWindowOpener } from "./auth-window";
import { saveDownloadWithDialog } from "./downloads";
import { installNativeFetchBridge } from "./fetch-bridge";
import { BEARER_TOKEN_SECRET, readSecret } from "./keychain";
import { invokeCommand, isTauriRuntime } from "./tauri";

/**
 * Point the SDK at the instance in use, before the session starts: an
 * absolute `Env.MODULE` (which also points the insight websocket there), the
 * native fetch bridge, sign ins in the app's own window, downloads through
 * the save dialog, and a remembered bearer token from the keychain. The Rust
 * side is told the instance first: it refuses requests anywhere else.
 * `Config.load` turns CSRF on from the instance's own config.
 *
 * Switching instances reloads the app, so this runs once per page.
 *
 * @param instance - The instance in use.
 */
export const configureSdkHost = async (
	instance: InstanceProfile,
): Promise<void> => {
	const moduleUrl = getModuleUrl(instance);
	if (isTauriRuntime()) {
		await invokeCommand("set_active_instance", { moduleUrl: moduleUrl });
		installNativeFetchBridge(moduleUrl);
		setSignInWindowOpener(createTauriSignInWindowOpener(moduleUrl));
		setDownloadHandler(saveDownloadWithDialog);
	}
	const bearerToken = await readSecret(instance.id, BEARER_TOKEN_SECRET);
	Env.update({
		MODULE: moduleUrl,
		BEARER_TOKEN: bearerToken ?? "",
		BEARER_PROVIDER: bearerToken ? (instance.bearerProvider ?? "") : "",
	});
};
