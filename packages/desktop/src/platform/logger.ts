import { invoke } from "@tauri-apps/api/core";

const write = async (
	level: "info" | "warn" | "error",
	message: string,
): Promise<void> => {
	try {
		await invoke("desktop_log", { level, message });
	} catch {
		const output = level === "error" ? console.error : console.info;
		output(`[AI Core] ${message}`);
	}
};

export const logInfo = (message: string): void => {
	void write("info", message);
};

export const logError = (message: string): void => {
	void write("error", message);
};

export const getDesktopLogPath = async (): Promise<string> => {
	try {
		return await invoke<string>("desktop_log_path");
	} catch {
		return "";
	}
};
