export * from "../../../libs/sdk/dist/js-frameworks/react/index.mjs";
export {
	decideAgentRunAction,
	download,
	getAgentRun,
	getSubagentRuns,
	getSystemConfig,
	Insight,
	oauth,
	pollAgentRun,
	runAgent,
	runPixel,
	stopAgentRun,
	uploadInsight,
} from "./sdk-fixture";

import { fixtureActions } from "./sdk-fixture";

const fixtureError = new Error(
	"Fixture preview: backend actions are unavailable.",
);
const refresh = () => undefined;
const fixtureUser = {
	NATIVE: {
		name: "Visual fixture (offline)",
		username: "Visual fixture",
		email: "fixture@example.invalid",
	},
};
const insight = {
	isInitialized: true,
	isReady: true,
	isAuthorized: true,
	insightId: "isolated-visual-fixture",
	actions: fixtureActions,
	error: null,
	system: { config: {}, logins: {} },
};

export function useInsight() {
	return insight;
}
export function usePixel<D>(expression: string) {
	const isIdentity = expression.includes("GetUserInfo");
	return {
		status: isIdentity ? "SUCCESS" : "ERROR",
		data: (isIdentity ? fixtureUser : null) as D,
		error: isIdentity ? null : fixtureError,
		refresh,
	};
}
export function useIteratorPixel() {
	return {
		data: [],
		status: "ERROR",
		error: fixtureError,
		isLoading: false,
		hasMore: false,
		next: refresh,
		refresh,
		reset: refresh,
	};
}
