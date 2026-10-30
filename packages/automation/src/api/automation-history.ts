import { runPixel } from "@semoss/sdk";
import type {
	AutomationNodeResult,
	AutomationRunDetail,
	AutomationRunImplementationView,
	AutomationRunSummary,
	AutomationSavedResultPage,
} from "../domain/automation.types";

const RUN_DATA_PAGE_SIZE = 50;

export interface AutomationVersion {
	id: string;
	user: string;
	date: string;
	message: string;
}

/** Returns up to the backend maximum of 100 saved automation versions. */
export async function listAutomationVersions(
	appId: string,
): Promise<AutomationVersion[]> {
	const response = await runPixel(
		`ListAutomationVersions(project=${JSON.stringify([appId])}, limit=["100"]);`,
	);
	throwPixelErrors(response.errors);
	const output = response.pixelReturn?.[0]?.output;
	if (
		!Array.isArray(output) ||
		!output.every(
			(version): version is AutomationVersion =>
				isRecord(version) &&
				typeof version.id === "string" &&
				version.id.length > 0 &&
				typeof version.user === "string" &&
				typeof version.date === "string" &&
				typeof version.message === "string",
		)
	) {
		throw new Error(
			"Automation version history returned an invalid response.",
		);
	}
	return output;
}

/** Restores a saved revision as a new version; callers must reload the definition. */
export async function rollbackAutomation(
	appId: string,
	revision: string,
	expectedRevision: string,
): Promise<void> {
	const response = await runPixel(
		`RollbackAutomation(project=${JSON.stringify([appId])}, revision=${JSON.stringify([revision])}, expectedRevision=${JSON.stringify([expectedRevision])});`,
	);
	throwPixelErrors(response.errors);
	const output = response.pixelReturn?.[0]?.output;
	if (
		!isRecord(output) ||
		output.saved !== true ||
		typeof output.revision !== "string" ||
		output.revision.length === 0
	) {
		throw new Error("Automation rollback was not confirmed by the server.");
	}
}

export interface AutomationRunFramePage {
	headers: string[];
	rows: unknown[][];
	total: number;
	nextOffset?: number;
	hasMore?: boolean;
}

/** Returns the most recent persisted runs for an automation project. */
export async function listAutomationRuns(
	appId: string,
	limit = 50,
): Promise<AutomationRunSummary[]> {
	const response = await runPixel(
		`ListAutomationRuns(project=${JSON.stringify([appId])}, limit=${JSON.stringify([String(limit)])});`,
	);
	throwPixelErrors(response.errors);
	const output = response.pixelReturn?.[0]?.output;
	if (
		!Array.isArray(output) ||
		!output.every(
			(run) =>
				isRecord(run) &&
				typeof run.RUN_ID === "string" &&
				typeof run.PROJECT_ID === "string" &&
				typeof run.STATUS === "string",
		)
	) {
		throw new Error("Automation run history returned an invalid response.");
	}
	return output as AutomationRunSummary[];
}

/** Returns one persisted automation run including its ordered node results. */
export async function getAutomationRun(
	appId: string,
	runId: string,
): Promise<AutomationRunDetail> {
	const response = await runPixel(
		`GetAutomationRun(project=${JSON.stringify([appId])}, runId=${JSON.stringify([runId])});`,
	);
	throwPixelErrors(response.errors);
	const output = response.pixelReturn?.[0]?.output;
	if (
		!isRecord(output) ||
		output.RUN_ID !== runId ||
		!Array.isArray(output.nodeResults)
	) {
		throw new Error("Automation run details were not found.");
	}
	return output as unknown as AutomationRunDetail;
}

/** Returns a bounded, integrity-checked page from a durable Automation result. */
export async function getAutomationResult(
	appId: string,
	resultId: string,
	offset: number,
): Promise<AutomationSavedResultPage> {
	const response = await runPixel(
		`GetAutomationResult(project=${JSON.stringify([appId])}, resultId=${JSON.stringify([resultId])}, offset=${JSON.stringify([String(offset)])}, limit=${JSON.stringify([String(RUN_DATA_PAGE_SIZE)])});`,
	);
	throwPixelErrors(response.errors);
	const output = response.pixelReturn?.[0]?.output;
	if (!isSavedResultPage(output, resultId)) {
		throw new Error(
			"Automation saved result returned an invalid response.",
		);
	}
	return output;
}

