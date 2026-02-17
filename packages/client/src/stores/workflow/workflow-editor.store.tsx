import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useReducer,
} from "react";
import {
	getWorkflowStatus,
	runWorkflow as runWorkflowApi,
	saveWorkflow as saveWorkflowApi,
} from "@/api/workflow";
import type {
	Position,
	RunWorkflowResponse,
	StepType,
	Workflow,
	WorkflowExecution,
	WorkflowStep,
} from "@/types/workflow";
import {
	createEmptyWorkflow,
	createStep,
	DEFAULT_WORKFLOW_SETTINGS,
} from "@/types/workflow";
import { removeStepAndRewire } from "@/utility/workflow-dag";

// ─── State ───────────────────────────────────────────────────────
export interface WorkflowEditorState {
	/** The project ID this workflow belongs to */
	projectId: string;

	/** Current workflow document */
	workflow: Workflow;

	/** Currently selected step on the canvas */
	selectedStepId: string | null;

	/** Whether unsaved changes exist */
	isDirty: boolean;

	/** Undo stack of workflow snapshots */
	historyStack: Workflow[];

	/** Redo stack of workflow snapshots */
	redoStack: Workflow[];

	/** Execution status */
	executionStatus: "idle" | "running" | "complete";

	/** Last execution result */
	lastExecutionResult: RunWorkflowResponse | null;

	/** Execution history from the backend */
	executions: WorkflowExecution[];

	/** Loading state */
	loading: boolean;

	/** Error state */
	error: string | null;
}

// ─── Actions ─────────────────────────────────────────────────────
type Action =
	| { type: "SET_LOADING"; loading: boolean }
	| { type: "SET_ERROR"; error: string | null }
	| {
			type: "LOAD_WORKFLOW";
			projectId: string;
			workflow: Workflow;
			executions: WorkflowExecution[];
	  }
	| {
			type: "ADD_STEP";
			stepType: StepType;
			position: Position;
			name?: string;
			configOverrides?: Record<string, unknown>;
	  }
	| { type: "DELETE_STEP"; stepId: string }
	| { type: "UPDATE_STEP"; stepId: string; updates: Partial<WorkflowStep> }
	| { type: "MOVE_STEP"; stepId: string; position: Position }
	| {
			type: "CONNECT_STEPS";
			sourceId: string;
			targetId: string;
			handleType: "next" | "ifTrue" | "ifFalse";
	  }
	| {
			type: "DISCONNECT_STEPS";
			sourceId: string;
			targetId: string;
			handleType: "next" | "ifTrue" | "ifFalse";
	  }
	| { type: "SELECT_STEP"; stepId: string | null }
	| { type: "SET_VARIABLES"; variables: Record<string, unknown> }
	| {
			type: "SET_SETTINGS";
			settings: Partial<Workflow["settings"]>;
	  }
	| { type: "SET_WORKFLOW_NAME"; name: string }
	| { type: "MARK_SAVED"; version: number }
	| { type: "UNDO" }
	| { type: "REDO" }
	| { type: "SET_EXECUTION_STATUS"; status: "idle" | "running" | "complete" }
	| { type: "SET_EXECUTION_RESULT"; result: RunWorkflowResponse }
	| { type: "SET_EXECUTIONS"; executions: WorkflowExecution[] };

const MAX_HISTORY = 50;

function pushHistory(state: WorkflowEditorState): WorkflowEditorState {
	return {
		...state,
		historyStack: [
			...state.historyStack.slice(-MAX_HISTORY),
			structuredClone(state.workflow),
		],
		redoStack: [],
	};
}

