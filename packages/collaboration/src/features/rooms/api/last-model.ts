const LAST_MODEL_KEY = "collaboration.lastModel";

export interface LastModel {
	modelId: string;
	modelName: string;
}

/** The model this browser last picked in Collaboration, if any. */
export function readLastModel(): LastModel | null {
	try {
		const stored = JSON.parse(
			window.localStorage.getItem(LAST_MODEL_KEY) ?? "null",
		) as Partial<LastModel> | null;
		if (!stored || typeof stored.modelId !== "string" || !stored.modelId)
			return null;
		return {
			modelId: stored.modelId,
			modelName:
				typeof stored.modelName === "string" && stored.modelName
					? stored.modelName
					: stored.modelId,
		};
	} catch {
		return null;
	}
}

export function rememberLastModel(modelId: string, modelName: string): void {
	if (!modelId) return;
	try {
		window.localStorage.setItem(
			LAST_MODEL_KEY,
			JSON.stringify({ modelId, modelName: modelName || modelId }),
		);
	} catch {
		// storage can be full or blocked; the pick still applies to this session
	}
}
