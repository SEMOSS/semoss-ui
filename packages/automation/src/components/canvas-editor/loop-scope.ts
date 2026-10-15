import type { AutomationNode, LoopConfig } from "../../domain/automation.types";
import type { AutomationScopeEntry } from "../../domain/automation-inspector";
import { getLoopBodyUpstreamVariables } from "./loop-body-graph";

export interface LoopContextVariable {
	label: string;
	name: string;
}

/** Business-facing values exposed to every step inside one loop pass. */
export function getLoopContextVariables(
	config: LoopConfig,
	outputVar: string,
	bodyNodes: AutomationNode[],
): LoopContextVariable[] {
	const variables: LoopContextVariable[] = [
		{ label: "Pass number", name: `${outputVar}.number` },
		{ label: "Zero-based index", name: `${outputVar}.index` },
		{ label: "Is first pass", name: `${outputVar}.isFirst` },
	];
	if (config.mode === "forEach") {
		if (config.batchSize === 1) {
			variables.unshift({
				label: "Current item",
				name: `${outputVar}.item`,
			});
		}
		variables.push(
			{ label: "Current group", name: `${outputVar}.batch` },
			{ label: "Total passes", name: `${outputVar}.total` },
			{ label: "Is last pass", name: `${outputVar}.isLast` },
		);
	} else if (config.mode === "repeat") {
		variables.push(
			{ label: "Total passes", name: `${outputVar}.total` },
			{ label: "Is last pass", name: `${outputVar}.isLast` },
		);
	} else {
		variables.push({
			label: "Safety limit",
			name: `${outputVar}.maximum`,
		});
		for (const node of bodyNodes) {
			if (!node.outputVar) continue;
			variables.push({
				label: `Previous ${node.label}`,
				name: `${outputVar}.previous.${node.outputVar}`,
			});
		}
	}
	return variables;
}

interface LoopBodyScopeOptions {
	loop: AutomationNode;
	selectedNodeId: string;
	upstreamVars: string[];
	scopeEntries: AutomationScopeEntry[];
}

/** Combines parent inputs, loop-pass values, and earlier inner-step outputs. */
export function getLoopBodyScope({
	loop,
	selectedNodeId,
	upstreamVars,
	scopeEntries,
}: LoopBodyScopeOptions): {
	upstreamVars: string[];
	scopeEntries: AutomationScopeEntry[];
} {
	const body = loop.body ?? { nodes: [], edges: [] };
	const contextVariables = getLoopContextVariables(
		loop.config as LoopConfig,
		loop.outputVar,
		body.nodes,
	);
	const selectedUpstreamVars = Array.from(
		new Set([
			...upstreamVars,
			loop.outputVar,
			...contextVariables.map(({ name }) => name),
			...getLoopBodyUpstreamVariables(body, selectedNodeId),
		]),
	);
	const knownEntries = new Map(
		scopeEntries.map((entry) => [entry.name, entry]),
	);
	knownEntries.set(loop.outputVar, {
		name: loop.outputVar,
		source: "node",
		label: "Current loop pass",
		description: "Context supplied by the current loop pass.",
		availability: "guaranteed",
		pythonExpression: `scope[${JSON.stringify(loop.outputVar)}]`,
		templateExpression: `\${${loop.outputVar}}`,
		valueType: "object",
	});
	for (const variable of contextVariables) {
		const path = variable.name
			.slice(loop.outputVar.length)
			.split(".")
			.filter(Boolean);
		const requiredPythonExpression = `scope[${JSON.stringify(loop.outputVar)}]${path
			.map((part) => `[${JSON.stringify(part)}]`)
			.join("")}`;
		let optionalPythonExpression = `scope.get(${JSON.stringify(loop.outputVar)}, {})`;
		for (const [index, part] of path.entries()) {
			optionalPythonExpression += `.get(${JSON.stringify(part)}${index === path.length - 1 ? "" : ", {}"})`;
		}
		knownEntries.set(variable.name, {
			name: variable.name,
			source: "node",
			label: variable.label,
			description: "Value supplied by the current loop pass.",
			availability: "guaranteed",
			pythonExpression: requiredPythonExpression,
			requiredPythonExpression,
			optionalPythonExpression,
			templateExpression: `\${${variable.name}}`,
			valueType: "unknown",
		});
	}
	for (const name of selectedUpstreamVars) {
		if (knownEntries.has(name)) continue;
		knownEntries.set(name, {
			name,
			source: "node",
			label: name,
			description: "Output available to this loop step.",
			availability: "guaranteed",
			pythonExpression: `scope[${JSON.stringify(name)}]`,
			templateExpression: `\${${name}}`,
		});
	}
	return {
		upstreamVars: selectedUpstreamVars,
		scopeEntries: selectedUpstreamVars.flatMap((name) => {
			const entry = knownEntries.get(name);
			return entry ? [entry] : [];
		}),
	};
}
