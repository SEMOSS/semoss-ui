import { Env, type Insight } from "@semoss/sdk";

/**
 * Initializes the insight and runs the 1+1 reactor to test connectivity.
 * Throws with detailed errors if initialization or reactor fails.
 * Returns the result of 1+1.
 */
export async function initializeAndTestInsight(
	insight: Insight,
	logger?: (msg: string) => void,
	shouldLog?: boolean,
): Promise<number> {
	const log = logger || (() => {});

	console.log("This is running some how");

	if (shouldLog) {
		log("🔧 Initializing Semoss Insight...");
	}

	await insight.initialize({ python: false });

	if (shouldLog) {
		log(`📊 Insight Status:`);
		log(`   • Error: ${insight.error || "None"}`);
		log(`   • Authorized: ${insight.isAuthorized}`);
		log(`   • Ready: ${insight.isReady}`);
		log(`   • Insight ID: Available`);
	}

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

	if (shouldLog) {
		log("✅ Insight initialized successfully");

		// Run the reactor 1+1
		log("🧮 Executing: 1+1");
	}
	const { pixelReturn } = await insight.actions.run<[number]>("1+1");
	if (shouldLog) {
		log(`📊 Raw pixelReturn: ${JSON.stringify(pixelReturn, null, 2)}`);
	}
	if (
		!pixelReturn ||
		!pixelReturn[0] ||
		typeof pixelReturn[0].output !== "number"
	) {
		throw new Error("1+1 reactor did not return a valid result");
	}
	if (shouldLog) {
		log(`✅ 1+1 Result: ${pixelReturn[0].output}`);
		log(`🔍 Detailed Analysis:`);
		log(`   • Input: 1+1`);
		log(`   • Output Type: ${typeof pixelReturn[0].output}`);
		log(`   • Output Value: ${pixelReturn[0].output}`);
	}
	return pixelReturn[0].output;
}
