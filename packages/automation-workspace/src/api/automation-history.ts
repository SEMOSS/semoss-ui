import { runPixel } from "@semoss/sdk";
import type {
	AutomationRunDetail,
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
