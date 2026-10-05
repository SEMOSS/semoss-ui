import { useId } from "react";
import {
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
							Use 1 for one item at a time, or increase it to
							process groups.
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
				<p className="font-medium text-sm">Repeated steps</p>
				<p className="text-muted-foreground text-xs">
					{bodyNodes.length} step{bodyNodes.length === 1 ? "" : "s"}{" "}
					run on every pass. Select an inner step on the canvas to
					edit it, or use <strong>Open steps</strong> for the full
					editor.
				</p>
			</div>

			<div className="space-y-2 rounded-lg border bg-muted/20 p-3">
				<p className="font-medium text-sm">Available inside the loop</p>
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

			<div className="space-y-1 rounded-lg border bg-muted/20 p-3">
				<p className="font-medium text-sm">After the loop</p>
				<p className="text-muted-foreground text-xs">
					Every pass is collected in order. Later steps can use{" "}
					<code>{`\${${step.outputVar}.results}`}</code> to read the
					collected outputs.
				</p>
			</div>
		</div>
	);
}
