/**
 * The signed-in user's own account — `/api/auth/user`.
 *
 * Backend: `UserAuthorizationResource`
 * (Monolith/src/prerna/semoss/web/services/local/auth/UserAuthorizationResource.java).
 * Response maps are built in `SecurityUserUtils`, `SecurityUserAccessKeyUtils`,
 * `SecurityPasswordResetUtils` and `SecurityNativeUserUtils`
 * (Semoss/src/prerna/auth/utils).
 *
 * Most endpoints accept a JSON body or form fields. Endpoints using
 * `ResourceUtility.respond` answer 401 when the session is invalid or
 * anonymous, 403 when the caller may not do it, 400 for bad input and 500 for
 * unexpected failures, each with an `{ errorMessage }` body (surfaced as
 * `ApiError`). The password and access-key endpoints build their own errors,
 * noted on each function.
 */

import type { RequestOptions } from "../../../types";
import { get, post } from "../../../utility/http";
import { path } from "../../../utility/url";

/**
 * Updates the caller's display name and email, and refreshes the session's
 * login details. Both columns are overwritten: an omitted field is saved as
 * empty.
 *
 * @name editUser
 * @endpoint POST /api/auth/user/editUser
 * @source Monolith/src/prerna/semoss/web/services/local/auth/UserAuthorizationResource.java#editUser
 * @param params - JSON body.
 * @param params.name - The new display name.
 * @param params.newEmail - The new email (validated, stored in lower case).
 * @param options - Per-call overrides (signal, headers).
 * @returns The fields that were sent, echoed back.
 * @throws {ApiError} 401 if the session is invalid or anonymous; 400 if the email is not valid or the body cannot be read.
 */
export function editUser(
	params: { name: string; newEmail: string },
	options?: RequestOptions,
): Promise<{ name?: string; newEmail?: string; [key: string]: unknown }> {
	return post(path`/api/auth/user/editUser`, params, options, {
		bodyType: "json",
	});
}

/**
 * Meant to delete the caller's account, but not implemented: after checking
 * the session it returns an empty response and deletes nothing.
 *
 * @name deleteUser
 * @endpoint POST /api/auth/user/deleteUser
 * @source Monolith/src/prerna/semoss/web/services/local/auth/UserAuthorizationResource.java#deleteUser
 * @param params - None.
 * @param options - Per-call overrides (signal, headers).
 * @returns Nothing (the backend returns no body).
 * @remarks Unverified response shape: the resource returns a `null` `Response`, which the server sends as an empty (204) response.
 * @throws {ApiError} 401 if the session is invalid.
 */
export function deleteUser(
	params: Record<string, never> = {},
	options?: RequestOptions,
): Promise<undefined> {
	return post(path`/api/auth/user/deleteUser`, params, options);
}

/**
 * Creates an access key for the caller's primary login, when the login
 * provider allows access keys. The secret key is returned only here.
 *
 * @name createUserAccessKey
 * @endpoint POST /api/auth/user/createUserAccessKey
 * @source Monolith/src/prerna/semoss/web/services/local/auth/UserAuthorizationResource.java#createUserAccessKey
 * @param params - Form fields.
 * @param params.tokenName - A name for the key (under 255 characters).
 * @param params.tokenDescription - A description (under 500 characters).
 * @param options - Per-call overrides (signal, headers).
 * @returns The new access key and secret key, with the name and description.
 * @throws {ApiError} 401 if the session is invalid or anonymous; 403 if access keys are not allowed for the login; 400 if the name or description is too long.
 */
export function createUserAccessKey(
	params: { tokenName?: string; tokenDescription?: string } = {},
	options?: RequestOptions,
): Promise<{
	ACCESSKEY: string;
	SECRETKEY: string;
	TOKENNAME?: string;
	TOKENDESCRIPTION?: string;
}> {
	return post(path`/api/auth/user/createUserAccessKey`, params, options);
}

/**
 * Deletes one of the caller's access keys.
 *
 * @name deleteUserAccessKey
 * @endpoint POST /api/auth/user/deleteUserAccessKey
 * @source Monolith/src/prerna/semoss/web/services/local/auth/UserAuthorizationResource.java#deleteUserAccessKey
 * @param params - Form fields.
 * @param params.accessKey - The access key to delete.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 401 if the session is invalid; 400 if `accessKey` is missing, the delete fails, or the key could not be deleted (then the body is `{ success: false }`).
 */
export function deleteUserAccessKey(
	params: { accessKey: string },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(path`/api/auth/user/deleteUserAccessKey`, params, options);
}

