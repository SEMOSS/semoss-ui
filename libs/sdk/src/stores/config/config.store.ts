import { toError } from "@semoss/utility/error";
import { tryParseJson } from "@semoss/utility/json";
import { isRecord } from "@semoss/utility/object";
import { Observable } from "@semoss/utility/observable";
import { getSystemConfig } from "../../api";
import { Env } from "../../env";

/** The system config, as `/api/config` returns it. */
type SystemConfig = Awaited<ReturnType<typeof getSystemConfig>>;

/**
 * How each kind of resource is named in the config's
 * `adminOnly{Resource}{Operation}` flags, such as `adminOnlyDbAddAccess`.
 * These are the resources the backend sends every operation's flag for.
 * Insights have their own smaller set (`adminOnlyInsightAddAccess`,
 * `adminOnlyInsightSetPublic` and `adminOnlyInsightShare`), read from the
 * config directly.
 */
const ADMIN_ONLY_RESOURCES = {
	PROJECT: "Project",
	WORKSPACE: "Workspace",
	SKILL: "Skill",
	DATABASE: "Db",
	FUNCTION: "Function",
	MODEL: "Model",
	STORAGE: "Storage",
	VECTOR: "Vector",
	// the backend keeps no flags for guardrails, so they are always admin-only
	GUARDRAIL: null,
} as const;

/**
 * How each operation is named in the config's
 * `adminOnly{Resource}{Operation}` flags.
 */
const ADMIN_ONLY_OPERATIONS = {
	access: "AddAccess",
	add: "Add",
	delete: "Delete",
	discoverable: "SetDiscoverable",
	public: "SetPublic",
} as const;

/** What is known before the config is read, and after a reset. */
const EMPTY_SNAPSHOT = {
	/**
	 * `IDLE` before the first read, `LOADING` during it, and `ERROR` when no
	 * config could be read. A later read keeps `READY` while it runs, and a
	 * failed one keeps the config it had.
	 */
	status: "IDLE" as "IDLE" | "LOADING" | "READY" | "ERROR",
	/**
	 * The config, or null until one is read. Its meta key lists are sorted by
	 * `display_order`, and its lists are never missing.
	 */
	config: null as SystemConfig | null,
	/**
	 * The config's theme, parsed from its `THEME_MAP`, or null when it has
	 * none or it is not valid JSON. Each app lays its own defaults under it.
	 */
	theme: null as Record<string, unknown> | null,
	/** Why the last read failed, or null. */
	error: null as Error | null,
};

/**
 * Sort a meta key list by display order, without changing the list given.
 *
 * @param value - The list as the server sent it.
 * @returns A sorted copy, or an empty list when the server sent none.
 */
const sortMetaKeys = <K extends { display_order: number }>(
	value: K[] | undefined,
): K[] =>
	Array.isArray(value)
		? [...value].sort((a, b) => a.display_order - b.display_order)
		: [];

/**
 * Default and sort the config's lists once, so no reader has to check or
 * sort them.
 *
 * @param data - The config as the server sent it.
 * @returns The config, with every list present and the meta keys sorted.
 */
const normalizeConfig = (data: SystemConfig): SystemConfig => ({
	...data,
	logins: isRecord(data.logins) ? data.logins : {},
	availableProviders: Array.isArray(data.availableProviders)
		? data.availableProviders
		: [],
	databaseMetaKeys: sortMetaKeys(data.databaseMetaKeys),
	projectMetaKeys: sortMetaKeys(data.projectMetaKeys),
});

/**
 * Parse the config's theme from its `THEME_MAP`, a JSON string.
 *
 * @param config - The config.
 * @returns The theme, or null when there is none or it is not a JSON object
 * (an array counts as none).
 */
const parseTheme = (config: SystemConfig): Record<string, unknown> | null => {
	const themeMap = config.theme?.THEME_MAP;
	if (typeof themeMap !== "string" || !themeMap) {
		return null;
	}

	// a broken theme falls back to each app's defaults rather than failing the page
	let theme = tryParseJson(themeMap);

	// some servers store the theme encoded twice, as a JSON string of JSON
	if (typeof theme === "string") {
		theme = tryParseJson(theme);
	}
	return isRecord(theme) ? theme : null;
};

