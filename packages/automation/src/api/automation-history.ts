import { runPixel } from "@semoss/sdk";
import type {
	AutomationNodeResult,
	AutomationRunDetail,
	AutomationRunSummary,
} from "../domain/automation.types";

const RUN_DATA_PAGE_SIZE = 50;

export interface AutomationRunFramePage {
	headers: string[];
	rows: unknown[][];
	total: number;
}

/** Returns the most recent persisted runs for an automation project. */
export async function listAutomationRuns(
	appId: string,
	limit = 50,
): Promise<AutomationRunSummary[]> {
	const response = await runPixel(
		`ListAutomationRuns(project=${JSON.stringify([appId])}, limit=${JSON.stringify([String(limit)])});`,
	);
	const output = response.pixelReturn?.[0]?.output;
	return Array.isArray(output) ? (output as AutomationRunSummary[]) : [];
}

/** Returns one persisted automation run including its ordered node results. */
export async function getAutomationRun(
	appId: string,
	runId: string,
): Promise<AutomationRunDetail> {
	const response = await runPixel(
		`GetAutomationRun(project=${JSON.stringify([appId])}, runId=${JSON.stringify([runId])});`,
	);
	const output = response.pixelReturn?.[0]?.output as
		| AutomationRunDetail
		| undefined;
	if (!output?.RUN_ID) {
		throw new Error("Automation run details were not found.");
	}
	return output;
}

/** Pages row-shaped node output from the execution Insight's standard SEMOSS frame. */
export async function getAutomationRunFramePage(
	insightId: string,
	frame: NonNullable<AutomationNodeResult["OUTPUT_FRAME"]>,
	offset: number,
): Promise<AutomationRunFramePage> {
	const frameName = frame.value.queryName ?? frame.value.alias ?? "";
	if (!frameName) {
		throw new Error("Automation output frame is unavailable.");
	}

	const response = await runPixel<
		[number, { data: { headers: string[]; values: unknown[][] } }]
	>(
		`META | Frame(${JSON.stringify(frameName)}) | QueryAll() | Distinct(false) | QueryRowCount(); META | Frame(${JSON.stringify(frameName)}) | QueryAll() | Offset(${offset}) | Limit(${RUN_DATA_PAGE_SIZE}) | Collect(${RUN_DATA_PAGE_SIZE});`,
		insightId,
	);
	if (response.errors.length > 0) {
		throw new Error(response.errors.join("\n"));
	}

	const total = response.pixelReturn[0]?.output;
	const pageOutput = response.pixelReturn[1]?.output;
	const data =
		typeof pageOutput === "object" && pageOutput !== null
			? pageOutput.data
			: null;
	if (
		typeof total !== "number" ||
		!data ||
		!Array.isArray(data.headers) ||
		!data.headers.every((header) => typeof header === "string") ||
		!Array.isArray(data.values) ||
		!data.values.every((row) => Array.isArray(row))
	) {
		throw new Error("Automation output frame returned an invalid page.");
	}

	return { headers: data.headers, rows: data.values, total };
}

/** Continues a durable run after its trace-linked child agent finishes an input flow. */
export async function resumeAutomationRun(
	appId: string,
	runId: string,
): Promise<AutomationRunDetail> {
	const response = await runPixel(
		`ResumeAutomationRun(project=${JSON.stringify([appId])}, runId=${JSON.stringify([runId])});`,
	);
	if (response.errors.length > 0) {
		throw new Error(response.errors.join("\n"));
	}
	const output = response.pixelReturn?.[0]?.output as
		| AutomationRunDetail
		| undefined;
	if (!output?.RUN_ID) {
		throw new Error("The waiting automation run could not be continued.");
	}
	return output;
}
