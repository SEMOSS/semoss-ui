import { Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";
import {
	Button,
	Field,
	FieldDescription,
	FieldLabel,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	useTheme,
} from "@semoss/ui/next";
import type {
	AutomationNode,
	AutomationNodeBody,
	LoopConfig,
} from "../../../domain/automation.types";
import type { AutomationScopeEntry } from "../../../domain/automation-inspector";
import { AutomationPythonEditor } from "../automation-python-editor";
import { LoopBodyCanvas } from "../loop-body-canvas";
import {
	getLoopBodyUpstreamVariables,
	removeLoopBodyNode,
} from "../loop-body-graph";
import { ConditionExpressionForm } from "./condition-expression-form";
import { PillInput } from "./pill-input";

interface LoopFormProps {
	step: AutomationNode;
	selectedBodyNodeId?: string;
	config: LoopConfig;
	upstreamVars: string[];
	scopeEntries: AutomationScopeEntry[];
	onChange: (config: LoopConfig) => void;
	onBodyChange: (body: AutomationNodeBody) => void;
	renderBodyNode: (
		node: AutomationNode,
		upstreamVars: string[],
		onUpdate: (node: AutomationNode) => void,
	) => ReactNode;
	devMode: boolean;
	readOnly?: boolean;
}

type LoopMode = LoopConfig["mode"];

interface LoopContextVariable {
	label: string;
	name: string;
}

function configForMode(mode: LoopMode, maxIterations: number): LoopConfig {
	if (mode === "repeat") {
		return { mode, count: 1, maxIterations };
	}
	if (mode === "while") {
		return { mode, condition: "", maxIterations };
	}
	return { mode, items: "", batchSize: 1, maxIterations };
}

function loopContextVariables(
	config: LoopConfig,
	outputVar: string,
	bodyNodes: AutomationNode[],
): LoopContextVariable[] {
	const variables: LoopContextVariable[] = [
		{ label: "Pass number", name: `${outputVar}.number` },
		{ label: "Zero-based index", name: `${outputVar}.index` },
		{ label: "Is first pass", name: `${outputVar}.isFirst` },
	];
	if (config.mode === "forEach") {
		if (config.batchSize === 1) {
			variables.unshift({
				label: "Current item",
				name: `${outputVar}.item`,
			});
		}
		variables.push(
			{ label: "Current group", name: `${outputVar}.batch` },
			{ label: "Total passes", name: `${outputVar}.total` },
			{ label: "Is last pass", name: `${outputVar}.isLast` },
		);
	} else if (config.mode === "repeat") {
		variables.push(
			{ label: "Total passes", name: `${outputVar}.total` },
			{ label: "Is last pass", name: `${outputVar}.isLast` },
		);
	} else {
		variables.push({
			label: "Safety limit",
			name: `${outputVar}.maximum`,
		});
		for (const node of bodyNodes) {
			if (node.outputVar) {
				variables.push({
					label: `Previous ${node.label}`,
					name: `${outputVar}.previous.${node.outputVar}`,
				});
			}
		}
	}
	return variables;
}

function isRoutingNode(node: AutomationNode): boolean {
	return (
		node.workflowType === "control.if" ||
		node.workflowType === "control.jev"
	);
}

/** Configures bounded iteration and the nested graph repeated by the loop. */
export function LoopForm({
	step,
	selectedBodyNodeId: requestedBodyNodeId,
	config,
	upstreamVars,
	scopeEntries,
	onChange,
	onBodyChange,
	renderBodyNode,
	devMode,
	readOnly = false,
}: LoopFormProps) {
	const modeSelectId = useId();
	const { resolvedTheme } = useTheme();
	const loopBodyTitleId = useId();
	const loopStepSettingsTitleId = useId();
	const bodyNodes = step.body?.nodes ?? [];
	const [selectedBodyNodeId, setSelectedBodyNodeId] = useState<string | null>(
		requestedBodyNodeId ?? bodyNodes[0]?.id ?? null,
	);
	const appliedRequestedBodyNodeId = useRef(requestedBodyNodeId);
	const selectedBodyNode = bodyNodes.find(
		(node) => node.id === selectedBodyNodeId,
	);
	const selectedIsRoutingNode = selectedBodyNode
		? isRoutingNode(selectedBodyNode)
		: false;

	useEffect(() => {
		if (requestedBodyNodeId === appliedRequestedBodyNodeId.current) return;
		appliedRequestedBodyNodeId.current = requestedBodyNodeId;
		if (
			requestedBodyNodeId &&
			bodyNodes.some((node) => node.id === requestedBodyNodeId)
		) {
			setSelectedBodyNodeId(requestedBodyNodeId);
		}
	}, [bodyNodes, requestedBodyNodeId]);

	useEffect(() => {
		if (selectedBodyNodeId && !selectedBodyNode) {
			setSelectedBodyNodeId(bodyNodes[0]?.id ?? null);
		}
	}, [bodyNodes, selectedBodyNode, selectedBodyNodeId]);

	const body = step.body ?? { nodes: [], edges: [] };
	const contextVariables = loopContextVariables(
		config,
		step.outputVar,
		bodyNodes,
	);
	const contextVariableNames = [
		step.outputVar,
		...contextVariables.map(({ name }) => name),
	];
	const selectedUpstreamVars = selectedBodyNode
		? Array.from(
				new Set([
					...upstreamVars,
					...contextVariableNames,
					...getLoopBodyUpstreamVariables(body, selectedBodyNode.id),
				]),
			)
		: upstreamVars;
	const selectedScopeEntries = (() => {
		const knownEntries = new Map(
			scopeEntries.map((entry) => [entry.name, entry]),
		);
		knownEntries.set(step.outputVar, {
			name: step.outputVar,
			source: "node",
			label: "Current loop pass",
			description: "Context supplied by the current loop pass.",
			availability: "guaranteed",
			pythonExpression: `scope[${JSON.stringify(step.outputVar)}]`,
			templateExpression: `\${${step.outputVar}}`,
			valueType: "object",
		});
		for (const variable of contextVariables) {
			knownEntries.set(variable.name, {
				name: variable.name,
				source: "node",
				label: variable.label,
				description: "Value supplied by the current loop pass.",
				availability: "guaranteed",
				pythonExpression: `scope[${JSON.stringify(step.outputVar)}]${variable.name
					.slice(step.outputVar.length)
					.split(".")
					.filter(Boolean)
					.map((part) => `[${JSON.stringify(part)}]`)
					.join("")}`,
				templateExpression: `\${${variable.name}}`,
				valueType: "unknown",
			});
		}
		for (const name of selectedUpstreamVars) {
			if (knownEntries.has(name)) continue;
			knownEntries.set(name, {
				name,
				source: "node",
				label: name,
				description: "Output available to this loop step.",
				availability: "guaranteed",
				pythonExpression: `scope[${JSON.stringify(name)}]`,
				templateExpression: `\${${name}}`,
			});
		}
		return selectedUpstreamVars.flatMap((name) => {
			const entry = knownEntries.get(name);
			return entry ? [entry] : [];
		});
	})();
	const iterationDescription =
		config.mode === "forEach"
			? config.batchSize === 1
				? "These steps run once for each item."
				: "These steps run once for each group of items."
			: config.mode === "repeat"
				? "These steps run the selected number of times."
				: "These steps run while the condition remains true.";
	const pythonContextExample =
		config.mode === "forEach"
			? config.batchSize === 1
				? `scope["${step.outputVar}"]["item"]`
				: `scope["${step.outputVar}"]["batch"]`
			: config.mode === "repeat"
				? `scope["${step.outputVar}"]["number"]`
				: `scope["${step.outputVar}"]["previous"]`;
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
			<Field>
				<FieldLabel htmlFor={modeSelectId}>
					How should these steps repeat?
				</FieldLabel>
				<Select
					value={config.mode}
					onValueChange={(mode) =>
						onChange(
							configForMode(
								mode as LoopMode,
								config.maxIterations,
							),
						)
					}
					disabled={readOnly}
				>
					<SelectTrigger id={modeSelectId} className="w-full">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="forEach">For each item</SelectItem>
						<SelectItem value="repeat">
							Repeat a set number of times
						</SelectItem>
						<SelectItem value="while">
							Repeat while a condition is true
						</SelectItem>
					</SelectContent>
				</Select>
				<FieldDescription>{iterationDescription}</FieldDescription>
			</Field>

			{config.mode === "forEach" && (
				<>
					<PillInput
						label="Items to process"
						required
						value={config.items}
						onChange={(items) => onChange({ ...config, items })}
						upstreamVars={upstreamVars}
						placeholder='${previous_output.items} or ["a", "b", "c"]'
						description="Choose a list from an earlier step or enter a JSON array."
						mono
						minRows={2}
						readOnly={readOnly}
					/>
					<Field>
						<FieldLabel>Items per pass</FieldLabel>
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
							Use 1 to process one item at a time. Increase this
							to process groups.
						</FieldDescription>
					</Field>
				</>
			)}

			{config.mode === "repeat" && (
				<Field>
					<FieldLabel>Number of times</FieldLabel>
					<Input
						type="number"
						min={1}
						max={config.maxIterations}
						value={config.count}
						onChange={(event) =>
							onChange({
								...config,
								count: Number(event.target.value),
							})
						}
						readOnly={readOnly}
					/>
				</Field>
			)}

			{config.mode === "while" && (
				<ConditionExpressionForm
					condition={config.condition}
					onChange={(condition) => onChange({ ...config, condition })}
					upstreamVars={[...upstreamVars, ...contextVariableNames]}
					devMode={devMode}
					readOnly={readOnly}
				/>
			)}

			<Field>
				<FieldLabel>Safety limit</FieldLabel>
				<Input
					type="number"
					min={1}
					max={10_000}
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
					Stops the loop before it can run unexpectedly long.
				</FieldDescription>
			</Field>

			<div className="space-y-2 rounded-lg border bg-muted/20 p-3">
				<p className="font-medium text-sm">
					Available inside loop steps
				</p>
				<div className="flex flex-wrap gap-2">
					{contextVariables.map((variable) => (
						<span
							key={variable.name}
							className="rounded-md border bg-background px-2 py-1 text-xs"
						>
							<span className="text-muted-foreground">
								{variable.label}:{" "}
							</span>
							<code>{`\${${variable.name}}`}</code>
						</span>
					))}
				</div>
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
						{iterationDescription} Select a step below to edit it
						and insert the loop variables it needs.
					</p>
				</div>
				{bodyNodes.length > 0 && (
					<fieldset className="grid grid-cols-2 gap-2">
						<legend className="sr-only">Loop steps</legend>
						{bodyNodes.map((node, index) => (
							<Button
								key={node.id}
								type="button"
								variant={
									selectedBodyNodeId === node.id
										? "secondary"
										: "outline"
								}
								className="h-auto min-w-0 justify-start px-3 py-2 text-left"
								onClick={() => setSelectedBodyNodeId(node.id)}
								aria-label={`Edit step ${index + 1}: ${node.label}`}
							>
								<span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted font-medium text-xs">
									{index + 1}
								</span>
								<span className="min-w-0">
									<span className="block truncate text-xs">
										{node.label}
									</span>
									{!isRoutingNode(node) && (
										<span className="block truncate font-mono text-muted-foreground text-xs">
											{node.outputVar}
										</span>
									)}
								</span>
							</Button>
						))}
					</fieldset>
				)}

				<LoopBodyCanvas
					body={body}
					loopOutputVar={step.outputVar}
					selectedNodeId={selectedBodyNodeId}
					readOnly={readOnly}
					onBodyChange={onBodyChange}
					onNodeSelect={setSelectedBodyNodeId}
				/>
			</section>

			<div className="space-y-1 rounded-lg border bg-muted/20 p-3">
				<p className="font-medium text-sm">After the loop</p>
				<p className="text-muted-foreground text-xs">
					Every pass is collected in order. Later steps can use{" "}
					<code>{`\${${step.outputVar}.results}`}</code> to read the
					collected outputs.
				</p>
			</div>

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
							<div className="h-72 overflow-hidden rounded-lg border bg-muted/30">
								<AutomationPythonEditor
									value={
										typeof selectedBodyNode.workflowConfig
											?.pythonSource === "string"
											? selectedBodyNode.workflowConfig
													.pythonSource
											: ""
									}
									onChange={(pythonSource) =>
										updateSelectedBodyNode({
											...selectedBodyNode,
											workflowCodeMode: "custom",
											workflowConfig: {
												...selectedBodyNode.workflowConfig,
												pythonSource,
											},
										})
									}
									scopeEntries={selectedScopeEntries}
									theme={
										resolvedTheme === "dark"
											? "vs-dark"
											: "vs"
									}
									readOnly={readOnly}
								/>
							</div>
							<FieldDescription>
								Read this pass with{" "}
								<code>{pythonContextExample}</code>.
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
