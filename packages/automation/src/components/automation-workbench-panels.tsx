import { createContext, useContext } from "react";
import type {
	AutomationNodeTrace,
	AutomationRunDetail,
} from "../domain/automation.types";
import type { AutomationInspectorSnapshot } from "../domain/automation-inspector";
import type { N8nImportConversionModel } from "../domain/n8n-import-adapter";
import type { AutomationCanvasHandle } from "./canvas-editor/automation-canvas";
import { AutomationCanvas } from "./canvas-editor/automation-canvas-loader";
import { InspectorTab } from "./canvas-editor/tabs/inspector-tab";
import {
	type AutomationTraceSnapshot,
	RunsTab,
} from "./canvas-editor/tabs/runs-tab";

export interface AutomationWorkbenchContextValue {
	appId: string;
	readOnly: boolean;
	conversionModel?: N8nImportConversionModel;
	canvasRef: React.RefObject<AutomationCanvasHandle | null>;
	agentRunAutomationUpdate: AutomationRunDetail | null;
	onAgentRunTrace: (trace: AutomationNodeTrace | null) => void;
	onTraceChange: (snapshot: AutomationTraceSnapshot) => void;
	onInspectorChange: (snapshot: AutomationInspectorSnapshot) => void;
	onHistoryChanged: () => void;
	inspectorSnapshot: AutomationInspectorSnapshot | null;
	traceSnapshot: AutomationTraceSnapshot | null;
	historyRefreshToken: number;
	onOpenOutput: (output: string) => void;
	onAskAssistant: (prompt: string) => void;
	onOpenPythonEditor: (nodeId: string, source: string) => void;
}

export const AutomationWorkbenchContext =
	createContext<AutomationWorkbenchContextValue | null>(null);

function useAutomationWorkbenchContext(): AutomationWorkbenchContextValue {
	const context = useContext(AutomationWorkbenchContext);
	if (!context) {
		throw new Error(
			"Automation dock panels must render within AutomationWorkbench.",
		);
	}
	return context;
}

export const AutomationEditorPanel = () => {
	const context = useAutomationWorkbenchContext();
	return (
		<AutomationCanvas
			ref={context.canvasRef}
			appId={context.appId}
			readOnly={context.readOnly}
			conversionModel={context.conversionModel}
			onViewAgentRun={context.onAgentRunTrace}
			externalRunUpdate={context.agentRunAutomationUpdate}
			onTraceChange={context.onTraceChange}
			onInspectorChange={context.onInspectorChange}
			onHistoryChanged={context.onHistoryChanged}
		/>
	);
};

export const AutomationInspectorPanel = () => {
	const context = useAutomationWorkbenchContext();
	const snapshot = context.inspectorSnapshot;
	return (
		<InspectorTab
			appId={context.appId}
			description={snapshot?.description ?? ""}
			devMode={snapshot?.devMode ?? false}
			editingStep={snapshot?.editingStep ?? null}
			onPrepareSchedule={() =>
				context.canvasRef.current?.prepareSchedule() ??
				Promise.resolve(false)
			}
			upstreamVars={snapshot?.upstreamVars ?? []}
			stepRunStatus={snapshot?.stepRunStatus}
			stepRunError={snapshot?.stepRunError}
			stepRunOutput={snapshot?.stepRunOutput}
			stepRunTrace={snapshot?.stepRunTrace}
			readOnly={context.readOnly || Boolean(snapshot?.readOnly)}
			onDescriptionChange={(description) =>
				context.canvasRef.current?.applyInspectorAction({
					type: "update-description",
					description,
				})
			}
			onClose={() =>
				context.canvasRef.current?.applyInspectorAction({
					type: "close",
				})
			}
			onUpdate={(step) =>
				context.canvasRef.current?.applyInspectorAction({
					type: "update-step",
					step,
				})
			}
			onDelete={(stepId) =>
				context.canvasRef.current?.applyInspectorAction({
					type: "delete-step",
					stepId,
				})
			}
			onOpenPythonEditor={context.onOpenPythonEditor}
		/>
	);
};

export const AutomationTracePanel = () => {
	const context = useAutomationWorkbenchContext();
	const snapshot = context.traceSnapshot;
	return (
		<RunsTab
			appId={context.appId}
			refreshToken={context.historyRefreshToken}
			running={snapshot?.running ?? false}
			latestRunStatus={snapshot?.latestRunStatus ?? null}
			aiRunSummary={snapshot?.aiRunSummary ?? null}
			generatingAiSummary={snapshot?.generatingAiSummary ?? false}
			steps={snapshot?.steps ?? []}
			results={snapshot?.results ?? []}
			executedDefinition={snapshot?.executedDefinition ?? null}
			onDismiss={() => undefined}
			onOpenOutput={context.onOpenOutput}
			onAskAssistant={context.onAskAssistant}
			onViewRun={(run) =>
				context.canvasRef.current?.viewHistoricalRun(run)
			}
			onExitHistoricalView={() =>
				context.canvasRef.current?.exitHistoricalView()
			}
		/>
	);
};
