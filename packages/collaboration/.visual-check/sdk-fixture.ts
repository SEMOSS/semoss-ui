// Temporary browser-check adapter, deliberately outside the production entry graph.
export * from "../../../libs/sdk/dist/index.mjs";

const ERROR = "Fixture preview: backend actions are unavailable.";
export async function unavailable(): Promise<never> {
	throw new Error(ERROR);
}
export const fixtureActions = {
	run: unavailable,
	runPixel: unavailable,
	initialize: unavailable,
};
export const runPixel = unavailable;
export const runAgent = unavailable;
export const pollAgentRun = unavailable;
export const getAgentRun = unavailable;
export const stopAgentRun = unavailable;
export const getSubagentRuns = unavailable;
export const decideAgentRunAction = unavailable;
export const uploadInsight = unavailable;
export const download = unavailable;
export const oauth = unavailable;
export const getSystemConfig = unavailable;

export class Insight {
	isInitialized = false;
	isReady = false;
	isAuthorized = false;
	insightId = "isolated-visual-fixture";
	error = null;
	system = null;
	actions = fixtureActions;
	initialize = unavailable;
	async destroy(): Promise<void> {}
}
