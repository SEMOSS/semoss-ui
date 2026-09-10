/**
 * Format-agnostic import/export for the canvas toolbar: detects whether an uploaded
 * file is our own round-trip export or an n8n workflow, and builds the downloadable
 * file for "Export".
 */

import type { AutomationWorkflowDocument } from "./automation-workflow.types";
import type { AutomationNodeSources } from "./automation-workflow-adapter";
import {
	n8nWorkflowToAutomationDocument,
	parseN8nWorkflowJson,
} from "./n8n-import-adapter";

export interface NativeAutomationExport extends AutomationWorkflowDocument {
	nodeSources: AutomationNodeSources;
}

export interface AutomationImportResult {
	document: AutomationWorkflowDocument;
	nodeSources: AutomationNodeSources;
	warnings: string[];
}

function isNativeAutomationExport(
	value: unknown,
): value is NativeAutomationExport {
	return (
		!!value &&
		typeof value === "object" &&
		(value as { formatVersion?: unknown }).formatVersion === 2 &&
		!!(value as { graph?: unknown }).graph
	);
}

function isN8nWorkflow(value: unknown): boolean {
	return (
		!!value &&
		typeof value === "object" &&
		Array.isArray((value as { nodes?: unknown }).nodes) &&
		typeof (value as { connections?: unknown }).connections === "object"
	);
}

export function buildNativeAutomationExport(
	workflowDocument: AutomationWorkflowDocument,
	nodeSources: AutomationNodeSources,
): NativeAutomationExport {
	return { ...workflowDocument, nodeSources };
}

/** Parses a file from either "Export" (native) or an n8n workflow export. */
export function parseAutomationImportFile(raw: string): AutomationImportResult {
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		throw new Error("File is not valid JSON.");
	}
	if (isNativeAutomationExport(parsed)) {
		const { nodeSources, ...workflowDocument } = parsed;
		return {
			document: workflowDocument,
			nodeSources: nodeSources ?? {},
			warnings: [],
		};
	}
	if (isN8nWorkflow(parsed)) {
		return n8nWorkflowToAutomationDocument(parseN8nWorkflowJson(raw));
	}
	throw new Error("File doesn't look like a supported automation export.");
}

/** Triggers a browser download of the current automation as a single JSON file. */
export function downloadAutomationExport(
	fileNameBase: string,
	workflowDocument: AutomationWorkflowDocument,
	nodeSources: AutomationNodeSources,
): void {
	const payload = buildNativeAutomationExport(workflowDocument, nodeSources);
	const blob = new Blob([JSON.stringify(payload, null, 2)], {
		type: "application/json",
	});
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = `${fileNameBase || "automation"}.json`;
	anchor.click();
	URL.revokeObjectURL(url);
}
