import {
	connectLogin,
	getLogins,
	logoutProvider,
	SessionLoginDisconnectError,
} from "../../api/auth";

/**
 * How long a read of the session's logins is reused. Every view that shows
 * sign in state asks for them, so they share one read rather than each asking.
 */
const LOGINS_MAX_AGE_MS = 30 * 1000;

/** What the page knows about the session's logins. */
export interface LoginsSnapshot {
	/**
	 * The account name for each login the session holds, keyed by provider in
	 * upper case (`NATIVE`, `MICROSOFT`, `GOOGLE`, ...).
	 */
	logins: Record<string, string>;
	/** The login the session belongs to, such as `NATIVE`, or null when not known. */
	primaryLogin: string | null;
	/**
	 * What each OAuth sign in lets connectors use, as the config's
	 * `connectorAccess` reports it for a signed in user, or null when it does
	 * not say.
	 */
	connectorAccess: unknown;
	/** The sign ins this server offers, as the config's `availableProviders` lists them. */
	availableProviders: { provider: string; isOauth: boolean }[];
	/** `loading` until the logins are known, `error` when the last read failed. */
	status: "loading" | "ready" | "error";
}

/** What is known before the session's config is read. */
const EMPTY_SNAPSHOT: LoginsSnapshot = {
	logins: {},
	primaryLogin: null,
	connectorAccess: null,
	availableProviders: [],
	status: "loading",
};

/** The config's offered sign ins, keeping only well formed entries. */
const normalizeProviders = (
	value: unknown,
): LoginsSnapshot["availableProviders"] =>
	Array.isArray(value)
		? value.filter(
				(entry): entry is { provider: string; isOauth: boolean } =>
					typeof entry === "object" &&
					entry !== null &&
					typeof entry.provider === "string",
			)
		: [];

/** A login map as the backend sends it, with keys in upper case. */
const normalizeLogins = (value: unknown): Record<string, string> => {
	const logins: Record<string, string> = {};
	if (typeof value !== "object" || value === null) {
		return logins;
	}
	for (const [provider, name] of Object.entries(value)) {
		if (typeof name === "string") {
			logins[provider.toUpperCase()] = name;
		}
	}
	return logins;
};

/**
 * What the session is signed in to, for the whole page: every insight, view,
 * and app reads the same logins, so a sign in or out made anywhere shows up
 * everywhere. The insight store fills it from the system config when the page
 * loads and after each login and logout; views ask it again when they show
 * sign in state, sharing one read.
 */
export class LoginsStore {
	private snapshot: LoginsSnapshot = EMPTY_SNAPSHOT;

	/** When the logins were last read, to reuse a recent read. */
	private readAt = 0;

	/** The read in flight, joined by every caller. */
	private request: Promise<Record<string, string>> | null = null;

	private readonly listeners = new Set<() => void>();

	/** The current logins. The same object until they change. */
	getSnapshot = (): LoginsSnapshot => this.snapshot;

	/**
	 * Hear about every change to the logins.
	 *
	 * @param listener - Called after each change.
	 * @returns Stops listening.
	 */
	subscribe = (listener: () => void): (() => void) => {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	};

	/**
	 * Take what the system config says about the session. Its logins are only
	 * taken while none have been read, since the config is read once per page
	 * and a later read is newer; its login settings do not change while the
	 * session lasts.
	 *
	 * @param config - The system config.
	 */
	seed = (config: {
		logins?: unknown;
		primaryLogin?: unknown;
		connectorAccess?: unknown;
		availableProviders?: unknown;
	}): void => {
		const settings = {
			primaryLogin:
				typeof config.primaryLogin === "string"
					? config.primaryLogin.toUpperCase()
					: null,
			connectorAccess: config.connectorAccess ?? null,
			availableProviders: normalizeProviders(config.availableProviders),
		};
		if (this.snapshot.status === "loading") {
			this.readAt = Date.now();
			this.set({
				...settings,
				logins: normalizeLogins(config.logins),
				status: "ready",
			});
			return;
		}
		const current = this.snapshot;
		if (
			current.primaryLogin !== settings.primaryLogin ||
			current.connectorAccess !== settings.connectorAccess ||
			JSON.stringify(current.availableProviders) !==
				JSON.stringify(settings.availableProviders)
		) {
			this.set({ ...current, ...settings });
		}
	};

	/** Forget the session, when it signs in or out, so its next config is taken. */
	reset = (): void => {
		this.readAt = 0;
		this.set(EMPTY_SNAPSHOT);
	};

	/**
	 * Read the session's logins again. A read in flight is joined, and one
	 * younger than `maxAgeMs` is reused. A failed read keeps what was known.
	 *
	 * @param options.maxAgeMs - How old a reused read may be; 0 always reads
	 * again. Defaults to 30 seconds.
	 * @returns The session's logins.
	 */
	refresh = ({
		maxAgeMs = LOGINS_MAX_AGE_MS,
	}: {
		maxAgeMs?: number;
	} = {}): Promise<Record<string, string>> => {
		if (
			this.snapshot.status === "ready" &&
			Date.now() - this.readAt < maxAgeMs
		) {
			return Promise.resolve(this.snapshot.logins);
		}
		if (!this.request) {
			const request = getLogins()
				.then(
					(logins) => {
						this.readAt = Date.now();
						this.set({
							...this.snapshot,
							logins: logins,
							status: "ready",
						});
						return logins;
					},
					(error: unknown) => {
						this.set({ ...this.snapshot, status: "error" });
						throw error;
					},
				)
				.finally(() => {
					if (this.request === request) {
						this.request = null;
					}
				});
			this.request = request;
		}
		return this.request;
	};

	/**
	 * Sign the session in to one more provider with a popup, then read the
	 * logins again. See {@link connectLogin}.
	 *
	 * Must be called straight from a click: the popup opens before anything is
	 * awaited.
	 *
	 * @param provider - The provider's login key, such as `MICROSOFT`.
	 * @param loginPath - The segment of `/api/auth/login/{segment}` that starts
	 * its sign in. Defaults to the login key in lower case.
	 * @returns Whether the session holds the provider's login afterwards.
	 * @throws PopupBlockedError when the browser blocks the popup.
	 */
	connect = (provider: string, loginPath?: string): Promise<boolean> =>
		connectLogin({
			provider: provider,
			loginPath: loginPath,
			primaryLogin: this.snapshot.primaryLogin,
		}).finally(() => this.refresh({ maxAgeMs: 0 }).catch(() => undefined));

	/**
	 * Sign the session out of one provider, keeping the session and its other
	 * logins, then read the logins again.
	 *
	 * @param provider - The provider's login key, such as `MICROSOFT`.
	 * @throws SessionLoginDisconnectError for the session's own login, or when
	 * that login is not known.
	 * @throws Error when the backend refuses the sign out.
	 */
	disconnect = async (provider: string): Promise<void> => {
		const { primaryLogin } = this.snapshot;
		if (primaryLogin === null || primaryLogin === provider) {
			throw new SessionLoginDisconnectError();
		}
		try {
			await logoutProvider(provider);
		} finally {
			await this.refresh({ maxAgeMs: 0 }).catch(() => undefined);
		}
	};

	private set = (next: LoginsSnapshot): void => {
		this.snapshot = next;
		for (const listener of this.listeners) {
			listener();
		}
	};
}

/** The page's logins, shared by every insight and view. */
export const Logins = new LoginsStore();
