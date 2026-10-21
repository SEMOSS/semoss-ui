import { useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import { Button, Small } from "@semoss/ui/next";
import { tryParseJson } from "@semoss/utility/json";
import { isRecord } from "@semoss/utility/object";
import type { FunctionEngineConfig } from "../../../domain/automation.types";
import { EnginePickerField } from "./engine-picker-field";
import { type InputMode, InputModeToggle } from "./input-mode-toggle";
import { BoundInput } from "./pill-input";

interface FunctionParameterDefinition {
	name: string;
	type: string;
	description?: string;
	required: boolean;
}

interface FunctionEngineDefinition {
	name: string;
	description?: string;
	parameters: FunctionParameterDefinition[];
}

function requiredParameterNames(value: unknown): Set<string> {
	const names = new Set<string>();
	const visit = (entry: unknown): void => {
		if (typeof entry === "string") {
			names.add(entry);
			return;
		}
		if (Array.isArray(entry)) entry.forEach(visit);
	};
	visit(value);
	return names;
}

/** Validates and normalizes the function-definition JSON returned by SEMOSS. */
function functionEngineDefinition(
	value: unknown,
): FunctionEngineDefinition | null {
	if (!isRecord(value)) return null;
	const schema = isRecord(value.parameters) ? value.parameters : null;
	const properties =
		schema && isRecord(schema.properties) ? schema.properties : {};
	const required = requiredParameterNames(schema?.required ?? value.required);
	const parameters = Object.entries(properties).flatMap(
		([name, property]) => {
			if (!isRecord(property)) return [];
			return [
				{
					name,
					type:
						typeof property.type === "string"
							? property.type
							: "string",
					description:
						typeof property.description === "string"
							? property.description
							: undefined,
					required: required.has(name),
				},
			];
		},
	);
	return {
		name: typeof value.name === "string" ? value.name : "Function",
		description:
			typeof value.description === "string"
				? value.description
				: undefined,
		parameters,
	};
}

function defaultParameterValue(type: string): unknown {
	switch (type.toLowerCase()) {
		case "boolean":
			return false;
		case "integer":
		case "number":
			return 0;
		case "array":
			return [];
		case "object":
			return {};
		default:
			return "";
	}
}

/** Builds an editable JSON object containing every declared function parameter. */
function parameterTemplate(parameters: FunctionParameterDefinition[]): string {
	return JSON.stringify(
		Object.fromEntries(
			parameters.map((parameter) => [
				parameter.name,
				defaultParameterValue(parameter.type),
			]),
		),
		null,
		2,
	);
}

function parameterObject(value: string): Record<string, unknown> | null {
	const parsed = tryParseJson(value);
	return isRecord(parsed) ? parsed : null;
}

function parameterDisplayValue(value: unknown): string {
	if (value === undefined || value === null) return "";
	if (typeof value === "string") return value;
	return JSON.stringify(value);
}

function parameterValue(value: string, type: string): unknown {
	const trimmed = value.trim();
	if (/^\$\{[^}]+\}$/.test(trimmed)) return trimmed;
	if (type === "boolean" && (trimmed === "true" || trimmed === "false")) {
		return trimmed === "true";
	}
	if ((type === "integer" || type === "number") && trimmed !== "") {
		const numericValue = Number(trimmed);
		if (Number.isFinite(numericValue)) return numericValue;
	}
	if (type === "array" || type === "object") {
		const parsed = tryParseJson(trimmed);
		return parsed === undefined ? value : parsed;
	}
	return value;
}

export interface FunctionEngineFormProps {
	/** Current node config */
	config: FunctionEngineConfig;
	/** Output variable names produced by upstream nodes, offered as autocomplete */
	upstreamVars: string[];
	/** Called with the updated config on every field change */
	onChange: (c: FunctionEngineConfig) => void;
	/** Opens JSON first in developer mode; users can still switch representations. */
	devMode?: boolean;
	/** When true, all fields are locked to their current values */
	readOnly?: boolean;
}

