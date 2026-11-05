import { downloadBlob } from "@semoss/utility/browser";
import {
	ensureAutomationNodeDefinitions,
	listDataStoreEngines,
} from "../../api";
import type { AutomationImportResult } from "../../domain/automation-import-export";
import type { AutomationWorkflowDocument } from "../../domain/automation-workflow.types";
import {
	type AutomationNodeSources,
	canvasDocumentFromWorkflow,
} from "../../domain/automation-workflow-adapter";
import { automationToBpmnXml } from "./automation-to-bpmn";
import { bpmnXmlToAutomationDocument } from "./bpmn-import-adapter";

/** Whether an uploaded file's text looks like XML rather than JSON. */
export function isBpmnImportText(raw: string): boolean {
	return raw.trimStart().startsWith("<");
}

/**
 * Parses a BPMN file for the same import flow as the other workflow formats.
 *
 * Data stores in the file are matched against the engines the user can
 * access; if that lookup fails the import still goes ahead, with a warning,
 * and those tasks need their engine picked afterwards.
 */
export async function parseBpmnImportFile(
	raw: string,
	fileName: string,
): Promise<AutomationImportResult> {
	await ensureAutomationNodeDefinitions();
	let engines: Awaited<ReturnType<typeof listDataStoreEngines>> = [];
	let engineLookupWarning: string | undefined;
	if (/dataStoreReference/i.test(raw)) {
		try {
			engines = await listDataStoreEngines();
		} catch (error) {
			engineLookupWarning = `Could not load your engines to match the BPMN data stores: ${
				error instanceof Error ? error.message : "unknown error"
			}`;
		}
	}
	const result = await bpmnXmlToAutomationDocument(raw, fileName, {
		engines,
	});
	return engineLookupWarning
		? { ...result, warnings: [engineLookupWarning, ...result.warnings] }
		: result;
}

/** Downloads a saved workflow as a BPMN diagram. */
export async function downloadBpmnExport(
	fileNameBase: string,
	workflowDocument: AutomationWorkflowDocument,
	nodeSources: AutomationNodeSources,
): Promise<void> {
	await ensureAutomationNodeDefinitions();
	const canvas = canvasDocumentFromWorkflow(workflowDocument, nodeSources);
	const xml = await automationToBpmnXml(
		canvas.steps,
		canvas.edges,
		canvas.description || fileNameBase,
	);
	downloadBlob(
		new Blob([xml], { type: "application/xml" }),
		`${fileNameBase || "automation"}.bpmn`,
	);
}
