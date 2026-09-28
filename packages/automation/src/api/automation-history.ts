import { runPixel } from "@semoss/sdk";
import type {
	AutomationRunDetail,
	AutomationRunNodeDataPage,
	AutomationRunSummary,
} from "../domain/automation.types";

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

/** Returns one bounded page from a node value retained by its run workspace. */
export async function getAutomationRunNodeData(
	appId: string,
	runId: string,
	nodeId: string,
	offset = 0,
	limit = 50,
): Promise<AutomationRunNodeDataPage> {
	const response = await runPixel(
		`GetAutomationRunNodeData(project=${JSON.stringify([appId])}, runId=${JSON.stringify([runId])}, nodeId=${JSON.stringify([nodeId])}, offset=${JSON.stringify([String(offset)])}, limit=${JSON.stringify([String(limit)])});`,
	);
	if (response.errors.length > 0) {
		throw new Error(response.errors.join("\n"));
	}
	const output = response.pixelReturn?.[0]?.output as
		| AutomationRunNodeDataPage
		| undefined;
	if (!output?.available) {
		throw new Error(
			"Run data is no longer available. Run the automation again.",
		);
	}
	return output;
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
