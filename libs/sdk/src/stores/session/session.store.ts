import { toError } from "@semoss/utility/error";
import { Observable } from "@semoss/utility/observable";
import {
	confirmOTP,
	isAdminUser,
	login,
	loginLDAP,
	loginOTP,
	logout,
	oauth,
	registerUser,
} from "../../api/auth";
import { getUserInfo, setUserMetadata } from "../../api/user";
import { Env } from "../../env";
import { UnauthorizedError } from "../../utility/error";
import { onUnauthorized } from "../../utility/fetch";
import { Config, type ConfigStore } from "../config/config.store";
import { LoginsStore } from "../logins/logins.store";
import { SessionInsightStore } from "./session-insight.store";
import { SessionPermissionStore } from "./session-permissions.store";

/** What is known once the session is signed out, and the shape of every snapshot. */
const SIGNED_OUT = {
	/**
	 * `INITIALIZING` until the first check finishes, then `AUTHENTICATED` or
	 * `UNAUTHENTICATED`; `ERROR` when the session could not be read.
	 */
	status: "UNAUTHENTICATED" as
		| "INITIALIZING"
		| "UNAUTHENTICATED"
		| "AUTHENTICATED"
		| "ERROR",
	/**
	 * The signed in user, as `GetUserInfo` describes their primary login (see
	 * `pickLogin`), with `meta` read from the database by `GetUserMetadata`;
	 * null when signed out or not yet known.
	 */
	user: null as
		| (Awaited<ReturnType<typeof getUserInfo>>["logins"][string] & {
				/** The upper case provider the user is described by, such as `NATIVE`. */
				provider: string;
				/** Whether the user is an admin. */
				isAdmin: boolean;
				/** Whether the session holds a native login. */
				isNative: boolean;
				/**
				 * The user's default model engine ids, empty when none is set. Read
				 * from `meta`; change them with `setMetadata`.
				 */
				defaultModels: {
					textGeneration: string;
					codeGeneration: string;
				};
		  })
		| null,
	/** Why the session could not be read, or null. */
	error: null as Error | null,
};

/**
 * Whether the page has a session: the config names a login, or every
 * request carries an access key or bearer token. A server that lets
 * anonymous users in names an `ANONYMOUS` login, so they count as signed in,
 * as they do for the backend.
 *
 * @param config - The system config.
 * @returns True when requests run as a user.
 */
const hasSession = (
	config: Awaited<ReturnType<ConfigStore["load"]>>,
): boolean =>
	Object.keys(config.logins).length > 0 ||
	Boolean(Env.ACCESS_KEY && Env.SECRET_KEY) ||
	Boolean(Env.BEARER_TOKEN);

/**
 * Pick the login that describes the user: the session's primary login, then
 * SAML, then NATIVE, then the first. The backend keeps the user's metadata,
 * such as their default models, on the primary login, so describing the user
 * by it keeps what is shown and what is saved on the same account. Every app
 * picks the same one, so the user's name and id agree everywhere.
 *
 * @param logins - Each login's user, keyed by upper case provider.
 * @param primaryLogin - The config's primary login, in upper case, if any.
 * @returns The provider and its user, or null when there are no logins.
 */
const pickLogin = <L>(
	logins: Record<string, L>,
	primaryLogin: string | undefined,
): [string, L] | null => {
	for (const provider of [primaryLogin?.toUpperCase(), "SAML", "NATIVE"]) {
		if (provider && logins[provider]) {
			return [provider, logins[provider]];
		}
	}
	return Object.entries(logins)[0] ?? null;
};

/**
 * Read the user's default models from their metadata.
 *
 * @param meta - The user's metadata.
 * @returns Each default's engine id, empty when none is set.
 */
const toDefaultModels = (
	meta: Record<string, string[]>,
): NonNullable<(typeof SIGNED_OUT)["user"]>["defaultModels"] => ({
	textGeneration: meta["text-generation-model"]?.[0] ?? "",
	codeGeneration: meta["code-generation-model"]?.[0] ?? "",
});

/**
 * Describe the signed in user from what `getUserInfo` read: who they are
 * from their picked login, and their metadata from the database when it was
 * read, else from that login's token.
 *
 * @param info - What `getUserInfo` read.
 * @param primaryLogin - The config's primary login, if any.
 * @param isAdmin - Whether the user is an admin.
 * @returns The user.
 */