/**
 * Lists the access keys of the caller's primary login, without secrets.
 * Anonymous sessions may call it too.
 *
 * @name getUserAccessKeys
 * @endpoint GET /api/auth/user/getUserAccessKeys
 * @source Monolith/src/prerna/semoss/web/services/local/auth/UserAuthorizationResource.java#getUserAccessKeys
 * @param params - None.
 * @param options - Per-call overrides (signal, headers).
 * @returns One row per key (keys in upper case, as the query returns them).
 * @throws {ApiError} 401 if the session is invalid.
 */
export function getUserAccessKeys(
	params: Record<string, never> = {},
	options?: RequestOptions,
): Promise<
	Array<{
		TOKENNAME?: string;
		TOKENDESCRIPTION?: string;
		ACCESSKEY: string;
		DATECREATED?: string;
		LASTUSED?: string;
	}>
> {
	return get(path`/api/auth/user/getUserAccessKeys`, params, options);
}

/**
 * Starts a password reset: emails the user a link carrying a one-time token.
 * Needs no session. Disabled when only admins may change passwords.
 *
 * @name setupResetPassword
 * @endpoint POST /api/auth/user/setupResetPassword
 * @source Monolith/src/prerna/semoss/web/services/local/auth/UserAuthorizationResource.java#setupResetPassword
 * @param params - Form fields.
 * @param params.email - The account's email.
 * @param params.type - The account's login type (e.g. `"NATIVE"`).
 * @param params.url - The reset page; `?token=…` is appended. Defaults to `<server>/resetPassword/index.html`.
 * @param params.subject - The email subject.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true, message }`.
 * @throws {ApiError} 401 if users may not change their password or the reset is not allowed for the account; 400 if the body cannot be read; 500 if the email could not be sent.
 */
export function setupResetPassword(
	params: { email: string; type: string; url?: string; subject?: string },
	options?: RequestOptions,
): Promise<{ success: true; message: string }> {
	return post(path`/api/auth/user/setupResetPassword`, params, options);
}

/**
 * Sets a new password with a reset token from {@link setupResetPassword}, then
 * emails the user that it changed. Needs no session.
 *
 * @name resetPassword
 * @endpoint POST /api/auth/user/resetPassword
 * @source Monolith/src/prerna/semoss/web/services/local/auth/UserAuthorizationResource.java#resetPassword
 * @param params - Form fields.
 * @param params.token - The reset token.
 * @param params.password - The new password.
 * @param params.sender - The sender for the confirmation email.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true, userId, message }`.
 * @throws {ApiError} 401 if users may not change their password, or the token or password is not valid; 400 if the body cannot be read.
 */
export function resetPassword(
	params: { token: string; password: string; sender?: string },
	options?: RequestOptions,
): Promise<{ success: true; userId: string; message: string }> {
	return post(path`/api/auth/user/resetPassword`, params, options);
}

/**
 * Sets one of the caller's metadata values, replacing any value stored under
 * the key.
 *
 * @name setUserMetadata
 * @endpoint POST /api/auth/user/setUserMetadata
 * @source Monolith/src/prerna/semoss/web/services/local/auth/UserAuthorizationResource.java#setUserMetadata
 * @param params - JSON body.
 * @param params.metaKey - The metadata key.
 * @param params.metaValue - The value, or a list of values.
 * @param options - Per-call overrides (signal, headers).
 * @returns A confirmation message under `userMetadata`.
 * @throws {ApiError} 401 if the session is invalid or anonymous; 400 if `metaKey` or `metaValue` is missing or the body cannot be read.
 */
export function setUserMetadata(
	params: { metaKey: string; metaValue: string | string[] },
	options?: RequestOptions,
): Promise<{ userMetadata: string }> {
	return post(path`/api/auth/user/setUserMetadata`, params, options, {
		bodyType: "json",
	});
}

/**
 * Changes the caller's password after checking the current one. Only for
 * native logins.
 *
 * @name changePassword
 * @endpoint POST /api/auth/user/changePassword
 * @source Monolith/src/prerna/semoss/web/services/local/auth/UserAuthorizationResource.java#changePassword
 * @param params - Form fields.
 * @param params.currentPassword - The current password.
 * @param params.newPassword - The new password (must meet the password rules).
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true, userId, message }`.
 * @throws {ApiError} 401 if the current password is wrong or the new one is not valid (body `{ success: false, userId, message }`, so `ApiError.message` is generic — read `data.message`), or for any other failure, including an invalid session or a non-native login (body `{ errorMessage }`); 400 if a field is missing in a JSON body.
 */
export function changePassword(
	params: { currentPassword: string; newPassword: string },
	options?: RequestOptions,
): Promise<{ success: true; userId: string; message: string }> {
	return post(path`/api/auth/user/changePassword`, params, options);
}
