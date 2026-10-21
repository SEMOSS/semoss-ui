/**
 * Server configuration and discovery — `/api/config`.
 *
 * Backend: `ServerConfigurationResource`
 * (Monolith/src/prerna/semoss/web/services/config/ServerConfigurationResource.java).
 * The config map pulls from `AbstractSecurityUtils`, `SocialPropertiesUtil`,
 * `User`, `PasswordRequirements`, `AccessPermissionEnum`, `ConnectorScopeAccess`,
 * `AdminThemeUtils` and the `Security*Utils#getMetakeyOptions` helpers
 * (Semoss/src/prerna/**).
 *
 * All endpoints are public; they work with or without a signed-in user.
 */

import type { RequestOptions } from "@/types";
import { get } from "@/utility/http";
import { path } from "@/utility/url";

/**
 * Reads the server configuration the UI boots from: feature flags, admin-only
 * restrictions, login providers, password rules, the session's logins, the
 * active theme and metadata-key options. Without a signed-in user, stale
 * session cookies are expired and the session created for the call is
 * dropped. Never cached.
 *
 * @name getConfig
 * @endpoint GET /api/config
 * @source Monolith/src/prerna/semoss/web/services/config/ServerConfigurationResource.java#getServerConfig
 * @param params - No parameters.
 * @param options - Per-call overrides (signal, headers).
 * @returns The configuration map. The typed keys are always present unless marked optional; every `adminOnly*` key is a boolean.
 * @throws {ApiError} On an unexpected server failure.
 */
export function getConfig(
	params: Record<string, never> = {},
	options?: RequestOptions,
): Promise<{
	r: boolean;
	python: boolean;
	security: true;
	anonymousUsers: boolean;
	anonymousUserUploadData: boolean;
	useLogoutPage: boolean;
	/** Max upload size, when `FILE_TRANSFER_LIMIT` is set. */
	"file-limit"?: number;
	fileSharedPath?: string;
	version?: { version: string; datetime: string };
	defaultFrameType: string;
	defaultScriptingLanguage: string;
	localDeployment: boolean;
	cacheInsightByDefault: boolean;
	cacheInsightMinutes: number;
	cacheInsightEncrypt: boolean;
	cacheCron: string | null;
	showWelcomeBanner: boolean;
	/** Permission name to id, e.g. `{ OWNER: 1, EDIT: 2, READ_ONLY: 3 }`. */
	permissionMappingString: Record<string, number>;
	/** Permission id to name. */
	permissionMappingInteger: Record<string, string>;
	pipelineLandingFilter: unknown;
	pipelineSourceFilter: unknown;
	widgetTabShareExportList: unknown;
	adminOnlyViewMenuBarFlag: boolean;
	adminOnlyNonAprrovedFlag: boolean;
	applicationUrl: string | null;
	/** Session timeout in minutes. */
	timeout: number;
	loginsAllowed: Record<string, boolean>;
	availableProviders: Array<{
		name: string;
		provider: string;
		isOauth: boolean;
		label: string;
	}>;
	nativeRegistration: boolean;
	msGraphLookup: boolean;
	passwordRequirements?: {
		minPassLength: number;
		requireUpperCase: boolean;
		requireLowerCase: boolean;
		requireNumeric: boolean;
		requireSpecial: boolean;
		passwordExpirationDays: number;
		requireAdminResetForExpiration: boolean;
		allowUserChangePassword: boolean;
		passReuseCount: number;
		daysToLock: number;
		daysToLockEmail: number;
		[key: string]: unknown;
	};
	/** Display name per signed-in provider, keyed by upper-case provider. */
	logins: Record<string, string>;
	/** Id and name per signed-in provider. */
	loginDetails: Record<string, { id: string; name: string; san?: unknown }>;
	/** The provider the session belongs to, upper-case. */
	primaryLogin?: string;
	/** Signed-in users only: whether each connector app can work, by provider label then app. */
	connectorAccess?: Record<string, Record<string, boolean>>;
	/** The active admin theme row, or `{}`. */
	theme: Record<string, unknown>;
	csrf: boolean;
	databaseMetaKeys: Array<{
		metakey: string;
		single_multi: string;
		display_order: number;
		display_options: string | null;
		display_values: string | null;
	}>;
	engineMetaKeys: Array<{
		metakey: string;
		single_multi: string;
		display_order: number;
		display_options: string | null;
		display_values: string | null;
	}>;
	projectMetaKeys: Array<{
		metakey: string;
		single_multi: string;
		display_order: number;
		display_options: string | null;
		display_values: string | null;
	}>;
	insightMetaKeys: Array<{
		metakey: string;
		single_multi: string;
		display_order: number;
		display_options: string | null;
		display_values: string | null;
	}>;
	userMetaKeys: Array<{
		metakey: string;
		single_multi: string;
		display_order: number;
		display_options: string | null;
		display_values: string | null;
	}>;
	notificationEnabled: boolean;
	auditLogEnabled: boolean;
	/** Current server time (UTC). */
	systemDate: string;
	[adminOnlyFlag: string]: unknown;
}> {
	return get(path`/api/config`, params, options);
}

/**
 * Creates the session so the CSRF filter can issue a token. The token comes
 * back in the `X-CSRF-Token` response header when the request sends
 * `X-CSRF-Token: Fetch`; the transport already does this on the first write,
 * so call it directly only to warm the session.
 *
 * @name fetchCsrf
 * @endpoint GET /api/config/fetchCsrf
 * @source Monolith/src/prerna/semoss/web/services/config/ServerConfigurationResource.java#fetchCsrf
 * @param params - No parameters.
 * @param options - Per-call overrides (signal, headers), e.g. `{ headers: { "X-CSRF-Token": "Fetch" } }`.
 * @returns `true`.
 * @throws {ApiError} On an unexpected server failure.
 */
export function fetchCsrf(
	params: Record<string, never> = {},
	options?: RequestOptions,
): Promise<true> {
	return get(path`/api/config/fetchCsrf`, params, options);
}

/**
 * Lists every JAX-RS endpoint of the `/api` application, sorted by path then
 * method. Resources whose class name starts with `Admin` are included only for
 * signed-in admins.
 *
 * @name endpoints
 * @endpoint GET /api/config/endpoints
 * @source Monolith/src/prerna/semoss/web/services/config/ServerConfigurationResource.java#listEndpoints
 * @param params - No parameters.
 * @param options - Per-call overrides (signal, headers).
 * @returns The context path, the endpoint count, whether admin resources are included, and one entry per endpoint (`path` is relative to `/api`).
 * @throws {ApiError} On an unexpected server failure.
 */
export function endpoints(
	params: Record<string, never> = {},
	options?: RequestOptions,
): Promise<{
	contextPath: string;
	count: number;
	includesAdminResources: boolean;
	endpoints: Array<{
		method: string;
		path: string;
		resource: string;
		operation: string;
		consumes?: string[];
		produces?: string[];
	}>;
}> {
	return get(path`/api/config/endpoints`, params, options);
}