/** Returns the immutable source snapshot executed for one run node. */
export async function getAutomationRunSource(
	appId: string,
	runId: string,
	nodeId: string,
): Promise<AutomationRunImplementationView> {
	const response = await runPixel(
		`GetAutomationRunSource(project=${JSON.stringify([appId])}, runId=${JSON.stringify([runId])}, nodeId=${JSON.stringify([nodeId])});`,
	);
	throwPixelErrors(response.errors);
	const output = response.pixelReturn?.[0]?.output;
	if (
		!isRecord(output) ||
		output.RUN_ID !== runId ||
		output.NODE_ID !== nodeId ||
		typeof output.viewKind !== "string"
	) {
		throw new Error(
			"Automation source snapshot returned an invalid response.",
		);
	}
	if (
		output.viewKind === "PYTHON" &&
		typeof output.legacyPython === "boolean" &&
		output.nodeType === "developer.python" &&
		(output.sourceIdentity === "developer.python" ||
			output.sourceIdentity === "developer.python.compatibility") &&
		typeof output.sourceNodeId === "string" &&
		typeof output.SOURCE_CODE === "string"
	) {
		return {
			viewKind: "PYTHON",
			legacyPython: output.legacyPython,
			nodeType: "developer.python",
			sourceIdentity: output.sourceIdentity,
			sourceNodeId: output.sourceNodeId,
			...(typeof output.historicalNodeType === "string"
				? { historicalNodeType: output.historicalNodeType }
				: {}),
			source: output.SOURCE_CODE,
		};
	}
	if (
		output.viewKind === "IMPLEMENTATION" &&
		output.legacyPython === false &&
		typeof output.nodeType === "string" &&
		isRecord(output.config) &&
		typeof output.implementationId === "string" &&
		typeof output.definitionHash === "string"
	) {
		return {
			viewKind: "IMPLEMENTATION",
			legacyPython: false,
			nodeType: output.nodeType,
			config: output.config,
			implementationId: output.implementationId,
			definitionHash: output.definitionHash,
		};
	}
	throw new Error(
		"Automation implementation snapshot returned an invalid response.",
	);
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

	return {
		headers: data.headers,
		rows: data.values,
		total,
		nextOffset: offset + data.values.length,
		hasMore: offset + data.values.length < total,
	};
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

function throwPixelErrors(errors: string[]): void {
	if (errors.length > 0) {
		throw new Error(errors.join("\n"));
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isSavedResultPage(
	value: unknown,
	resultId: string,
): value is AutomationSavedResultPage {
	if (
		!isRecord(value) ||
		value.RESULT_ID !== resultId ||
		typeof value.NODE_ID !== "string" ||
		!["VALUE", "TABLE", "FILE"].includes(String(value.RESULT_KIND)) ||
		typeof value.BYTE_COUNT !== "number" ||
		typeof value.CHECKSUM !== "string" ||
		typeof value.RETAIN_UNTIL !== "string" ||
		value.CAPTURE_STATE !== "RETAINED"
	) {
		return false;
	}
	if (value.RESULT_KIND !== "TABLE") {
		return "value" in value || "manifest" in value;
	}
	return (
		typeof value.ROW_COUNT === "number" &&
		value.ROW_COUNT >= 0 &&
		Array.isArray(value.schema) &&
		value.schema.every(
			(column) =>
				isRecord(column) &&
				typeof column.name === "string" &&
				typeof column.type === "string",
		) &&
		Array.isArray(value.rows) &&
		value.rows.every((row) => Array.isArray(row)) &&
		typeof value.offset === "number" &&
		value.offset >= 0 &&
		typeof value.nextOffset === "number" &&
		value.nextOffset >= value.offset &&
		typeof value.hasMore === "boolean" &&
		(!value.hasMore || value.nextOffset > value.offset)
	);
}