export function FunctionEngineForm({
	config,
	upstreamVars,
	onChange,
	devMode = false,
	readOnly = false,
}: FunctionEngineFormProps) {
	const [inputMode, setInputMode] = useState<InputMode>(() =>
		devMode ? "json" : "form",
	);
	const definitionPixel = usePixel<unknown>(
		config.engineId
			? `GetFunctionEngineDefinition(engine=[${JSON.stringify(config.engineId)}]);`
			: "",
		{
			data: null,
		},
	);
	const definition = functionEngineDefinition(definitionPixel.data);
	const parsedValues = parameterObject(config.params);
	const values = parsedValues ?? {};
	const hasParameterFields =
		definition !== null && definition.parameters.length > 0;
	const displayedMode = parsedValues === null ? "json" : inputMode;
	const showParameterFields = hasParameterFields && displayedMode === "form";
	const showRawParameters = !hasParameterFields || displayedMode === "json";

	const updateParameter = (
		parameter: FunctionParameterDefinition,
		value: string,
	) => {
		onChange({
			...config,
			params: JSON.stringify(
				{
					...values,
					[parameter.name]: parameterValue(value, parameter.type),
				},
				null,
				2,
			),
		});
	};

	return (
		<div className="flex flex-col gap-4">
			<EnginePickerField
				label="Function Engine"
				name={config.engineName || ""}
				value={config.engineId}
				engineTypes={["FUNCTION"]}
				required
				disabled={readOnly}
				onChange={(e) => {
					const isDifferentEngine = e.engine_id !== config.engineId;
					onChange({
						...config,
						engineId: e.engine_id,
						engineName: e.engine_display_name ?? e.engine_name,
						params: isDifferentEngine ? "{}" : config.params,
					});
				}}
			/>
			{definitionPixel.status === "LOADING" && (
				<output className="text-muted-foreground text-sm">
					Loading function parameters…
				</output>
			)}
			{definitionPixel.status === "ERROR" && (
				<Small role="alert" className="text-destructive">
					Function parameter details could not be loaded. You can
					still edit the JSON directly.
				</Small>
			)}
			{hasParameterFields && (
				<InputModeToggle
					value={displayedMode}
					onValueChange={setInputMode}
					formDisabled={parsedValues === null}
				/>
			)}
			{showParameterFields && definition && (
				<div className="rounded-md border border-border bg-muted/30 p-3">
					<div className="flex items-center justify-between gap-3">
						<p className="font-medium text-sm">Function inputs</p>
						{!readOnly && (
							<Button
								type="button"
								size="sm"
								variant="outline"
								onClick={() =>
									onChange({
										...config,
										params: parameterTemplate(
											definition.parameters,
										),
									})
								}
							>
								Populate parameters
							</Button>
						)}
					</div>
					{definition.description && (
						<Small className="mt-1 block text-muted-foreground">
							{definition.description}
						</Small>
					)}
					<div className="mt-3 flex flex-col gap-3">
						{definition.parameters.map((parameter) => (
							<BoundInput
								key={parameter.name}
								label={`${parameter.name} · ${parameter.type}${parameter.required ? "" : " (optional)"}`}
								required={parameter.required}
								value={parameterDisplayValue(
									values[parameter.name],
								)}
								description={parameter.description}
								placeholder={`Enter ${parameter.name}`}
								onChange={(value) =>
									updateParameter(parameter, value)
								}
								upstreamVars={upstreamVars}
								readOnly={readOnly}
							/>
						))}
					</div>
				</div>
			)}
			{showRawParameters && (
				<>
					<BoundInput
						label="Input Parameters (JSON)"
						required
						value={config.params}
						placeholder='{"location": "${location}"}'
						description={
							hasParameterFields
								? "Edit the complete function input object. Form mode uses this same value."
								: "Parameter details are unavailable, so enter the function input object directly."
						}
						onChange={(value) => {
							setInputMode("json");
							onChange({ ...config, params: value });
						}}
						upstreamVars={upstreamVars}
						readOnly={readOnly}
						mono
					/>
					{parsedValues === null && (
						<Small role="alert" className="text-destructive">
							Enter a valid JSON object before switching to Form.
						</Small>
					)}
				</>
			)}
		</div>
	);
}
