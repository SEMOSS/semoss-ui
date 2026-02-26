import { Env, type Insight } from "@semoss/sdk";
import { getDefaultLogger } from "./logger.js";

/**
 * Initializes the insight and runs the 1+1 reactor to test connectivity.
 * Throws with detailed errors if initialization or reactor fails.
 * Returns the result of 1+1.
 */
export async function initializeAndTestInsight(
	insight: Insight,
): Promise<number> {
	const fileLogger = getDefaultLogger();

	fileLogger.debug("Initializing Semoss Insight...");

	await insight.initialize({ python: false });

	fileLogger.debug(
		`Insight status — error: ${insight.error || "None"}, authorized: ${insight.isAuthorized}, ready: ${insight.isReady}`,
	);

	if (insight.error) {
		const msg =
			insight.error instanceof Error
				? insight.error.message
				: String(insight.error);
		if (
			msg.includes("Unexpected token") ||
			msg.includes("is not valid JSON")
		) {
			throw new Error(
				"Authentication failed — check ACCESS_KEY and SECRET_KEY. The server returned an HTML login page instead of JSON.",
			);
		}
		if (msg.includes("fetch failed") || msg.includes("ECONNREFUSED")) {
			throw new Error(
				`Could not connect to server at ${Env.MODULE} — is the server running?`,
			);
		}
		throw insight.error;
	} else if (!insight.isAuthorized) {
		throw new Error("User is not Authorized");
	} else if (!insight.isReady) {
		throw new Error("Error initializing model");
	}

	fileLogger.debug("Insight initialized, executing 1+1 reactor test");
	const { pixelReturn } = await insight.actions.run<[number]>("1+1");
	fileLogger.debug(`1+1 reactor result: ${pixelReturn[0]?.output}`);
	if (
		!pixelReturn ||
		!pixelReturn[0] ||
		typeof pixelReturn[0].output !== "number"
	) {
		throw new Error("1+1 reactor did not return a valid result");
	}
	fileLogger.debug(`Insight test passed (1+1 = ${pixelReturn[0].output})`);
	return pixelReturn[0].output;
}
