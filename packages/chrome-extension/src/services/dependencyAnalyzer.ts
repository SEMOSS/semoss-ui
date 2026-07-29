/**
 * Dependency Analyzer Service
 * Analyzes dependencies between recorded actions to determine impact of deletions
 */

import type { RecordedAction } from "../recorder/types";

/**
 * Types of dependencies between steps
 */
export type DependencyType =
	| "navigation" // Step requires specific URL/page context
	| "selector" // Step requires element created/affected by previous step
	| "form_flow" // Step requires input value from previous step
	| "element_state" // Step requires checked/selected state from previous step
	| "page_state"; // Step requires scroll position or page state

/**
 * Information about a single dependency
 */
export interface Dependency {
	/** Index of the step that depends on the deleted step */
	dependentStepIndex: number;

	/** Type of dependency */
	type: DependencyType;

	/** Human-readable explanation of the dependency */
	reason: string;

	/** The dependent action for reference */
	dependentAction: RecordedAction;
}

/**
 * Result of analyzing the impact of deleting a step
 */
export interface DeleteImpact {
	/** Whether deleting this step would break subsequent steps */
	hasImpact: boolean;

	/** List of dependencies that would be broken */
	dependencies: Dependency[];

	/** Summary message for the user */
	summary: string;
}

/**
 * Analyzes dependencies between recorded actions
 */
export class DependencyAnalyzer {
	private constructor() {
		// Prevent instantiation - this is a utility class with only static methods
	}

	/**
	 * Analyzes the impact of deleting a specific step
	 * Uses conservative pattern-based approach: warn by default, skip only obvious safe cases
	 * @param actionsList Complete list of recorded actions
	 * @param stepIndex Index of the step being deleted
	 * @returns Impact analysis with list of affected steps
	 */
	static getDeleteImpact(
		actionsList: RecordedAction[],
		stepIndex: number,
	): DeleteImpact {
		if (
			stepIndex < 0 ||
			stepIndex >= actionsList.length ||
			actionsList.length === 0
		) {
			return {
				hasImpact: false,
				dependencies: [],
				summary: "No impact detected",
			};
		}

		const stepToDelete = actionsList[stepIndex];
		const subsequentSteps = actionsList.slice(stepIndex + 1);

		// SAFE CASES: Can be deleted without warning
		// 1. WAIT actions (just delays, no side effects)
		// 2. Last step with nothing after it (no dependencies possible)
		const isLastStep = subsequentSteps.length === 0;
		const isSafeToDelete = stepToDelete.type === "WAIT" || isLastStep;

		if (isSafeToDelete) {
			const reason =
				stepToDelete.type === "WAIT"
					? "WAIT actions are just delays with no side effects."
					: "This is the last step in your recording - nothing follows it.";
			return {
				hasImpact: false,
				dependencies: [],
				summary: reason,
			};
		}

		// DEFAULT: Warn for everything else
		// Build dependencies list showing what comes after
		const dependencies: Dependency[] = [];

		// If there are steps after this one, they might be affected
		if (subsequentSteps.length > 0) {
			// Show ALL subsequent steps (removed limit)
			for (let i = 0; i < subsequentSteps.length; i++) {
				const nextStep = subsequentSteps[i];
				const nextStepIndex = stepIndex + 1 + i;

				const reason = DependencyAnalyzer.getImpactReason(
					stepToDelete,
					nextStep,
					i,
					subsequentSteps,
				);
				let depType: DependencyType = "page_state";

				// Determine dependency type for categorization
				if (stepToDelete.type === "NAVIGATE") {
					depType = "navigation";
				} else if (
					stepToDelete.type === "TYPE" &&
					nextStep.type === "CLICK"
				) {
					depType = "form_flow";
				} else if (
					stepToDelete.type === "CLICK" &&
					(nextStep.type === "TYPE" || nextStep.type === "CLICK")
				) {
					depType = "selector";
				} else if (
					stepToDelete.type === "CHECK" ||
					stepToDelete.type === "UNCHECK" ||
					stepToDelete.type === "SELECT"
				) {
					depType = "element_state";
				}

				dependencies.push({
					dependentStepIndex: nextStepIndex,
					type: depType,
					reason: reason,
					dependentAction: nextStep,
				});
			}
		}

		// Build summary
		const totalSteps = subsequentSteps.length;
		const summary =
			totalSteps > 0
				? `Deleting this step may affect ${totalSteps} subsequent step${totalSteps > 1 ? "s" : ""}. Review the list below to confirm.`
				: "This is the last step in your recording.";

		return {
			hasImpact: dependencies.length > 0,
			dependencies,
			summary,
		};
	}

