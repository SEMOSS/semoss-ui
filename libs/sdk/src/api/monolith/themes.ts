/**
 * Admin (platform-wide) themes — `/api/themes`.
 *
 * Backend: `AdminThemeResource`
 * (Monolith/src/prerna/semoss/web/services/local/AdminThemeResource.java).
 * Rows are read in `AdminThemeUtils` (Semoss/src/prerna/theme/AdminThemeUtils.java)
 * from the `ADMIN_THEME` table without aliases, so keys are the upper-case
 * column names.
 *
 * Errors use `{ error }` instead of `{ errorMessage }`: 400 when the theme
 * database is missing, 401 when the session is invalid or the caller is not an
 * admin. A failed write answers 400 with the body `false`. All surface as
 * `ApiError`.
 */

import type { RequestOptions } from "../../lib/api-types";
import { get, post } from "../../utility/http";
import { path } from "../../utility/url";

/**
 * Reads the active admin theme. Any caller may read it (it is also embedded in
 * `GET /api/config` as `theme`).
 *
 * @name getActiveAdminTheme
 * @endpoint GET /api/themes/getActiveAdminTheme
 * @source Monolith/src/prerna/semoss/web/services/local/AdminThemeResource.java#getActiveAdminTheme
 * @param params - No parameters.
 * @param options - Per-call overrides (signal, headers).
 * @returns The active theme row, or `{}` when no theme is active.
 * @throws {ApiError} 400 if the theme database is not available.
 */
export function getActiveAdminTheme(
	params: Record<string, never> = {},
	options?: RequestOptions,
): Promise<
	| {
			ID: string;
			THEME_NAME: string;
			/** The theme as a JSON string. */
			THEME_MAP: string;
			IS_ACTIVE: boolean;
	  }
	| Record<string, never>
> {
	return get(path`/api/themes/getActiveAdminTheme`, params, options);
}

/**
 * Lists admin themes. Admin only.
 *
 * @name getAdminThemes
 * @endpoint GET /api/themes/getAdminThemes
 * @source Monolith/src/prerna/semoss/web/services/local/AdminThemeResource.java#getAdminThemes
 * @param params - Query parameters.
 * @param params.limit - Page size (`0` for no limit). Required: the backend fails when it is missing.
 * @param params.offset - Rows to skip. Required: the backend fails when it is missing.
 * @param options - Per-call overrides (signal, headers).
 * @returns One row per theme.
 * @throws {ApiError} 401 if the caller is not an admin; 400 if the theme database is not available; 500 when `limit` or `offset` is missing.
 */
export function getAdminThemes(
	params: { limit: number; offset: number },
	options?: RequestOptions,
): Promise<
	Array<{
		ID: string;
		THEME_NAME: string;
		THEME_MAP: string;
		IS_ACTIVE: boolean;
	}>
> {
	return get(path`/api/themes/getAdminThemes`, params, options);
}

/**
 * Creates an admin theme, optionally making it the active one. Admin only.
 *
 * @name createAdminTheme
 * @endpoint POST /api/themes/createAdminTheme
 * @source Monolith/src/prerna/semoss/web/services/local/AdminThemeResource.java#createAdminTheme
 * @param params - Form fields.
 * @param params.name - Theme name.
 * @param params.json - The theme definition (objects are JSON-stringified).
 * @param params.isActive - Make it the active theme.
 * @param options - Per-call overrides (signal, headers).
 * @returns `true`.
 * @throws {ApiError} 401 if the caller is not an admin; 400 if the theme database is missing or the insert fails.
 */
export function createAdminTheme(
	params: {
		name: string;
		json: string | Record<string, unknown>;
		isActive?: boolean;
	},
	options?: RequestOptions,
): Promise<true> {
	return post(path`/api/themes/createAdminTheme`, params, options);
}

/**
 * Updates an admin theme's name, definition and active flag. Admin only.
 *
 * @name editAdminTheme
 * @endpoint POST /api/themes/editAdminTheme
 * @source Monolith/src/prerna/semoss/web/services/local/AdminThemeResource.java#editAdminTheme
 * @param params - Form fields.
 * @param params.id - The theme id.
 * @param params.name - Theme name.
 * @param params.json - The theme definition (objects are JSON-stringified).
 * @param params.isActive - Make it the active theme.
 * @param options - Per-call overrides (signal, headers).
 * @returns `true`.
 * @throws {ApiError} 401 if the caller is not an admin; 400 if the theme database is missing or the update fails.
 */
export function editAdminTheme(
	params: {
		id: string;
		name: string;
		json: string | Record<string, unknown>;
		isActive?: boolean;
	},
	options?: RequestOptions,
): Promise<true> {
	return post(path`/api/themes/editAdminTheme`, params, options);
}

/**
 * Deletes an admin theme. Admin only.
 *
 * @name deleteAdminTheme
 * @endpoint POST /api/themes/deleteAdminTheme
 * @source Monolith/src/prerna/semoss/web/services/local/AdminThemeResource.java#deleteAdminTheme
 * @param params - Form fields.
 * @param params.id - The theme id.
 * @param options - Per-call overrides (signal, headers).
 * @returns `true`.
 * @throws {ApiError} 401 if the caller is not an admin; 400 if the theme database is missing or the delete fails.
 */
export function deleteAdminTheme(
	params: { id: string },
	options?: RequestOptions,
): Promise<true> {
	return post(path`/api/themes/deleteAdminTheme`, params, options);
}

/**
 * Makes one admin theme active and every other theme inactive. Admin only.
 *
 * @name setActiveAdminTheme
 * @endpoint POST /api/themes/setActiveAdminTheme
 * @source Monolith/src/prerna/semoss/web/services/local/AdminThemeResource.java#setActiveAdminTheme
 * @param params - Form fields.
 * @param params.id - The theme id.
 * @param options - Per-call overrides (signal, headers).
 * @returns `true`.
 * @throws {ApiError} 401 if the caller is not an admin; 400 if the theme database is missing or the update fails.
 */
export function setActiveAdminTheme(
	params: { id: string },
	options?: RequestOptions,
): Promise<true> {
	return post(path`/api/themes/setActiveAdminTheme`, params, options);
}

/**
 * Deactivates every admin theme, so the platform falls back to the default
 * look. Admin only.
 *
 * @name setAllAdminThemesInactive
 * @endpoint POST /api/themes/setAllAdminThemesInactive
 * @source Monolith/src/prerna/semoss/web/services/local/AdminThemeResource.java#setAllAdminThemesInactive
 * @param params - No parameters.
 * @param options - Per-call overrides (signal, headers).
 * @returns `true`.
 * @throws {ApiError} 401 if the caller is not an admin; 400 if the theme database is missing or the update fails.
 */
export function setAllAdminThemesInactive(
	params: Record<string, never> = {},
	options?: RequestOptions,
): Promise<true> {
	return post(path`/api/themes/setAllAdminThemesInactive`, params, options);
}
