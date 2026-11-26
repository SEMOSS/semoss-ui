import type {
	AutomationNodeResult,
	AutomationRunDetail,
} from "../../../domain/automation.types";
import { flattenNodeResults } from "./run-data-browser-data";
import { getRunScopeVariableRows } from "./run-node-view-state";

/** One "variable contains text" rule from the advanced search. */
export interface VariableCondition {
	id: string;
	/** A variable reference as shown in the variable map, e.g. `${customer_id}`. */
	name: string;
	value: string;
}

/** Empty rows (no variable and no value) are still being filled in, so they do not filter. */
export function activeVariableConditions(
	conditions: readonly VariableCondition[],
): VariableCondition[] {
	return conditions.filter(
		(condition) => condition.name !== "" || condition.value.trim() !== "",
	);
}

/** Every variable name seen in the loaded runs' variable maps, sorted for a picker. */
export function collectVariableNames(
	details: Iterable<AutomationRunDetail>,
): string[] {
	const names = new Set<string>();
	for (const detail of details) {
		for (const result of flattenNodeResults(detail.nodeResults)) {
			for (const row of getRunScopeVariableRows(result.scopeSnapshot) ??
				[]) {
				names.add(row.name);
			}
		}
	}
	return [...names].sort((a, b) => a.localeCompare(b));
}

/**
 * True when every condition is met by some step of the run: that step's variable map holds the
 * variable with a value containing the text (ignoring case). A blank value only asks that the
 * variable exists, and a blank variable name searches every variable.
 */
export function runMatchesVariableConditions(
	detail: Pick<AutomationRunDetail, "nodeResults">,
	conditions: readonly VariableCondition[],
): boolean {
	return nodesMatchVariableConditions(detail.nodeResults, conditions);
}

/** Same test as {@link runMatchesVariableConditions}, for any set of steps, e.g. one loop pass. */
export function nodesMatchVariableConditions(
	nodes: readonly AutomationNodeResult[],
	conditions: readonly VariableCondition[],
): boolean {
	if (conditions.length === 0) return true;
	const stepVariables = flattenNodeResults(nodes).map(
		(result) => getRunScopeVariableRows(result.scopeSnapshot) ?? [],
	);
	return conditions.every(({ name, value }) => {
		const needle = value.trim().toLowerCase();
		return stepVariables.some((rows) =>
			rows.some(
				(row) =>
					(name === "" || row.name === name) &&
					row.value.toLowerCase().includes(needle),
			),
		);
	});
}
