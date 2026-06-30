import { Env } from "@semoss/sdk/react";
import { toast } from "@semoss/ui/next";

/**
 * Project → GitHub repository link, as surfaced by the ProjectInfo reactor.
 * `linked: false` (or the field being absent) means the project is not
 * connected to a repo.
 */
export interface GithubLink {
	linked: boolean;
	repoId?: number | string;
	repoFullName?: string;
	installationId?: number | string;
	htmlUrl?: string;
	/** Branch the push webhook syncs the project's local repo to. */
	branch?: string;
	/** Optional subdirectory within the repo to sync (monorepo support). */
	subdir?: string;
}

/**
 * A GitHub App installation the logged-in user can link a project to, as
 * returned by `/github/install/installations`. An installation is the App
 * installed on one account (a user or an organization); each can grant access
 * to all repos or a hand-picked ("selected") subset.
 */
export interface GithubInstallation {
	installationId: number | string;
	/** Login of the account the App is installed on (e.g. "my-org"). */
	account: string;
	/** "Organization" or "User" — drives the "manage repos on GitHub" URL. */
	accountType?: string;
	/** "all" or "selected" — whether the App can see every repo or a subset. */
	repositorySelection?: string;
	/** Suspended installations can't be used until un-suspended on GitHub. */
	suspended?: boolean;
}

/** A repository a GitHub App installation can access. */
export interface GithubRepo {
	id: number | string;
	fullName: string;
	/** The repo's default branch (e.g. "main"), pre-selected in the branch picker. */
	defaultBranch?: string;
}

/** A project → repo link row, as listed on the admin settings page. */
export interface GithubProjectLink {
	projectId: string;
	appId?: number | string;
	installationId?: number | string;
	repoId?: number | string;
	repoFullName?: string;
	branch?: string;
	/** Optional subdirectory within the repo to sync (monorepo support). */
	subdir?: string;
	createdOn?: string;
	updatedOn?: string;
}

/**
 * Result of the `GitHubCheckInstallation` reactor — whether the GitHub App
 * installation a project is linked to is still valid (not uninstalled/suspended).
 */
export interface GithubInstallationCheck {
	project?: string;
	repo?: string;
	installationId?: number | string;
	installationValid?: boolean;
}

/**
 * A single webhook delivery row from the `GitHubWebhookDeliveries` reactor.
 * Mirrors the fields GitHub returns for /app/hook/deliveries.
 */
export interface GithubWebhookDelivery {
	id?: number;
	guid?: string;
	event?: string;
	action?: string;
	status?: string;
	statusCode?: number;
	deliveredAt?: string;
	duration?: number;
	redelivery?: boolean;
	installationId?: number;
	repositoryId?: number;
}

/** Shared error envelope used by the GitHub servlet endpoints. */
interface GithubErrorBody {
	status?: string;
	reason?: string;
	/**
	 * Set by the per-user-scoped picker endpoints when the logged-in user hasn't
	 * authorized their GitHub access (or it expired/was revoked). Recoverable via
	 * a one-time authorize redirect — not a hard error.
	 */
	needsAuth?: boolean;
}

/**
 * Thrown when a GitHub picker endpoint returns `401 { needsAuth: true }`. This
 * is an expected, recoverable state (the user must authorize their GitHub
 * access), not a failure — callers should redirect to the authorize flow via
 * {@link redirectToGithubAuthorize} / {@link handleNeedsAuth} rather than
 * surfacing an error toast.
 */
export class GithubNeedsAuthError extends Error {
	constructor(reason?: string) {
		super(reason || "GitHub authorization required");
		this.name = "GithubNeedsAuthError";
	}
}

const buildUrl = (path: string, params?: Record<string, string>): string => {
	const url = new URL(`${Env.MODULE}${path}`, window.location.origin);
	if (params) {
		for (const [key, value] of Object.entries(params)) {
			url.searchParams.set(key, value);
		}
	}
	return url.toString();
};

const readJson = async (response: Response): Promise<unknown> =>
	response.json().catch(() => null);

/**
 * Throws on a failed response. A `401 { needsAuth: true }` becomes a
 * {@link GithubNeedsAuthError} (recoverable re-auth, handled by redirecting to
 * the authorize flow); any other failure becomes a plain Error carrying the
 * backend `reason`, which callers surface in a toast.
 */
const throwIfError = (
	response: Response,
	body: GithubErrorBody | null,
): void => {
	if (body?.needsAuth) {
		throw new GithubNeedsAuthError(body.reason);
	}
	if (!response.ok || body?.status === "error") {
		throw new Error(body?.reason || `Request failed (${response.status})`);
	}
};

