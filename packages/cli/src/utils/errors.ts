/**
 * Parse and enhance error messages for better user experience
 */
export function formatConnectionError(error: unknown): {
	message: string;
	suggestions: string[];
} {
	const errorMessage = error instanceof Error ? error.message : String(error);

	// HTML response instead of JSON
	if (
		errorMessage.includes("is not valid JSON") ||
		errorMessage.includes("<!doctype") ||
		errorMessage.includes("Unexpected token '<'")
	) {
		return {
			message: "Server returned HTML instead of JSON",
			suggestions: [
				"Check that the server URL is correct",
				"Verify the server is running",
				"Ensure the URL includes the correct API path",
				"Example: https://your-server.com/api (not just https://your-server.com)",
			],
		};
	}

	// Network/DNS errors
	if (
		errorMessage.includes("ENOTFOUND") ||
		errorMessage.includes("getaddrinfo")
	) {
		return {
			message: "Cannot reach the server (DNS lookup failed)",
			suggestions: [
				"Check that the server URL is correct",
				"Verify you have internet connectivity",
				"Check if the server is accessible from your network",
			],
		};
	}

	// Connection refused
	if (
		errorMessage.includes("ECONNREFUSED") ||
		errorMessage.includes("connect ECONNREFUSED")
	) {
		return {
			message: "Connection refused by server",
			suggestions: [
				"Verify the server is running",
				"Check that the port number is correct",
				"Ensure firewall allows the connection",
			],
		};
	}

	// Timeout
	if (
		errorMessage.includes("timeout") ||
		errorMessage.includes("ETIMEDOUT")
	) {
		return {
			message: "Connection timed out",
			suggestions: [
				"Check that the server is responding",
				"Verify network connectivity",
				"Try again in a moment",
			],
		};
	}

	// SSL/TLS errors
	if (
		errorMessage.includes("certificate") ||
		errorMessage.includes("SSL") ||
		errorMessage.includes("TLS")
	) {
		return {
			message: "SSL/TLS certificate error",
			suggestions: [
				"Check that the server has a valid SSL certificate",
				"Verify you're using https:// for secure servers",
				"Contact your server administrator",
			],
		};
	}

	// Authentication errors
	if (
		errorMessage.includes("Authentication failed") ||
		errorMessage.includes("Unauthorized") ||
		errorMessage.includes("401")
	) {
		return {
			message: "Authentication failed",
			suggestions: [
				"Verify your Access Key is correct",
				"Verify your Secret Key is correct",
				"Check that your credentials haven't expired",
			],
		};
	}

	// Forbidden
	if (errorMessage.includes("Forbidden") || errorMessage.includes("403")) {
		return {
			message: "Access forbidden",
			suggestions: [
				"Your credentials may not have permission",
				"Contact your administrator for access",
			],
		};
	}

	// Generic error
	return {
		message: errorMessage,
		suggestions: [
			"Check the server URL and credentials",
			"Verify the server is accessible",
			"Try again in a moment",
		],
	};
}
