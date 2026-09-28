import { runPixel } from "@semoss/sdk";
import type {
	AutomationNodeCatalog,
	AutomationNodeDefinition,
	AutomationOutputFieldSchema,
	AutomationPort,
	ConfigFieldSchema,
} from "../domain/automation-workflow.types";

const SUPPORTED_SCHEMA_VERSION = 1;
const NODE_CATEGORIES = new Set([
	"trigger",
	"database",
	"model",
	"agent",
	"storage",
	"vector",
	"function",
	"app",
	"control",
	"developer",
]);
const CONFIG_FIELD_TYPES = new Set([
	"boolean",
	"branch-clauses",
	"code",
	"engine",
	"globals",
	"json",
	"number",
	"string",
	"string[]",
	"textarea",
]);
const OUTPUT_FIELD_TYPES = new Set([
	"boolean",
	"number",
	"object",
	"string",
	"string[]",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isConfigFieldSchema(value: unknown): value is ConfigFieldSchema {
	return (
		isRecord(value) &&
		typeof value.type === "string" &&
		CONFIG_FIELD_TYPES.has(value.type) &&
		typeof value.label === "string" &&
		value.label.length > 0
	);
}

function isOutputFieldSchema(
	value: unknown,
): value is AutomationOutputFieldSchema {
	return (
		isRecord(value) &&
		typeof value.type === "string" &&
		OUTPUT_FIELD_TYPES.has(value.type) &&
		typeof value.label === "string" &&
		value.label.length > 0 &&
		typeof value.description === "string" &&
		typeof value.required === "boolean"
	);
}

function isPort(value: unknown): value is AutomationPort {
	return (
		isRecord(value) &&
		typeof value.id === "string" &&
		typeof value.label === "string" &&
		(value.kind === "control" || value.kind === "data") &&
		(value.direction === "input" || value.direction === "output")
	);
}

function isNodeDefinition(value: unknown): value is AutomationNodeDefinition {
	if (
		!isRecord(value) ||
		typeof value.type !== "string" ||
		value.type.length === 0 ||
		typeof value.label !== "string" ||
		typeof value.description !== "string" ||
		typeof value.category !== "string" ||
		!NODE_CATEGORIES.has(value.category) ||
		!isRecord(value.defaultConfig) ||
		!isRecord(value.configSchema) ||
		!Object.values(value.configSchema).every(isConfigFieldSchema) ||
		!isRecord(value.outputSchema) ||
		!Object.values(value.outputSchema).every(isOutputFieldSchema) ||
		!Array.isArray(value.inputs) ||
		!value.inputs.every(isPort) ||
		!Array.isArray(value.outputs) ||
		!value.outputs.every(isPort) ||
		(value.defaultCodeMode !== "generated" &&
			value.defaultCodeMode !== "custom") ||
		typeof value.requiredPermission !== "string" ||
		typeof value.supportsOutput !== "boolean" ||
		typeof value.supportsCustomCode !== "boolean"
	) {
		return false;
	}
	return true;
}

/** Loads and validates the canonical Automation node catalog from SEMOSS. */
export async function fetchAutomationNodeDefinitions(): Promise<AutomationNodeCatalog> {
	const response = await runPixel("GetAutomationNodeDefinitions();");
	if (response.errors.length > 0) {
		throw new Error(response.errors.join("\n"));
	}

	const output: unknown = response.pixelReturn?.[0]?.output;
	if (
		!isRecord(output) ||
		output.schemaVersion !== SUPPORTED_SCHEMA_VERSION
	) {
		throw new Error(
			"SEMOSS returned an unsupported Automation node catalog version.",
		);
	}
	if (!Array.isArray(output.nodes) || !output.nodes.every(isNodeDefinition)) {
		throw new Error("SEMOSS returned an invalid Automation node catalog.");
	}

	const nodeTypes = new Set(output.nodes.map((node) => node.type));
	if (nodeTypes.size !== output.nodes.length) {
		throw new Error(
			"SEMOSS returned duplicate Automation node definitions.",
		);
	}
	if (!nodeTypes.has("trigger.start")) {
		throw new Error(
			"SEMOSS returned an Automation catalog without a start node.",
		);
	}

	return {
		schemaVersion: SUPPORTED_SCHEMA_VERSION,
		nodes: output.nodes,
	};
}
