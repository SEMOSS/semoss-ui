/**
 * Sign in, sign out and login configuration — `/api/auth`.
 *
 * Backend: `UserResource`
 * (Monolith/src/prerna/semoss/web/services/local/UserResource.java).
 * Login maps come from `User`, `AccessToken` and `SocialPropertiesUtil`
 * (Semoss/src/prerna/auth, Semoss/src/prerna/util).
 *
 * Errors are `{ errorMessage }` maps (surfaced as `ApiError`), except the
 * login-property admin routes, which answer a bare string with a 400.
 *
 * The login endpoints (`login`, `loginLDAP`, `loginLinOTP`) and `logout`
 * redirect by default: the server answers 302 with a `redirect` header (or a
 * `Location` to the main page), which surfaces as `ApiError` / `onRedirect`.
 * Pass `disableRedirect: true` to get the JSON body instead.
 *
 * OAuth logins are browser navigations, so they are exposed as URL builders
 * ({@link loginUrl}, {@link login2Url}) rather than fetch calls.
 */

import { ApiClient } from "../../lib/api-client";
import type { RequestOptions } from "../../types";
import { get, post } from "../../utility/http";
import { path, url } from "../../utility/url";

/**
 * Lists the providers the current session is signed in with. When nobody is
 * signed in the session cookie is expired and the map holds only
 * `{ ANONYMOUS: "Sign In" }` when anonymous users are enabled, or is empty.
 *
 * @name logins
 * @endpoint GET /api/auth/logins
 * @source Monolith/src/prerna/semoss/web/services/local/UserResource.java#getAllLogins
 * @param params - No parameters.
 * @param options - Per-call overrides (signal, headers).
 * @returns Display name per provider, keyed by the upper-case provider name (e.g. `NATIVE`, `MS`).
 * @throws {ApiError} On an unexpected server failure.
 */
export function logins(
	params: Record<string, never> = {},
	options?: RequestOptions,
): Promise<Record<string, string>> {
	return get(path`/api/auth/logins`, params, options);
}

/**
 * Signs out of one provider, or of every provider with `provider: "ALL"`.
 * When no login remains the session is invalidated and its cookie expired;
 * unless `disableRedirect` is set the server then answers 302 with a
 * `redirect` header (custom logout URL, logout page or login page), which
 * surfaces as `ApiError`. For `"ALL"` the client session (CSRF token and
 * cookies) is always cleared afterwards; for a single provider it is kept,
 * because the session survives while other logins remain.
 *
 * @name logout
 * @endpoint GET /api/auth/logout/{provider}
 * @source Monolith/src/prerna/semoss/web/services/local/UserResource.java#logout
 * @param params - Path and query parameters.
 * @param params.provider - The provider to sign out of (e.g. `"NATIVE"`, `"MS"`), or `"ALL"`.
 * @param params.disableRedirect - Answer 200 JSON instead of a 302 redirect when the session ends. Defaults to `true`, since a script cannot follow the redirect; pass `false` for the server's redirect.
 * @param options - Per-call overrides (signal, headers).
 * @returns `success` is `true` when a login was removed.
 * @throws {ApiError} 400 if nobody is signed in; 302 (redirect) when the session ends without `disableRedirect`; 500 for an unknown provider.
 */
export function logout(
	params: { provider: string; disableRedirect?: boolean },
	options?: RequestOptions,
): Promise<{ success: boolean }> {
	const { provider, ...query } = params;
	return get<{ success: boolean }>(
		path`/api/auth/logout/${provider}`,
		{ disableRedirect: true, ...query },
		options,
	).finally(() => {
		if (provider.toUpperCase() === "ALL") {
			ApiClient.clear();
		}
	});
}

