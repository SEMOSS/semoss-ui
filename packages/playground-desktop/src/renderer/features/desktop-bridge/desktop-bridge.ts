import type { DesktopBridge } from "../../../contract/ipc-contract";

declare global {
	interface Window {
		/** The preload's bridge to the main process. */
		semossDesktop?: DesktopBridge;
	}
}

/**
 * The preload's bridge. The renderer only runs inside the app's window, so a
 * missing bridge is a bug, not a state to handle.
 *
 * @returns The bridge.
 * @throws Error outside the app's window.
 */
export const getDesktopBridge = (): DesktopBridge => {
	const bridge = window.semossDesktop;
	if (!bridge) {
		throw new Error(
			"The desktop renderer must run inside its Electron window",
		);
	}
	return bridge;
};
