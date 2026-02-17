import type { WorkflowStep } from "@/types/workflow";

// ─── Types ───────────────────────────────────────────────────────
export interface ValidationError {
	stepId?: string;
	message: string;
}

// ─── Helpers ─────────────────────────────────────────────────────

/** Gather all outgoing stepId references from a step */
function outgoingRefs(step: WorkflowStep): string[] {
	return [
		...(step.next ?? []),
		...(step.ifTrue ?? []),
		...(step.ifFalse ?? []),
	];
}

/** Build a Set of all stepIds */
function stepIdSet(steps: WorkflowStep[]): Set<string> {
	return new Set(steps.map((s) => s.stepId));
}

// ─── Validations ─────────────────────────────────────────────────

/** Check for duplicate step IDs */
export function findDuplicateIds(steps: WorkflowStep[]): ValidationError[] {
	const seen = new Set<string>();
	const errors: ValidationError[] = [];
	for (const step of steps) {
		if (seen.has(step.stepId)) {
			errors.push({
				stepId: step.stepId,
				message: `Duplicate step ID "${step.stepId}"`,
			});
		}
		seen.add(step.stepId);
	}
	return errors;
}

/** Check for dangling references — edges pointing to non-existent stepIds */
export function findDanglingRefs(steps: WorkflowStep[]): ValidationError[] {
	const ids = stepIdSet(steps);
	const errors: ValidationError[] = [];
	for (const step of steps) {
		for (const ref of outgoingRefs(step)) {
			if (!ids.has(ref)) {
				errors.push({
					stepId: step.stepId,
					message: `Step "${step.stepId}" references non-existent step "${ref}"`,
				});
			}
		}
	}
	return errors;
}

/** Find entry steps (no incoming edges) */
export function findEntrySteps(steps: WorkflowStep[]): WorkflowStep[] {
	const hasIncoming = new Set<string>();
	for (const step of steps) {
		for (const ref of outgoingRefs(step)) {
			hasIncoming.add(ref);
		}
	}
	return steps.filter((s) => !hasIncoming.has(s.stepId));
}

/** Find orphaned steps — unreachable from any entry point via BFS */
export function findOrphanedSteps(steps: WorkflowStep[]): ValidationError[] {
	if (steps.length === 0) return [];

	const ids = stepIdSet(steps);
	const stepMap = new Map(steps.map((s) => [s.stepId, s]));
	const entries = findEntrySteps(steps);

	if (entries.length === 0) {
		return [
			{
				message:
					"No entry points found — every step has incoming edges (possible cycle)",
			},
		];
	}

	const visited = new Set<string>();
	const queue = entries.map((e) => e.stepId);

	while (queue.length > 0) {
		const current = queue.shift();
		if (current == null || visited.has(current)) continue;
		visited.add(current);

		const step = stepMap.get(current);
		if (!step) continue;

		for (const ref of outgoingRefs(step)) {
			if (ids.has(ref) && !visited.has(ref)) {
				queue.push(ref);
			}
		}
	}

	const orphaned = steps.filter((s) => !visited.has(s.stepId));
	return orphaned.map((s) => ({
		stepId: s.stepId,
		message: `Step "${s.stepId}" (${s.name}) is orphaned — unreachable from any entry point`,
	}));
}

/** Detect cycles via DFS */
export function findCycles(steps: WorkflowStep[]): ValidationError[] {
	const stepMap = new Map(steps.map((s) => [s.stepId, s]));
	const visited = new Set<string>();
	const inStack = new Set<string>();
	const errors: ValidationError[] = [];

	function dfs(id: string): boolean {
		if (inStack.has(id)) {
			errors.push({
				stepId: id,
				message: `Cycle detected involving step "${id}"`,
			});
			return true;
		}
		if (visited.has(id)) return false;

		visited.add(id);
		inStack.add(id);

		const step = stepMap.get(id);
		if (step) {
			for (const ref of outgoingRefs(step)) {
				if (dfs(ref)) return true;
			}
		}

		inStack.delete(id);
		return false;
	}

	for (const step of steps) {
		if (!visited.has(step.stepId)) {
			dfs(step.stepId);
		}
	}

	return errors;
}

/** Run all validations together */
export function validateWorkflow(steps: WorkflowStep[]): ValidationError[] {
	return [
		...findDuplicateIds(steps),
		...findDanglingRefs(steps),
		...findOrphanedSteps(steps),
		...findCycles(steps),
	];
}

/**
 * Get all upstream step IDs reachable by walking backwards through the DAG.
 * Used for template expression autocomplete — only show steps that will have
 * executed before the current step.
 */
export function getUpstreamStepIds(
	steps: WorkflowStep[],
	targetStepId: string,
): Set<string> {
	// Build a reverse adjacency map: childId → Set<parentId>
	const reverseMap = new Map<string, Set<string>>();
	for (const step of steps) {
		for (const ref of outgoingRefs(step)) {
			if (!reverseMap.has(ref)) {
				reverseMap.set(ref, new Set());
			}
			reverseMap.get(ref)?.add(step.stepId);
		}
	}

	const visited = new Set<string>();
	const queue = [targetStepId];

	while (queue.length > 0) {
		const current = queue.shift();
		if (current == null) continue;
		const parents = reverseMap.get(current);
		if (!parents) continue;

		for (const parentId of parents) {
			if (!visited.has(parentId)) {
				visited.add(parentId);
				queue.push(parentId);
			}
		}
	}

	return visited;
}

/**
 * Remove all references to a deleted stepId from other steps.
 * Returns a new array with cleaned steps.
 */
export function removeStepReferences(
	steps: WorkflowStep[],
	deletedStepId: string,
): WorkflowStep[] {
	return steps
		.filter((s) => s.stepId !== deletedStepId)
		.map((s) => ({
			...s,
			next: s.next?.filter((id) => id !== deletedStepId) ?? null,
			ifTrue: s.ifTrue?.filter((id) => id !== deletedStepId) ?? null,
			ifFalse: s.ifFalse?.filter((id) => id !== deletedStepId) ?? null,
		}));
}

/**
 * Auto-rewire: if A→B→C and B is deleted, wire A→C.
 * Returns steps with the deleted step removed and edges rewired.
 */
export function removeStepAndRewire(
	steps: WorkflowStep[],
	deletedStepId: string,
): WorkflowStep[] {
	const deletedStep = steps.find((s) => s.stepId === deletedStepId);
	if (!deletedStep) return steps;

	const deletedSuccessors = outgoingRefs(deletedStep);

	return steps
		.filter((s) => s.stepId !== deletedStepId)
		.map((s) => {
			const replaceRef = (refs: string[] | null): string[] | null => {
				if (!refs) return null;
				const updated = refs.flatMap((id) =>
					id === deletedStepId ? deletedSuccessors : [id],
				);
				return updated.length > 0 ? updated : null;
			};

			return {
				...s,
				next: replaceRef(s.next),
				ifTrue: replaceRef(s.ifTrue),
				ifFalse: replaceRef(s.ifFalse),
			};
		});
}
