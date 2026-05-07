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
}
