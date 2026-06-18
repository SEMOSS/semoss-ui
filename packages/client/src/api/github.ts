import { Env } from "@semoss/sdk/react";

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
 * Throws an Error carrying the backend `reason` when the response failed or the
 * body reports `status: "error"`. Callers surface the message in a toast.
 */
const throwIfError = (
	response: Response,
	body: GithubErrorBody | null,
): void => {
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
 * Persists the project → repo link the user chose, including the branch to
 * track. The backend takes the authoritative repo full name from GitHub, so
 * only the ids + branch are sent (as query params, matching the servlet).
 */
export const selectRepo = async (input: {
	projectId: string;
	installationId: number | string;
	repoId: number | string;
	branch: string;
}): Promise<{ repoFullName: string }> => {
	const response = await fetch(
		buildUrl("/github/install/select", {
			projectId: input.projectId,
			installationId: String(input.installationId),
			repoId: String(input.repoId),
			branch: input.branch,
		}),
		{
			method: "POST",
			credentials: "include",
			headers: { Accept: "application/json" },
		},
	);
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

/** Convenience: the github.com URL for a `owner/repo` full name. */
export const repoHtmlUrl = (repoFullName: string): string =>
	`https://github.com/${repoFullName}`;
