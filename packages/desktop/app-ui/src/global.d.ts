import type {
	ConnectionRecord,
	NewConnectionInput,
} from "../../electron/connections/types";

export interface DesktopBridge {
	connections: {
		list(): Promise<ConnectionRecord[]>;
		getCurrentId(): Promise<string | null>;
		add(input: NewConnectionInput): Promise<ConnectionRecord>;
		remove(id: string): Promise<void>;
		select(id: string): Promise<void>;
	};
}

declare global {
	interface Window {
		semossDesktop: DesktopBridge;
	}
}
