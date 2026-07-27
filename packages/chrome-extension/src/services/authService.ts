/**
 * Authentication Service for Chrome Extension
 * Handles Google OAuth authentication only
 */

import { escapePixelString, SemossClient } from "./semossClient";

/**
 * Base SEMOSS server URL (including the module path) used for the OAuth
 * session login. This mirrors the codebase OAuth flow in
 * libs/sdk/src/api/auth.ts, which uses the relative `Env.MODULE` prefix.
 * The extension is not served from the SEMOSS host, so an absolute URL is
 * required here.
 */

export interface OAuthUserInfo {
	name?: string;
	email?: string;
	id?: string;
}

export interface Project {
	id: string;
	name: string;
	displayName: string;
	canEdit: boolean;
}

// Response from MyProjects() reactor
interface MyProjectsResponse {
	project_id?: string;
	app_id?: string;
	project_name?: string;
	app_name?: string;
	project_display_name?: string;
	app_display_name?: string;
	project_user_permission?: number | string;
	app_user_permission?: number | string;
	user_permission?: number | string;
	tag?: string[] | string;
	app_tag?: string[] | string;
}

export class AuthService {
	private constructor() {
		// Prevent instantiation - this is a utility class with only static methods
	}

	/**
	 * Check the current OAuth session for a provider.
	 *
	 * Mirrors `GET ${MODULE}/api/auth/userinfo/${provider}` from the codebase
	 * (libs/sdk/src/api/auth.ts). A session is considered active only when the
	 * response contains a `name`.
	 */
	static async getOAuthUserInfo(
		provider: string,
	): Promise<OAuthUserInfo | null> {
		try {
			const response = await SemossClient.request(
				`/api/auth/userinfo/${provider}`,
			);

			if (!response.ok) {
				return null;
			}

			const data = (await response.json()) as OAuthUserInfo;
			return data?.name ? data : null;
		} catch {
			return null;
		}
	}

	/**
	 * Log in with an OAuth provider (e.g. "google").
	 *
	 * Replicates the exact flow from libs/sdk/src/api/auth.ts `oauth()`:
	 *   1. Check `userinfo` to see if the user is already logged in.
	 *   2. Open the backend login endpoint in a popup window.
	 *   3. Poll on an interval until the OAuth session is established (the
	 *      `userinfo` re-check returns a name) or the popup is closed.
	 *
	 * The popup-URL host check from the codebase cannot be used here because
	 * the popup lives on the SEMOSS origin (cross-origin to the extension), so
	 * we re-check `userinfo` on each tick instead. On success the SEMOSS
	 * session cookie is set and the extension marks itself authenticated.
	 */
	static async loginWithOAuth(provider: string): Promise<boolean> {
		// Already logged in?
		const existing = await AuthService.getOAuthUserInfo(provider);
		if (existing) {
			await AuthService.saveOAuthSession(provider, existing);
			return true;
		}

		// Open the backend login endpoint in a popup window.
		const baseUrl = await SemossClient.getBaseUrl();
		const url = `${baseUrl}/api/auth/login/${provider}`;
		const popup = window.open(
			url,
			"_blank",
			"height=600,width=400,top=300,left=600",
		);

		if (!popup) {
			throw new Error(
				"Unable to open the login window. Please allow popups and try again.",
			);
		}

		// Poll until the OAuth session is established or the popup closes.
		return new Promise<boolean>((resolve, reject) => {
			const interval = setInterval(async () => {
				try {
					const info = await AuthService.getOAuthUserInfo(provider);
					if (info) {
						clearInterval(interval);
						if (!popup.closed) {
							popup.close();
						}
						await AuthService.saveOAuthSession(provider, info);
						resolve(true);
						return;
					}

					if (popup.closed) {
						clearInterval(interval);
						reject(
							new Error(
								"Login window was closed before authentication completed.",
							),
						);
					}
				} catch {
					// Ignore transient errors while the popup is on the
					// provider's domain; the next tick will re-check.
				}
			}, 1000);
		});
	}