	/**
	 * Generates a user-friendly explanation for all dependencies
	 */
	static formatDependencyExplanation(dependencies: Dependency[]): string {
		if (dependencies.length === 0) {
			return "No dependencies detected. This step can be safely deleted.";
		}

		const groupedByType = dependencies.reduce(
			(acc, dep) => {
				if (!acc[dep.type]) {
					acc[dep.type] = [];
				}
				acc[dep.type].push(dep);
				return acc;
			},
			{} as Record<DependencyType, Dependency[]>,
		);

		const explanations: string[] = [];

		if (groupedByType.navigation) {
			explanations.push(
				`🌐 **Page Context**: ${groupedByType.navigation.length} step${groupedByType.navigation.length > 1 ? "s" : ""} require${groupedByType.navigation.length === 1 ? "s" : ""} this page navigation.`,
			);
		}

		if (groupedByType.selector) {
			explanations.push(
				`🎯 **Element Dependencies**: ${groupedByType.selector.length} step${groupedByType.selector.length > 1 ? "s" : ""} may depend on elements affected by this action.`,
			);
		}

		if (groupedByType.form_flow) {
			explanations.push(
				`📝 **Form Flow**: ${groupedByType.form_flow.length} step${groupedByType.form_flow.length > 1 ? "s" : ""} depend${groupedByType.form_flow.length === 1 ? "s" : ""} on this form input.`,
			);
		}

		if (groupedByType.element_state) {
			explanations.push(
				`☑️ **Element State**: ${groupedByType.element_state.length} step${groupedByType.element_state.length > 1 ? "s" : ""} require${groupedByType.element_state.length === 1 ? "s" : ""} this element state.`,
			);
		}

		if (groupedByType.page_state) {
			explanations.push(
				`📜 **Page State**: ${groupedByType.page_state.length} step${groupedByType.page_state.length > 1 ? "s" : ""} depend${groupedByType.page_state.length === 1 ? "s" : ""} on this page state.`,
			);
		}

		return explanations.join("\n\n");
	}

	/**
	 * Generates a clear reason for why deleting this step might affect the next step
	 */
	private static getImpactReason(
		deletedStep: RecordedAction,
		nextStep: RecordedAction,
		_position: number,
		_allNextSteps: RecordedAction[],
	): string {
		// Navigation impact
		if (deletedStep.type === "NAVIGATE") {
			if (nextStep.type === "NAVIGATE") {
				return "Navigates to a different page";
			}
			if (nextStep.type === "WAIT") {
				return "Waits for the page to load";
			}
			if (nextStep.type === "CLICK") {
				return "Clicks an element on the loaded page";
			}
			if (nextStep.type === "TYPE") {
				return "Types into a field on the loaded page";
			}
			return `Performs ${nextStep.type} on the loaded page`;
		}

		// Form flow impact
		if (deletedStep.type === "TYPE") {
			if (nextStep.type === "CLICK") {
				return "Clicks button/link (may need the typed value)";
			}
			if (nextStep.type === "TYPE") {
				return "Types into the next form field";
			}
			if (nextStep.type === "SELECT") {
				return "Selects dropdown option (may be conditional on input)";
			}
			return `Performs ${nextStep.type} (may depend on this input)`;
		}

		// Click impact
		if (deletedStep.type === "CLICK") {
			if (nextStep.type === "NAVIGATE") {
				return "Page navigation triggered by this click";
			}
			if (nextStep.type === "TYPE") {
				return "Types into field revealed/enabled by click";
			}
			if (nextStep.type === "CLICK") {
				return "Clicks element revealed/enabled by this click";
			}
			if (nextStep.type === "WAIT") {
				return "Waits for elements from this click to load";
			}
			return `${nextStep.type} on elements from this click`;
		}

		// Double-click impact
		if (deletedStep.type === "DBLCLICK") {
			if (nextStep.type === "TYPE") {
				return "Types into field opened by double-click";
			}
			return `${nextStep.type} triggered by this double-click`;
		}

		// State change impact
		if (deletedStep.type === "CHECK") {
			return `${nextStep.type} (may require checkbox to be checked)`;
		}

		if (deletedStep.type === "UNCHECK") {
			return `${nextStep.type} (may require checkbox to be unchecked)`;
		}

		if (deletedStep.type === "SELECT") {
			return `${nextStep.type} (may depend on selected option)`;
		}

		// Scroll impact
		if (deletedStep.type === "SCROLL") {
			if (nextStep.type === "CLICK") {
				return "Clicks element that needs to be scrolled into view";
			}
			return `${nextStep.type} on element that may be out of viewport`;
		}

		// Default
		return `Follows this ${deletedStep.type.toLowerCase()} action`;
	}
}