const toUser = (
	info: Awaited<ReturnType<typeof getUserInfo>>,
	primaryLogin: string | undefined,
	isAdmin: boolean,
): NonNullable<(typeof SIGNED_OUT)["user"]> => {
	const [provider, record] = pickLogin(info.logins, primaryLogin) ?? [
		"",
		null,
	];
	const meta = info.meta ?? record?.meta ?? {};
	return {
		id: record?.id ?? "",
		name: record?.name ?? "",
		username: record?.username ?? "",
		email: record?.email ?? "",
		provider: provider,
		isAdmin: isAdmin,
		isNative: "NATIVE" in info.logins,
		userEpoch: record?.userEpoch ?? "",
		lastLogin: record?.lastLogin,
		groupInfo: record?.groupInfo,
		meta: meta,
		defaultModels: toDefaultModels(meta),
	};
};

/**
 * The signed in user's session: who they are, what they are signed in to,
 * and what they may do. It needs no React; the hooks in `@semoss/sdk/react`
 * read it.
 *
 * There is normally one per page, {@link Session}, and every insight on the
 * page belongs to it: the backend keeps one session per browser. Signing in
 * or out here clears everything the previous user's session knew, its logins
 * and permissions included, so nothing of theirs shows up for the next user.
 *
 * It owns four parts, each readable on its own:
 * - `config`: the system config, which needs no session.
 * - `logins`: what the session is signed in to.
 * - `permissions`: the user's permission on each resource asked about.
 * - `insight`: the session's own insight, for work that belongs to no
 *   workspace but must share one insight.
 *
 * @example
 * ```ts
 * await Session.initialize();
 * if (!Session.isAuthorized) {
 *     await Session.login({ type: "native", username, password });
 * }
 * Session.getSnapshot().user?.name;
 * ```
 */
export class SessionStore {
	/**
	 * The session, `INITIALIZING` until its first check. Held privately so the
	 * store's public types do not depend on how it is kept.
	 */
	private readonly state = new Observable<typeof SIGNED_OUT>({
		...SIGNED_OUT,
		status: "INITIALIZING",
	});

	/**
	 * Read the current state. The same object until it changes, as
	 * `useSyncExternalStore` requires.
	 *
	 * @returns The current state.
	 */
	getSnapshot = (): typeof SIGNED_OUT => this.state.getSnapshot();

	/**
	 * Hear about every change to the state.
	 *
	 * @param listener - Called after each change; read the new state with
	 * `getSnapshot`.
	 * @returns Stops listening.
	 */
	subscribe = (listener: () => void): (() => void) =>
		this.state.subscribe(listener);

	/** The system config the session is read from. */
	readonly config: ConfigStore;

	/** What the session is signed in to. */
	readonly logins: LoginsStore;

	/** The user's permission on each resource the page has asked about. */
	readonly permissions = new SessionPermissionStore();

	/** The session's own insight, made on first use. */
	readonly insight = new SessionInsightStore();

	/** The check in flight or done, shared by every caller of `initialize`. */
	private initializing: Promise<typeof SIGNED_OUT> | null = null;

	/**
	 * Counts checks: a sign in, sign out or new check adds one, and a check
	 * whose count has moved on when it lands is dropped, so an answer about
	 * the previous user never lands on the next.
	 */
	private version = 0;

	/**
	 * Stops hearing about the backend ending the session; see `dispose`. Null
	 * until the page first uses the session, so a page that never does is not
	 * signed out by it.
	 */
	private stopListening: (() => void) | null = null;

	/**
	 * Create a session. A page normally uses {@link Session} instead.
	 *
	 * @param options - What the session reads.
	 * @param options.config - The system config. Defaults to the page's {@link Config}.
	 * @param options.logins - The logins store. Defaults to a new one, so each session owns its logins.
	 */
	constructor({
		config = Config,
		logins = new LoginsStore(),
	}: { config?: ConfigStore; logins?: LoginsStore } = {}) {
		this.config = config;
		this.logins = logins;
	}

	/**
	 * Stop hearing about the backend ending the session. Only for a session
	 * made for a while, such as a test's; the page's {@link Session} lives as
	 * long as the page.
	 */
	dispose = (): void => {
		this.stopListening?.();
		this.stopListening = null;
	};

	/**
	 * Whether a user is signed in.
	 *
	 * @returns True once the session is `AUTHENTICATED`.
	 */
	get isAuthorized(): boolean {
		return this.getSnapshot().status === "AUTHENTICATED";
	}

	/**
	 * Read the session once: the config, then the user when signed in. Every
	 * caller shares one check, so it is safe to call from every view.
	 *
	 * @returns The session once known. It never rejects; a failure is the
	 * `ERROR` status, and the next call reads the session again.
	 */
	initialize = (): Promise<typeof SIGNED_OUT> => {
		this.listen();
		if (!this.initializing) {
			this.initializing = this.check(false);
		}
		return this.initializing;
	};

