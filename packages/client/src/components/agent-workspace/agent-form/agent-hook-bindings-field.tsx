import { Check, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
	Button,
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { PIXEL_HOOK_BINDING_SOURCES } from "./types";

export interface AgentHookBindingsFieldProps {
	value?: Record<string, string>;
	onChange: (value: Record<string, string>) => void;
	onBlur: () => void;
	error?: string;
	onValidityChange: (error?: string) => void;
}

type BindingRow = {
	id: number;
	variable: string;
	source: string;
};

type BindingSource = (typeof PIXEL_HOOK_BINDING_SOURCES)[number];

const BINDING_SOURCE_DETAILS: Record<BindingSource, string> = {
	event: "Name of the lifecycle event currently firing.",
	payload:
		"Complete lifecycle payload, including context, result, and tool data.",
	context: "Complete context for the current agent run.",
	"context.runId": "Durable identifier for this agent run.",
	"context.roomId": "Room in which the agent is running.",
	"context.userId": "Identifier of the user who started the run.",
	"context.input": "Original user input that started this run.",
	"context.spawnDepth":
		"Zero for a root agent; increases for each spawned agent.",
	result: "Complete result produced by the finished agent run.",
	"result.finalText": "Final text response returned by the agent.",
	"result.structuredOutput":
		"Final response parsed as an object or array when it is entirely valid JSON.",
	"result.iterations": "Number of agent-loop iterations used.",
	"result.reflectionsUsed": "Number of reflection attempts used.",
	"result.inputMessageId": "Stored message identifier for the run input.",
	"result.finalOutputMessageId":
		"Stored message identifier for the final response.",
	"result.toolCallRecords": "Summary of all tool calls made during the run.",
	tool: "Complete payload for the tool call currently firing.",
	"tool.name": "Name of the tool being called.",
	"tool.callId": "Identifier for this individual tool call.",
	"tool.params": "Arguments supplied to the tool.",
	"tool.resultContent":
		"Text returned by the tool. Available after the tool finishes.",
	"tool.durationMs":
		"Tool execution time in milliseconds. Available afterward.",
	"tool.success":
		"Whether the tool completed successfully. Available afterward.",
	"tool.iteration": "Agent-loop iteration in which the tool was called.",
};

const BINDING_SOURCE_GROUPS = [
	{
		label: "Event",
		description: "Available whenever the hook fires.",
		sources: PIXEL_HOOK_BINDING_SOURCES.filter(
			(source) => source === "event" || source === "payload",
		),
	},
	{
		label: "Run context",
		description: "Available throughout the agent run.",
		sources: PIXEL_HOOK_BINDING_SOURCES.filter((source) =>
			source.startsWith("context"),
		),
	},
	{
		label: "Completed run",
		description: "Available on afterRun and beforeAgentDeInit.",
		sources: PIXEL_HOOK_BINDING_SOURCES.filter((source) =>
			source.startsWith("result"),
		),
	},
	{
		label: "Tool call",
		description:
			"Available on beforeTool and afterTool; result fields require afterTool.",
		sources: PIXEL_HOOK_BINDING_SOURCES.filter((source) =>
			source.startsWith("tool"),
		),
	},
] as const;

const ADD_SOURCE_ORDER = [
	"result.finalText",
	"result.structuredOutput",
	"context.runId",
	"context.roomId",
	"event",
	...PIXEL_HOOK_BINDING_SOURCES,
];

const formatBindings = (value?: Record<string, string>) =>
	JSON.stringify(value ?? {});

const suggestedVariable = (source: string) => {
	const parts = source.split(".");
	if (parts.length === 1) {
		return source;
	}
	const leaf = parts[parts.length - 1];
	return parts[0] === "tool"
		? ["tool", leaf.charAt(0).toUpperCase(), leaf.slice(1)].join("")
		: leaf;
};

/** Guided editor for mapping lifecycle payload fields to temporary Pixel variables. */
export const AgentHookBindingsField = ({
	value,
	onChange,
	onBlur,
	error,
	onValidityChange,
}: AgentHookBindingsFieldProps) => {
	const nextId = useRef(0);
	const lastCommittedValue = useRef(formatBindings(value));
	const [rows, setRows] = useState<BindingRow[]>(() =>
		Object.entries(value ?? {}).map(([variable, source]) => ({
			id: nextId.current++,
			variable,
			source,
		})),
	);

	useEffect(() => {
		const nextValue = formatBindings(value);
		if (nextValue !== lastCommittedValue.current) {
			lastCommittedValue.current = nextValue;
			setRows(
				Object.entries(value ?? {}).map(([variable, source]) => ({
					id: nextId.current++,
					variable,
					source,
				})),
			);
		}
	}, [value]);

	const commitRows = (nextRows: BindingRow[]) => {
		setRows(nextRows);
		const variables = new Set<string>();
		for (const row of nextRows) {
			if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(row.variable)) {
				onValidityChange(
					row.variable
						? ["Invalid Pixel variable name: ", row.variable].join(
								"",
							)
						: "Enter a Pixel variable name for each input.",
				);
				return;
			}
			if (variables.has(row.variable)) {
				onValidityChange(
					[
						"Pixel variable names must be unique: ",
						row.variable,
					].join(""),
				);
				return;
			}
			variables.add(row.variable);
		}

		const bindings = Object.fromEntries(
			nextRows.map((row) => [row.variable, row.source]),
		);
		lastCommittedValue.current = formatBindings(bindings);
		onChange(bindings);
		onValidityChange();
	};

	const addSource = (source: string) => {
		if (rows.some((row) => row.source === source)) {
			return;
		}
		const baseVariable = suggestedVariable(source);
		let variable = baseVariable;
		let suffix = 2;
		while (rows.some((row) => row.variable === variable)) {
			variable = baseVariable + suffix++;
		}
		commitRows([...rows, { id: nextId.current++, variable, source }]);
	};

	const firstUnusedSource = ADD_SOURCE_ORDER.find(
		(source) => !rows.some((row) => row.source === source),
	);

	return (
		<Field data-invalid={!!error}>
			<FieldLabel>Inputs from the agent run</FieldLabel>
			<FieldDescription>
				Choose values to expose to Pixel. The variable name is what you
				put in brackets. For example, map{" "}
				<code className="rounded bg-muted px-1">finalText</code> to{" "}
				<code className="rounded bg-muted px-1">result.finalText</code>,
				then use{" "}
				<code className="rounded bg-muted px-1">[finalText]</code> in
				the Pixel expression above.
			</FieldDescription>

			{rows.length > 0 && (
				<div className="flex flex-col gap-2">
					<div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto] gap-2 px-1 text-muted-foreground text-xs">
						<span>Pixel variable</span>
						<span>Lifecycle value</span>
						<span className="sr-only">Remove</span>
					</div>
					{rows.map((row) => (
						<div
							key={row.id}
							className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto] items-center gap-2"
						>
							<Input
								aria-label="Pixel variable"
								value={row.variable}
								onChange={(event) =>
									commitRows(
										rows.map((candidate) =>
											candidate.id === row.id
												? {
														...candidate,
														variable:
															event.target.value,
													}
												: candidate,
										),
									)
								}
								onBlur={onBlur}
							/>
							<Select
								value={row.source}
								onValueChange={(source) =>
									commitRows(
										rows.map((candidate) =>
											candidate.id === row.id
												? { ...candidate, source }
												: candidate,
										),
									)
								}
							>
								<SelectTrigger aria-label="Lifecycle value">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{BINDING_SOURCE_GROUPS.map((group) => (
										<div key={group.label}>
											<div className="px-2 py-1.5 font-medium text-muted-foreground text-xs">
												{group.label}
											</div>
											{group.sources.map((source) => (
												<SelectItem
													key={source}
													value={source}
												>
													{source}
												</SelectItem>
											))}
										</div>
									))}
								</SelectContent>
							</Select>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								aria-label={[
									"Remove ",
									row.variable || "input",
								].join("")}
								onClick={() =>
									commitRows(
										rows.filter(
											(candidate) =>
												candidate.id !== row.id,
										),
									)
								}
							>
								<X className="size-4" />
							</Button>
						</div>
					))}
				</div>
			)}

			{firstUnusedSource && (
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="w-fit"
					onClick={() => addSource(firstUnusedSource)}
				>
					<Plus className="size-4" />
					Add input
				</Button>
			)}

			<details className="rounded-md border border-border px-3 py-2 text-xs">
				<summary className="cursor-pointer font-medium">
					Browse agent-run values
				</summary>
				<p className="mt-2 text-muted-foreground">
					Choose only the values this hook needs. A value unavailable
					at the selected lifecycle event is passed as null.
				</p>
				<div className="mt-3 flex flex-col gap-4">
					{BINDING_SOURCE_GROUPS.map((group) => (
						<div key={group.label}>
							<p className="font-medium">{group.label}</p>
							<p className="mb-2 text-muted-foreground">
								{group.description}
							</p>
							<div className="grid gap-2 sm:grid-cols-2">
								{group.sources.map((source) => {
									const selected = rows.some(
										(row) => row.source === source,
									);
									return (
										<Button
											key={source}
											type="button"
											variant="secondary"
											size="sm"
											disabled={selected}
											className="h-auto min-h-14 items-start justify-start gap-2 px-3 py-2 text-left"
											onClick={() => addSource(source)}
										>
											{selected ? (
												<Check className="mt-0.5 size-4 shrink-0" />
											) : (
												<Plus className="mt-0.5 size-4 shrink-0" />
											)}
											<span className="flex min-w-0 flex-col gap-0.5">
												<code className="font-medium text-xs">
													{source}
												</code>
												<span className="whitespace-normal font-normal font-sans text-muted-foreground text-xs">
													{
														BINDING_SOURCE_DETAILS[
															source
														]
													}
												</span>
											</span>
										</Button>
									);
								})}
							</div>
						</div>
					))}
				</div>
			</details>
			{error && <FieldError>{error}</FieldError>}
		</Field>
	);
};
