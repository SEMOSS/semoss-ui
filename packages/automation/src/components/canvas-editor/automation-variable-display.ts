import type { AutomationScopeEntry } from "../../domain/automation-inspector";

export interface AutomationVariableDisplay {
	label: string;
	description?: string;
	valueType?: string;
}

const LOOP_VARIABLE_LABELS: Record<string, string> = {
	item: "Current item",
	batch: "Current group",
	number: "Pass number",
	index: "Item index",
	total: "Total passes",
	isFirst: "First pass",
	isLast: "Last pass",
	maximum: "Maximum passes",
	results: "Collected results",
};

function humanizeIdentifier(value: string): string {
	const words = value
		.replaceAll("_", " ")
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		.trim();
	return words.length > 0
		? words.charAt(0).toUpperCase() + words.slice(1)
		: value;
}

/** Returns a business-facing label while preserving the variable name as its identity. */
export function getAutomationVariableDisplay(
	name: string,
	entries: AutomationScopeEntry[],
): AutomationVariableDisplay {
	const entry = entries.find((candidate) => candidate.name === name);
	if (entry) {
		return {
			label: entry.label,
			description: entry.description,
			valueType: entry.valueType,
		};
	}

	const parts = name.split(".").filter(Boolean);
	const leaf = parts.at(-1) ?? name;
	const loopLabel = LOOP_VARIABLE_LABELS[leaf];
	if (loopLabel) return { label: loopLabel };

	return {
		label: parts.map(humanizeIdentifier).join(" → "),
	};
}
