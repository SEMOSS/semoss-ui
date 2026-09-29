import { Env, get, runPixel } from "@semoss/sdk";
import type { RoomStore } from "@/stores/room/room.store";
import { parseRoomToolbox } from "../tools/chat-tool-info";
import {
	buildUserConnectorToolsPixel,
	type ConnectorProvider,
	type ConnectorServiceId,
	type McpTool,
	mergeUserConnectorTools,
	ROOM_PIXEL_TOOLS_PATH,
	readConnectorTools,
	readMcpTools,
	USER_CONNECTORS_PATH,
} from "./connector.catalog";

/** How often the sign in popup is checked for having closed or come back. */
const POPUP_POLL_MS = 1000;

/**
 * How often the logins are read while the popup is open, for a sign in that
 * finishes on another origin, where the popup cannot be read.
 */
const CONNECT_LOGINS_POLL_MS = 5000;

/** How long a sign in may take before the popup is given up on. */
const CONNECT_TIMEOUT_MS = 5 * 60 * 1000;

const POPUP_FEATURES = "popup,width=520,height=680";

/** How the asset reactors answer for a file that is not there. */
const MISSING_FILE = /does not exist/i;

/**
 * Raised when the browser blocks the sign in popup, so the UI can ask the user
 * to allow popups for this site.
 */
export class PopupBlockedError extends Error {
	constructor() {
		super("The sign in window was blocked");
		this.name = "PopupBlockedError";
	}
}

/**
 * How long a read of the session's logins is reused. Every view that shows
 * sign in state reads them, so they share one read rather than each asking.
 */
const LOGINS_MAX_AGE_MS = 30 * 1000;

/** The last read of the session's logins, and when it came back. */
let loginsCache: { logins: Record<string, string>; readAt: number } | null =
	null;

/** The read of the session's logins in flight, shared by every caller. */
let loginsRequest: Promise<Record<string, string>> | null = null;

/**
 * Read the logins from `/api/auth/logins` rather than from `/api/config`,
 * which the SDK loads once per page and so goes stale the moment a provider
 * is added.
 *
 * @return The session's logins.
 */
const fetchSessionLogins = async (): Promise<Record<string, string>> => {
	const { data } = await get<unknown>(`${Env.MODULE}/api/auth/logins`);
	if (typeof data !== "object" || data === null) {
		return {};
	}

	const logins: Record<string, string> = {};
	for (const [provider, name] of Object.entries(data)) {
		if (typeof name === "string") {
			logins[provider.toUpperCase()] = name;
		}
	}
	return logins;
};

/**
 * The logins the current session holds, as account names keyed by provider
 * (`MICROSOFT`, `GOOGLE`, `NATIVE`, ...).
 *
 * Every caller on the page shares one read: a read in flight is joined, and
 * one younger than `maxAgeMs` is reused.
 *
 * @param options - `maxAgeMs`: how old a reused read may be. 0 always reads
 * again, joining only a read already in flight.
 * @return The session's logins.
 */
export const getSessionLogins = ({
	maxAgeMs = LOGINS_MAX_AGE_MS,
}: {
	maxAgeMs?: number;
} = {}): Promise<Record<string, string>> => {
	if (loginsCache && Date.now() - loginsCache.readAt < maxAgeMs) {
		return Promise.resolve(loginsCache.logins);
	}
	if (!loginsRequest) {
		const request = fetchSessionLogins()
			.then((logins) => {
				loginsCache = { logins: logins, readAt: Date.now() };
				return logins;
			})
			.finally(() => {
				if (loginsRequest === request) {
					loginsRequest = null;
				}
			});
		loginsRequest = request;
	}
	return loginsRequest;
};

/** Drop the reused read of the logins, so the next caller reads them again. */
const forgetSessionLogins = (): void => {
	loginsCache = null;
};

/**
 * Sign the session out of one provider, keeping its other logins.
 *
 * @param provider - The provider to sign out of.
 */
const signOutProvider = async (provider: ConnectorProvider): Promise<void> => {
	try {
		await get(
			`${Env.MODULE}/api/auth/logout/${provider.loginKey}?disableRedirect=true`,
		);
	} finally {
		forgetSessionLogins();
	}
};

/** What `/api/config` says about the session's logins. */
export interface SessionLoginConfig {
	/** The login the session belongs to, such as `MICROSOFT`, when known. */
	primaryLogin: string | null;
	/**
	 * Which connector apps each OAuth sign in lets the connectors use, by
	 * provider and app. The server judges it from the scopes the sign in asks
	 * for and sends only the verdict, and only to a signed in user.
	 */
	connectorAccess: unknown;
	/** The logins this server offers, as `availableProviders` lists them. */
	availableProviders: { provider: string; isOauth: boolean }[] | null;
}

/** What a read of the config that failed or said nothing leaves known. */
const UNKNOWN_LOGIN_CONFIG: SessionLoginConfig = {
	primaryLogin: null,
	connectorAccess: null,
	availableProviders: null,
};