	/**
	 * Read the session again, config included, as after a sign in made
	 * outside the session, such as in an embedding page.
	 *
	 * @returns The session once known. It never rejects.
	 */
	refresh = (): Promise<typeof SIGNED_OUT> => {
		this.listen();
		this.initializing = this.check(true);
		return this.initializing;
	};

	/**
	 * Read the signed in user again, such as their metadata after it changed
	 * in another tab or app. Unlike `refresh`, it keeps the config, logins
	 * and permissions; only `user` changes. Does nothing when signed out.
	 *
	 * @returns The session once known.
	 * @throws When the user cannot be read. The session is kept.
	 */
	reloadUser = async (): Promise<typeof SIGNED_OUT> => {
		const version = this.version;
		const current = this.getSnapshot().user;
		if (!current) {
			return this.getSnapshot();
		}

		const [config, info] = await Promise.all([
			this.config.load(),
			this.insight.withInsight((insightId) => getUserInfo(insightId)),
		]);

		// a sign in, sign out or check since replaced the user
		if (version === this.version && this.getSnapshot().user) {
			this.state.update({
				user: toUser(info, config.primaryLogin, current.isAdmin),
			});
		}
		return this.getSnapshot();
	};

	/**
	 * Sign in, then read the new session. An OAuth sign in opens a popup, so
	 * it must be called straight from a click.
	 *
	 * @param credentials - How the user signs in. A linotp sign in sends the
	 * otp that `requestOTP` asked for.
	 * @returns Whether a user is signed in afterwards.
	 * @throws When the sign in is refused, the popup is blocked, or the
	 * session cannot be read after signing in.
	 */
	login = async (
		credentials:
			| { type: "native"; username: string; password: string }
			| { type: "ldap"; username: string; password: string }
			| { type: "linotp"; otp: string }
			| { type: "oauth"; provider: string },
	): Promise<boolean> => {
		if (credentials.type === "native") {
			await login(credentials.username, credentials.password);
		} else if (credentials.type === "ldap") {
			await loginLDAP(credentials.username, credentials.password);
		} else if (credentials.type === "linotp") {
			await confirmOTP(credentials.otp);
		} else {
			await oauth(credentials.provider);
		}

		// signing in can give the browser a new backend session, so an insight
		// made before belongs to the old one and is not reused
		this.insight.clear();

		// the config read while signed out names none of the new logins
		const { status, error } = await this.refresh();
		if (status === "ERROR" && error) {
			throw error;
		}
		return status === "AUTHENTICATED";
	};

	/**
	 * Start a linotp sign in. It does not sign in: the user then signs in
	 * with the otp they are sent, through `login({ type: "linotp", otp })`.
	 *
	 * @param username - The user's name.
	 * @param pin - The user's pin.
	 * @returns True when the challenge was sent, false when the password must
	 * change first.
	 * @throws When the backend refuses the pin.
	 */
	requestOTP = (username: string, pin: string): Promise<boolean> =>
		loginOTP(username, pin);

	/**
	 * Create a native account. It does not sign the person in.
	 *
	 * @param details - What the person signs up with.
	 * @returns True once the account is created.
	 * @throws When the backend refuses the account.
	 */
	register = (
		details: Parameters<typeof registerUser>[0],
	): Promise<boolean> => registerUser(details);

	/**
	 * Sign out. The session forgets the user, their logins and permissions,
	 * then reads the config again in the background, since the copy read
	 * while signed in names the old logins, and takes the sign ins it offers.
	 * The backend drops the session's insights itself.
	 *
	 * @throws When the backend refuses the sign out. The session is kept.
	 */
	logout = async (): Promise<void> => {
		await logout();
		this.listen();
		this.signOut();
	};

	/**
	 * Forget the user after the backend ends the session on its own, as when
	 * a request is sent away to sign in. Called by the session itself; an app
	 * calls it when it learns the session ended some other way.
	 */
	handleUnauthorized = (): void => {
		if (this.getSnapshot().status !== "UNAUTHENTICATED") {
			this.signOut();
		}
	};

	/**
	 * Whether the user may do an operation the config can keep for admins.
	 *
	 * @param resource - The kind of resource.
	 * @param operation - The operation.
	 * @returns True for an admin, or when the config opens it to everyone.
	 */
	canPerform = (
		resource: Parameters<ConfigStore["isAdminOnly"]>[0],
		operation: Parameters<ConfigStore["isAdminOnly"]>[1],
	): boolean =>
		this.getSnapshot().user?.isAdmin === true ||
		!this.config.isAdminOnly(resource, operation);