/**
 * Re-reads the signed-in user's profile from an OAuth provider using the
 * session's access token for it. When nobody is signed in, or the provider
 * call fails, it still answers 200 with only an `errorMessage` such as
 * `"Log into your Microsoft account"`.
 *
 * @name userinfo
 * @endpoint GET /api/auth/userinfo/{provider}
 * @source Monolith/src/prerna/semoss/web/services/local/UserResource.java#userinfoGeneric
 * @param params - Path parameters.
 * @param params.provider - The provider path key (e.g. `"google"`, `"ms"`, `"microsoft"`).
 * @param options - Per-call overrides (signal, headers).
 * @returns The provider profile (`AccessToken.toProviderMap`, without the token or dates), or `{ errorMessage }`.
 * @throws {ApiError} On an unexpected server failure.
 */
export function userinfo(
	params: { provider: string },
	options?: RequestOptions,
): Promise<
	| {
			id: string;
			name: string;
			username: string;
			email: string;
			meta?: Record<string, string[]>;
			san?: Record<string, string>;
			groupInfo: { groupType?: string; groups?: string[] };
			userEpoch?: string;
	  }
	| { errorMessage: string }
> {
	const { provider } = params;
	return get(path`/api/auth/userinfo/${provider}`, {}, options);
}

/**
 * URL that starts (and receives the callback of) an OAuth login. Navigate the
 * browser or a popup to it: the server redirects to the provider, and after
 * the callback redirects to the main page, to `redirect`, or — with
 * `disableRedirect` — ends on a page that closes its window. Covers the
 * named routes (`adfs`, `dropbox`, `github`, `gitlab`, `google`, `linkedin`,
 * `microsoft`, `okta`, `salesforce`, `servicenow`, `siteminder`,
 * `surveymonkey`, `twitter`) and any config-driven provider.
 *
 * @name loginUrl
 * @endpoint GET /api/auth/login/{provider}
 * @source Monolith/src/prerna/semoss/web/services/local/UserResource.java#loginGeneric
 * @param params - Path and query parameters.
 * @param params.provider - The social.properties provider key, e.g. `"google"` or `"microsoft"` (`"ms"` is a deprecated alias).
 * @param params.redirect - Where to send the browser after a successful login.
 * @param params.disableRedirect - End on a self-closing page instead of redirecting (for popups).
 * @returns The absolute or base-relative URL.
 */
export function loginUrl(params: {
	provider: string;
	redirect?: string;
	disableRedirect?: boolean;
}): string {
	const { provider, ...query } = params;
	return url(path`/api/auth/login/${provider}`, query);
}

/**
 * URL that starts (and receives the callback of) an OAuth login whose client
 * credentials come from a saved external connector rather than
 * social.properties. Navigate the browser or a popup to it.
 *
 * @name login2Url
 * @endpoint GET /api/auth/login2/{provider}
 * @source Monolith/src/prerna/semoss/web/services/local/UserResource.java#loginJiraDynamic
 * @param params - Path and query parameters.
 * @param params.provider - `"jira"`, `"salesforce"` or `"servicenow"`.
 * @param params.connectionId - The external connector holding the client id/secret.
 * @param params.redirect - Where to send the browser after a successful login.
 * @param params.disableRedirect - End on a self-closing page instead of redirecting (for popups).
 * @returns The absolute or base-relative URL.
 */
export function login2Url(params: {
	provider: "jira" | "salesforce" | "servicenow";
	connectionId: string;
	redirect?: string;
	disableRedirect?: boolean;
}): string {
	const { provider, ...query } = params;
	return url(path`/api/auth/login2/${provider}`, query);
}

/**
 * Signs in with a native (SEMOSS-managed) username and password and adds the
 * login to the session. Requires native logins to be enabled.
 *
 * @name login
 * @endpoint POST /api/auth/login
 * @source Monolith/src/prerna/semoss/web/services/local/UserResource.java#loginNative
 * @param params - Form fields.
 * @param params.username - The username.
 * @param params.password - The password.
 * @param params.redirect - Where the server should redirect after login (ignored with `disableRedirect`).
 * @param params.disableRedirect - Answer the JSON body instead of a 302 redirect. Defaults to `true`, since a script cannot follow the redirect; pass `false` for the server's redirect.
 * @param options - Per-call overrides (signal, headers).
 * @returns The signed-in user (unless `disableRedirect` is `false`, when the server redirects).
 * @throws {ApiError} 400 if native login is disabled; 401 for empty or invalid credentials; 500 on failure.
 */