/**
 * Pre-flight: is an instance-level GitHub App configured? Safe for non-admins.
 * Resolves to `false` (rather than throwing) on any error so callers can simply
 * render the "not set up" state.
 */
export const isGithubAvailable = async (): Promise<boolean> => {
	try {
		const response = await fetch(buildUrl("/github/available"), {
			method: "GET",
			credentials: "include",
			headers: { Accept: "application/json" },
		});
		const body = (await readJson(response)) as {
			available?: boolean;
		} | null;
		return response.ok && body?.available === true;
	} catch {
		return false;
	}
};

/**
 * The project → repo link for a project, or `{ linked: false }` when the
 * project is not connected. Drives the project GitHub tab's state.
 */
export const getProjectLink = async (
	projectId: string,
): Promise<GithubLink> => {
	const response = await fetch(
		buildUrl("/github/project/link", { projectId }),
		{
			method: "GET",
			credentials: "include",
			headers: { Accept: "application/json" },
		},
	);
	const body = (await readJson(response)) as
		| (GithubErrorBody & GithubLink)
		| null;
	throwIfError(response, body);
	return body?.linked ? (body as GithubLink) : { linked: false };
};

/** Lists all project → repo links configured on the instance (admin only). */
export const getAllProjectLinks = async (): Promise<GithubProjectLink[]> => {
	const response = await fetch(buildUrl("/github/manifest/projects"), {
		method: "GET",
		credentials: "include",
		headers: { Accept: "application/json" },
	});
	const body = (await readJson(response)) as
		| (GithubErrorBody & { projects?: GithubProjectLink[] })
		| null;
	throwIfError(response, body);
	return Array.isArray(body?.projects) ? body.projects : [];
};

/**
 * Lists the GitHub App installations the user can link this project to (the App
 * installed across the user's accounts/orgs). Drives the connect-flow picker.
 * Requires owner access to `projectId`. Throws (with the backend `reason`) on
 * 400 ("no GitHub App is configured") or 502 ("unable to read installations").
 */
export const getInstallInstallations = async (
	projectId: string,
): Promise<GithubInstallation[]> => {
	const response = await fetch(
		buildUrl("/github/install/installations", { projectId }),
		{
			method: "GET",
			credentials: "include",
			headers: { Accept: "application/json" },
		},
	);
	const body = (await readJson(response)) as
		| (GithubErrorBody & { installations?: GithubInstallation[] })
		| null;
	throwIfError(response, body);
	return Array.isArray(body?.installations) ? body.installations : [];
};

/**
 * Lists every repo the given installation can access. Requires owner access to
 * `projectId` (the backend guards repo reads as part of linking a project).
 */
export const getInstallRepos = async (
	projectId: string,
	installationId: string,
): Promise<GithubRepo[]> => {
	const response = await fetch(
		buildUrl("/github/install/repos", { projectId, installationId }),
		{
			method: "GET",
			credentials: "include",
			headers: { Accept: "application/json" },
		},
	);
	const body = (await readJson(response)) as
		| (GithubErrorBody & { repos?: GithubRepo[] })
		| null;
	throwIfError(response, body);
	return Array.isArray(body?.repos) ? body.repos : [];
};

/**
 * Lists the branches of a repo an installation can access, for the branch
 * dropdown. Hits GitHub, so callers should show a loading state and handle the
 * 502 (GitHub unreachable / repo not accessible) by retrying or letting the
 * user type a branch name.
 */
export const getInstallBranches = async (
	projectId: string,
	installationId: string,
	repoFullName: string,
): Promise<string[]> => {
	const response = await fetch(
		buildUrl("/github/install/branches", {
			projectId,
			installationId,
			repoFullName,
		}),
		{
			method: "GET",
			credentials: "include",
			headers: { Accept: "application/json" },
		},
	);
	const body = (await readJson(response)) as
		| (GithubErrorBody & { branches?: string[] })
		| null;
	throwIfError(response, body);
	return Array.isArray(body?.branches) ? body.branches : [];
};

/**
 * Persists the project → repo link the user chose. The backend takes the
 * authoritative repo full name from GitHub, so only the ids (and optional
 * branch) are sent as query params, matching the servlet, and the resolved full
 * name is returned. Omitting `branch` lets the backend default to the repo's
 * default branch.
 */
