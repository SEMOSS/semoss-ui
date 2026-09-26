import { Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useId, useState } from "react";
import {
	Button,
	Field,
	FieldDescription,
	FieldLabel,
	Input,
	Textarea,
} from "@semoss/ui/next";
import type {
	AutomationNode,
	AutomationNodeBody,
	LoopConfig,
} from "../../../domain/automation.types";
import { LoopBodyCanvas } from "../loop-body-canvas";
import {
	getLoopBodyUpstreamVariables,
	removeLoopBodyNode,
} from "../loop-body-graph";
import { PillInput } from "./pill-input";

interface LoopFormProps {
	step: AutomationNode;
	config: LoopConfig;
	upstreamVars: string[];
	onChange: (config: LoopConfig) => void;
	onBodyChange: (body: AutomationNodeBody) => void;
	renderBodyNode: (
		node: AutomationNode,
		upstreamVars: string[],
		onUpdate: (node: AutomationNode) => void,
	) => ReactNode;
	readOnly?: boolean;
}

/** Configures bounded iteration and the nested graph repeated by the loop. */
export function LoopForm({
	step,
	config,
	upstreamVars,
	onChange,
	onBodyChange,
	renderBodyNode,
	readOnly = false,
}: LoopFormProps) {
	const loopBodyTitleId = useId();
	const loopStepSettingsTitleId = useId();
	const bodyNodes = step.body?.nodes ?? [];
	const [selectedBodyNodeId, setSelectedBodyNodeId] = useState<string | null>(
		bodyNodes[0]?.id ?? null,
	);
	const selectedBodyNode = bodyNodes.find(
		(node) => node.id === selectedBodyNodeId,
	);
	const selectedIsRoutingNode =
		selectedBodyNode?.workflowType === "control.if" ||
		selectedBodyNode?.workflowType === "control.jev";

	useEffect(() => {
		if (selectedBodyNodeId && !selectedBodyNode) {
			setSelectedBodyNodeId(bodyNodes[0]?.id ?? null);
		}
	}, [bodyNodes, selectedBodyNode, selectedBodyNodeId]);

	const body = step.body ?? { nodes: [], edges: [] };
	const selectedUpstreamVars = selectedBodyNode
		? [
				...upstreamVars,
				step.outputVar,
				...getLoopBodyUpstreamVariables(body, selectedBodyNode.id),
			]
		: upstreamVars;
	const updateSelectedBodyNode = (updatedNode: AutomationNode) => {
		onBodyChange({
			...body,
			nodes: bodyNodes.map((candidate) =>
				candidate.id === updatedNode.id ? updatedNode : candidate,
			),
		});
	};
	const removeSelectedBodyNode = () => {
		if (!selectedBodyNode || readOnly) return;
		const nextBody = removeLoopBodyNode(body, selectedBodyNode.id);
		onBodyChange(nextBody);
		setSelectedBodyNodeId(nextBody.nodes[0]?.id ?? null);
	};

	return (
		<div className="flex flex-col gap-5">
			<PillInput
				label="Items to loop over"
				required
				value={config.items}
				onChange={(items) => onChange({ ...config, items })}
				upstreamVars={upstreamVars}
				placeholder='${previous_output} or ["a", "b", "c"]'
				description="Use an exact variable reference to preserve a list, or enter a JSON array."
				mono
				minRows={2}
				readOnly={readOnly}
			/>

			<div className="grid grid-cols-2 gap-3">
				<Field>
					<FieldLabel>Batch size</FieldLabel>
					<Input
						type="number"
						min={1}
						value={config.batchSize}
						onChange={(event) =>
							onChange({
								...config,
								batchSize: Number(event.target.value),
							})
						}
						readOnly={readOnly}
					/>
					<FieldDescription>
						Items available to each iteration.
					</FieldDescription>
				</Field>
				<Field>
					<FieldLabel>Maximum iterations</FieldLabel>
					<Input
						type="number"
						min={1}
						value={config.maxIterations}
						onChange={(event) =>
							onChange({
								...config,
								maxIterations: Number(event.target.value),
							})
						}
						readOnly={readOnly}
					/>
					<FieldDescription>
						Stops unexpectedly large runs.
					</FieldDescription>
				</Field>
			</div>

			<section
				className="space-y-3 border-t pt-4"
				aria-labelledby={loopBodyTitleId}
			>
				<div>
					<h3 id={loopBodyTitleId} className="font-medium text-sm">
						Steps inside the loop
					</h3>
					<p className="text-muted-foreground text-xs">
						The selected route runs for every item or batch. Add
						steps from a node&apos;s output. The loop context is
						available as ${"{"}
						{step.outputVar}
						{"}"}.
					</p>
				</div>

				<LoopBodyCanvas
					body={body}
					loopOutputVar={step.outputVar}
					selectedNodeId={selectedBodyNodeId}
					readOnly={readOnly}
					onBodyChange={onBodyChange}
					onNodeSelect={setSelectedBodyNodeId}
				/>
			</section>

			{selectedBodyNode && (
				<section
					className="space-y-3 rounded-lg border bg-muted/20 p-3"
					aria-labelledby={loopStepSettingsTitleId}
				>
					<div className="flex items-center justify-between gap-3">
						<h3
							id={loopStepSettingsTitleId}
							className="font-medium text-sm"
						>
							Configure {selectedBodyNode.label}
						</h3>
						{!readOnly && (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="text-destructive hover:text-destructive"
								onClick={removeSelectedBodyNode}
							>
								<Trash2 className="size-4" aria-hidden />
								Remove
							</Button>
						)}
					</div>
					<div
						className={
							selectedIsRoutingNode
								? "grid gap-3"
								: "grid grid-cols-2 gap-3"
						}
					>
						<Field>
							<FieldLabel>Label</FieldLabel>
							<Input
								value={selectedBodyNode.label}
								onChange={(event) =>
									updateSelectedBodyNode({
										...selectedBodyNode,
										label: event.target.value,
									})
								}
								readOnly={readOnly}
							/>
						</Field>
						{!selectedIsRoutingNode && (
							<Field>
								<FieldLabel>Output variable</FieldLabel>
								<Input
									className="font-mono"
									value={selectedBodyNode.outputVar}
									onChange={(event) =>
										updateSelectedBodyNode({
											...selectedBodyNode,
											outputVar: event.target.value,
										})
									}
									readOnly={readOnly}
								/>
							</Field>
						)}
					</div>
					{selectedBodyNode.workflowType === "developer.python" ? (
						<Field>
							<FieldLabel>Python source</FieldLabel>
							<Textarea
								className="min-h-64 resize-y font-mono text-sm"
								value={
									typeof selectedBodyNode.workflowConfig
										?.pythonSource === "string"
										? selectedBodyNode.workflowConfig
												.pythonSource
										: ""
								}
								onChange={(event) =>
									updateSelectedBodyNode({
										...selectedBodyNode,
										workflowCodeMode: "custom",
										workflowConfig: {
											...selectedBodyNode.workflowConfig,
											pythonSource: event.target.value,
										},
									})
								}
								readOnly={readOnly}
								spellCheck={false}
							/>
							<FieldDescription>
								Read this iteration from scope.get(&quot;
								{step.outputVar}&quot;).
							</FieldDescription>
						</Field>
					) : (
						renderBodyNode(
							selectedBodyNode,
							selectedUpstreamVars,
							updateSelectedBodyNode,
						)
					)}
				</section>
			)}
		</div>
	);
}
