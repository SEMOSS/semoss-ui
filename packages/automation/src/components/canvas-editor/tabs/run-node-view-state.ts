import type { AutomationRunFramePage } from "../../../api/automation-history";
import type {
	AutomationNodeResult,
	AutomationSavedResultPage,
	AutomationSavedResultReference,
} from "../../../domain/automation.types";

export interface RunNodeOccurrence {
	parentNodeId?: string | null;
	iterationIndex?: number | null;
}

export type RunNodeDataSource =
	| {
			kind: "retained";
			savedResult: AutomationSavedResultReference;
	  }
	| {
			kind: "live";
			insightId: string;
			frame: NonNullable<AutomationNodeResult["OUTPUT_FRAME"]>;
	  }
	| { kind: "preview" };

export type AsyncViewerState = "loading" | "error" | "empty" | "ready";
export type RunNodeContentView = "output" | "scope";

export const RUN_NODE_VIEW_LABELS = {
	navigation: "Run nodes",
	detailView: "Run node detail view",
	output: "Output",
	scope: "Variables",
	outputData: "Automation node output data",
	retryData: "Retry loading node data",
} as const;

export const RUN_RESULTS_LAYOUT_CLASSES = {
	root: "flex min-h-0 flex-1 flex-col overflow-hidden sm:flex-row",
	navigation:
		"max-h-48 w-full shrink-0 overflow-y-auto border-border border-b bg-muted/20 p-2 sm:max-h-none sm:w-56 sm:border-r sm:border-b-0",
	content: "min-w-0 flex-1 overflow-y-auto p-3",
	scrollRegion:
		"max-h-[28rem] overflow-auto rounded-md border focus-visible:outline-2 focus-visible:outline-ring",
} as const;

/** Selects retained output before the shorter-lived execution frame. */
export function getRunNodeDataSource(
	savedResult: AutomationSavedResultReference | undefined,
	insightId: string | null | undefined,
	frame: AutomationNodeResult["OUTPUT_FRAME"] | undefined,
): RunNodeDataSource {
	if (savedResult?.RESULT_KIND === "TABLE") {
		return { kind: "retained", savedResult };
	}
	if (insightId && frame) {
		return { kind: "live", insightId, frame };
	}
	return { kind: "preview" };
}

/** Finds the durable result for one root node or one exact loop occurrence. */
export function findSavedResultForOccurrence(
	savedResults: AutomationSavedResultReference[],
	nodeId: string,
	occurrence?: RunNodeOccurrence | null,
): AutomationSavedResultReference | undefined {
	const parentNodeId = occurrence?.parentNodeId ?? null;
	const iterationIndex = occurrence?.iterationIndex ?? null;
	return savedResults.find(
		(result) =>
			result.NODE_ID === nodeId &&
			(result.PARENT_NODE_ID ?? null) === parentNodeId &&
			(result.ITERATION_INDEX ?? null) === iterationIndex,
	);
}

/** Produces a stable identity for stateful viewers of repeated loop body nodes. */
export function getRunNodeOccurrenceKey(
	runId: string,
	nodeId: string,
	occurrence?: RunNodeOccurrence | null,
): string {
	return JSON.stringify([
		runId,
		nodeId,
		occurrence?.parentNodeId ?? null,
		occurrence?.iterationIndex ?? null,
	]);
}

/** Maps a validated retained table page into the common data-view model. */
export function mapSavedResultPage(
	result: AutomationSavedResultPage,
): AutomationRunFramePage {
	return {
		headers: result.schema?.map((column) => column.name) ?? [],
		rows: result.rows ?? [],
		total: result.ROW_COUNT ?? result.rows?.length ?? 0,
		nextOffset: result.nextOffset,
		hasMore: result.hasMore,
	};
}

/** Derives the product-visible state for a data or source viewer. */
export function getAsyncViewerState(
	isLoading: boolean,
	error: string | null,
	hasValue: boolean,
	isEmpty: boolean,
): AsyncViewerState {
	if (isLoading && !hasValue) return "loading";
	if (error) return "error";
	if (!hasValue || isEmpty) return "empty";
	return "ready";
}

export interface RunScopeVariableRow {
	name: string;
	value: string;
}

/** Mirrors the fields loop-scope.ts's getLoopContextVariables exposes as `${loop.field}` refs. */
const LOOP_CONTEXT_FIELDS = new Set([
	"item",
	"batch",
	"index",
	"number",
	"total",
	"maximum",
	"isFirst",
	"isLast",
]);

/** A loop's own scope entry is a nested object shaped like getLoopContextVariables's output. */
function isLoopContextSnapshot(
	entryValue: unknown,
): entryValue is Record<string, unknown> {
	return (
		typeof entryValue === "object" &&
		entryValue !== null &&
		!Array.isArray(entryValue) &&
		"index" in entryValue &&
		"number" in entryValue &&
		"isFirst" in entryValue
	);
}

/**
 * Splits a retained scope-snapshot JSON string into one Name/Value row per top-level
 * variable (Mirth Connect-style message browser). The row name is the literal `${...}`
 * reference the user can paste into a later step, not a humanized label. A loop's own
 * entry is further broken out into one row per pass field (e.g. `${my_loop.item}`)
 * instead of one opaque JSON blob. Returns null when there is nothing tabular to show.
 */
export function getRunScopeVariableRows(
	value: string | null | undefined,
): RunScopeVariableRow[] | null {
	if (!value) return null;
	let parsed: unknown;
	try {
		parsed = JSON.parse(value);
	} catch {
		return null;
	}
	if (
		parsed === null ||
		typeof parsed !== "object" ||
		Array.isArray(parsed)
	) {
		return null;
	}
	const rows: RunScopeVariableRow[] = [];
	for (const [key, entryValue] of Object.entries(
		parsed as Record<string, unknown>,
	)) {
		if (isLoopContextSnapshot(entryValue)) {
			for (const [field, fieldValue] of Object.entries(entryValue)) {
				if (!LOOP_CONTEXT_FIELDS.has(field)) continue;
				rows.push({
					name: `\${${key}.${field}}`,
					value:
						typeof fieldValue === "string"
							? fieldValue
							: JSON.stringify(fieldValue, null, 2),
				});
			}
			continue;
		}
		rows.push({
			name: `\${${key}}`,
			value:
				typeof entryValue === "string"
					? entryValue
					: JSON.stringify(entryValue, null, 2),
		});
	}
	return rows;
}