/**
 * The page's read of the config's login settings. None of them change while
 * the session lasts, so the page reads them once; a read that fails is
 * dropped, so the next caller tries again.
 */
let loginConfigRequest: Promise<SessionLoginConfig> | null = null;

/**
 * Read what the config says about the session's logins, once per page.
 *
 * @return The session's login settings; unknown values are null.
 */
export const readSessionLoginConfig = (): Promise<SessionLoginConfig> => {
	if (!loginConfigRequest) {
		loginConfigRequest = (async () => {
			try {
				const { data } = await get<{
					primaryLogin?: unknown;
					connectorAccess?: unknown;
					availableProviders?: unknown;
				}>(`${Env.MODULE}/api/config`);
				const providers = Array.isArray(data?.availableProviders)
					? data.availableProviders.filter(
							(
								entry,
							): entry is {
								provider: string;
								isOauth: boolean;
							} =>
								typeof entry === "object" &&
								entry !== null &&
								typeof entry.provider === "string",
						)
					: null;
				return {
					primaryLogin:
						typeof data?.primaryLogin === "string"
							? data.primaryLogin.toUpperCase()
							: null,
					connectorAccess: data?.connectorAccess ?? null,
					availableProviders: providers,
				};
			} catch {
				loginConfigRequest = null;
				return UNKNOWN_LOGIN_CONFIG;
			}
		})();
	}
	return loginConfigRequest;
};

/**
 * Whether a popup has come back to this app, which is where the backend
 * sends it once a sign in finishes. A popup still on the provider's pages
 * cannot be read, which counts as not yet.
 *
 * @param popup - The sign in popup.
 * @return True once the popup shows a page of this app again.
 */
const isPopupBack = (popup: Window): boolean => {
	try {
		const href = popup.location.href;
		return (
			!!href &&
			href !== "about:blank" &&
			new URL(href).origin === window.location.origin &&
			!href.includes("/api/auth/login")
		);
	} catch {
		return false;
	}
};

/**
 * Sign the session in to a provider, alongside the login the user already has,
 * always with a fresh sign in.
 *
 * The backend attaches the provider's token to the current session, which is
 * what the connector reactors act with, and it keeps listing a provider whose
 * token has expired or failed to refresh. So a provider the session already
 * lists is signed out first, and the sign in ends once it is listed again, or
 * when the popup closes or comes back to this app, or after five minutes. The
 * popup is checked every second; the logins are read every few seconds as
 * well, since a sign in that finishes on another origin, as it does in local
 * development, leaves the popup unreadable.
 *
 * The session's own login is never signed out, since that would end the
 * session or change whose it is; when it is the one being renewed, the sign
 * in ends when the popup closes or comes back to this app. It is not signed
 * out either when the session's login is not known.
 *
 * Must be called straight from a click, before any await, or the browser
 * blocks the popup.
 *
 * @param provider - The provider to sign in to.
 * @return Whether the session holds the provider's login once the popup is done.
 * @throws PopupBlockedError when the popup could not open.
 */
export const connectProvider = (
	provider: ConnectorProvider,
): Promise<boolean> => {
	// opened blank inside the click, and sent to the sign in once any stale
	// login is gone
	const popup = window.open("", "semoss-connect", POPUP_FEATURES);
	if (!popup) {
		return Promise.reject(new PopupBlockedError());
	}

	const isConnected = async (): Promise<boolean> => {
		try {
			const logins = await getSessionLogins({ maxAgeMs: 0 });
			return provider.loginKey in logins;
		} catch {
			return false;
		}
	};

	return (async () => {
		const [wasConnected, { primaryLogin }] = await Promise.all([
			isConnected(),
			readSessionLoginConfig(),
		]);
		const canSignOut =
			wasConnected &&
			primaryLogin !== null &&
			primaryLogin !== provider.loginKey;
		if (canSignOut) {
			await signOutProvider(provider).catch(() => undefined);
		}
		// a renewed session login stays listed, so only the popup tells when it
		// is done
		const watchesLogins = !wasConnected || canSignOut;
		if (popup.closed) {
			return isConnected();
		}
		popup.location.href = `${Env.MODULE}/api/auth/login/${provider.loginPath}`;

		return new Promise<boolean>((resolve) => {
			const startedAt = Date.now();
			let loginsReadAt = startedAt;
			let isChecking = false;

			const timer = window.setInterval(async () => {
				if (isChecking) {
					return;
				}
				isChecking = true;
				try {
					const now = Date.now();
					const hasEnded = popup.closed || isPopupBack(popup);
					const hasTimedOut = now - startedAt > CONNECT_TIMEOUT_MS;
					let isListed = false;
					if (
						watchesLogins &&
						now - loginsReadAt >= CONNECT_LOGINS_POLL_MS
					) {
						loginsReadAt = now;
						isListed = await isConnected();
					}
					if (!hasEnded && !hasTimedOut && !isListed) {
						return;
					}

					window.clearInterval(timer);
					if (!popup.closed) {
						popup.close();
					}
					resolve(isListed || (await isConnected()));
				} finally {
					isChecking = false;
				}
			}, POPUP_POLL_MS);
		});
	})();
};

