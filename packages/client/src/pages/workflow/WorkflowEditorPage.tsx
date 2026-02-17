import { ReactFlowProvider } from "@xyflow/react";
import { ChevronLeft, Clock, Play, Redo2, Save, Undo2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@semoss/ui/next";
import {
	getWorkflowStatus,
	runWorkflow,
	saveWorkflow,
	scheduleWorkflow,
} from "@/api/workflow";
import { ConfigPanel } from "@/components/workflow/ConfigPanel";
import { ExecutionHistory } from "@/components/workflow/ExecutionHistory";
import { SettingsPanel } from "@/components/workflow/SettingsPanel";
import { StepPalette } from "@/components/workflow/StepPalette";
import { VariablesPanel } from "@/components/workflow/VariablesPanel";
import { WorkflowCanvas } from "@/components/workflow/WorkflowCanvas";
import { useWorkflowEditor, WorkflowEditorProvider } from "@/stores/workflow";

/** Inner component that uses the workflow context */
function WorkflowEditorInner() {
	const { workflowId } = useParams<{ workflowId: string }>();
	const navigate = useNavigate();
	const { state, dispatch } = useWorkflowEditor();

	const [rightTab, setRightTab] = useState<
		"config" | "variables" | "settings"
	>("config");
	const [saving, setSaving] = useState(false);
	const [running, setRunning] = useState(false);
	const [scheduleOpen, setScheduleOpen] = useState(false);
	const [cronExpr, setCronExpr] = useState("0 0 * * *");
	const [jobName, setJobName] = useState("");

	// Load workflow on mount
	useEffect(() => {
		if (!workflowId) return;

		let cancelled = false;

		async function load() {
			dispatch({ type: "SET_LOADING", loading: true });
			try {
				const status = await getWorkflowStatus(workflowId as string);
				if (cancelled) return;
				dispatch({
					type: "LOAD_WORKFLOW",
					projectId: workflowId as string,
					workflow: status.workflow,
					executions: status.executions ?? [],
				});
			} catch (err) {
				if (cancelled) return;
				dispatch({
					type: "SET_ERROR",
					error:
						err instanceof Error
							? err.message
							: "Failed to load workflow",
				});
			} finally {
				if (!cancelled) {
					dispatch({ type: "SET_LOADING", loading: false });
				}
			}
		}

		load();
		return () => {
			cancelled = true;
		};
	}, [workflowId, dispatch]);

	// Save
	const handleSave = useCallback(async () => {
		if (!workflowId) return;
		setSaving(true);
		try {
			await saveWorkflow(workflowId, state.workflow);
			dispatch({ type: "MARK_SAVED", version: state.workflow.version });
		} catch (err) {
			dispatch({
				type: "SET_ERROR",
				error:
					err instanceof Error
						? err.message
						: "Failed to save workflow",
			});
		} finally {
			setSaving(false);
		}
	}, [workflowId, state.workflow, dispatch]);

	// Run
	const handleRun = useCallback(async () => {
		if (!workflowId) return;
		setRunning(true);
		try {
			// Save first
			await saveWorkflow(workflowId, state.workflow);
			dispatch({ type: "MARK_SAVED", version: state.workflow.version });

			const result = await runWorkflow(
				workflowId,
				state.workflow.variables,
			);
			dispatch({ type: "SET_EXECUTION_RESULT", result });
		} catch (err) {
			dispatch({
				type: "SET_ERROR",
				error:
					err instanceof Error
						? err.message
						: "Failed to run workflow",
			});
		} finally {
			setRunning(false);
		}
	}, [workflowId, state.workflow, dispatch]);

	// Schedule
	const handleSchedule = useCallback(async () => {
		if (!workflowId || !jobName.trim() || !cronExpr.trim()) return;
		try {
			await scheduleWorkflow(workflowId, jobName.trim(), cronExpr.trim());
			setScheduleOpen(false);
		} catch (err) {
			dispatch({
				type: "SET_ERROR",
				error:
					err instanceof Error
						? err.message
						: "Failed to schedule workflow",
			});
		}
	}, [workflowId, jobName, cronExpr, dispatch]);

	// Keyboard shortcuts
	useEffect(() => {
		function handler(e: KeyboardEvent) {
			if ((e.metaKey || e.ctrlKey) && e.key === "s") {
				e.preventDefault();
				handleSave();
			}
		}
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [handleSave]);

	if (state.loading) {
		return (
			<div className="flex h-full items-center justify-center text-gray-400 text-sm">
				Loading workflow…
			</div>
		);
	}

	if (state.error && !state.workflow.name) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-4">
				<div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800 text-sm">
					{state.error}
				</div>
				<button
					type="button"
					onClick={() => navigate("/workflow")}
					className="text-blue-600 text-sm hover:underline"
				>
					Back to workflows
				</button>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col">
			{/* Toolbar */}
			<div className="flex items-center justify-between border-gray-200 border-b bg-white px-4 py-2">
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={() => navigate("/workflow")}
						className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
						title="Back to workflows"
					>
						<ChevronLeft className="h-5 w-5" />
					</button>
					<input
						type="text"
						value={state.workflow.name}
						onChange={(e) =>
							dispatch({
								type: "SET_WORKFLOW_NAME",
								name: e.target.value,
							})
						}
						className="border-none bg-transparent font-semibold text-gray-900 text-lg focus:outline-none"
					/>
					{state.isDirty && (
						<span className="text-amber-500 text-xs">
							(unsaved)
						</span>
					)}
				</div>

				<div className="flex items-center gap-2">
					{/* Undo / Redo */}
					<button
						type="button"
						onClick={() => dispatch({ type: "UNDO" })}
						disabled={state.historyStack.length === 0}
						className="rounded p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
						title="Undo (⌘Z)"
					>
						<Undo2 className="h-4 w-4" />
					</button>
					<button
						type="button"
						onClick={() => dispatch({ type: "REDO" })}
						disabled={state.redoStack.length === 0}
						className="rounded p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
						title="Redo (⌘⇧Z)"
					>
						<Redo2 className="h-4 w-4" />
					</button>

					<div className="mx-1 h-5 w-px bg-gray-200" />

					{/* Schedule */}
					<button
						type="button"
						onClick={() => setScheduleOpen(!scheduleOpen)}
						className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
						title="Schedule"
					>
						<Clock className="h-4 w-4" />
					</button>

					{/* Save */}
					<button
						type="button"
						onClick={handleSave}
						disabled={saving || !state.isDirty}
						className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 font-medium text-gray-700 text-sm hover:bg-gray-50 disabled:opacity-50"
					>
						<Save className="h-3.5 w-3.5" />
						{saving ? "Saving…" : "Save"}
					</button>

					{/* Run */}
					<button
						type="button"
						onClick={handleRun}
						disabled={running}
						className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 font-medium text-sm text-white hover:bg-green-700 disabled:opacity-50"
					>
						<Play className="h-3.5 w-3.5" />
						{running ? "Running…" : "Run"}
					</button>
				</div>
			</div>

			{/* Error banner */}
			{state.error && (
				<div className="border-red-200 border-b bg-red-50 px-4 py-2 text-red-800 text-sm">
					{state.error}
				</div>
			)}

			{/* Schedule popup */}
			{scheduleOpen && (
				<div className="border-blue-200 border-b bg-blue-50 px-4 py-3">
					<div className="flex items-end gap-3">
						<div className="flex flex-col gap-1">
							<span className="font-medium text-gray-700 text-xs">
								Job Name
							</span>
							<input
								type="text"
								value={jobName}
								onChange={(e) => setJobName(e.target.value)}
								placeholder="daily-etl"
								className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
							/>
						</div>
						<div className="flex flex-col gap-1">
							<span className="font-medium text-gray-700 text-xs">
								Cron Expression
							</span>
							<input
								type="text"
								value={cronExpr}
								onChange={(e) => setCronExpr(e.target.value)}
								placeholder="0 0 * * *"
								className="rounded-md border border-gray-300 px-3 py-1.5 font-mono text-sm"
							/>
						</div>
						<button
							type="button"
							onClick={handleSchedule}
							disabled={!jobName.trim() || !cronExpr.trim()}
							className="rounded-md bg-blue-600 px-4 py-1.5 font-medium text-sm text-white hover:bg-blue-700 disabled:opacity-50"
						>
							Schedule
						</button>
						<button
							type="button"
							onClick={() => setScheduleOpen(false)}
							className="rounded-md border border-gray-300 px-4 py-1.5 font-medium text-gray-700 text-sm hover:bg-gray-50"
						>
							Cancel
						</button>
					</div>
				</div>
			)}

			{/* Main 3-panel layout */}
			<div className="flex flex-1 overflow-hidden">
				{/* Left: Step Palette */}
				<div className="w-56 shrink-0 overflow-y-auto border-gray-200 border-r bg-gray-50">
					<StepPalette />
				</div>

				{/* Center: Canvas */}
				<div className="flex-1">
					<WorkflowCanvas />
				</div>

				{/* Right: Config / Variables / Settings */}
				<div className="flex w-80 shrink-0 flex-col border-gray-200 border-l bg-white">
					{/* Tab bar */}
					<div className="flex border-gray-200 border-b">
						<button
							type="button"
							onClick={() => setRightTab("config")}
							className={cn(
								"flex-1 px-3 py-2 font-medium text-xs",
								rightTab === "config"
									? "border-blue-600 border-b-2 text-blue-600"
									: "text-gray-500 hover:text-gray-700",
							)}
						>
							Config
						</button>
						<button
							type="button"
							onClick={() => setRightTab("variables")}
							className={cn(
								"flex-1 px-3 py-2 font-medium text-xs",
								rightTab === "variables"
									? "border-blue-600 border-b-2 text-blue-600"
									: "text-gray-500 hover:text-gray-700",
							)}
						>
							Variables
						</button>
						<button
							type="button"
							onClick={() => setRightTab("settings")}
							className={cn(
								"flex-1 px-3 py-2 font-medium text-xs",
								rightTab === "settings"
									? "border-blue-600 border-b-2 text-blue-600"
									: "text-gray-500 hover:text-gray-700",
							)}
						>
							Settings
						</button>
					</div>

					{/* Tab content */}
					<div className="flex-1 overflow-y-auto">
						{rightTab === "config" && <ConfigPanel />}
						{rightTab === "variables" && <VariablesPanel />}
						{rightTab === "settings" && <SettingsPanel />}
					</div>
				</div>
			</div>

			{/* Bottom: Execution History */}
			<ExecutionHistory />
		</div>
	);
}

/** Page wrapper with providers */
export function WorkflowEditorPage() {
	return (
		<ReactFlowProvider>
			<WorkflowEditorProvider>
				<WorkflowEditorInner />
			</WorkflowEditorProvider>
		</ReactFlowProvider>
	);
}
