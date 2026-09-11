import { useId, useState } from "react";
import {
	Badge,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Switch,
	Textarea,
	ToggleGroup,
	ToggleGroupItem,
} from "@semoss/ui/next";
import type {
	BuiltinToolDefinition,
	BuiltinToolParam,
	BuiltinToolSelection,
} from "@/api/engines";
import { CatalogTagInput } from "@/components/catalog";

// GetModelBuiltinTools' response shape is a pixel wire type and lives in the
// data layer; re-exported here so consumers keep importing it alongside the
// field that renders it.
export type { ModelBuiltinTools } from "@/api/engines";

/**
 * The selection written when a tool is switched on: the catalog definition
 * copied verbatim, so whatever later reads the stored JSON knows the tool's
 * options, defaults, and display names without a second catalog lookup.
 * Parameters only gain a `value` once the user changes them.
 */
const buildDefaultSelection = (
	definition: BuiltinToolDefinition,
): BuiltinToolSelection => ({
	...definition,
	params: (definition.params ?? []).map((param) => ({ ...param })),
});

interface EngineBuiltinToolsFieldProps {
	/** Catalog tools offered for this engine's providers, keyed by tool name */
	tools: Record<string, BuiltinToolDefinition>;

	/** Stored selection; null when nothing has been saved yet */
	value: Record<string, BuiltinToolSelection> | null;

	/** Called with the full selection object on every edit */
	onChange: (next: Record<string, BuiltinToolSelection>) => void;

	/** Test id prefix; each tool switch gets `${testId}--${toolKey}` */
	testId: string;
}

/**
 * Selectable list of the provider-hosted built-in tools a model can use, with
 * per-tool parameter editors driven by the catalog's parameter schemas. The
 * selection is reported as the keyed JSON object stored in BUILTIN_TOOLS.
 */
export const EngineBuiltinToolsField = ({
	tools,
	value,
	onChange,
	testId,
}: EngineBuiltinToolsFieldProps) => {
	const selection = value ?? {};

	/**
	 * Rebuild the selection with catalog tools in catalog order, so the same
	 * choices always serialize identically for the parent's dirty check.
	 */
	const orderSelection = (next: Record<string, BuiltinToolSelection>) => {
		const ordered: Record<string, BuiltinToolSelection> = {};
		for (const toolKey of Object.keys(tools)) {
			if (toolKey in next) {
				ordered[toolKey] = next[toolKey];
			}
		}
		for (const toolKey of Object.keys(next)) {
			if (!(toolKey in ordered)) {
				ordered[toolKey] = next[toolKey];
			}
		}
		return ordered;
	};

	const toggleTool = (toolKey: string, enabled: boolean) => {
		const next = { ...selection };
		if (enabled) {
			next[toolKey] = tools[toolKey]
				? buildDefaultSelection(tools[toolKey])
				: {};
		} else {
			delete next[toolKey];
		}
		onChange(orderSelection(next));
	};

	/**
	 * Set (or clear, with undefined) one parameter's value. The stored tool
	 * is rewritten from the current catalog definition each time, so a copy
	 * saved against an older catalog picks up fresh metadata on edit.
	 */
	const updateParam = (
		toolKey: string,
		paramAlias: string,
		paramValue: unknown,
	) => {
		const definition = tools[toolKey];
		if (!definition) {
			return;
		}
		const stored = selection[toolKey];
		const params = (definition.params ?? []).map((param) => {
			const value =
				param.alias === paramAlias
					? paramValue
					: stored?.params?.find(
							(storedParam) => storedParam.alias === param.alias,
						)?.value;
			return value === undefined ? { ...param } : { ...param, value };
		});
		onChange(
			orderSelection({
				...selection,
				[toolKey]: { ...definition, params },
			}),
		);
	};

	/**
	 * The value a parameter editor shows: the stored value when the user set
	 * one, the catalog default otherwise.
	 */
	const currentParamValue = (toolKey: string, param: BuiltinToolParam) => {
		const storedValue = selection[toolKey]?.params?.find(
			(storedParam) => storedParam.alias === param.alias,
		)?.value;
		return storedValue !== undefined ? storedValue : param.default;
	};

	// Tools saved on the model that its provider no longer offers. They stay
	// visible so they can be switched off, but expose nothing to configure.
	const unknownSelectedKeys = Object.keys(selection).filter(
		(toolKey) => !tools[toolKey],
	);

	return (
		<div className="flex flex-col gap-2" data-testid={testId}>
			{Object.entries(tools).map(([toolKey, definition]) => {
				const isSelected = toolKey in selection;
				const uiParams = (definition.params ?? []).filter(
					(param) => param.show_in_ui !== false,
				);

				return (
					<div key={toolKey} className="rounded-md border">
						<div className="flex items-start justify-between gap-4 p-3">
							<div className="flex flex-col gap-1">
								<div className="flex flex-wrap items-center gap-2">
									<span className="font-medium text-sm">
										{definition.display_name || toolKey}
									</span>
									<Badge
										variant="outline"
										className="font-mono text-xs"
									>
										{definition.alias}
									</Badge>
								</div>
								{definition.description && (
									<p className="text-muted-foreground text-xs">
										{definition.description}
									</p>
								)}
							</div>
							<Switch
								checked={isSelected}
								onCheckedChange={(checked) =>
									toggleTool(toolKey, checked)
								}
								data-testid={`${testId}--${toolKey}`}
							/>
						</div>

						{isSelected && uiParams.length > 0 && (
							<div className="flex flex-col gap-4 border-t p-3">
								{uiParams.map((param) => (
									<BuiltinToolParamInput
										key={param.alias}
										param={param}
										value={currentParamValue(
											toolKey,
											param,
										)}
										onCommit={(paramValue) =>
											updateParam(
												toolKey,
												param.alias,
												paramValue,
											)
										}
										testId={`${testId}--${toolKey}--${param.alias}`}
									/>
								))}
							</div>
						)}
					</div>
				);
			})}

			{unknownSelectedKeys.map((toolKey) => (
				<div
					key={toolKey}
					className="flex items-center justify-between gap-4 rounded-md border border-dashed p-3"
				>
					<div className="flex flex-col gap-1">
						<span className="font-mono text-sm">{toolKey}</span>
						<p className="text-muted-foreground text-xs">
							Saved on this model but not offered for its
							provider. Switch off to remove it.
						</p>
					</div>
					<Switch
						checked
						onCheckedChange={() => toggleTool(toolKey, false)}
						data-testid={`${testId}--${toolKey}`}
					/>
				</div>
			))}
		</div>
	);
};

