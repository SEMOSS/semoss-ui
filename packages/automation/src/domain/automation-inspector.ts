import type {
	AutomationNode,
	AutomationNodeTrace,
	StepRunStatus,
} from "./automation.types";
import type { AutomationOutputFieldSchema } from "./automation-workflow.types";

/** Server-derived description of one value visible to a node at runtime. */
export interface AutomationScopeEntry {
	name: string;
	source: "runtime" | "global" | "node";
	label: string;
	description: string;
	availability: "guaranteed" | "conditional";
	pythonExpression: string;
	requiredPythonExpression?: string;
	optionalPythonExpression?: string;
	templateExpression: string;
	valueType?: string;
	sourceNodeId?: string;
	defaultValue?: unknown;
}

export type AutomationScopeAccess = "required" | "optional";

/** Returns real Python syntax for reading one run-scope value. */
export function getAutomationScopeExpression(
	entry: AutomationScopeEntry,
	access: AutomationScopeAccess,
): string {
	if (access === "optional") {
		return (
			entry.optionalPythonExpression ??
			`scope.get(${JSON.stringify(entry.name)})`
		);
	}
	return (
		entry.requiredPythonExpression ?? `scope[${JSON.stringify(entry.name)}]`
	);
}

const MAX_DISCOVERED_SCOPE_FIELDS = 60;
const MAX_DISCOVERED_SCOPE_DEPTH = 4;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function scopeValueType(value: unknown): string {
	if (value === null) return "null";
	if (Array.isArray(value)) return "array";
	return typeof value === "object" ? "object" : typeof value;
}

function requiredNestedExpression(root: string, path: string[]): string {
	return [root, ...path]
		.map((part, index) =>
			index === 0
				? `scope[${JSON.stringify(part)}]`
				: `[${JSON.stringify(part)}]`,
		)
		.join("");
}

function optionalNestedExpression(root: string, path: string[]): string {
	let expression = `scope.get(${JSON.stringify(root)}, {})`;
	for (let index = 0; index < path.length; index++) {
		const part = path[index];
		const isLast = index === path.length - 1;
		expression += `.get(${JSON.stringify(part)}${isLast ? "" : ", {}"})`;
	}
	return expression;
}

/** Describes fields guaranteed by a node's server-owned output contract. */
export function declaredAutomationScopeEntries(
	parent: AutomationScopeEntry,
	outputSchema: Record<string, AutomationOutputFieldSchema>,
): AutomationScopeEntry[] {
	return Object.entries(outputSchema).map(([key, field]) => {
		const path = [key];
		const requiredPythonExpression = requiredNestedExpression(
			parent.name,
			path,
		);
		const optionalPythonExpression = optionalNestedExpression(
			parent.name,
			path,
		);
		const availability =
			parent.availability === "conditional" || !field.required
				? "conditional"
				: "guaranteed";
		return {
			...parent,
			name: `${parent.name}.${key}`,
			label: `${parent.label} / ${field.label}`,
			description: field.description,
			availability,
			pythonExpression:
				availability === "conditional"
					? optionalPythonExpression
					: requiredPythonExpression,
			requiredPythonExpression,
			optionalPythonExpression,
			templateExpression: `\${${parent.name}.${key}}`,
			valueType: field.type,
		};
	});
}

/**
 * Describes object fields observed in a prior node's persisted JSON output.
 * Discovery is bounded so a large database result cannot flood editor completion.
 */
export function inferNestedAutomationScopeEntries(
	parent: AutomationScopeEntry,
	serializedOutput: string | null | undefined,
): AutomationScopeEntry[] {
	if (!serializedOutput) return [];

	let output: unknown;
	try {
		output = JSON.parse(serializedOutput);
	} catch {
		return [];
	}
	if (!isRecord(output)) return [];

	const entries: AutomationScopeEntry[] = [];
	const visit = (value: Record<string, unknown>, path: string[]): void => {
		if (
			path.length >= MAX_DISCOVERED_SCOPE_DEPTH ||
			entries.length >= MAX_DISCOVERED_SCOPE_FIELDS
		) {
			return;
		}
		for (const [key, child] of Object.entries(value)) {
			if (entries.length >= MAX_DISCOVERED_SCOPE_FIELDS) return;
			const childPath = [...path, key];
			const requiredPythonExpression = requiredNestedExpression(
				parent.name,
				childPath,
			);
			const optionalPythonExpression = optionalNestedExpression(
				parent.name,
				childPath,
			);
			entries.push({
				...parent,
				name: [parent.name, ...childPath].join("."),
				label: `${parent.label} / ${childPath.join(" / ")}`,
				description: "Observed in the selected or latest run output.",
				availability: "conditional",
				pythonExpression: optionalPythonExpression,
				requiredPythonExpression,
				optionalPythonExpression,
				templateExpression: `\${${[parent.name, ...childPath].join(".")}}`,
				valueType: scopeValueType(child),
			});
			if (isRecord(child)) visit(child, childPath);
		}
	};

	visit(output, []);
	return entries;
}

export interface AutomationInspectorSnapshot {
	description: string;
	devMode: boolean;
	/** Whether the owning canvas is read-only — mirrors `AutomationCanvas`'s `readOnly` prop so a
	 * host rendering the inspector as a sibling panel can disable its forms even if its own
	 * `readOnly` prop were ever out of sync with the canvas. */
	readOnly: boolean;
	editingStep: AutomationNode | null;
	upstreamVars: string[];
	scopeEntries: AutomationScopeEntry[];
	stepRunStatus?: StepRunStatus;
	stepRunError?: string;
	stepRunOutput?: string | null;
	stepRunTrace?: AutomationNodeTrace;
}

export type AutomationInspectorAction =
	| { type: "update-step"; step: AutomationNode }
	| { type: "delete-step"; stepId: string }
	| { type: "update-description"; description: string }
	| { type: "update-dev-mode"; devMode: boolean }
	| { type: "close" };
