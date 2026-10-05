import type {
	AutomationNode,
	StepRunStatus,
} from "../../../domain/automation.types";
import type { AutomationScopeEntry } from "../../../domain/automation-inspector";
import { NodeEditDrawer } from "../node-edit-drawer";
import { TriggerEditPanel } from "./trigger-edit-panel";

/** Props for the inspector dock tab. */
interface InspectorTabProps {
	appId: string;
	description: string;
	devMode: boolean;
	editingStep: AutomationNode | null;
	onPrepareSchedule: () => Promise<boolean>;
	upstreamVars: string[];
	scopeEntries: AutomationScopeEntry[];
	stepRunStatus?: StepRunStatus;
	stepRunError?: string;
	onDescriptionChange: (value: string) => void;
	onClose: () => void;
	onUpdate: (step: AutomationNode) => void;
	onDelete: (stepId: string) => void;
	/** Pops the raw Python source out into a larger editor, for a host rendering this tab
	 * alongside the canvas instead of in a separate iframe. */
	onOpenPythonEditor?: (nodeId: string, source: string) => void;
	/** Switches the trace/run-details panel to the latest run, selected on this node. */
	onViewRunDetails?: (stepId: string) => void;
	/** When true, the node's compiled Python source is open in a real file editor tab, so
	 * the inline editor is locked to avoid two copies of the same source diverging. */
	pythonFileOpen?: boolean;
	/** When true, the trigger/node panels render view-only and all mutating controls
	 * (including delete and raw Python editing) are disabled. */
	readOnly?: boolean;
}

export function InspectorTab({
	appId,
	description,
	devMode,
	editingStep,
	onPrepareSchedule,
	upstreamVars,
	scopeEntries,
	stepRunStatus,
	stepRunError,
	onDescriptionChange,
	onClose,
	onUpdate,
	onDelete,
	onOpenPythonEditor,
	onViewRunDetails,
	pythonFileOpen = false,
	readOnly = false,
}: InspectorTabProps) {
	if (editingStep?.type === "trigger") {
		return (
			<TriggerEditPanel
				appId={appId}
				description={description}
				onDescriptionChange={onDescriptionChange}
				onClose={onClose}
				onPrepareSchedule={onPrepareSchedule}
				step={editingStep}
				onUpdate={onUpdate}
				devMode={devMode}
				readOnly={readOnly}
			/>
		);
	}

	if (editingStep) {
		return (
			<NodeEditDrawer
				step={editingStep}
				appId={appId}
				upstreamVars={upstreamVars}
				scopeEntries={scopeEntries}
				runStatus={stepRunStatus}
				runError={stepRunError}
				devMode={devMode}
				onUpdate={onUpdate}
				onDelete={() => onDelete(editingStep.id)}
				onOpenPythonEditor={onOpenPythonEditor}
				onViewRunDetails={onViewRunDetails}
				pythonFileOpen={pythonFileOpen}
				readOnly={readOnly}
			/>
		);
	}

	return (
		<div className="flex h-full flex-col items-center justify-center px-6 text-center">
			<p className="font-semibold text-sm">Select a step</p>
			<p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
				Choose the trigger or an action on the canvas to inspect and
				edit its configuration.
			</p>
		</div>
	);
}
