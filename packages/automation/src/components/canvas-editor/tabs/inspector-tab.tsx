import { useId } from "react";
import { Button, Input, P } from "@semoss/ui/next";
import type {
	AutomationNode,
	StepRunStatus,
} from "../../../domain/automation.types";
import type { AutomationScopeEntry } from "../../../domain/automation-inspector";
import type { AutomationNodeGroup } from "../../../domain/automation-workflow.types";
import { AutomationVariableContext } from "../automation-variable-context";
import { NodeEditDrawer } from "../node-edit-drawer";
import { TriggerEditPanel } from "./trigger-edit-panel";

/** Props for the inspector dock tab. */
interface InspectorTabProps {
	appId: string;
	description: string;
	devMode: boolean;
	editingStep: AutomationNode | null;
	editingNodeGroup?: AutomationNodeGroup | null;
	onPrepareSchedule: () => Promise<boolean>;
	upstreamVars: string[];
	scopeEntries: AutomationScopeEntry[];
	stepRunStatus?: StepRunStatus;
	stepRunError?: string;
	onDescriptionChange: (value: string) => void;
	onClose: () => void;
	onUpdate: (step: AutomationNode) => void;
	onDelete: (stepId: string) => void;
	onUpdateNodeGroup?: (group: AutomationNodeGroup) => void;
	onUngroupNodeGroup?: (groupId: string) => void;
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
	editingNodeGroup,
	onPrepareSchedule,
	upstreamVars,
	scopeEntries,
	stepRunStatus,
	stepRunError,
	onDescriptionChange,
	onClose,
	onUpdate,
	onDelete,
	onUpdateNodeGroup,
	onUngroupNodeGroup,
	onOpenPythonEditor,
	onViewRunDetails,
	pythonFileOpen = false,
	readOnly = false,
}: InspectorTabProps) {
	const groupLabelId = useId();
	if (editingNodeGroup) {
		return (
			<div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
				<div>
					<p className="font-semibold text-sm">Node group</p>
					<P className="mt-1 text-muted-foreground text-xs">
						{editingNodeGroup.nodeIds.length} grouped nodes
					</P>
				</div>
				<div className="flex flex-col gap-2">
					<label
						htmlFor={groupLabelId}
						className="font-medium text-sm"
					>
						Label
					</label>
					<Input
						id={groupLabelId}
						value={editingNodeGroup.name}
						disabled={readOnly}
						onChange={(event) =>
							onUpdateNodeGroup?.({
								...editingNodeGroup,
								name: event.target.value,
							})
						}
					/>
				</div>
				{!readOnly && (
					<Button
						variant="outline"
						onClick={() =>
							onUngroupNodeGroup?.(editingNodeGroup.id)
						}
					>
						Ungroup nodes
					</Button>
				)}
			</div>
		);
	}

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
			<AutomationVariableContext.Provider
				value={{ entries: scopeEntries, devMode }}
			>
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
			</AutomationVariableContext.Provider>
		);
	}

	return (
		<div className="flex h-full flex-col items-center justify-center px-6 text-center">
			<p className="font-semibold text-sm">Select a step</p>
			<p className="mt-1 text-muted-foreground text-xs leading-relaxed">
				Choose the trigger or an action on the canvas to inspect and
				edit its configuration.
			</p>
		</div>
	);
}
