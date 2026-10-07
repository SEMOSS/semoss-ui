import type { ThreadSession } from "@/features/thread-assistant/thread-session";

/** Ready, idle session data for Work panel behavior tests. */
export function workSnapshot(): ReturnType<ThreadSession["getSnapshot"]> {
	return {
		usage: { contextTokens: null, totalTokens: null },
		isCompacting: false,
		compactionError: null,
		compactionNotice: null,
		settings: {
			agentId: "",
			modelId: "model",
			instructions: "",
			temperature: null,
			mcp: [],
		},
		agent: null,
		isSavingSettings: false,
		settingsError: null,
		isLoadingModel: false,
		modelError: null,
		isReady: true,
		isLoading: false,
		isPreparing: false,
		error: null,
		association: null,
		modelId: "model",
		modelName: "Model",
		hasUnconfirmedSubmission: false,
		submissionNotice: null,
		isCreationUncertain: false,
		composerResetKey: 0,
		turn: {
			messages: [],
			toolStates: {},
			pendingApprovals: [],
			phase: null,
			isSubmitting: false,
			isRestoring: false,
			isCancelling: false,
			isRunning: false,
			turnError: null,
			transportError: null,
			settlementVersion: 0,
		},
	};
}