export function login(
	params: {
		username: string;
		password: string;
		redirect?: string;
		disableRedirect?: boolean;
	},
	options?: RequestOptions,
): Promise<{
	success: "true";
	username: string;
	name?: string;
	email?: string;
}> {
	return post(
		path`/api/auth/login`,
		{ disableRedirect: true, ...params },
		options,
	);
}

/**
 * Signs in against the configured LDAP / Active Directory server and adds the
 * login to the session, creating the user when `ldap_auto_add` is on.
 *
 * @name loginLDAP
 * @endpoint POST /api/auth/loginLDAP
 * @source Monolith/src/prerna/semoss/web/services/local/UserResource.java#loginLDAP
 * @param params - Form fields.
 * @param params.username - The LDAP username.
 * @param params.password - The LDAP password.
 * @param params.disableRedirect - Answer the JSON body instead of a 302 redirect. Defaults to `true`, since a script cannot follow the redirect; pass `false` for the server's redirect.
 * @param options - Per-call overrides (signal, headers).
 * @returns The signed-in username (unless `disableRedirect` is `false`).
 * @throws {ApiError} 400 if LDAP login is disabled; 401 for empty credentials, or with `data.requirePwdChange: true` when the password must be changed first (see {@link changeADPassword}); 500 for bad credentials or other failures.
 */
export function loginLDAP(
	params: { username: string; password: string; disableRedirect?: boolean },
	options?: RequestOptions,
): Promise<{ success: "true"; username: string }> {
	return post(
		path`/api/auth/loginLDAP`,
		{ disableRedirect: true, ...params },
		options,
	);
}

/**
 * Changes an Active Directory password with the user's current password.
 * Allowed when LDAP login is enabled or `linotp_check_ad` is on.
 *
 * @name changeADPassword
 * @endpoint POST /api/auth/changeADPassword
 * @source Monolith/src/prerna/semoss/web/services/local/UserResource.java#changeADPassword
 * @param params - Form fields.
 * @param params.username - The AD username.
 * @param params.curPassword - The current password.
 * @param params.newPassword - The new password.
 * @param options - Per-call overrides (signal, headers).
 * @returns The username whose password changed.
 * @throws {ApiError} 400 if not configured; 401 if a field is empty; 500 if the directory rejects the change.
 */
export function changeADPassword(
	params: { username: string; curPassword: string; newPassword: string },
	options?: RequestOptions,
): Promise<{ success: "true"; username: string }> {
	return post(path`/api/auth/changeADPassword`, params, options);
}

/**
 * Signs in with LinOTP two-factor authentication. Call it first with
 * `username` + `pin`; if LinOTP issues a challenge the response is
 * `{ OTP: "Please get OTP code." }` and the transaction is kept in the
 * session, so call it again with the `otp`. A successful login is added to the
 * session.
 *
 * @name loginLinOTP
 * @endpoint POST /api/auth/loginLinOTP
 * @source Monolith/src/prerna/semoss/web/services/local/UserResource.java#loginLinOTP
 * @param params - Form fields: either `username` + `pin` (first step) or `otp` (second step; the username comes from the session).
 * @param params.username - The username (first step).
 * @param params.pin - The PIN / password (first step).
 * @param params.otp - The one-time passcode (second step).
 * @param params.redirect - Where the server should redirect after login (ignored with `disableRedirect`).
 * @param params.disableRedirect - Answer the JSON body instead of a 302 redirect. Defaults to `true`, since a script cannot follow the redirect; pass `false` for the server's redirect.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ OTP: "Please get OTP code." }` when the PIN was accepted and a passcode is still needed, or `{ success: "true", username }` once signed in (`LinOTPUtil.login`).
 * @throws {ApiError} 400 if LinOTP login is disabled; 401 for missing or invalid credentials (`data.requirePwdChange` when the AD password must change); 500 on failure.
 */
