/**
 * GitHub App linking for projects — `/github`.
 *
 * Backend: `GitHubService`
 * (Monolith/src/prerna/semoss/web/github/GitHubService.java), registered by
 * `GitHubApplication`. Links are stored by `SecurityExternalConnectorsUtils`
 * (Semoss/src/prerna/auth/utils/SecurityExternalConnectorsUtils.java).
 *
 * Linking a project is owner-gated (`GitHubProjectGuard`): 400 when
 * `projectId` is missing, 401 without a login, 403 without owner access. The
 * installation and repo pickers are scoped to the caller's own GitHub access
 * through a user token kept in the session; without one they answer 401 with
 * `needsAuth: true`, and the browser has to visit {@link authorizeUrl}.
 * Errors are `{ status: "error", reason }` bodies (no `errorMessage`, so
 * `ApiError.message` is the generic status text; read `ApiError.data`).
 */

import type { RequestOptions } from "@/types";
import { del, get, post } from "@/utility/http";
import { path, url } from "@/utility/url";

/**
 * Reports whether this server has a GitHub App configured, so the connect UI
 * can hide itself. Any signed-in user may call it; no credentials are exposed.
 *
 * @name available
 * @endpoint GET /github/available
 * @source Monolith/src/prerna/semoss/web/github/GitHubService.java#available
 * @param params - Takes no parameters.
 * @param options - Per-call overrides (signal, headers).
 * @returns Whether an app with a slug is configured.
 * @throws {ApiError} 401 without a login.
 */
export function available(
	params: Record<string, never> = {},
	options?: RequestOptions,
): Promise<{ available: boolean }> {
	return get(path`/github/available`, params, options);
}

/**
 * Builds the URL the browser navigates to to install the GitHub App for a
 * project. The server stores `projectId` in the session and redirects (303) to
 * GitHub's install page; GitHub then returns to `/github/install/callback`,
 * which links the single granted repo or redirects to the repo picker.
 *
 * @name appUrl
 * @endpoint GET /github/install/app
 * @source Monolith/src/prerna/semoss/web/github/GitHubService.java#installApp
 * @param params - Query parameters.
 * @param params.projectId - The project to link. Not owner-checked by this route.
 * @returns The URL to open in the browser.
 */
export function appUrl(params: { projectId: string }): string {
	return url(path`/github/install/app`, params);
}

/**
 * Builds the URL the browser navigates to to authorize the GitHub App on the
 * user's behalf (requires owner access to the project). The server redirects
 * (303) to GitHub's OAuth page; GitHub returns to `/github/user/callback`,
 * which keeps the user token in the session and sends the user back to the
 * project.
 *
 * @name authorizeUrl
 * @endpoint GET /github/user/authorize
 * @source Monolith/src/prerna/semoss/web/github/GitHubService.java#userAuthorize
 * @param params - Query parameters.
 * @param params.projectId - The project to return to.
 * @returns The URL to open in the browser.
 */
export function authorizeUrl(params: { projectId: string }): string {
	return url(path`/github/user/authorize`, params);
}

/**
 * Lists the app installations the caller can access on GitHub, so a project
 * can be linked to an installation that already exists.
 *
 * @name installations
 * @endpoint GET /github/install/installations
 * @source Monolith/src/prerna/semoss/web/github/GitHubService.java#installInstallations
 * @param params - Query parameters.
 * @param params.projectId - The project being linked (owner access required).
 * @param options - Per-call overrides (signal, headers).
 * @returns One row per installation.
 * @throws {ApiError} 400 if no app is configured, 401 `needsAuth` without a GitHub user token, 403 without owner access, 502 if GitHub cannot be read.
 */
export function installations(
	params: { projectId: string },
	options?: RequestOptions,
): Promise<{
	status: "ok";
	installations: Array<{
		installationId: number;
		account: string;
		accountType: string;
		repositorySelection: string;
		suspended: boolean;
	}>;
}> {
	return get(path`/github/install/installations`, params, options);
}

/**
 * Lists the repositories of an installation that the caller can see, for the
 * repo picker.
 *
 * @name repos
 * @endpoint GET /github/install/repos
 * @source Monolith/src/prerna/semoss/web/github/GitHubService.java#installRepos
 * @param params - Query parameters.
 * @param params.projectId - The project being linked (owner access required).
 * @param params.installationId - The installation.
 * @param options - Per-call overrides (signal, headers).
 * @returns The repositories; `defaultBranch` is `"main"` for an empty repo.
 * @throws {ApiError} 400 without `installationId`, 401 `needsAuth` without a GitHub user token, 403 without owner access, 502 if GitHub cannot be read.
 */
export function repos(
	params: { projectId: string; installationId: string | number },
	options?: RequestOptions,
): Promise<{
	status: "ok";
	installationId: string;
	repos: Array<{ id: number; fullName: string; defaultBranch: string }>;
}> {
	return get(path`/github/install/repos`, params, options);
}

