/**
 * GitHub App administration — `/github/manifest`.
 *
 * Backend: `AdminGitHubService`
 * (Monolith/src/prerna/semoss/web/github/AdminGitHubService.java), registered
 * by `GitHubApplication`. The app is stored by `SecurityExternalConnectorsUtils`
 * (Semoss/src/prerna/auth/utils/SecurityExternalConnectorsUtils.java).
 *
 * Every route is admin-only (`GitHubAdminGuard`): 401 without a login, 403 for
 * a non-admin. Errors are `{ status: "error", reason }` bodies (no
 * `errorMessage`, so `ApiError.message` is the generic status text; read
 * `ApiError.data`).
 */

import type { RequestOptions } from "../../lib/api-types";
import { del, get } from "../../lib/http";
import { path, url } from "../../lib/url";

/**
 * Builds the URL the admin's browser navigates to to create this server's
 * GitHub App through GitHub's manifest flow. The server answers with an
 * auto-submitting HTML form that posts the app manifest (push events,
 * read-only contents) to GitHub; GitHub then returns to
 * `/github/manifest/callback`, which saves the app and redirects to the
 * settings page.
 *
 * @name newUrl
 * @endpoint GET /github/manifest/new
 * @source Monolith/src/prerna/semoss/web/github/AdminGitHubService.java#createApp
 * @param params - Query parameters.
 * @param params.name - App name; defaults to `"Semoss GitHub App"`.
 * @param params.org - Create the app under this organization instead of the admin's account.
 * @param params.public - Make the app installable by anyone.
 * @returns The URL to open in the browser.
 */
export function newUrl(
	params: { name?: string; org?: string; public?: boolean } = {},
): string {
	return url(path`/github/manifest/new`, params);
}

/**
 * Lists the GitHub App configured on this server (today at most one), with the
 * client secret, webhook secret and private key removed.
 *
 * @name apps
 * @endpoint GET /github/manifest/apps
 * @source Monolith/src/prerna/semoss/web/github/AdminGitHubService.java#listApps
 * @param params - Takes no parameters.
 * @param options - Per-call overrides (signal, headers).
 * @returns The configured apps.
 * @throws {ApiError} 401 without a login, 403 if the caller is not an admin.
 */
export function apps(
	params: Record<string, never> = {},
	options?: RequestOptions,
): Promise<{
	apps: Array<{
		appId: number;
		slug: string;
		appName: string;
		ownerLogin: string;
		htmlUrl: string;
		webhookUrl: string;
		clientId: string;
		createdOn?: string;
		updatedOn?: string;
	}>;
}> {
	return get(path`/github/manifest/apps`, params, options);
}

/**
 * Lists every project linked to a GitHub repository on this server.
 *
 * @name projects
 * @endpoint GET /github/manifest/projects
 * @source Monolith/src/prerna/semoss/web/github/AdminGitHubService.java#listProjects
 * @param params - Takes no parameters.
 * @param options - Per-call overrides (signal, headers).
 * @returns One row per project link.
 * @throws {ApiError} 401 without a login, 403 if the caller is not an admin.
 */
export function projects(
	params: Record<string, never> = {},
	options?: RequestOptions,
): Promise<{
	projects: Array<{
		projectId: string;
		appId: number;
		installationId: number;
		repoId: number;
		repoFullName: string;
		branch: string;
		subdir?: string;
		createdOn?: string;
		updatedOn?: string;
	}>;
}> {
	return get(path`/github/manifest/projects`, params, options);
}

/**
 * Removes a GitHub App, and every project link that uses it, from this server.
 * The app registration itself must still be deleted on GitHub; the answer
 * carries its slug and URL for that.
 *
 * @name deleteApp
 * @endpoint DELETE /github/manifest/app
 * @source Monolith/src/prerna/semoss/web/github/AdminGitHubService.java#deleteApp
 * @param params - Query parameters.
 * @param params.appId - The GitHub app id; defaults to the one configured app.
 * @param options - Per-call overrides (signal, headers).
 * @returns The removed app's id, slug and GitHub URL, with instructions in `message`.
 * @throws {ApiError} 400 for a non-numeric `appId`, 401 without a login, 403 if the caller is not an admin, 404 if no app is configured, 500 if it cannot be deleted.
 */
export function deleteApp(
	params: { appId?: number | string } = {},
	options?: RequestOptions,
): Promise<{
	status: "ok";
	appId: number;
	slug: string;
	htmlUrl: string;
	message: string;
}> {
	return del(path`/github/manifest/app`, params, options);
}
