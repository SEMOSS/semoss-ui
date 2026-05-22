/**
 * Authentication Service for Chrome Extension
 * Handles credential management and Semoss API authentication
 */

export interface AuthCredentials {
	endpointUrl: string;
	clientKey: string;
	secretKey: string;
}

export interface Project {
	id: string;
	name: string;
	displayName: string;
	canEdit: boolean;
}

export interface AuthResponse {
	success: boolean;
	userId: string;
	userName: string;
	userEmail: string;
	projects: Project[];
}

export class AuthService {
	/**
	 * Validates credentials and fetches user's projects from Semoss
	 */
	static async authenticate(
		credentials: AuthCredentials,
	): Promise<AuthResponse> {
		const { endpointUrl, clientKey, secretKey } = credentials;

		if (!endpointUrl || !clientKey || !secretKey) {
			throw new Error(
				"Missing credentials. Please provide endpoint URL, client key, and secret key.",
			);
		}

		// Clean up endpoint URL (remove trailing slash)
		const cleanUrl = endpointUrl.replace(/\/$/, "");

		const expression = `AuthenticateExtensionUser(clientKey=["${clientKey}"], secretKey=["${secretKey}"]);`;

		try {
			const response = await fetch(`${cleanUrl}/api/engine/runPixel`, {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: new URLSearchParams({
					expression: expression,
				}),
			});

			if (!response.ok) {
				throw new Error(
					`Authentication failed: ${response.status} ${response.statusText}`,
				);
			}

			const rawData = await response.json();

			// Extract data from Pixel engine response wrapper
			let data: Partial<AuthResponse>;
			if (
				rawData.pixelReturn &&
				Array.isArray(rawData.pixelReturn) &&
				rawData.pixelReturn.length > 0
			) {
				// Pixel engine wraps response in pixelReturn array
				data = rawData.pixelReturn[0].output;
			} else {
				// Direct response (fallback)
				data = rawData;
			}

			if (!data || !data.success) {
				throw new Error("Authentication failed: Invalid credentials");
			}

			return data as AuthResponse;
		} catch (error) {
			if (error instanceof Error) {
				throw new Error(`Authentication error: ${error.message}`);
			}
			throw new Error("Authentication failed: Unknown error");
		}
	}

	/**
	 * Save credentials and authentication state to chrome storage
	 */
	static async saveCredentials(
		credentials: AuthCredentials,
		projects: Project[],
	): Promise<void> {
		await chrome.storage.local.set({
			endpointUrl: credentials.endpointUrl,
			clientKey: credentials.clientKey,
			secretKey: credentials.secretKey,
			isAuthenticated: true,
			projects: projects,
			authenticatedAt: Date.now(),
		});
	}

	/**
	 * Get stored credentials from chrome storage
	 */
	static async getCredentials(): Promise<AuthCredentials | null> {
		const data = await chrome.storage.local.get([
			"endpointUrl",
			"clientKey",
			"secretKey",
			"isAuthenticated",
		]);

		if (!data.isAuthenticated) {
			return null;
		}

		return {
			endpointUrl: data.endpointUrl,
			clientKey: data.clientKey,
			secretKey: data.secretKey,
		};
	}