/** Shared label + description shell for a single parameter editor. */
const ParamShell = ({
	param,
	control,
	inline,
}: {
	param: BuiltinToolParam;
	control: React.ReactNode;
	/** Render the control on the label row (switches) instead of below it. */
	inline?: boolean;
}) => (
	<div className="flex flex-col gap-1.5">
		<div
			className={
				inline ? "flex items-center justify-between gap-4" : undefined
			}
		>
			<span className="font-medium text-muted-foreground text-xs">
				{param.display_name || param.alias}
				{param.type === "required" && (
					<span className="text-destructive"> *</span>
				)}
			</span>
			{inline && control}
		</div>
		{!inline && control}
	</div>
);

/**
 * Editor for one tool parameter, shaped by the catalog's `input` kind:
 * switches for booleans, selects and toggle groups where the options are
 * enumerated, tags for free lists, and raw JSON for maps.
 */
const BuiltinToolParamInput = ({
	param,
	value,
	onCommit,
	testId,
}: {
	param: BuiltinToolParam;
	value: unknown;
	onCommit: (value: unknown) => void;
	testId: string;
}) => {
	const inputId = useId();
	// Raw text being edited for a JSON parameter. Committed once it parses;
	// kept as typed so invalid intermediate states are not thrown away.
	const [jsonDraft, setJsonDraft] = useState<string | null>(null);

	const options = (param.options ?? []).map((option) => String(option));

	if (param.input === "boolean") {
		return (
			<ParamShell
				param={param}
				inline
				control={
					<Switch
						checked={value === true}
						onCheckedChange={(checked) => onCommit(checked)}
						data-testid={testId}
					/>
				}
			/>
		);
	}

	if (param.input === "number") {
		return (
			<ParamShell
				param={param}
				control={
					<Input
						id={inputId}
						type="text"
						inputMode="numeric"
						value={
							value === undefined || value === null
								? ""
								: String(value)
						}
						onChange={(event) => {
							const digits = event.target.value.replace(
								/[^\d]/g,
								"",
							);
							onCommit(
								digits === "" ? undefined : Number(digits),
							);
						}}
						data-testid={testId}
					/>
				}
			/>
		);
	}

	if (param.input === "list") {
		const values = Array.isArray(value) ? value.map(String) : [];

		if (options.length > 0) {
			return (
				<ParamShell
					param={param}
					control={
						<ToggleGroup
							type="multiple"
							variant="outline"
							size="sm"
							spacing={2}
							className="flex-wrap"
							value={values}
							onValueChange={(next) => onCommit(next)}
							data-testid={testId}
						>
							{options.map((option) => (
								<ToggleGroupItem key={option} value={option}>
									{option}
								</ToggleGroupItem>
							))}
						</ToggleGroup>
					}
				/>
			);
		}

		return (
			<ParamShell
				param={param}
				control={
					<CatalogTagInput
						value={values}
						onChange={(next) => onCommit(next)}
						placeholder="Press enter to add a value"
						testId={testId}
					/>
				}
			/>
		);
	}

	if (param.input === "string" && options.length > 0) {
		return (
			<ParamShell
				param={param}
				control={
					<Select
						value={typeof value === "string" ? value : ""}
						onValueChange={(next) => onCommit(next)}
					>
						<SelectTrigger className="w-full" data-testid={testId}>
							<SelectValue placeholder="Select a value" />
						</SelectTrigger>
						<SelectContent>
							{options.map((option) => (
								<SelectItem key={option} value={option}>
									{option}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				}
			/>
		);
	}

	if (param.input === "string") {
		return (
			<ParamShell
				param={param}
				control={
					<Input
						id={inputId}
						type="text"
						value={typeof value === "string" ? value : ""}
						onChange={(event) => {
							const next = event.target.value;
							onCommit(next === "" ? undefined : next);
						}}
						data-testid={testId}
					/>
				}
			/>
		);
	}

	// "map" and anything unrecognized edit as raw JSON.
	const committedText = JSON.stringify(value ?? {}, null, 2);
	const text = jsonDraft ?? committedText;
	let isInvalid = false;
	if (jsonDraft !== null) {
		try {
			JSON.parse(jsonDraft);
		} catch {
			isInvalid = true;
		}
	}

	return (
		<ParamShell
			param={param}
			control={
				<div className="flex flex-col gap-1">
					<Textarea
						value={text}
						rows={4}
						className="font-mono text-xs"
						onChange={(event) => {
							const nextText = event.target.value;
							setJsonDraft(nextText);
							try {
								onCommit(JSON.parse(nextText));
							} catch {
								// keep typing - the draft is committed once
								// it parses
							}
						}}
						data-testid={testId}
					/>
					{isInvalid && (
						<p className="text-destructive text-xs">
							Not valid JSON. The last valid value is what gets
							saved.
						</p>
					)}
				</div>
			}
		/>
	);
};
