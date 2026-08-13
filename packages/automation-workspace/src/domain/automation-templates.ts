import type {
	AutomationNode,
	DatabaseEngineConfig,
	ModelEngineConfig,
	StorageEngineConfig,
	VectorEngineConfig,
} from "./automation.types";
import { newStepId } from "./automation-display";

export interface AutomationTemplate {
	id: string;
	name: string;
	description: string;
	automationDescription: string;
	makeNodes: () => AutomationNode[];
}

function triggerNode(): AutomationNode {
	return {
		id: newStepId("trigger"),
		type: "trigger",
		position: { x: 0, y: 0 },
		label: "Trigger",
		outputVar: "trigger_out",
		config: { mode: "manual" },
	};
}

function dbNode(
	label: string,
	outputVar: string,
	operation: DatabaseEngineConfig["operation"] = "query",
): AutomationNode {
	return {
		id: newStepId("database-engine"),
		type: "database-engine",
		position: { x: 0, y: 0 },
		label,
		outputVar,
		config: {
			engineId: "",
			operation,
			expression: "",
			limit: 50,
			commit: operation === "write",
		} as DatabaseEngineConfig,
	};
}

function modelNode(
	label: string,
	outputVar: string,
	command = "",
): AutomationNode {
	return {
		id: newStepId("model-engine"),
		type: "model-engine",
		position: { x: 0, y: 0 },
		label,
		outputVar,
		config: {
			engineId: "",
			operation: "llm",
			command,
			context: "",
			paramValues: "",
			values: "",
			image: "",
			prompt: "",
			entities: "",
		} as ModelEngineConfig,
	};
}

function storageNode(
	label: string,
	outputVar: string,
	operation: StorageEngineConfig["operation"] = "list",
): AutomationNode {
	return {
		id: newStepId("storage-engine"),
		type: "storage-engine",
		position: { x: 0, y: 0 },
		label,
		outputVar,
		config: {
			engineId: "",
			operation,
			storagePath: "/",
			filePath: "",
			metadata: "",
		} as StorageEngineConfig,
	};
}

function vectorNode(
	label: string,
	outputVar: string,
	operation: VectorEngineConfig["operation"] = "search",
): AutomationNode {
	return {
		id: newStepId("vector-engine"),
		type: "vector-engine",
		position: { x: 0, y: 0 },
		label,
		outputVar,
		config: {
			engineId: "",
			operation,
			command: "",
			limit: 5,
			filters: "",
			metaFilters: "",
			filePath: "",
			source: "",
			space: "",
			filePaths: "",
			paramValues: "",
			fileNames: "",
		} as VectorEngineConfig,
	};
}

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
	{
		id: "weekly-db-report",
		name: "Weekly Report",
		description:
			"Query a database, summarize results with AI, and produce a plain-English briefing.",
		automationDescription: "Weekly database report",
		makeNodes: () => [
			triggerNode(),
			dbNode("Query Database", "db_out"),
			modelNode(
				"Summarize Results",
				"summary_out",
				"Summarize these records in 3–5 bullet points for a weekly briefing.",
			),
		],
	},
	{
		id: "document-indexer",
		name: "Document Indexer",
		description:
			"Download a file from storage and index it into a vector database for Q&A.",
		automationDescription: "Index documents for Q&A",
		makeNodes: () => [
			triggerNode(),
			storageNode("Download File", "file_out", "download"),
			vectorNode("Index Document", "index_out", "add-file"),
		],
	},
	{
		id: "data-enrichment",
		name: "Data Enrichment",
		description:
			"Pull records from a database, enrich them with AI, and write the results back.",
		automationDescription: "AI-powered data enrichment pipeline",
		makeNodes: () => [
			triggerNode(),
			dbNode("Fetch Records", "db_out"),
			modelNode(
				"Enrich with AI",
				"enriched_out",
				"Analyze and enrich each of the following records with additional context.",
			),
			dbNode("Write Results", "write_out", "write"),
		],
	},
	{
		id: "knowledge-search",
		name: "Knowledge Search",
		description:
			"Search a document store and use AI to draft a focused answer.",
		automationDescription: "Knowledge base search and answer",
		makeNodes: () => [
			triggerNode(),
			vectorNode("Search Documents", "search_out", "search"),
			modelNode(
				"Draft Answer",
				"answer_out",
				"Using the context below, answer the question clearly and concisely.",
			),
		],
	},
	{
		id: "file-analyzer",
		name: "File Analyzer",
		description:
			"List files in storage, analyze them with AI, and upload a summary report.",
		automationDescription: "Automated file analysis and reporting",
		makeNodes: () => [
			triggerNode(),
			storageNode("List Files", "files_out", "list"),
			modelNode(
				"Analyze Files",
				"analysis_out",
				"Analyze these files and produce a structured summary report.",
			),
			storageNode("Upload Report", "upload_out", "upload"),
		],
	},
];