	/**
	 * Get stored projects from chrome storage
	 */
	static async getProjects(): Promise<Project[]> {
		const data = await chrome.storage.local.get(["projects"]);
		return data.projects || [];
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
	 * Clear all stored credentials and authentication state
	 */
	static async clearCredentials(): Promise<void> {
		await chrome.storage.local.remove([
			"endpointUrl",
			"clientKey",
			"secretKey",
			"isAuthenticated",
			"selectedProject",
			"projects",
			"authenticatedAt",
		]);
	}

	/**
	 * Test connection to Semoss without saving credentials
	 */
	static async testConnection(
		credentials: AuthCredentials,
	): Promise<AuthResponse> {
		return AuthService.authenticate(credentials);
	}

	/**
	 * Create a new CODE project with portals enabled
	 */
	static async createProject(projectName: string): Promise<string> {
		const credentials = await AuthService.getCredentials();
		if (!credentials) {
			throw new Error("Not authenticated. Please authenticate first.");
		}

		const { endpointUrl } = credentials;
		const cleanUrl = endpointUrl.replace(/\/$/, "");

		// CreateProjectReactor parameters: project name, type=CODE, global=true, hasPortal=true
		const expression = `CreateProject(project=["${projectName}"], projectType=["CODE"], global=[true], portal=[true]);`;

		try {
			const response = await fetch(`${cleanUrl}/api/engine/runPixel`, {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: new URLSearchParams({
					expression: expression,
				}),
			});

			if (!response.ok) {
				throw new Error(
					`Project creation failed: ${response.status} ${response.statusText}`,
				);
			}

			const rawData = await response.json();

			// Extract project ID from response
			let projectId: string;
			if (
				rawData.pixelReturn &&
				Array.isArray(rawData.pixelReturn) &&
				rawData.pixelReturn.length > 0
			) {
				const output = rawData.pixelReturn[0].output;
				// CreateProject returns a map with project_id
				projectId = output.project_id || output.projectId || output.id;
			} else {
				throw new Error("Invalid response from CreateProject");
			}

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
	 * Clone portal template from GitHub to the project
	 */
	static async clonePortalsToProject(projectId: string): Promise<void> {
		const credentials = await AuthService.getCredentials();
		if (!credentials) {
			throw new Error("Not authenticated. Please authenticate first.");
		}

		const { endpointUrl } = credentials;
		const cleanUrl = endpointUrl.replace(/\/$/, "");

		// GitCloneIntoProjectPortalsReactor parameters
		const expression = `GitCloneIntoProjectPortals(project=["${projectId}"], repo=["https://github.com/SEMOSS/semoss-ui.git"], branch=["chrome-extension-recorder"], subdirectory=["packages/chrome-extension/src/portals"]);`;

		try {
			const response = await fetch(`${cleanUrl}/api/engine/runPixel`, {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: new URLSearchParams({
					expression: expression,
				}),
			});

			if (!response.ok) {
				throw new Error(
					`Portal cloning failed: ${response.status} ${response.statusText}`,
				);
			}

			const rawData = await response.json();

			// Check for error in response
			if (
				rawData.pixelReturn &&
				Array.isArray(rawData.pixelReturn) &&
				rawData.pixelReturn.length > 0
			) {
				const output = rawData.pixelReturn[0];
				if (output.operationType === "ERROR") {
					throw new Error(output.output || "Portal cloning failed");
				}
			}
		} catch (error) {
			if (error instanceof Error) {
				throw new Error(`Portal cloning error: ${error.message}`);
			}
			throw new Error("Portal cloning failed: Unknown error");
		}
	}

	/**
	 * Add MCP and PLAYWRIGHT tags to a project so it shows up in playground
	 */
	static async addPlaywrightTags(projectId: string): Promise<void> {
		const credentials = await AuthService.getCredentials();
		if (!credentials) {
			throw new Error("Not authenticated. Please authenticate first.");
		}

		const { endpointUrl } = credentials;
		const cleanUrl = endpointUrl.replace(/\/$/, "");

		// Use SetProjectMetadata reactor to add tags
		const expression = `SetProjectMetadata(project=["${projectId}"], meta=[{"tag":["MCP", "PLAYWRIGHT"]}]);`;

		try {
			const response = await fetch(`${cleanUrl}/api/engine/runPixel`, {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: new URLSearchParams({
					expression: expression,
				}),
			});

			if (!response.ok) {
				throw new Error(
					`Failed to add tags: ${response.status} ${response.statusText}`,
				);
			}

			const rawData = await response.json();

			// Check for error in response
			if (
				rawData.pixelReturn &&
				Array.isArray(rawData.pixelReturn) &&
				rawData.pixelReturn.length > 0
			) {
				const output = rawData.pixelReturn[0];
				if (output.operationType === "ERROR") {
					throw new Error(output.output || "Failed to add tags");
				}
			}

			console.log("Added MCP and PLAYWRIGHT tags to project:", projectId);
		} catch (error) {
			if (error instanceof Error) {
				throw new Error(`Tag addition error: ${error.message}`);
			}
			throw new Error("Failed to add tags: Unknown error");
		}
	}

	/**
	 * Re-authenticate and get updated project list
	 */
	static async getUpdatedProjects(): Promise<Project[]> {
		const credentials = await AuthService.getCredentials();
		if (!credentials) {
			throw new Error("Not authenticated. Please authenticate first.");
		}

		// Re-authenticate to get fresh project list
		const authResponse = await AuthService.authenticate(credentials);

		// Update stored projects
		await chrome.storage.local.set({
			projects: authResponse.projects,
		});

		return authResponse.projects;
	}
}
