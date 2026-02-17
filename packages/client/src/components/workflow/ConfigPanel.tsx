import { X } from "lucide-react";
import { useCallback, useMemo } from "react";
import { Button } from "@semoss/ui/next";
import { useWorkflowEditor } from "@/stores/workflow";
import type { WorkflowStep } from "@/types/workflow";
import { STEP_TYPE_LABELS, STEP_TYPES } from "@/types/workflow";
import { ConditionConfigForm } from "./config/ConditionConfigForm";
import { LLMAgentConfigForm } from "./config/LLMAgentConfigForm";
import { LLMAskConfigForm } from "./config/LLMAskConfigForm";
import { OutputConfigForm } from "./config/OutputConfigForm";
import { RunPixelConfigForm } from "./config/RunPixelConfigForm";
import { RunToolConfigForm } from "./config/RunToolConfigForm";
import { StaticConfigForm } from "./config/StaticConfigForm";
import { UseAppConfigForm } from "./config/UseAppConfigForm";

export function ConfigPanel() {
	const { state, dispatch } = useWorkflowEditor();

	const step = useMemo((): WorkflowStep | null => {
		if (!state.selectedStepId) return null;
		return (
			state.workflow.steps.find(
				(s) => s.stepId === state.selectedStepId,
			) ?? null
		);
	}, [state.selectedStepId, state.workflow.steps]);

	const handleClose = useCallback(() => {
		dispatch({ type: "SELECT_STEP", stepId: null });
	}, [dispatch]);

	const handleNameChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			if (!step) return;
			dispatch({
				type: "UPDATE_STEP",
				stepId: step.stepId,
				updates: { name: e.target.value },
			});
		},
		[step, dispatch],
	);

	const handleDescriptionChange = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			if (!step) return;
			dispatch({
				type: "UPDATE_STEP",
				stepId: step.stepId,
				updates: { description: e.target.value },
			});
		},
		[step, dispatch],
	);

	const handleConfigChange = useCallback(
		(config: Record<string, unknown>) => {
			if (!step) return;
			dispatch({
				type: "UPDATE_STEP",
				stepId: step.stepId,
				updates: { config: { ...step.config, ...config } },
			});
		},
		[step, dispatch],
	);

	const handleDelete = useCallback(() => {
		if (!step) return;
		dispatch({ type: "DELETE_STEP", stepId: step.stepId });
	}, [step, dispatch]);

	if (!step) {
		return (
			<div className="flex h-full items-center justify-center border-gray-200 border-l bg-white p-6 text-gray-400 text-sm">
				Select a step to configure
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col overflow-y-auto border-gray-200 border-l bg-white">
			{/* Header */}
			<div className="flex items-center justify-between border-gray-200 border-b px-4 py-3">
				<div className="flex flex-col">
					<span className="font-semibold text-sm">
						Configure Step
					</span>
					<span className="text-[11px] text-gray-400">
						{step.type === STEP_TYPES.RUN_TOOL &&
						(step.config as unknown as Record<string, unknown>)
							.source === "project"
							? "Use App"
							: STEP_TYPE_LABELS[step.type]}
					</span>
				</div>
				<button
					type="button"
					onClick={handleClose}
					className="rounded-md p-1 hover:bg-gray-100"
				>
					<X className="h-4 w-4 text-gray-500" />
				</button>
			</div>

			{/* Common fields */}
			<div className="flex flex-col gap-3 border-gray-100 border-b p-4">
				<div className="flex flex-col gap-1">
					<span className="font-medium text-gray-600 text-xs">
						Name
					</span>
					<input
						type="text"
						value={step.name}
						onChange={handleNameChange}
						className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
					/>
				</div>
				<div className="flex flex-col gap-1">
					<span className="font-medium text-gray-600 text-xs">
						Description
					</span>
					<textarea
						value={step.description ?? ""}
						onChange={handleDescriptionChange}
						placeholder="Optional description..."
						rows={2}
						className="resize-y rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
					/>
				</div>
			</div>

			{/* Type-specific config */}
			<div className="flex-1 p-4">
				{step.type === STEP_TYPES.STATIC && (
					<StaticConfigForm
						config={
							step.config as unknown as Record<string, unknown>
						}
						stepId={step.stepId}
						onChange={handleConfigChange}
					/>
				)}
				{step.type === STEP_TYPES.LLM_ASK && (
					<LLMAskConfigForm
						config={
							step.config as unknown as Record<string, unknown>
						}
						stepId={step.stepId}
						onChange={handleConfigChange}
					/>
				)}
				{step.type === STEP_TYPES.LLM_AGENT && (
					<LLMAgentConfigForm
						config={
							step.config as unknown as Record<string, unknown>
						}
						stepId={step.stepId}
						onChange={handleConfigChange}
					/>
				)}
				{step.type === STEP_TYPES.RUN_TOOL &&
					((step.config as unknown as Record<string, unknown>)
						.source === "project" ? (
						<UseAppConfigForm
							config={
								step.config as unknown as Record<
									string,
									unknown
								>
							}
							stepId={step.stepId}
							onChange={handleConfigChange}
						/>
					) : (
						<RunToolConfigForm
							config={
								step.config as unknown as Record<
									string,
									unknown
								>
							}
							stepId={step.stepId}
							onChange={handleConfigChange}
						/>
					))}
				{step.type === STEP_TYPES.RUN_PIXEL && (
					<RunPixelConfigForm
						config={
							step.config as unknown as Record<string, unknown>
						}
						stepId={step.stepId}
						onChange={handleConfigChange}
					/>
				)}
				{step.type === STEP_TYPES.CONDITION && (
					<ConditionConfigForm
						config={
							step.config as unknown as Record<string, unknown>
						}
						stepId={step.stepId}
						onChange={handleConfigChange}
					/>
				)}
				{step.type === STEP_TYPES.OUTPUT && (
					<OutputConfigForm
						config={
							step.config as unknown as Record<string, unknown>
						}
						stepId={step.stepId}
						onChange={handleConfigChange}
					/>
				)}
			</div>

			{/* Footer: Delete */}
			<div className="border-gray-100 border-t p-4">
				<Button
					variant="destructive"
					size="sm"
					className="w-full"
					onClick={handleDelete}
				>
					Delete Step
				</Button>
			</div>
		</div>
	);
}
