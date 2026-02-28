import { Parser } from "node-sql-parser";
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
}

function detectQueryType(query: string): string {
	const parser = new Parser();
	const ast = parser.astify(query);
	console.log("AST:", ast);

	if (Array.isArray(ast)) {
		if (ast.length === 0) {
			return "OTHER";
		}
		return ast[0].type.toUpperCase();
	}

	return ast.type.toUpperCase();
}

function removeComments(query: string): string {
	const parser = new Parser();
	const ast = parser.astify(query);
	return parser.sqlify(ast);
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
		typeof typed.output === "string" && typed.output.startsWith("ERROR:")
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
			const queryType = detectQueryType(queryToRun);
			console.log("Detected query type:", queryType);

			const sanitizedQuery = removeComments(queryToRun).replaceAll(
				"`",
				"",
			);
			const pixel = `SqlQuery(database=["${engineId}"], query=["<encode>${sanitizedQuery}</encode>"], commit = [true]);`;

			const response = await runPixel(pixel);
			console.log("Full response:", response);

			let resultToStore: QueryResult;
			if (response?.pixelReturn && response.pixelReturn.length > 0) {
				const firstResult = response.pixelReturn[0];
				console.log("Setting data to:", firstResult);
				resultToStore = {
					...firstResult,
					queryType: queryType as "SELECT" | "OTHER",
				};
			} else {
				console.log("No pixelReturn found, using full response");
				resultToStore = {
					output: response,
					queryType: queryType as "SELECT" | "OTHER",
					timeToRun: 0,
				};
			}

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
				queryType: detectQueryType(queryToRun) as "SELECT" | "OTHER",
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
		// limit,
		// setLimit
	};
}
