import type {
	AutomationNode,
	AutomationNodeTrace,
	StepRunStatus,
} from "../../../domain/automation.types";
import { NodeEditDrawer } from "../node-edit-drawer";
import { TriggerEditPanel } from "./trigger-edit-panel";

/** Props for the inspector dock tab. */
interface InspectorTabProps {
	appId: string;
	description: string;
	devMode: boolean;
	editingStep: AutomationNode | null;
	upstreamVars: string[];
	stepRunStatus?: StepRunStatus;
	stepRunError?: string;
	stepRunOutput?: string | null;
	stepRunTrace?: AutomationNodeTrace;
	onDescriptionChange: (value: string) => void;
	onClose: () => void;
	onUpdate: (step: AutomationNode) => void;
	onDelete: (stepId: string) => void;
}

export function InspectorTab({
	appId,
	description,
	devMode,
	editingStep,
	upstreamVars,
	stepRunStatus,
	stepRunError,
	stepRunOutput,
	stepRunTrace,
	onDescriptionChange,
	onClose,
	onUpdate,
	onDelete,
}: InspectorTabProps) {
	if (editingStep?.type === "trigger") {
		return (
			<TriggerEditPanel
				description={description}
				onDescriptionChange={onDescriptionChange}
				onClose={onClose}
				step={editingStep}
				onUpdate={onUpdate}
			/>
		);
	}

	if (editingStep) {
		return (
			<NodeEditDrawer
				step={editingStep}
				appId={appId}
				upstreamVars={upstreamVars}
				runStatus={stepRunStatus}
				runError={stepRunError}
				runOutput={stepRunOutput}
				runTrace={stepRunTrace}
				devMode={devMode}
				onUpdate={onUpdate}
				onDelete={() => onDelete(editingStep.id)}
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
