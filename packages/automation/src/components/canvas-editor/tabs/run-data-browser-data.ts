import type {
	AutomationNodeResult,
	AutomationRunDetail,
} from "../../../domain/automation.types";

export interface RunDataItem {
	key: string;
	label: string;
	description: string;
	status?: AutomationNodeResult["STATUS"];
	input: string;
	results: AutomationNodeResult[];
	loopNodeId?: string;
	iterationIndex?: number;
	searchText: string;
}

/** Builds root and loop-iteration work items without exposing frame internals. */
export function buildRunDataItems(run: AutomationRunDetail): RunDataItem[] {
	const rootInput = formatRunInput(run.INPUT_SNAPSHOT);
	const items: RunDataItem[] = [
		{
			key: "root",
			label: "Run input",
			description: `${run.TRIGGER_TYPE ?? "MANUAL"} trigger · ${run.nodeResults.length} steps`,
			status: statusForResults(run.nodeResults),
			input: rootInput,
			results: run.nodeResults,
			searchText: searchText("Run input", rootInput, run.nodeResults),
		},
	];

	for (const loopResult of run.nodeResults) {
		for (const iteration of loopResult.iterations ?? []) {
			const label = `${loopResult.NODE_LABEL || loopResult.NODE_ID} · Item ${iteration.index + 1}`;
			const input = formatIterationInput(
				iteration.input,
				iteration.index,
			);
			items.push({
				key: `${runtimeNodeId(loopResult)}:${iteration.index}`,
				label,
				description: `${iteration.nodeResults.length} executed steps`,
				status: statusForResults(iteration.nodeResults),
				input,
				results: iteration.nodeResults,
				loopNodeId: runtimeNodeId(loopResult),
				iterationIndex: iteration.index,
				searchText: searchText(label, input, iteration.nodeResults),
			});
		}
	}
	return items;
}

function formatIterationInput(input: unknown, index: number): string {
	if (input === undefined) {
		return `Loop item ${index + 1}. This run predates exact loop-input retention.`;
	}
	if (typeof input === "string") return input;
	try {
		return JSON.stringify(input, null, 2);
	} catch {
		return String(input);
	}
}

export function runtimeNodeId(result: AutomationNodeResult | null): string {
	if (!result) return "";
	return result.trace?.nodeId ?? result.NODE_ID;
}

function statusForResults(
	results: AutomationNodeResult[],
): AutomationNodeResult["STATUS"] | undefined {
	if (results.some((result) => result.STATUS === "FAILED")) return "FAILED";
	if (results.some((result) => result.STATUS === "RUNNING")) return "RUNNING";
	if (results.some((result) => result.STATUS === "WAITING_FOR_INPUT")) {
		return "WAITING_FOR_INPUT";
	}
	if (results.some((result) => result.STATUS === "SUCCESS")) return "SUCCESS";
	return results[0]?.STATUS;
}

function searchText(
	label: string,
	input: string,
	results: AutomationNodeResult[],
): string {
	return [
		label,
		input,
		...results.flatMap((result) => [
			result.NODE_LABEL,
			result.NODE_ID,
			result.OUTPUT_VAR_NAME ?? "",
			result.STATUS,
			result.OUTPUT_PREVIEW ?? "",
			result.ERROR_MESSAGE ?? "",
		]),
	].join(" ");
}

function formatRunInput(inputSnapshot?: string): string {
	if (!inputSnapshot) return "No trigger input was retained.";
	try {
		return JSON.stringify(JSON.parse(inputSnapshot) as unknown, null, 2);
	} catch {
		return inputSnapshot;
	}
}