/**
 * The system config, read from `/api/config` and shared by the page. It needs
 * no session: a signed out page reads it to offer its sign ins. The session
 * reads it again after each sign in and sign out, since the config names the
 * session's logins.
 *
 * There is normally one per page, {@link Config}, which the page's session
 * reads.
 *
 * @example
 * ```ts
 * const config = await Config.load();
 * config.availableProviders; // the sign ins the server offers
 *
 * Config.isAdminOnly("DATABASE", "add"); // whether only admins may add one
 * ```
 */
export class ConfigStore {
	/**
	 * The config, starting with nothing read; call `load` to read it. Held privately so the
	 * store's public types do not depend on how it is kept.
	 */
	private readonly state = new Observable<typeof EMPTY_SNAPSHOT>(
		EMPTY_SNAPSHOT,
	);

	/**
	 * Read the current state. The same object until it changes, as
	 * `useSyncExternalStore` requires.
	 *
	 * @returns The current state.
	 */
	getSnapshot = (): typeof EMPTY_SNAPSHOT => this.state.getSnapshot();

	/**
	 * Hear about every change to the state.
	 *
	 * @param listener - Called after each change; read the new state with
	 * `getSnapshot`.
	 * @returns Stops listening.
	 */
	subscribe = (listener: () => void): (() => void) =>
		this.state.subscribe(listener);

	/** The read in flight, joined by every caller. */
	private request: Promise<SystemConfig> | null = null;

	/**
	 * Counts reads: a reset or new read adds one, and a read whose count has
	 * moved on when it lands is dropped, so an older answer never overwrites a
	 * newer one.
	 */
	private version = 0;

	/**
	 * Read the config. A config already read is reused and a read in flight
	 * is joined, unless `force` is set.
	 *
	 * @param options - How to read.
	 * @param options.force - Read again even when the config is known, as
	 * after a sign in. Defaults to false.
	 * @returns The config.
	 * @throws When the config cannot be read. The store keeps any config it
	 * had, and shows the failure in `error`.
	 */
	load = ({
		force = false,
	}: {
		force?: boolean;
	} = {}): Promise<SystemConfig> => {
		const { config } = this.getSnapshot();

		// reuse what is known, or join the read already on its way
		if (!force && config) {
			return Promise.resolve(config);
		}
		if (!force && this.request) {
			return this.request;
		}

		const version = ++this.version;

		// only the first read shows as loading; a later one keeps the config on screen
		if (!config) {
			this.state.update({ status: "LOADING", error: null });
		}

		const request = getSystemConfig()
			.then((data) => {
				const next = normalizeConfig(data);

				// a newer read or a reset has started since; this answer is out of date
				if (version !== this.version) {
					return next;
				}

				// getSystemConfig keeps the token; the request interceptor also reads
				// this flag. It is only turned on, so a page that turned it on itself
				// keeps it.
				if (next.csrf === true) {
					Env.update({ CSRF: true });
				}

				this.state.set({
					status: "READY",
					config: next,
					theme: parseTheme(next),
					error: null,
				});
				return next;
			})
			.catch((error: unknown) => {
				if (version === this.version) {
					// keep a config already read; only a first read can fail the store
					const current = this.getSnapshot();
					this.state.update({
						status: current.config ? "READY" : "ERROR",
						error: toError(error),
					});
				}
				throw error;
			})
			.finally(() => {
				// a forced read may have replaced this one; only clear our own
				if (this.request === request) {
					this.request = null;
				}
			});

		this.request = request;
		return request;
	};

	/**
	 * Forget the config. A read in flight is dropped: it changes nothing when
	 * it lands.
	 */
	reset = (): void => {
		this.version++;
		this.request = null;
		this.state.set(EMPTY_SNAPSHOT);
	};

	/**
	 * Whether the config keeps an operation for admins. The backend always
	 * sends these flags; before the config is read, every operation counts as
	 * admin-only, and so does every operation on a guardrail, which has none.
	 *
	 * @param resource - The kind of resource.
	 * @param operation - The operation.
	 * @returns True when only admins may do it.
	 */
	isAdminOnly = (
		resource: keyof typeof ADMIN_ONLY_RESOURCES,
		operation: keyof typeof ADMIN_ONLY_OPERATIONS,
	): boolean => {
		const name = ADMIN_ONLY_RESOURCES[resource];
		return (
			name === null ||
			this.getSnapshot().config?.[
				`adminOnly${name}${ADMIN_ONLY_OPERATIONS[operation]}`
			] !== false
		);
	};
}

/** The page's system config, read by the page's {@link Session}. */
export const Config = new ConfigStore();
