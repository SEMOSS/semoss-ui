import {
	connectLogin,
	getLogins,
	logoutProvider,
	parseLogins,
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
	/**
	 * The user id of each login the session holds, keyed by provider in upper
	 * case, as the system config's `loginDetails` names them. A login signed in
	 * to after the config was read has none until the config is read again.
	 */
	accountIds: Record<string, string>;
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
	accountIds: {},
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

/**
 * The user id of each login in the config's `loginDetails`, keyed by provider
 * in upper case. Entries without an id are left out.
 */
const parseAccountIds = (value: unknown): Record<string, string> => {
	const accountIds: Record<string, string> = {};
	if (typeof value !== "object" || value === null) {
		return accountIds;
	}
	for (const [provider, details] of Object.entries(value)) {
		const id =
			typeof details === "object" && details !== null && "id" in details
				? details.id
				: null;
		if (typeof id === "string" && id) {
			accountIds[provider.toUpperCase()] = id;
		}
	}
	return accountIds;
};

/** The account ids of the logins the session still holds. */
const keepHeldAccounts = (
	accountIds: Record<string, string>,
	logins: Record<string, string>,
): Record<string, string> =>
	Object.fromEntries(
		Object.entries(accountIds).filter(([provider]) => provider in logins),
	);

/**
 * What the session is signed in to, for the whole page: every insight, view,
 * and app reads the same logins, so a sign in or out made anywhere shows up
 * everywhere. The insight store fills it from the system config when the page
 * loads and after each login, and resets it on logout; views ask it again
 * when they show sign in state, sharing one read.
 */
export class LoginsStore {
	private snapshot: LoginsSnapshot = EMPTY_SNAPSHOT;

	/** When the logins were last read, to reuse a recent read. */
	private readAt = 0;

	/** The read in flight, joined by every caller. */
	private request: Promise<Record<string, string>> | null = null;

	/**
	 * Counts sessions: every reset, on each login and logout, adds one. A read
	 * notes the count when it starts, and when its answer arrives after the
	 * count has moved on, the answer describes a session that has ended, so it
	 * is thrown away instead of overwriting the current logins.
	 */
	private sessionVersion = 0;

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
	 * Take what the system config says about the session. Its logins and their
	 * account ids are taken while none have been read, since the config is read
	 * once per page and a later read is newer; its login settings do not change
	 * while the session lasts. Once logins are known, a config only adds the
	 * account id of a login that has none, and only when it names that login the
	 * same way, so a copy cached for an earlier session never replaces them.
	 *
	 * @param config - The system config.
	 */
	seed = (config: {
		logins?: unknown;
		loginDetails?: unknown;
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
			const logins = parseLogins(config.logins);
			this.readAt = Date.now();
			this.set({
				...settings,
				logins,
				accountIds: keepHeldAccounts(
					parseAccountIds(config.loginDetails),
					logins,
				),
				status: "ready",
			});
			return;
		}
		const current = this.snapshot;
		// the config is the only place the account ids come from
		const configLogins = parseLogins(config.logins);
		const accountIds = { ...current.accountIds };
		for (const [provider, id] of Object.entries(
			keepHeldAccounts(
				parseAccountIds(config.loginDetails),
				current.logins,
			),
		)) {
			if (
				!(provider in accountIds) &&
				configLogins[provider] === current.logins[provider]
			) {
				accountIds[provider] = id;
			}
		}
		if (
			current.primaryLogin !== settings.primaryLogin ||
			current.connectorAccess !== settings.connectorAccess ||
			JSON.stringify(current.availableProviders) !==
				JSON.stringify(settings.availableProviders) ||
			JSON.stringify(current.accountIds) !== JSON.stringify(accountIds)
		) {
			this.set({ ...current, ...settings, accountIds });
		}
	};

	/**
	 * Forget the session, when it signs in or out, so its next config is
	 * taken. A read still in flight belongs to the old session, so it is
	 * dropped: it changes nothing when it lands, and the next refresh reads
	 * again.
	 */
	reset = (): void => {
		this.sessionVersion++;
		this.request = null;
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
			const sessionVersion = this.sessionVersion;
			const request = getLogins()
				.then(
					(logins) => {
						if (sessionVersion !== this.sessionVersion) {
							return logins;
						}
						this.readAt = Date.now();
						this.set({
							...this.snapshot,
							logins: logins,
							// a login signed out of loses its account id
							accountIds: keepHeldAccounts(
								this.snapshot.accountIds,
								logins,
							),
							status: "ready",
						});
						return logins;
					},
					(error: unknown) => {
						if (sessionVersion === this.sessionVersion) {
							this.set({ ...this.snapshot, status: "error" });
						}
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
	 * @param provider - The provider's login key, such as `MICROSOFT`, in any
	 * case.
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
	 * @param provider - The provider's login key, such as `MICROSOFT`, in any
	 * case.
	 * @throws SessionLoginDisconnectError for the session's own login, or when
	 * that login is not known.
	 * @throws Error when the backend refuses the sign out.
	 */
	disconnect = async (provider: string): Promise<void> => {
		// the backend signs out by the upper case key, so compare it that way
		const loginKey = provider.toUpperCase();
		const { primaryLogin } = this.snapshot;
		if (primaryLogin === null || primaryLogin === loginKey) {
			throw new SessionLoginDisconnectError();
		}
		try {
			await logoutProvider(loginKey);
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