	/**
	 * Log in with native SEMOSS credentials (username/password).
	 *
	 * Opens the normal SEMOSS login UI, then polls /api/auth/userinfo/native
	 * to detect when authentication completes.
	 */
	static async loginWithNative(): Promise<boolean> {
		// Already logged in?
		const existing = await AuthService.getOAuthUserInfo("native");
		if (existing) {
			await AuthService.saveOAuthSession("native", existing);
			return true;
		}

		// Open the SEMOSS login UI instead of /api/auth/login/native. Native
		// username/password login is a POST to /api/auth/login.
		const url = await SemossClient.getUiLoginUrl();
		const popup = window.open(
			url,
			"_blank",
			"height=600,width=400,top=300,left=600",
		);

		if (!popup) {
			throw new Error(
				"Unable to open the login window. Please allow popups and try again.",
			);
		}

		// Poll until the native session is established or the popup closes.
		return new Promise<boolean>((resolve, reject) => {
			const interval = setInterval(async () => {
				try {
					const info = await AuthService.getOAuthUserInfo("native");
					if (info) {
						clearInterval(interval);
						if (!popup.closed) {
							popup.close();
						}
						await AuthService.saveOAuthSession("native", info);
						resolve(true);
						return;
					}

					if (popup.closed) {
						clearInterval(interval);
						reject(
							new Error(
								"Login window was closed before authentication completed.",
							),
						);
					}
				} catch {
					// Ignore transient errors during authentication;
					// the next tick will re-check.
				}
			}, 1000);
		});
	}

	/**
	 * Persist the authenticated OAuth session so the panel can react and the
	 * authentication banner clears.
	 */
	private static async saveOAuthSession(
		provider: string,
		info: OAuthUserInfo,
	): Promise<void> {
		await chrome.storage.local.set({
			isAuthenticated: true,
			authProvider: provider,
			userName: info.name ?? "",
			userEmail: info.email ?? "",
			authenticatedAt: Date.now(),
		});
	}

	/**
	 * Get stored projects from chrome storage
	 */
	static async getProjects(): Promise<Project[]> {
		const data = await chrome.storage.local.get(["projects"]);
		return data.projects || [];
	}

	/**
	 * Fetch user's accessible projects from SEMOSS (uses OAuth session)
	 */
	static async fetchProjectsFromSemoss(): Promise<Project[]> {
		// Use MyProjects() which is the standard reactor for getting user's projects
		const expression = `MyProjects();`;

		try {
			const projectsOutput =
				await SemossClient.runPixel<MyProjectsResponse[]>(expression);
			const projectsData = Array.isArray(projectsOutput)
				? projectsOutput
				: [];

			// Map to extension's Project interface
			const projects: Project[] = projectsData.map((p) => {
				const id = p.project_id || p.app_id || "";
				const name = p.project_name || p.app_name || "";
				const displayName =
					p.project_display_name || p.app_display_name || name;

				// Check permissions: owner (1) or edit (2) means canEdit
				const permission = Number(
					p.project_user_permission ||
						p.app_user_permission ||
						p.user_permission ||
						0,
				);
				const canEdit = permission >= 1 && permission <= 2;

				return {
					id,
					name,
					displayName,
					canEdit,
				};
			});

			// Store projects in chrome storage
			await chrome.storage.local.set({
				projects: projects,
			});

			return projects;
		} catch (error) {
			console.error("Failed to fetch projects from SEMOSS:", error);
			if (error instanceof Error) {
				throw new Error(`Failed to fetch projects: ${error.message}`);
			}
			throw new Error("Failed to fetch projects: Unknown error");
		}
	}

	/**
	 * Save selected project to chrome storage
	 */
	static async saveSelectedProject(projectId: string): Promise<void> {
		await chrome.storage.local.set({
			selectedProject: projectId,
		});
	}