function reducer(
	state: WorkflowEditorState,
	action: Action,
): WorkflowEditorState {
	switch (action.type) {
		case "SET_LOADING":
			return { ...state, loading: action.loading };

		case "SET_ERROR":
			return { ...state, error: action.error, loading: false };

		case "LOAD_WORKFLOW":
			return {
				...state,
				projectId: action.projectId,
				workflow:
					action.workflow ??
					createEmptyWorkflow(action.projectId, "New Workflow"),
				executions: action.executions ?? [],
				loading: false,
				error: null,
				isDirty: false,
				historyStack: [],
				redoStack: [],
				selectedStepId: null,
			};

		case "ADD_STEP": {
			const s = pushHistory(state);
			const newStep = createStep(
				action.stepType,
				action.position,
				action.name,
			);
			// Apply config overrides (e.g. source: "project" for Use App)
			if (action.configOverrides) {
				newStep.config = {
					...newStep.config,
					...action.configOverrides,
				};
			}
			return {
				...s,
				isDirty: true,
				workflow: {
					...s.workflow,
					steps: [...s.workflow.steps, newStep],
				},
				selectedStepId: newStep.stepId,
			};
		}

		case "DELETE_STEP": {
			const s = pushHistory(state);
			return {
				...s,
				isDirty: true,
				workflow: {
					...s.workflow,
					steps: removeStepAndRewire(s.workflow.steps, action.stepId),
				},
				selectedStepId:
					s.selectedStepId === action.stepId
						? null
						: s.selectedStepId,
			};
		}

		case "UPDATE_STEP": {
			const s = pushHistory(state);
			return {
				...s,
				isDirty: true,
				workflow: {
					...s.workflow,
					steps: s.workflow.steps.map((step) =>
						step.stepId === action.stepId
							? { ...step, ...action.updates }
							: step,
					),
				},
			};
		}

		case "MOVE_STEP": {
			// Position changes are lightweight — don't push history
			return {
				...state,
				isDirty: true,
				workflow: {
					...state.workflow,
					steps: state.workflow.steps.map((step) =>
						step.stepId === action.stepId
							? { ...step, position: action.position }
							: step,
					),
				},
			};
		}

		case "CONNECT_STEPS": {
			const s = pushHistory(state);
			return {
				...s,
				isDirty: true,
				workflow: {
					...s.workflow,
					steps: s.workflow.steps.map((step) => {
						if (step.stepId !== action.sourceId) return step;
						const field = action.handleType;
						const existing = step[field] ?? [];
						if (existing.includes(action.targetId)) return step;
						return {
							...step,
							[field]: [...existing, action.targetId],
						};
					}),
				},
			};
		}

		case "DISCONNECT_STEPS": {
			const s = pushHistory(state);
			return {
				...s,
				isDirty: true,
				workflow: {
					...s.workflow,
					steps: s.workflow.steps.map((step) => {
						if (step.stepId !== action.sourceId) return step;
						const field = action.handleType;
						const existing = step[field];
						if (!existing) return step;
						const filtered = existing.filter(
							(id) => id !== action.targetId,
						);
						return {
							...step,
							[field]: filtered.length > 0 ? filtered : null,
						};
					}),
				},
			};
		}

		case "SELECT_STEP":
			return { ...state, selectedStepId: action.stepId };

		case "SET_VARIABLES": {
			const s = pushHistory(state);
			return {
				...s,
				isDirty: true,
				workflow: { ...s.workflow, variables: action.variables },
			};
		}

		case "SET_SETTINGS": {
			const s = pushHistory(state);
			return {
				...s,
				isDirty: true,
				workflow: {
					...s.workflow,
					settings: { ...s.workflow.settings, ...action.settings },
				},
			};
		}

		case "SET_WORKFLOW_NAME": {
			const s = pushHistory(state);
			return {
				...s,
				isDirty: true,
				workflow: { ...s.workflow, name: action.name },
			};
		}

		case "MARK_SAVED":
			return {
				...state,
				isDirty: false,
				workflow: { ...state.workflow, version: action.version },
			};

		case "UNDO": {
			if (state.historyStack.length === 0) return state;
			const prev = state.historyStack[state.historyStack.length - 1];
			return {
				...state,
				workflow: prev,
				historyStack: state.historyStack.slice(0, -1),
				redoStack: [
					...state.redoStack,
					structuredClone(state.workflow),
				],
				isDirty: true,
			};
		}

		case "REDO": {
			if (state.redoStack.length === 0) return state;
			const next = state.redoStack[state.redoStack.length - 1];
			return {
				...state,
				workflow: next,
				redoStack: state.redoStack.slice(0, -1),
				historyStack: [
					...state.historyStack,
					structuredClone(state.workflow),
				],
				isDirty: true,
			};
		}

		case "SET_EXECUTION_STATUS":
			return { ...state, executionStatus: action.status };

		case "SET_EXECUTION_RESULT":
			return {
				...state,
				executionStatus: "complete",
				lastExecutionResult: action.result,
			};

		case "SET_EXECUTIONS":
			return { ...state, executions: action.executions };

		default:
			return state;
	}
}

