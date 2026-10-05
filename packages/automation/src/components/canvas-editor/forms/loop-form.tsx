import { ChevronDown } from "lucide-react";
import { useId } from "react";
import {
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Field,
	FieldDescription,
	FieldLabel,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import type {
	AutomationNode,
	LoopConfig,
} from "../../../domain/automation.types";
import { getLoopContextVariables } from "../loop-scope";
import { ConditionExpressionForm } from "./condition-expression-form";
import { PillInput } from "./pill-input";

interface LoopFormProps {
	step: AutomationNode;
	config: LoopConfig;
	upstreamVars: string[];
	onChange: (config: LoopConfig) => void;
	devMode: boolean;
	readOnly?: boolean;
}

type LoopMode = LoopConfig["mode"];

function configForMode(mode: LoopMode, maxIterations: number): LoopConfig {
	if (mode === "repeat") return { mode, count: 1, maxIterations };
	if (mode === "while") return { mode, condition: "", maxIterations };
	return { mode, items: "", batchSize: 1, maxIterations };
}

/** Configures iteration; repeated steps are edited on the loop canvas. */
export function LoopForm({
	step,
	config,
	upstreamVars,
	onChange,
	devMode,
	readOnly = false,
}: LoopFormProps) {
	const modeSelectId = useId();
	const bodyNodes = step.body?.nodes ?? [];
	const contextVariables = getLoopContextVariables(
		config,
		step.outputVar,
		bodyNodes,
	);
	const contextVariableNames = [
		step.outputVar,
		...contextVariables.map(({ name }) => name),
	];
	const iterationDescription =
		config.mode === "forEach"
			? config.batchSize === 1
				? "The loop runs once for each item."
				: "The loop runs once for each group of items."
			: config.mode === "repeat"
				? "The loop runs the selected number of times."
				: "The loop runs while the condition remains true.";

	return (
		<div className="flex flex-col gap-5">
			<div className="rounded-lg border bg-muted/20 p-3">
				<p className="font-medium text-sm">Loop setup</p>
				<p className="mt-1 text-muted-foreground text-xs">
					Choose what repeats, the data it processes, and the steps
					that run for each pass.
				</p>
			</div>

			<Field>
				<FieldLabel htmlFor={modeSelectId}>Repeat mode</FieldLabel>
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
						label="List to repeat over"
						required
						value={config.items}
						onChange={(items) => onChange({ ...config, items })}
						upstreamVars={upstreamVars}
						placeholder="Choose data from an earlier step"
						description="Use Insert data to choose a list, such as files or database rows."
						mono
						minRows={2}
						readOnly={readOnly}
					/>
					<Field>
						<FieldLabel>Group size</FieldLabel>
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
							Use 1 to process each item separately. Increase it
							when a repeated step should receive a group.
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

			<div className="space-y-2 rounded-lg border bg-muted/20 p-3">
				<p className="font-medium text-sm">Steps to repeat</p>
				<p className="text-muted-foreground text-xs">
					{bodyNodes.length} step{bodyNodes.length === 1 ? "" : "s"}{" "}
					run on every pass. Select an inner step on the canvas to
					edit it, or use <strong>Open steps</strong> for the full
					editor.
				</p>
			</div>

			<div className="space-y-2 rounded-lg border bg-muted/20 p-3">
				<p className="font-medium text-sm">
					Data available to repeated steps
				</p>
				<div className="flex flex-wrap gap-2">
					{contextVariables.map((variable) => (
						<span
							key={variable.name}
							className="rounded-md border bg-background px-2 py-1 text-xs"
						>
							{variable.label}
							{devMode && (
								<code className="ml-1 text-muted-foreground">
									{`\${${variable.name}}`}
								</code>
							)}
						</span>
					))}
				</div>
			</div>

			<div className="space-y-1 rounded-lg border bg-muted/20 p-3">
				<p className="font-medium text-sm">Collected results</p>
				<p className="text-muted-foreground text-xs">
					Every pass is collected in order. Later steps can choose{" "}
					<strong>Collected results</strong> from Insert data
					{devMode ? (
						<>
							{" "}
							(<code>{`\${${step.outputVar}.results}`}</code>)
						</>
					) : null}
					.
				</p>
			</div>

			<Collapsible>
				<CollapsibleTrigger asChild>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="w-full justify-between"
					>
						Advanced settings
						<ChevronDown className="size-4" aria-hidden />
					</Button>
				</CollapsibleTrigger>
				<CollapsibleContent className="pt-3">
					<Field>
						<FieldLabel>Maximum passes</FieldLabel>
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
				</CollapsibleContent>
			</Collapsible>
		</div>
	);
}
