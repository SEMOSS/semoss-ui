import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
	isSameServer,
	parseServerConfig,
	type ServerConfig,
} from "../../../contract/server-connection";

/** The app's one config file, in its user data folder. */
export const CONFIG_FILE_NAME = "smss-desktop-config.json";

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

/**
 * A saved server and the browser storage that holds its sign in. Each server
 * has its own partition, so its cookies and storage never mix with another's.
 */
export interface SavedServer extends ServerConfig {
	/** The Electron session partition: `persist:server-<uuid>`. */
	readonly partition: string;
}

/** What the app keeps between launches, in its user data folder. */
interface DesktopConfig {
	/** The file format's version, for a future change. */
	readonly version: 1;
	/** Every saved server, in the order they were added. */
	readonly servers: readonly SavedServer[];
	/** The partition of the server in use; null only when none is saved. */
	readonly active: string | null;
	/** The local origin's port. Cookies and storage belong to it, so it is reused. */
	readonly port: number | null;
	/** Where the window last was; null before it first closes. */
	readonly window: WindowState | null;
	/** The app's language, such as `en`; null until the first launch picks one. */
	readonly language: string | null;
}

/** The config before anything is saved, and the fallback for a bad file. */
const DEFAULT_CONFIG: DesktopConfig = {
	version: 1,
	servers: [],
	active: null,
	port: null,
	window: null,
	language: null,
};

/** A partition this app made, one per server. */
const PARTITION_PATTERN = /^persist:server-[0-9a-f-]{36}$/;

/** A base language code, the only kind the app's translations are keyed by. */
const LANGUAGE_PATTERN = /^[a-z]{2,3}$/;

/**
 * Whether a value is a language code the config can hold, such as `en`.
 *
 * @param value - The value.
 * @returns True for two or three lower case letters.
 */
export const isLanguageCode = (value: unknown): value is string =>
	typeof value === "string" && LANGUAGE_PATTERN.test(value);

/** The app's saved config, read once and written through on every change. */
export interface DesktopConfigFile {
	/** The server in use; null until the user picks one. */
	readonly server: SavedServer | null;
	/** Every saved server, in the order they were added. */
	readonly servers: readonly SavedServer[];
	/** The saved local port; null before the first launch. */
	readonly port: number | null;
	/** The saved window state; null before the window first closes. */
	readonly window: WindowState | null;
	/** The saved language; null until the first launch picks one. */
	readonly language: string | null;
	/**
	 * Use a server, saving it with a new partition when it is not saved yet.
	 *
	 * @returns The server as saved, with its partition.
	 */
	useServer: (server: ServerConfig) => SavedServer;
	/**
	 * Forget a saved server. When it was in use, the first one left takes over.
	 *
	 * @returns The forgotten server, or null when it was not saved.
	 */
	forgetServer: (server: ServerConfig) => SavedServer | null;
	/** Save the local port. */
	setPort: (port: number) => void;
	/** Save the window state. */
	setWindow: (window: WindowState) => void;
	/** Save the language. */
	setLanguage: (language: string) => void;
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
 * Read one saved server and its partition.
 *
 * @param value - The saved value.
 * @returns The server, or null when it or its partition is invalid.
 */
const parseSavedServer = (value: unknown): SavedServer | null => {
	let config: ServerConfig;
	try {
		config = parseServerConfig(value);
	} catch {
		return null;
	}
	const { partition } = value as Record<string, unknown>;
	if (typeof partition !== "string" || !PARTITION_PATTERN.test(partition)) {
		return null;
	}
	return { ...config, partition };
};

/**
 * Read a saved config file. Anything missing, corrupt, or invalid falls back
 * to the defaults rather than stopping the app.
 *
 * @param text - The file's contents.
 * @returns The config.
 */
export const parseDesktopConfig = (text: string): DesktopConfig => {
	let raw: unknown;
	try {
		raw = JSON.parse(text);
	} catch {
		return DEFAULT_CONFIG;
	}
	if (typeof raw !== "object" || raw === null) return DEFAULT_CONFIG;
	const { servers, active, port, window, language } = raw as Record<
		string,
		unknown
	>;

	// one entry per server and per partition; a duplicate is dropped
	const kept: SavedServer[] = [];
	for (const candidate of Array.isArray(servers)
		? servers.map(parseSavedServer)
		: []) {
		if (
			candidate &&
			!kept.some(
				(saved) =>
					isSameServer(saved, candidate) ||
					saved.partition === candidate.partition,
			)
		) {
			kept.push(candidate);
		}
	}

	const activeServer =
		kept.find((saved) => saved.partition === active) ?? kept[0];
	return {
		version: 1,
		servers: kept,
		active: activeServer?.partition ?? null,
		port: isPort(port) ? port : null,
		window: parseWindow(window),
		language: isLanguageCode(language) ? language : null,
	};
};

/**
 * Open the config file in a folder, normally Electron's `userData`.
 *
 * @param folder - The folder that holds {@link CONFIG_FILE_NAME}.
 * @returns The config, saved atomically on every change.
 */
export const openDesktopConfig = (folder: string): DesktopConfigFile => {
	const path = join(folder, CONFIG_FILE_NAME);
	let config = DEFAULT_CONFIG;
	try {
		config = parseDesktopConfig(readFileSync(path, "utf8"));
	} catch {
		// first launch: no file yet
	}

	// write a temporary file and rename it, so a crash never leaves half a file
	const write = (next: DesktopConfig): void => {
		config = next;
		mkdirSync(dirname(path), { recursive: true });
		const temp = `${path}.tmp`;
		writeFileSync(temp, JSON.stringify(next, null, 2), "utf8");
		renameSync(temp, path);
	};

	const find = (server: ServerConfig): SavedServer | undefined =>
		config.servers.find((saved) => isSameServer(saved, server));

	return {
		get server() {
			return (
				config.servers.find(
					(saved) => saved.partition === config.active,
				) ?? null
			);
		},
		get servers() {
			return config.servers;
		},
		get port() {
			return config.port;
		},
		get window() {
			return config.window;
		},
		get language() {
			return config.language;
		},
		useServer: (server) => {
			const saved = find(server) ?? {
				url: server.url,
				module: server.module,
				partition: `persist:server-${randomUUID()}`,
			};
			write({
				...config,
				servers: find(server)
					? config.servers
					: [...config.servers, saved],
				active: saved.partition,
			});
			return saved;
		},
		forgetServer: (server) => {
			const saved = find(server);
			if (!saved) return null;
			const servers = config.servers.filter((item) => item !== saved);
			write({
				...config,
				servers,
				active:
					config.active === saved.partition
						? (servers[0]?.partition ?? null)
						: config.active,
			});
			return saved;
		},
		setPort: (port) => write({ ...config, port }),
		setWindow: (window) => write({ ...config, window }),
		setLanguage: (language) => {
			if (language !== config.language) write({ ...config, language });
		},
	};
};
