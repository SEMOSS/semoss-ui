import type { DesktopBridge } from "../../electron/preload";

declare global {
	interface Window {
		semossDesktop: DesktopBridge;
	}
}
