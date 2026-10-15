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
			const input = `Loop item ${iteration.index + 1}. The exact loop input is not retained separately from its step outputs.`;
			items.push({
				key: `${runtimeNodeId(loopResult)}:${iteration.index}`,
				label,
				description: `${iteration.nodeResults.length} executed steps`,
				status: statusForResults(iteration.nodeResults),
				input,
				results: iteration.nodeResults,
				searchText: searchText(label, input, iteration.nodeResults),
			});
		}
	}
	return items;
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
			result.outputVariable ?? "",
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