export function loginLinOTP(
	params: ({ username: string; pin: string } | { otp: string }) & {
		redirect?: string;
		disableRedirect?: boolean;
	},
	options?: RequestOptions,
): Promise<{ success: "true"; username: string } | { OTP: string }> {
	return post(
		path`/api/auth/loginLinOTP`,
		{ disableRedirect: true, ...params },
		options,
	);
}

/**
 * Resets a user's LinOTP failed-attempt counter. Admin only.
 *
 * @name resetLinOTPFailCounter
 * @endpoint POST /api/auth/resetLinOTPFailCounter
 * @source Monolith/src/prerna/semoss/web/services/local/UserResource.java#resetLinOTPFailCounter
 * @param params - Form fields.
 * @param params.username - The LinOTP user to reset.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: "true", message: "Successful reset" }`.
 * @throws {ApiError} 500 if the caller is not signed in, not an admin, or the reset fails; other LinOTP status codes pass through.
 */
export function resetLinOTPFailCounter(
	params: { username: string },
	options?: RequestOptions,
): Promise<{ success: "true"; message: string }> {
	return post(path`/api/auth/resetLinOTPFailCounter`, params, options);
}

/**
 * Registers a new native user (the username is also the id). Requires native
 * logins and registration to be enabled. Does not sign the user in.
 *
 * @name createUser
 * @endpoint POST /api/auth/createUser
 * @source Monolith/src/prerna/semoss/web/services/local/UserResource.java#createNativeUser
 * @param params - Form fields.
 * @param params.username - The username / id.
 * @param params.name - Display name.
 * @param params.password - The password; must meet the password requirements.
 * @param params.email - Email address.
 * @param params.phone - Phone number.
 * @param params.phoneextension - Phone extension.
 * @param params.countrycode - Phone country code.
 * @param options - Per-call overrides (signal, headers).
 * @returns The created username.
 * @throws {ApiError} 400 if registration is disabled or the username/email exists; 500 if validation (e.g. password rules) fails.
 */
export function createUser(
	params: {
		username: string;
		name: string;
		password: string;
		email: string;
		phone?: string;
		phoneextension?: string;
		countrycode?: string;
	},
	options?: RequestOptions,
): Promise<{ success: "true"; username: string }> {
	return post(path`/api/auth/createUser`, params, options);
}

/**
 * Creates an API user and returns its client id and secret once. Requires
 * the `api_user` login; admin only when the server sets admin-only API user
 * creation.
 *
 * @name createAPIUser
 * @endpoint POST /api/auth/createAPIUser
 * @source Monolith/src/prerna/semoss/web/services/local/UserResource.java#createAPIUser
 * @param params - Form fields.
 * @param params.name - Display name of the API user.
 * @param options - Per-call overrides (signal, headers).
 * @returns The new credentials. The secret is not retrievable later.
 * @throws {ApiError} 400 if API users are disabled; 401 when admin-only and the caller is not an admin.
 */
export function createAPIUser(
	params: { name: string },
	options?: RequestOptions,
): Promise<{ clientId: string; secretKey: string }> {
	return post(path`/api/auth/createAPIUser`, params, options);
}

/**
 * Lists every login type and whether it is enabled. Public.
 *
 * @name loginsAllowed
 * @endpoint GET /api/auth/loginsAllowed
 * @source Monolith/src/prerna/semoss/web/services/local/UserResource.java#loginsAllowed
 * @param params - No parameters.
 * @param options - Per-call overrides (signal, headers).
 * @returns Enabled flag per login key (e.g. `native`, `ldap`, `google`, `registration`, `api_user`).
 * @throws {ApiError} On an unexpected server failure.
 */
export function loginsAllowed(
	params: Record<string, never> = {},
	options?: RequestOptions,
): Promise<Record<string, boolean>> {
	return get(path`/api/auth/loginsAllowed/`, params, options);
}