	/**
	 * Set the user's metadata, such as a default model with
	 * `{ "text-generation-model": engineId }`. Only the keys given change; an
	 * empty value or list removes a key. The user shows the change at once,
	 * goes back when the backend refuses it, and is read again once saved,
	 * since the backend does not report every failed write.
	 *
	 * @param meta - The values to set, by key: one value, or a list in order.
	 * Each key must be one of the server's user meta keys.
	 * @returns The session once saved.
	 * @throws When the backend refuses the change.
	 */
	setMetadata = async (
		meta: Record<string, string | string[]>,
	): Promise<typeof SIGNED_OUT> => {
		const version = this.version;
		const changes = Object.fromEntries(
			Object.entries(meta).map(([key, value]) => [
				key,
				(Array.isArray(value) ? value : [value]).filter(Boolean),
			]),
		);
		const current = this.getSnapshot().user?.meta ?? {};
		const previous = Object.fromEntries(
			Object.keys(changes).map((key) => [key, current[key] ?? []]),
		);

		// show the change at once; the save below confirms or reverts it
		this.applyMetadata(changes);
		try {
			await this.insight.withInsight((insightId) =>
				setUserMetadata(changes, insightId),
			);
		} catch (error) {
			// only revert for the same user; a sign in or out since replaced them
			if (version === this.version) {
				this.applyMetadata(previous);
			}
			throw error;
		}

		// what the database kept; a failed read keeps the change shown
		return this.reloadUser().catch(() => this.getSnapshot());
	};

	/**
	 * Read the config, then the user when there is a session.
	 *
	 * @param force - Read the config again and start the session over, as
	 * after a sign in.
	 * @returns The session once known. It never rejects.
	 */
	private check = async (force: boolean): Promise<typeof SIGNED_OUT> => {
		const version = ++this.version;
		try {
			const config = await this.config.load({ force: force });

			// a sign in, sign out or newer check started meanwhile
			if (version !== this.version) {
				return this.getSnapshot();
			}

			// starting over: what the old config named belongs to the old session
			if (force) {
				this.logins.reset();
				this.permissions.clear();
			}
			this.logins.seed(config);

			if (!hasSession(config)) {
				this.state.set(SIGNED_OUT);
				return this.getSnapshot();
			}

			// the backend sets the insight's user from the session on every call,
			// so the session keeps reusing its insight
			const [info, isAdmin] = await Promise.all([
				this.insight.withInsight((insightId) => getUserInfo(insightId)),
				isAdminUser(),
			]);
			if (version !== this.version) {
				return this.getSnapshot();
			}

			this.state.set({
				status: "AUTHENTICATED",
				error: null,
				user: toUser(info, config.primaryLogin, isAdmin),
			});
		} catch (error) {
			if (version !== this.version) {
				return this.getSnapshot();
			}

			// the session ended while it was being read
			if (error instanceof UnauthorizedError) {
				this.signOut();
			} else {
				this.state.update({ status: "ERROR", error: toError(error) });

				// a failure, such as the network at start up, is not kept: the next
				// `initialize` reads the session again
				this.initializing = null;
			}
		}
		return this.getSnapshot();
	};

	/**
	 * Hear when the backend ends the session, from the first time the page
	 * uses it. Safe to call again.
	 */
	private listen = (): void => {
		// the backend sends any request away to sign in once the session ends
		this.stopListening ??= onUnauthorized(() => this.handleUnauthorized());
	};

	/**
	 * Forget the user and everything the session knew about them. Checks in
	 * flight are dropped, and `initialize` answers signed out until the next
	 * sign in.
	 *
	 * The config names the old session's logins, so a session the page uses
	 * reads it again in the background and takes the sign ins it offers. When
	 * that read fails the config is forgotten rather than kept naming the old
	 * user; the next sign in reads it again.
	 */
	private signOut = (): void => {
		this.version++;
		this.initializing = Promise.resolve(SIGNED_OUT);
		this.insight.clear();
		this.logins.reset();
		this.permissions.clear();
		this.state.set(SIGNED_OUT);

		const version = this.version;
		void this.config
			.load({ force: true })
			.then((config) => {
				if (version === this.version) {
					this.logins.seed(config);
				}
			})
			.catch(() => {
				if (version === this.version) {
					this.config.reset();
				}
			});
	};

	/**
	 * Show metadata on the session's user. An empty list removes its key, as
	 * the backend does.
	 *
	 * @param changes - The values to show, by key.
	 */
	private applyMetadata = (changes: Record<string, string[]>): void => {
		const { user } = this.getSnapshot();
		if (!user) {
			return;
		}

		const meta = Object.fromEntries(
			Object.entries({ ...user.meta, ...changes }).filter(
				([, values]) => values.length > 0,
			),
		);
		this.state.update({
			user: { ...user, meta: meta, defaultModels: toDefaultModels(meta) },
		});
	};
}

/** The page's session, shared by every insight and view. */
export const Session = new SessionStore();