/**
 * A definition file as the asset reactors return it, which is its text.
 *
 * @param output - The reactor's output.
 * @return The parsed file, or null when it is not JSON.
 */
const parseMcpFile = (output: unknown): unknown => {
	if (typeof output !== "string") {
		return output ?? null;
	}
	try {
		return JSON.parse(output);
	} catch {
		return null;
	}
};

/**
 * A room's tool file.
 *
 * @param room - A room bound to its insight.
 * @return The parsed file, or null when the room has none.
 * @throws Error when the file is there but cannot be read.
 */
const readRoomToolFile = async (room: RoomStore): Promise<unknown> => {
	const response = await room.runRoomPixel<[unknown]>(
		`GetInsightAssets(filePath=[${JSON.stringify(ROOM_PIXEL_TOOLS_PATH)}]);`,
		false,
		false,
		false,
	);
	if (response.errors.length > 0) {
		if (response.errors.some((error) => MISSING_FILE.test(error))) {
			return null;
		}
		throw new Error(response.errors.join(""));
	}
	return parseMcpFile(response.pixelReturn[0]?.output);
};

/**
 * Run a pixel for the user rather than for a room.
 *
 * @param pixel - The pixel.
 * @return Its first statement's output.
 * @throws Error when the pixel fails.
 */
const runUserPixel = async (pixel: string): Promise<unknown> => {
	const { errors, pixelReturn } = await runPixel<[unknown]>(pixel);
	if (errors.length > 0) {
		throw new Error(errors.join(""));
	}
	return pixelReturn[0]?.output;
};

/**
 * The user's connector tools, from their own file.
 *
 * @return The tools, or null when the user has not chosen connectors yet.
 * @throws Error when the file is there but cannot be read.
 */
export const readUserConnectorTools = async (): Promise<McpTool[] | null> => {
	try {
		return readConnectorTools(
			parseMcpFile(
				await runUserPixel(
					`GetUserAssets(filePath=${JSON.stringify([USER_CONNECTORS_PATH])});`,
				),
			),
		);
	} catch (error) {
		if (error instanceof Error && MISSING_FILE.test(error.message)) {
			return null;
		}
		throw error;
	}
};

/**
 * Switch the user's connectors: write the tools of the services switched on
 * into their own file, which every chat of theirs copies.
 *
 * @param services - The services to switch on.
 * @return The connector tools the file now holds.
 * @throws Error when the backend refuses the change.
 */
export const writeUserConnectorTools = async (
	services: readonly ConnectorServiceId[],
): Promise<McpTool[]> =>
	readConnectorTools(
		await runUserPixel(buildUserConnectorToolsPixel(services)),
	);

/**
 * Bring a room's copy of the user's connector tools up to date, keeping every
 * other tool in its file, then refresh the room's options so its toolbox
 * reflects them. Nothing is written when the room already holds them.
 *
 * @param room - A room bound to its insight.
 * @param userTools - The user's connector tools.
 * @throws Error when the room's file cannot be read or written.
 */
export const syncRoomConnectorTools = async (
	room: RoomStore,
	userTools: readonly McpTool[],
): Promise<void> => {
	const next = mergeUserConnectorTools(
		await readRoomToolFile(room),
		userTools,
	);
	if (!next) {
		return;
	}
	// JSON may escape the slash, so a closing encode marker in a description
	// cannot end the block early
	const text = JSON.stringify(next, null, 4).replace(
		/<\/encode>/gi,
		"<\\/encode>",
	);
	await room.runRoomPixel(
		`SaveInsightAssets(filePath=${JSON.stringify([ROOM_PIXEL_TOOLS_PATH])}, content=["<encode>${text}</encode>"]);`,
		false,
		false,
		true,
	);
	await room.syncRoomOptions();
};

/**
 * The tools in a room's own file, for a room whose user has not chosen
 * connectors yet and so keeps the ones it has.
 *
 * @param room - A room bound to its insight.
 * @return The tools; none when the room has no file.
 * @throws Error when the room's file cannot be read.
 */
export const loadRoomTools = async (room: RoomStore): Promise<McpTool[]> =>
	readMcpTools(await readRoomToolFile(room));

/**
 * The tools a room's own toolbox offers the assistant, as its tool file
 * holds them.
 *
 * @param room - A room bound to its insight.
 * @return The tools; none when the room has no tool file.
 */
export const loadRoomToolbox = async (
	room: RoomStore,
): Promise<ReturnType<typeof parseRoomToolbox>> =>
	parseRoomToolbox(await readRoomToolFile(room));
