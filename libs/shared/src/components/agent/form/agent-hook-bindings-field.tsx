import { useEffect, useId, useRef } from "react";
import {
	FieldDescription,
	FieldError,
	FieldLegend,
	FieldSet,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import type { AgentHookBindingSource } from "../agent.types";

export interface AgentHookBindingsFieldProps {
	pixel: string;
	value?: Record<string, string>;
	events: string[];
	runtimeEvents: string[];
	sources: AgentHookBindingSource[];
	onChange: (value: Record<string, string>) => void;
	onBlur: () => void;
	error?: string;
	onValidityChange: (error?: string) => void;
}

type BindingValidation = { message: string; variable: string };

const UNBOUND_VALUE = "__semoss_unbound_hook_variable__";
const PIXEL_VARIABLE_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
const BINDING_SOURCE_GROUPS = [
	{
		label: "Event",
		matches: (source: string) => source === "event" || source === "payload",
	},
	{
		label: "Run context",
		matches: (source: string) => source.startsWith("context"),
	},
	{
		label: "Completed run",
		matches: (source: string) => source.startsWith("result"),
	},
	{
		label: "Tool call",
		matches: (source: string) => source.startsWith("tool"),
	},
] as const;

/** Finds bracketed Pixel variables while ignoring strings and comments. */
export const extractPixelVariables = (pixel: string): string[] => {
	const variables: string[] = [];
	const seen = new Set<string>();
	let quote: "'" | '"' | null = null;
	let lineComment = false;
	let blockComment = false;

	for (let index = 0; index < pixel.length; index += 1) {
		const character = pixel[index];
		const next = pixel[index + 1];
		if (lineComment) {
			if (character === "\n") lineComment = false;
			continue;
		}
		if (blockComment) {
			if (character === "*" && next === "/") {
				blockComment = false;
				index += 1;
			}
			continue;
		}
		if (quote) {
			if (character === "\\") index += 1;
			else if (character === quote) quote = null;
			continue;
		}
		if (character === "/" && next === "/") {
			lineComment = true;
			index += 1;
			continue;
		}
		if (character === "/" && next === "*") {
			blockComment = true;
			index += 1;
			continue;
		}
		if (character === "'" || character === '"') {
			quote = character;
			continue;
		}
		if (character !== "[") continue;

		const close = pixel.indexOf("]", index + 1);
		if (close === -1) continue;
		const candidate = pixel.slice(index + 1, close).trim();
		if (PIXEL_VARIABLE_NAME.test(candidate) && !seen.has(candidate)) {
			seen.add(candidate);
			variables.push(candidate);
		}
		index = close;
	}
	return variables;
};

const formatBindings = (value?: Record<string, string>) =>
	JSON.stringify(value ?? {});

const isSourceAvailable = (
	source: string,
	events: string[],
	runtimeEvents: string[],
	sources: AgentHookBindingSource[],
) => {
	const capability = sources.find((candidate) => candidate.source === source);
	if (!capability) return false;
	const firingEvents = events.length > 0 ? events : runtimeEvents;
	return (
		firingEvents.length > 0 &&
		firingEvents.every((event) => capability.events.includes(event))
	);
};

/** Maps variables referenced by a Pixel expression to lifecycle values. */
export const AgentHookBindingsField = ({
	pixel,
	value,
	events,
	runtimeEvents,
	sources,
	onChange,
	onBlur,
	error,
	onValidityChange,
}: AgentHookBindingsFieldProps) => {
	const idPrefix = useId();
	const onChangeRef = useRef(onChange);
	const onValidityChangeRef = useRef(onValidityChange);
	const variables = extractPixelVariables(pixel);
	const variableSet = new Set(variables);
	const bindings = Object.fromEntries(
		Object.entries(value ?? {}).filter(([variable]) =>
			variableSet.has(variable),
		),
	);
	const sourceNames = sources.map((source) => source.source);
	const sourceGroups = BINDING_SOURCE_GROUPS.map((group) => ({
		...group,
		sources: sourceNames.filter(group.matches),
	})).filter((group) => group.sources.length > 0);
	const validation = variables.reduce<BindingValidation | undefined>(
		(current, variable) => {
			if (current) return current;
			const source = bindings[variable];
			if (
				source &&
				!isSourceAvailable(source, events, runtimeEvents, sources)
			) {
				return {
					variable,
					message: `${source} is not available at every selected hook event.`,
				};
			}
			return undefined;
		},
		undefined,
	);
	const validationMessage = validation?.message;
	const errorId = `${idPrefix}-error`;
	const serializedBindings = formatBindings(bindings);
	const serializedValue = formatBindings(value);

	onChangeRef.current = onChange;
	onValidityChangeRef.current = onValidityChange;

	useEffect(() => {
		onValidityChangeRef.current(validationMessage);
	}, [validationMessage]);

	useEffect(() => {
		if (serializedBindings !== serializedValue) {
			onChangeRef.current(
				JSON.parse(serializedBindings) as Record<string, string>,
			);
		}
	}, [serializedBindings, serializedValue]);

	const setBinding = (variable: string, source: string) => {
		const next = { ...bindings };
		if (source === UNBOUND_VALUE) delete next[variable];
		else next[variable] = source;
		onChange(next);
		onBlur();
	};

	return (
		<FieldSet className="gap-3" data-invalid={!!error}>
			<FieldLegend variant="label" className="mb-0">
				Inputs from the agent run
			</FieldLegend>
			<FieldDescription>
				Variables referenced in the Pixel expression appear here. Attach
				an agent-run value only when you want the hook to supply that
				variable.
			</FieldDescription>

			{variables.length === 0 ? (
				<p className="text-muted-foreground text-sm">
					Reference a Pixel variable such as <code>[val]</code> to
					configure an input.
				</p>
			) : (
				<div className="flex flex-col gap-2">
					<div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-2 px-1 text-muted-foreground text-xs">
						<span>Pixel variable</span>
						<span>Lifecycle value</span>
					</div>
					{variables.map((variable) => {
						const invalid = validation?.variable === variable;
						return (
							<div
								key={variable}
								className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] items-center gap-2"
							>
								<code className="rounded-md border bg-muted px-3 py-2 text-sm">
									[{variable}]
								</code>
								<Select
									value={bindings[variable] ?? UNBOUND_VALUE}
									onValueChange={(source) =>
										setBinding(variable, source)
									}
								>
									<SelectTrigger
										aria-label={`Lifecycle value for ${variable}`}
										aria-invalid={invalid || undefined}
										aria-describedby={
											invalid ? errorId : undefined
										}
									>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value={UNBOUND_VALUE}>
											Use existing Pixel variable
										</SelectItem>
										{sourceGroups.map((group) => (
											<div key={group.label}>
												<div className="px-2 py-1.5 font-medium text-muted-foreground text-xs">
													{group.label}
												</div>
												{group.sources.map((source) => (
													<SelectItem
														key={source}
														value={source}
														disabled={
															!isSourceAvailable(
																source,
																events,
																runtimeEvents,
																sources,
															)
														}
													>
														{source}
													</SelectItem>
												))}
											</div>
										))}
									</SelectContent>
								</Select>
							</div>
						);
					})}
				</div>
			)}
			{error && <FieldError id={errorId}>{error}</FieldError>}
		</FieldSet>
	);
};