/**
 * Lists the branches of a repository, after confirming the caller can see
 * that repository in the installation.
 *
 * @name branches
 * @endpoint GET /github/install/branches
 * @source Monolith/src/prerna/semoss/web/github/GitHubService.java#installBranches
 * @param params - Query parameters.
 * @param params.projectId - The project being linked (owner access required).
 * @param params.installationId - The installation.
 * @param params.repoFullName - The repository as `owner/repo`.
 * @param options - Per-call overrides (signal, headers).
 * @returns The branch names.
 * @throws {ApiError} 400 without `installationId` / `repoFullName`, 401 `needsAuth` without a GitHub user token, 403 without owner access or when the repo is not visible to the caller, 502 if GitHub cannot be read.
 */
export function branches(
	params: {
		projectId: string;
		installationId: string | number;
		repoFullName: string;
	},
	options?: RequestOptions,
): Promise<{ status: "ok"; repoFullName: string; branches: string[] }> {
	return get(path`/github/install/branches`, params, options);
}

/**
 * Links a project to a repository (creating or re-pointing the link). The repo
 * must be visible to the caller in the installation; its full name is taken
 * from GitHub. Does not trigger a sync.
 *
 * @name select
 * @endpoint POST /github/install/select
 * @source Monolith/src/prerna/semoss/web/github/GitHubService.java#selectRepo
 * @param params - Form fields.
 * @param params.projectId - The project (owner access required).
 * @param params.installationId - The installation.
 * @param params.repoId - The numeric GitHub repo id.
 * @param params.branch - Branch to track; defaults to the repo's default branch (`"main"` for an empty repo).
 * @param params.subdir - Only sync this folder of the repo (monorepos); blank for the whole repo.
 * @param options - Per-call overrides (signal, headers).
 * @returns The linked repo.
 * @throws {ApiError} 400 for missing or non-numeric ids, no configured app, or a repo the installation cannot see; 401 `needsAuth` without a GitHub user token; 403 without owner access; 500 if the link cannot be saved; 502 if GitHub cannot be read.
 */
export function select(
	params: {
		projectId: string;
		installationId: string | number;
		repoId: string | number;
		branch?: string;
		subdir?: string;
	},
	options?: RequestOptions,
): Promise<{ status: "ok"; repoId: number; repoFullName: string }> {
	return post(path`/github/install/select`, params, options);
}

/**
 * Returns the repository a project is linked to, for the project's GitHub tab.
 *
 * @name link
 * @endpoint GET /github/project/link
 * @source Monolith/src/prerna/semoss/web/github/GitHubService.java#getLink
 * @param params - Query parameters.
 * @param params.projectId - The project (owner access required).
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ linked: false }`, or the stored link with `linked: true`.
 * @throws {ApiError} 400 without `projectId`, 401 without a login, 403 without owner access.
 */
export function link(
	params: { projectId: string },
	options?: RequestOptions,
): Promise<
	| { linked: false }
	| {
			linked: true;
			projectId: string;
			appId: number;
			installationId: number;
			repoId: number;
			repoFullName: string;
			branch: string;
			subdir: string | null;
			createdOn: string | null;
			updatedOn: string | null;
	  }
> {
	return get(path`/github/project/link`, params, options);
}

/**
 * Disconnects a project from its repository. Only removes the link; the app
 * stays installed on GitHub.
 *
 * @name deleteLink
 * @endpoint DELETE /github/project/link
 * @source Monolith/src/prerna/semoss/web/github/GitHubService.java#disconnect
 * @param params - Query parameters.
 * @param params.projectId - The project (owner access required).
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ status: "ok" }`.
 * @throws {ApiError} 400 without `projectId`, 401 without a login, 403 without owner access, 500 if the link cannot be removed.
 */
export function deleteLink(
	params: { projectId: string },
	options?: RequestOptions,
): Promise<{ status: "ok" }> {
	return del(path`/github/project/link`, params, options);
}

/**
 * Sets the branch a linked project tracks — the branch push webhooks sync the
 * project's local repo to.
 *
 * @name branch
 * @endpoint POST /github/project/branch
 * @source Monolith/src/prerna/semoss/web/github/GitHubService.java#setBranch
 * @param params - Form fields.
 * @param params.projectId - The project (owner access required).
 * @param params.branch - The branch name.
 * @param options - Per-call overrides (signal, headers).
 * @returns The trimmed branch name.
 * @throws {ApiError} 400 without `branch` or when the project is not linked, 401 without a login, 403 without owner access, 500 if it cannot be saved.
 */
export function branch(
	params: { projectId: string; branch: string },
	options?: RequestOptions,
): Promise<{ status: "ok"; branch: string }> {
	return post(path`/github/project/branch`, params, options);
}
