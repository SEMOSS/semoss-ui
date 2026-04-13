import { useState } from "react";
import { runPixel } from "@semoss/sdk/react";

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

interface QueryExecutionOptions {
	onSchemaChange?: () => void;
}

export function useQueryExecution(
	engineId: string,
	options: QueryExecutionOptions = {},
) {
	const [query, setQuery] = useState("");
	const [previewData, setPreviewData] = useState<QueryResult | null>(null);
	const [previewLoading, setPreviewLoading] = useState(false);
	const [pixelQuery, setPixelQuery] = useState<string | null>(null);
	// const [limit, setLimit] = useState(500);

	const clearQuery = () => {
		setQuery("");
	};

	const clearResults = () => {
		setPreviewData(null);
	};

	const executeQuery = async (queryOverride?: string) => {
		const queryToRun =
			typeof queryOverride === "string" ? queryOverride : query;

		if (!queryToRun.trim()) {
			return;
		}

		if (typeof queryOverride === "string" && queryOverride !== query) {
			setQuery(queryOverride);
		}

		setPreviewLoading(true);

		try {
			const pixel = `SqlQuery(database=["${engineId}"], query=["<encode>${queryToRun.replaceAll("`", "")}</encode>"], commit = [true]);`;
			setPixelQuery(pixel);

			const response = await runPixel(pixel);
			console.log("Full response:", response);

			let resultToStore: QueryResult;
			if (response?.pixelReturn && response.pixelReturn.length > 0) {
				const firstResult = response.pixelReturn[0];
				console.log("Setting data to:", firstResult);
				resultToStore = {
					...firstResult,
					queryType: "OTHER",
					queryText: queryToRun,
				};
			} else {
				console.log("No pixelReturn found, using full response");
				resultToStore = {
					output: response,
					queryType: "OTHER",
					timeToRun: 0,
					queryText: queryToRun,
				};
			}

			resultToStore.queryType = hasTabularData(resultToStore)
				? "SELECT"
				: "OTHER";

			setPreviewData(resultToStore);

			if (
				options.onSchemaChange &&
				!isErrorResponse(resultToStore) &&
				!hasTabularData(resultToStore)
			) {
				console.log(
					"Non-tabular response detected. Refreshing schema.",
				);
				setTimeout(() => options.onSchemaChange?.(), 100);
			}
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "Unknown error";
			console.error("Query execution error:", error);
			setPreviewData({
				error: true,
				output: `Error: ${message}`,
				operationType: ["ERROR"],
				queryType: "OTHER",
				queryText: queryToRun,
			});
		} finally {
			setPreviewLoading(false);
		}
	};

	return {
		query,
		setQuery,
		previewData,
		previewLoading,
		clearQuery,
		clearResults,
		executeQuery,
		pixelQuery,
		// limit,
		// setLimit
	};
}
