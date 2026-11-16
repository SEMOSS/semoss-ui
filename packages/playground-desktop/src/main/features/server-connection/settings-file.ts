import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
	parseServerConfig,
	type ServerConfig,
} from "../../../contract/server-connection";

/** Where and how big the window was when it last closed. */
export interface WindowState {
	/** The left edge; none until the window has been placed. */
	readonly x?: number;
	/** The top edge; none until the window has been placed. */
	readonly y?: number;
	/** The unmaximized width. */
	readonly width: number;
	/** The unmaximized height. */
	readonly height: number;
	/** Whether it was maximized. */
	readonly isMaximized: boolean;
}

/** What the app keeps between launches, in its user data folder. */
interface DesktopSettings {
	/** The file format's version, for a future migration. */
	readonly version: 1;
	/** The server the app signs in to; null until the user picks one. */
	readonly server: ServerConfig | null;
	/** The local origin's port. Cookies and storage belong to it, so it is reused. */
	readonly port: number | null;
	/** Where the window last was; null before it first closes. */
	readonly window: WindowState | null;
}

/** The settings before anything is saved, and the fallback for a bad file. */
const DEFAULT_SETTINGS: DesktopSettings = {
	version: 1,
	server: null,
	port: null,
	window: null,
};

/** The app's saved settings, read once and written through on every change. */
export interface SettingsFile {
	/** The saved server; null until the user picks one. */
	readonly server: ServerConfig | null;
	/** The saved local port; null before the first launch. */
	readonly port: number | null;
	/** The saved window state; null before the window first closes. */
	readonly window: WindowState | null;
	/** Save the server. */
	setServer: (server: ServerConfig) => void;
	/** Save the local port. */
	setPort: (port: number) => void;
	/** Save the window state. */
	setWindow: (window: WindowState) => void;
}

/**
 * Whether a value is a usable TCP port.
 *
 * @param value - The saved value.
 * @returns True for an integer from 1 to 65535.
 */
const isPort = (value: unknown): value is number =>
	typeof value === "number" &&
	Number.isInteger(value) &&
	value > 0 &&
	value < 65536;

/**
 * Read a saved window state, held to the window's minimum size.
 *
 * @param value - The saved value.
 * @returns The state, or null when it is missing or invalid.
 */
const parseWindow = (value: unknown): WindowState | null => {
	if (typeof value !== "object" || value === null) return null;
	const { x, y, width, height, isMaximized } = value as Record<
		string,
		unknown
	>;
	if (typeof width !== "number" || typeof height !== "number") return null;
	return {
		x: typeof x === "number" ? x : undefined,
		y: typeof y === "number" ? y : undefined,
		width: Math.max(480, width),
		height: Math.max(360, height),
		isMaximized: isMaximized === true,
	};
};

/**
 * Read a saved settings file. Anything missing, corrupt, or invalid falls back
 * to the defaults rather than stopping the app.
 *
 * @param text - The file's contents.
 * @returns The settings.
 */
export const parseSettings = (text: string): DesktopSettings => {
	let raw: unknown;
	try {
		raw = JSON.parse(text);
	} catch {
		return DEFAULT_SETTINGS;
	}
	if (typeof raw !== "object" || raw === null) return DEFAULT_SETTINGS;
	const { server, port, window } = raw as Record<string, unknown>;
	let parsedServer: ServerConfig | null = null;
	try {
		parsedServer = server ? parseServerConfig(server) : null;
	} catch {
		parsedServer = null;
	}
	return {
		version: 1,
		server: parsedServer,
		port: isPort(port) ? port : null,
		window: parseWindow(window),
	};
};

/**
 * Open the settings file in a folder, normally Electron's `userData`.
 *
 * @param folder - The folder that holds `desktop-settings.json`.
 * @returns The settings, saved atomically on every change.
 */
export const openSettingsFile = (folder: string): SettingsFile => {
	const path = join(folder, "desktop-settings.json");
	let settings = DEFAULT_SETTINGS;
	try {
		settings = parseSettings(readFileSync(path, "utf8"));
	} catch {
		// first launch: no file yet
	}

	// write a temporary file and rename it, so a crash never leaves half a file
	const write = (next: DesktopSettings): void => {
		settings = next;
		mkdirSync(dirname(path), { recursive: true });
		const temp = `${path}.tmp`;
		writeFileSync(temp, JSON.stringify(next, null, 2), "utf8");
		renameSync(temp, path);
	};

	return {
		get server() {
			return settings.server;
		},
		get port() {
			return settings.port;
		},
		get window() {
			return settings.window;
		},
		setServer: (server) => write({ ...settings, server }),
		setPort: (port) => write({ ...settings, port }),
		setWindow: (window) => write({ ...settings, window }),
	};
};