/**
 * Reads social.properties grouped by provider (the text before the first `_`
 * of each key). Admin only. Values include client secrets.
 *
 * @name loginProperties
 * @endpoint GET /api/auth/loginProperties
 * @source Monolith/src/prerna/semoss/web/services/local/UserResource.java#loginProperties
 * @param params - No parameters.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ [provider]: { [keyWithoutPrefix]: value } }`.
 * @throws {ApiError} 401 if nobody is signed in or the caller is not an admin.
 */
export function loginProperties(
	params: Record<string, never> = {},
	options?: RequestOptions,
): Promise<Record<string, Record<string, string>>> {
	return get(path`/api/auth/loginProperties/`, params, options);
}

/**
 * Updates social.properties keys for one provider. Admin only; the change is
 * audited (keys only, not values).
 *
 * @name modifyLoginProperties
 * @endpoint POST /api/auth/modifyLoginProperties/{provider}
 * @source Monolith/src/prerna/semoss/web/services/local/UserResource.java#modifyLoginProperties
 * @param params - Path parameter and form fields.
 * @param params.provider - The provider prefix (e.g. `"google"`).
 * @param params.modifications - Keys (without the provider prefix) to new values.
 * @param options - Per-call overrides (signal, headers).
 * @returns `true`.
 * @throws {ApiError} 400 if nobody is signed in or the caller is not an admin; 500 if the file cannot be written.
 */
export function modifyLoginProperties(
	params: { provider: string; modifications: Record<string, string> },
	options?: RequestOptions,
): Promise<true> {
	const { provider, ...form } = params;
	return post(
		path`/api/auth/modifyLoginProperties/${provider}`,
		form,
		options,
	);
}

/**
 * Replaces the whole social.properties file. Admin only; audited.
 *
 * @name modifyAllLoginProperties
 * @endpoint POST /api/auth/modifyAllLoginProperties
 * @source Monolith/src/prerna/semoss/web/services/local/UserResource.java#modifyAllLoginProperties
 * @param params - Form fields.
 * @param params.socialProperties - The full new file content.
 * @param options - Per-call overrides (signal, headers).
 * @returns `true`.
 * @throws {ApiError} 400 if nobody is signed in or the caller is not an admin; 500 if the content cannot be applied.
 */
export function modifyAllLoginProperties(
	params: { socialProperties: string },
	options?: RequestOptions,
): Promise<true> {
	return post(path`/api/auth/modifyAllLoginProperties`, params, options);
}

/**
 * Reads the raw social.properties file. Admin only. Includes client secrets.
 *
 * @name getAllLoginProperties
 * @endpoint GET /api/auth/getAllLoginProperties
 * @source Monolith/src/prerna/semoss/web/services/local/UserResource.java#getAllLoginProperties
 * @param params - No parameters.
 * @param options - Per-call overrides (signal, headers).
 * @returns The file text in `content`.
 * @throws {ApiError} 400 if nobody is signed in or the caller is not an admin; 500 if the file cannot be read.
 */
export function getAllLoginProperties(
	params: Record<string, never> = {},
	options?: RequestOptions,
): Promise<{ content: string }> {
	return get(path`/api/auth/getAllLoginProperties`, params, options);
}

/**
 * Says who the request belongs to: the servlet container principal (with
 * Windows groups under Waffle/IWA), or else the primary login id of the
 * session user. Always 200.
 *
 * @name whoami
 * @endpoint GET /api/auth/whoami
 * @source Monolith/src/prerna/semoss/web/services/local/UserResource.java#show
 * @param params - No parameters.
 * @param options - Per-call overrides (signal, headers).
 * @returns `name` (and `groups` for a Windows principal, `warning` when taken from the session user), or `{ errorMessage: "null principal" }`.
 * @throws {ApiError} On an unexpected server failure.
 */
export function whoami(
	params: Record<string, never> = {},
	options?: RequestOptions,
): Promise<{
	name?: string;
	groups?: Array<{ name: string; domain: string; fqn: string; sid: string }>;
	warning?: string;
	errorMessage?: string;
}> {
	return get(path`/api/auth/whoami`, params, options);
}