export const selectRepo = async (input: {
	projectId: string;
	installationId: number | string;
	repoId: number | string;
	branch?: string;
	/** Subdirectory within the repo to sync. Empty/omitted = full repo. */
	subdir?: string;
}): Promise<{ repoFullName: string }> => {
	const params: Record<string, string> = {
		projectId: input.projectId,
		installationId: String(input.installationId),
		repoId: String(input.repoId),
	};
	if (input.branch) {
		params.branch = input.branch;
	}
	if (input.subdir?.trim()) {
		params.subdir = input.subdir.trim();
	}
	const response = await fetch(buildUrl("/github/install/select", params), {
		method: "POST",
		credentials: "include",
		headers: { Accept: "application/json" },
	});
	const body = (await readJson(response)) as
		| (GithubErrorBody & { repoFullName?: string })
		| null;
	throwIfError(response, body);
	return { repoFullName: body?.repoFullName ?? "" };
};

/** Unlinks the project from its repo. Does NOT uninstall the GitHub App. */
export const disconnectProject = async (projectId: string): Promise<void> => {
	const response = await fetch(
		buildUrl("/github/project/link", { projectId }),
		{
			method: "DELETE",
			credentials: "include",
			headers: { Accept: "application/json" },
		},
	);
	const body = (await readJson(response)) as GithubErrorBody | null;
	throwIfError(response, body);
};

/**
 * Sets the branch the push webhook tracks for a project (the branch a push must
 * target to sync the project). Returns the persisted branch.
 */
export const setProjectBranch = async (
	projectId: string,
	branch: string,
): Promise<{ branch: string }> => {
	const response = await fetch(
		buildUrl("/github/project/branch", { projectId, branch }),
		{
			method: "POST",
			credentials: "include",
			headers: { Accept: "application/json" },
		},
	);
	const body = (await readJson(response)) as
		| (GithubErrorBody & { branch?: string })
		| null;
	throwIfError(response, body);
	return { branch: body?.branch ?? branch };
};

/**
 * Full-page URL that kicks off the install flow for a project. Navigating here
 * (a top-level browser navigation, not fetch) 302-redirects to GitHub's install
 * screen; GitHub then bounces back through the install callback.
 */
export const buildInstallAppUrl = (projectId: string): string =>
	buildUrl("/github/install/app", { projectId });

/**
 * Full-page URL that starts the per-user GitHub authorization flow for a
 * project. Navigating here (top-level, not fetch) redirects to GitHub to
 * authorize the logged-in user's access (one click if previously authorized);
 * GitHub returns through a backend callback that lands the browser back on the
 * project page, where the picker flow can be retried.
 */
export const buildUserAuthorizeUrl = (projectId: string): string =>
	buildUrl("/github/user/authorize", { projectId });

/** Sends the browser to the per-user GitHub authorization flow. */
export const redirectToGithubAuthorize = (projectId: string): void => {
	window.location.assign(buildUserAuthorizeUrl(projectId));
};

/** How long to let the re-auth message show before the full-page redirect. */
const NEEDS_AUTH_REDIRECT_DELAY_MS = 1200;

/**
 * Single needsAuth handler: if `error` is a {@link GithubNeedsAuthError},
 * redirect to the authorize flow and return `true` (the page is now navigating
 * away, so the caller should stop). Otherwise return `false` so the caller can
 * handle it as a real error. Covers both the initial gate and a token that
 * silently expired mid-session.
 *
 * Pass a translated `message` to first show a toast explaining the redirect
 * (e.g. "GitHub authorization required — sending you to GitHub to authorize");
 * the navigation is then deferred briefly so the message is actually seen
 * before the page unloads.
 */
export const handleNeedsAuth = (
	error: unknown,
	projectId: string,
	message?: string,
): boolean => {
	if (!(error instanceof GithubNeedsAuthError)) {
		return false;
	}
	if (message) {
		toast.info(message);
	}
	window.setTimeout(
		() => redirectToGithubAuthorize(projectId),
		message ? NEEDS_AUTH_REDIRECT_DELAY_MS : 0,
	);
	return true;
};

/** Convenience: the github.com URL for a `owner/repo` full name. */
export const repoHtmlUrl = (repoFullName: string): string =>
	`https://github.com/${repoFullName}`;

/**
 * GitHub-side settings page where the user adjusts which repositories an
 * installation can access. Surfaced when an installation's `repositorySelection`
 * is "selected" and the repo the user wants isn't in the list. Organizations use
 * a different path than personal accounts.
 */
export const installationSettingsUrl = (installation: {
	installationId: number | string;
	account?: string;
	accountType?: string;
}): string =>
	installation.accountType === "Organization" && installation.account
		? `https://github.com/organizations/${installation.account}/settings/installations/${installation.installationId}`
		: `https://github.com/settings/installations/${installation.installationId}`;
