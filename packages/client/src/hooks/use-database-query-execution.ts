export interface QueryResult {
	output: unknown;
	operationType?: string[] | string;
	timeToRun?: number;
	error?: boolean;
	isSuccess?: boolean;
	executionInfo?: string;
	queryType: "SELECT" | "OTHER";
	numCollected?: number;
	queryText?: string;
}

export const isErrorResponse = (response: unknown): boolean => {
	if (typeof response !== "object" || response === null) {
		return false;
	}

	const typed = response as { operationType?: string[]; output?: unknown };
	if (typed.operationType?.includes("ERROR")) {
		return true;
	}

	return (
		typeof typed.output === "string" &&
		(/^(error|ERROR)/.test(typed.output) ||
			typed.output.startsWith("ERROR:"))
	);
};

export const getErrorMessage = (response: unknown): string => {
	if (typeof response !== "object" || response === null) {
		return "Unknown error occurred";
	}

	const typed = response as { output?: unknown };
	if (typeof typed.output === "string") {
		return typed.output.startsWith("ERROR:")
			? typed.output.replace("ERROR: ", "")
			: typed.output;
	}

	return "Unknown error occurred";
};

export const hasTabularData = (response: unknown): boolean => {
	if (typeof response !== "object" || response === null) {
		return false;
	}

	const output = (response as { output?: unknown }).output;
	if (typeof output !== "object" || output === null) {
		return false;
	}

	const data = (output as { data?: unknown }).data;
	if (typeof data !== "object" || data === null) {
		return false;
	}

	const typed = data as { headers?: unknown; values?: unknown };
	return Boolean(typed.headers && typed.values);
};
