import type {
	ConnectionRecord,
	NewKeysConnectionInput,
} from "../../electron/connections/types";

export interface DesktopBridge {
	connections: {
		list(): Promise<ConnectionRecord[]>;
		getCurrentId(): Promise<string | null>;
		add(input: NewKeysConnectionInput): Promise<ConnectionRecord>;
		remove(id: string): Promise<void>;
		select(id: string): Promise<void>;
		beginBrowserLogin(input: {
			alias: string;
			instanceUrl: string;
			modulePath: string;
		}): Promise<string>;
		completeBrowserLogin(loginId: string): Promise<ConnectionRecord>;
		cancelBrowserLogin(loginId: string): Promise<void>;
	};
}

declare global {
	interface Window {
		semossDesktop: DesktopBridge;
	}
}
