import { Env, Insight } from "@semoss/sdk";
import { colorizeJson } from "./formatter.js";

export interface PixelExecutionResult {
	success: boolean;
	output?: unknown;
	error?: string;
}

/**
 * Execute a Pixel command using the SEMOSS SDK
 */
export async function executePixelCommand(
	command: string,
	credentials: {
		module: string;
		accessKey: string;
		secretKey: string;
	},
): Promise<PixelExecutionResult> {
	try {
		// Update environment
		Env.update({
			MODULE: credentials.module,
			ACCESS_KEY: credentials.accessKey,
			SECRET_KEY: credentials.secretKey,
		});

		// Initialize insight
		const insight = new Insight();
		await insight.initialize({ python: false });

		if (insight.error) {
			return {
				success: false,
				error: `Connection error: ${insight.error.message || String(insight.error)}`,
			};
		}

		if (!insight.isAuthorized) {
			return {
				success: false,
				error: "Authentication failed. Check your credentials.",
			};
		}

		if (!insight.isReady) {
			return {
				success: false,
				error: "Server connection failed. Is the SEMOSS server running?",
			};
		}

		// Execute the Pixel command
		const result = await insight.actions.run(command);

		if (result.pixelReturn && result.pixelReturn.length > 0) {
			return {
				success: true,
				output: result.pixelReturn[0].output,
			};
		}

		return {
			success: true,
			output: result,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

/**
 * Format output for display in the TUI
 */
export function formatOutput(output: unknown): string {
	if (output === null || output === undefined) {
		return "(no output)";
	}

	if (typeof output === "string") {
		return output;
	}

	if (typeof output === "number" || typeof output === "boolean") {
		return String(output);
	}

	// For objects and arrays, pretty-print JSON with colors
	try {
		const json = JSON.stringify(output, null, 2);
		return colorizeJson(json);
	} catch {
		return String(output);
	}
}