// ─── Initial state ───────────────────────────────────────────────
const initialState: WorkflowEditorState = {
	projectId: "",
	workflow: {
		workflowId: "",
		name: "",
		version: 1,
		variables: {},
		settings: { ...DEFAULT_WORKFLOW_SETTINGS },
		steps: [],
	},
	selectedStepId: null,
	isDirty: false,
	historyStack: [],
	redoStack: [],
	executionStatus: "idle",
	lastExecutionResult: null,
	executions: [],
	loading: false,
	error: null,
};

// ─── Context ─────────────────────────────────────────────────────
interface WorkflowEditorContextValue {
	state: WorkflowEditorState;
	dispatch: React.Dispatch<Action>;
	/** Load a workflow from the backend */
	loadWorkflow: (projectId: string) => Promise<void>;
	/** Save the current workflow to the backend */
	save: (comment?: string) => Promise<void>;
	/** Run the current workflow */
	run: (variables?: Record<string, unknown>) => Promise<RunWorkflowResponse>;
}

const WorkflowEditorContext = createContext<WorkflowEditorContextValue | null>(
	null,
);

// ─── Provider ────────────────────────────────────────────────────
export function WorkflowEditorProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [state, dispatch] = useReducer(reducer, initialState);

	const loadWorkflow = useCallback(
		async (projectId: string) => {
			dispatch({ type: "SET_LOADING", loading: true });
			try {
				const res = await getWorkflowStatus(projectId);
				dispatch({
					type: "LOAD_WORKFLOW",
					projectId,
					workflow:
						res.workflow ??
						createEmptyWorkflow(projectId, res.projectName),
					executions: res.executions ?? [],
				});
			} catch (err) {
				dispatch({
					type: "SET_ERROR",
					error:
						err instanceof Error
							? err.message
							: "Failed to load workflow",
				});
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	);

	const save = useCallback(
		async (comment?: string) => {
			await saveWorkflowApi(state.projectId, state.workflow, comment);
			dispatch({
				type: "MARK_SAVED",
				version: state.workflow.version + 1,
			});
		},
		[state.projectId, state.workflow],
	);

	const run = useCallback(
		async (
			variables?: Record<string, unknown>,
		): Promise<RunWorkflowResponse> => {
			dispatch({ type: "SET_EXECUTION_STATUS", status: "running" });
			try {
				const result = await runWorkflowApi(state.projectId, variables);
				dispatch({ type: "SET_EXECUTION_RESULT", result });
				// Refresh execution history
				try {
					const updated = await getWorkflowStatus(state.projectId);
					dispatch({
						type: "SET_EXECUTIONS",
						executions: updated.executions ?? [],
					});
				} catch {
					// non-critical
				}
				return result;
			} catch (err) {
				dispatch({ type: "SET_EXECUTION_STATUS", status: "idle" });
				throw err;
			}
		},
		[state.projectId],
	);

	const value = useMemo(
		() => ({ state, dispatch, loadWorkflow, save, run }),
		[state, loadWorkflow, save, run],
	);

	return (
		<WorkflowEditorContext.Provider value={value}>
			{children}
		</WorkflowEditorContext.Provider>
	);
}

// ─── Hook ────────────────────────────────────────────────────────
export function useWorkflowEditor(): WorkflowEditorContextValue {
	const ctx = useContext(WorkflowEditorContext);
	if (!ctx) {
		throw new Error(
			"useWorkflowEditor must be used within a WorkflowEditorProvider",
		);
	}
	return ctx;
}
