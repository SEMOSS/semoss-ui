import { usePixel } from "@semoss/sdk/react";
import { Button, Small } from "@semoss/ui/next";
import type { FunctionEngineConfig } from "../../../domain/automation.types";
import { EnginePickerField } from "./engine-picker-field";
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

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
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
	const required = requiredParameterNames(value.required);
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

export interface FunctionEngineFormProps {
	/** Current node config */
	config: FunctionEngineConfig;
	/** Output variable names produced by upstream nodes, offered as autocomplete */
	upstreamVars: string[];
	/** Called with the updated config on every field change */
	onChange: (c: FunctionEngineConfig) => void;
	/** When true, all fields are locked to their current values */
	readOnly?: boolean;
}

export function FunctionEngineForm({
	config,
	upstreamVars,
	onChange,
	readOnly = false,
}: FunctionEngineFormProps) {
	const definitionPixel = usePixel<unknown>(
		config.engineId
			? `GetFunctionEngineDefinition(engine=[${JSON.stringify(config.engineId)}]);`
			: "",
		{
			data: null,
		},
	);
	const definition = functionEngineDefinition(definitionPixel.data);

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
			<BoundInput
				label="Input Parameters (JSON)"
				required
				value={config.params}
				placeholder='{"location": "${location}"}'
				description="Use the declared parameter names below. Scope variables can replace any JSON value."
				onChange={(v) => onChange({ ...config, params: v })}
				upstreamVars={upstreamVars}
				readOnly={readOnly}
				mono
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
			{definition && definition.parameters.length > 0 && (
				<div className="rounded-md border border-border bg-muted/30 p-3">
					<div className="flex items-center justify-between gap-3">
						<p className="font-medium text-sm">
							Available parameters
						</p>
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
					<dl className="mt-3 flex flex-col gap-3">
						{definition.parameters.map((parameter) => (
							<div key={parameter.name}>
								<dt className="font-medium font-mono text-sm">
									{parameter.name}
									<span className="ml-2 font-normal font-sans text-muted-foreground">
										{parameter.type}
										{parameter.required
											? " · required"
											: " · optional"}
									</span>
								</dt>
								{parameter.description && (
									<dd className="mt-1 text-muted-foreground text-sm">
										{parameter.description}
									</dd>
								)}
							</div>
						))}
					</dl>
				</div>
			)}
		</div>
	);
}