	/**
	 * Get selected project from chrome storage
	 */
	static async getSelectedProject(): Promise<string | null> {
		const data = await chrome.storage.local.get(["selectedProject"]);
		return data.selectedProject || null;
	}

	/**
	 * Check if user is authenticated
	 */
	static async isAuthenticated(): Promise<boolean> {
		const data = await chrome.storage.local.get(["isAuthenticated"]);
		return data.isAuthenticated === true;
	}

	/**
	 * Clear all stored authentication state
	 */
	static async clearCredentials(): Promise<void> {
		await chrome.storage.local.remove([
			"isAuthenticated",
			"authProvider",
			"userName",
			"userEmail",
			"selectedProject",
			"projects",
			"authenticatedAt",
		]);
	}

	static async refreshAuthState(): Promise<boolean> {
		const data = await chrome.storage.local.get(["authProvider"]);
		const provider = data.authProvider || "native";
		const info = await AuthService.getOAuthUserInfo(provider);
		if (!info?.name) {
			await AuthService.clearCredentials();
			return false;
		}

		await AuthService.saveOAuthSession(provider, info);
		return true;
	}

	/**
	 * Create a new CODE project with portals enabled (uses OAuth session)
	 */
	static async createProject(projectName: string): Promise<string> {
		// CreateProjectReactor parameters: project name, type=CODE, global=true, hasPortal=true
		const expression = `CreateProject(project=["${escapePixelString(projectName)}"], projectType=["CODE"], global=[true], portal=[true]);`;

		try {
			const output = await SemossClient.runPixel<{
				project_id?: string;
				projectId?: string;
				id?: string;
			}>(expression);
			const projectId =
				output.project_id || output.projectId || output.id;

			if (!projectId) {
				throw new Error("No project ID returned from CreateProject");
			}

			return projectId;
		} catch (error) {
			if (error instanceof Error) {
				throw new Error(`Project creation error: ${error.message}`);
			}
			throw new Error("Project creation failed: Unknown error");
		}
	}

	/**
	 * Create portal from bundled template (no external dependencies).
	 * Sends the portal HTML directly to SEMOSS to avoid git cloning issues.
	 */
	static async createPortalFromTemplate(projectId: string): Promise<void> {
		// Fetch the bundled portal template
		const portalHtmlUrl = chrome.runtime.getURL("src/portals/index.html");
		const response = await fetch(portalHtmlUrl);
		const portalHtml = await response.text();

		// Replace the placeholder APP ID with the actual project ID
		const updatedHtml = portalHtml.replace(
			/"APP":\s*"[^"]*"/,
			`"APP": "${projectId}"`,
		);

		// Send to SEMOSS using a new reactor that saves portal HTML directly
		const expression = `CreateProjectPortalFromTemplate(project=["${escapePixelString(projectId)}"], htmlContent=["${escapePixelString(updatedHtml)}"]);`;

		try {
			await SemossClient.runPixel(expression);
		} catch (error) {
			if (error instanceof Error) {
				throw new Error(`Portal creation error: ${error.message}`);
			}
			throw new Error("Portal creation failed: Unknown error");
		}
	}

	/**
	 * Add MCP and PLAYWRIGHT tags to a project so it shows up in playground (uses OAuth session)
	 */
	static async addPlaywrightTags(projectId: string): Promise<void> {
		// Use SetProjectMetadata reactor to add tags
		const expression = `SetProjectMetadata(project=["${escapePixelString(projectId)}"], meta=[{"tag":["MCP", "PLAYWRIGHT"]}]);`;

		try {
			await SemossClient.runPixel(expression);
		} catch (error) {
			if (error instanceof Error) {
				throw new Error(`Tag addition error: ${error.message}`);
			}
			throw new Error("Failed to add tags: Unknown error");
		}
	}
}
