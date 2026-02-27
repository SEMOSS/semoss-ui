/**
 * TUI Pixel execution and session management.
 *
 * Maintains a single {@link Insight} session that is created once when the
 * TUI connects to an instance and reused for every Pixel command.  This
 * avoids the overhead (and server-side resource leak) of creating a fresh
 * Insight for every keystroke.
 *
 * Public API:
 *  - {@link createSession}  — open a session + fetch user info
 *  - {@link executePixelCommand} — run a Pixel string on the active session
 *  - {@link destroySession} — tear down the session on exit
 *  - {@link formatOutput} — pretty-print arbitrary Pixel output
 */

import { Env, Insight } from "@semoss/sdk";
import { colorizeJson } from "./formatter.js";

// ── Types ───────────────────────────────────────────────────────

export interface PixelExecutionResult {
	success: boolean;
	output?: unknown;
	error?: string;
}

export interface SessionUser {
	id: string;
	name?: string;
	email?: string;
	admin: boolean;
	provider: string;
}

export interface SessionResult {
	success: boolean;
	user?: SessionUser;
	error?: string;
}

// ── Module-level session state ──────────────────────────────────

let activeInsight: Insight | null = null;

// ── Session lifecycle ───────────────────────────────────────────

/**
 * Create and initialise an SDK session for the TUI.
 *
 * Also runs `GetUserInfo()` so the header can display the
 * authenticated user's name.  A failed user-info fetch is non-fatal;
 * the session is still considered valid.
 */
export async function createSession(credentials: {
	module: string;
	accessKey: string;
	secretKey: string;
}): Promise<SessionResult> {
	try {
		Env.update({
			MODULE: credentials.module,
			ACCESS_KEY: credentials.accessKey,
			SECRET_KEY: credentials.secretKey,
		});

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

		activeInsight = insight;

		// Best-effort user info fetch
		let user: SessionUser | undefined;
		try {
			const result = await insight.actions.run("GetUserInfo();");
			const pixel = result.pixelReturn?.[0];
			if (pixel?.output && !pixel.operationType?.includes("ERROR")) {
				const raw = pixel.output as Record<
					string,
					Record<string, unknown>
				>;
				const provider = Object.keys(raw)[0];
				if (provider) {
					const info = raw[provider];
					user = {
						id: String(info.id ?? ""),
						name: info.name ? String(info.name) : undefined,
						email: info.email ? String(info.email) : undefined,
						admin: Boolean(info.admin),
						provider,
					};
				}
			}
		} catch {
			// Non-fatal — session is still usable
		}

		return { success: true, user };
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

/**
 * Execute a Pixel command on the active session.
 *
 * Returns a structured result with `success`, and either `output`
 * (on success) or `error` (on failure).  Server-side errors
 * (`operationType === "ERROR"`) are surfaced as failures.
 */
export async function executePixelCommand(
	command: string,
): Promise<PixelExecutionResult> {
	if (!activeInsight) {
		return {
			success: false,
			error: "No active session. Connect to an instance first.",
		};
	}

	try {
		const result = await activeInsight.actions.run(command);

		if (result.pixelReturn && result.pixelReturn.length > 0) {
			const pixel = result.pixelReturn[0];

			// Surface server-side errors
			if (pixel.operationType?.includes("ERROR")) {
				return {
					success: false,
					error:
						typeof pixel.output === "string"
							? pixel.output
							: JSON.stringify(pixel.output),
				};
			}

			return { success: true, output: pixel.output };
		}

		return { success: true, output: result };
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

/**
 * Destroy the active session and release server-side resources.
 * Safe to call multiple times or when no session exists.
 */
export async function destroySession(): Promise<void> {
	if (activeInsight) {
		try {
			await activeInsight.destroy();
		} catch {
			// Best-effort cleanup
		}
		activeInsight = null;
	}
}

// ── Output formatting ───────────────────────────────────────────

/**
 * Format arbitrary Pixel output for display in the TUI.
 * Primitives are stringified; objects/arrays are pretty-printed with
 * colour-coded JSON via {@link colorizeJson}.
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

	try {
		const json = JSON.stringify(output, null, 2);
		return colorizeJson(json);
	} catch {
		return String(output);
	}
}
