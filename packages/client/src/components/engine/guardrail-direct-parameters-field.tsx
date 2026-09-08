import { Plus, Trash2 } from "lucide-react";
import { useId } from "react";
import {
	Badge,
	Button,
	Field,
	FieldDescription,
	FieldLabel,
	FormField,
	FormInput,
	FormTextarea,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Switch,
} from "@semoss/ui/next";
import {
	createGuardrailDirectParam,
	type GuardrailDirectParamFormValue,
} from "./engine-guardrail-settings.constants";
import {
	type GuardrailParameterOption,
	type GuardrailParametersStatus,
	guardrailParameterTypeForForm,
} from "./guardrail-engine-parameters";

const DIRECT_PARAMETER_TYPE_LABELS: Record<
	GuardrailDirectParamFormValue["type"],
	string
> = {
	string: "String",
	number: "Number",
	boolean: "Boolean",
	"string-array": "String array",
	"number-array": "Number array",
	"boolean-array": "Boolean array",
	json: "JSON",
};

const defaultValueForType = (
	type: GuardrailDirectParamFormValue["type"],
): string => {
	if (type === "boolean") {
		return "false";
	}
	if (type.endsWith("-array")) {
		return "[]";
	}
	if (type === "json") {
		return "{}";
	}
	return "";
};

const structuredValueHelp = (
	type: GuardrailDirectParamFormValue["type"],
): { placeholder: string; description: string } => {
	if (type === "string-array") {
		return {
			placeholder: '["person", "email address"]',
			description: "Enter a JSON array containing only strings.",
		};
	}
	if (type === "number-array") {
		return {
			placeholder: "[0.5, 0.8]",
			description: "Enter a JSON array containing only numbers.",
		};
	}
	if (type === "boolean-array") {
		return {
			placeholder: "[true, false]",
			description: "Enter a JSON array containing only booleans.",
		};
	}
	return {
		placeholder: '{"key": "value"}',
		description: "Enter any valid JSON value, array, or object.",
	};
};

export interface GuardrailDirectParametersFieldProps {
	/** Fixed values currently held for this check. */
	value: GuardrailDirectParamFormValue[];

	/** Replaces the fixed values. */
	onChange: (next: GuardrailDirectParamFormValue[]) => void;

	/** Parameters the selected guardrail engine declares. */
	parameterOptions: GuardrailParameterOption[];

	/** Load state of the guardrail engine's parameters. */
	parametersStatus: GuardrailParametersStatus;

	/** Parameter names already supplied by the check's inputs. */
	mappedParameterNames: string[];

	/** Whether the fields accept edits. */
	disabled?: boolean;

	/** Prefix for this field's element ids. */
	idPrefix: string;

	/** React Hook Form path for this fixed value array. */
	namePrefix: string;
}

/**
 * Editor for a check's directParameters: literal values such as a threshold
 * that are passed to the guardrail engine on every call.
 */
export const GuardrailDirectParametersField = ({
	value,
	onChange,
	parameterOptions,
	parametersStatus,
	mappedParameterNames,
	disabled,
	idPrefix,
	namePrefix,
}: GuardrailDirectParametersFieldProps) => {
	const addParameterId = useId();
	const mappedParameters = new Set(
		mappedParameterNames.map((name) => name.trim()),
	);
	const directParameters = new Set(value.map((row) => row.key.trim()));
	const availableParameters = parameterOptions.filter(
		(parameter) =>
			!mappedParameters.has(parameter.name) &&
			!directParameters.has(parameter.name),
	);
	const addPlaceholder =
		parametersStatus === "no-engine"
			? "Select a guardrail engine first"
			: parametersStatus === "loading"
				? "Loading engine parameters..."
				: parametersStatus === "error"
					? "Unable to load engine parameters"
					: parameterOptions.length === 0
						? "This guardrail defines no parameters"
						: availableParameters.length === 0
							? `All ${parameterOptions.length} engine parameters are configured`
							: "Choose a parameter to add";

	const addParameter = (parameterName: string) => {
		const option = parameterOptions.find(
			(parameter) => parameter.name === parameterName,
		);
		if (!option) {
			return;
		}
		const parameter = createGuardrailDirectParam();
		parameter.key = option.name;
		parameter.type = guardrailParameterTypeForForm(option.type);
		parameter.value = defaultValueForType(parameter.type);
		onChange([...value, parameter]);
	};

	return (
		<div className="space-y-3">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<FieldLabel>Fixed values</FieldLabel>
				<Badge variant="secondary">
					{value.length}{" "}
					{value.length === 1 ? "fixed value" : "fixed values"}
				</Badge>
			</div>
			<FieldDescription>
				Values sent to the guardrail unchanged on every call, such as a
				threshold. Parameters already supplied by Inputs are marked
				Mapped; fixed values added here are marked Added.
			</FieldDescription>
			<Field>
				<FieldLabel htmlFor={addParameterId}>
					Add fixed value
				</FieldLabel>
				<Select
					value=""
					onValueChange={addParameter}
					disabled={
						disabled ||
						parametersStatus !== "loaded" ||
						parameterOptions.length === 0
					}
				>
					<SelectTrigger
						id={addParameterId}
						className="w-full"
						aria-label="Add direct parameter"
					>
						<Plus className="size-4" aria-hidden />
						<SelectValue placeholder={addPlaceholder} />
					</SelectTrigger>
					<SelectContent
						align="start"
						className="w-[var(--radix-select-trigger-width)]"
					>
						{parameterOptions.map((parameter) => {
							const status = mappedParameters.has(parameter.name)
								? "Mapped"
								: directParameters.has(parameter.name)
									? "Added"
									: "Available";

							return (
								<SelectItem
									key={parameter.name}
									value={parameter.name}
									disabled={status !== "Available"}
									className="[&>span:last-child]:w-full"
								>
									<span className="flex w-full min-w-0 items-center justify-between gap-4">
										<span className="min-w-0">
											<span className="block truncate font-mono">
												{parameter.name}
											</span>
											{parameter.description && (
												<span className="block truncate text-muted-foreground text-xs">
													{parameter.description}
												</span>
											)}
										</span>
										<span className="flex shrink-0 items-center gap-2">
											<span className="text-muted-foreground text-xs">
												{parameter.type}
												{parameter.required
													? " - required"
													: ""}
											</span>
											<Badge
												variant={
													status === "Available"
														? "outline"
														: "secondary"
												}
											>
												{status}
											</Badge>
										</span>
									</span>
								</SelectItem>
							);
						})}
					</SelectContent>
				</Select>
			</Field>

			{value.length === 0 && availableParameters.length > 0 && (
				<div className="rounded-md border border-dashed p-4 text-center text-muted-foreground text-sm">
					No fixed values added.
				</div>
			)}
			{value.length === 0 &&
				parameterOptions.length > 0 &&
				availableParameters.length === 0 && (
					<div className="rounded-md border border-dashed p-4 text-center text-muted-foreground text-sm">
						Every engine parameter is already supplied by Inputs.
					</div>
				)}
			{value.map((row, index) => (
				<div
					key={row.id}
					className="overflow-hidden rounded-md border bg-card"
				>
					<div className="flex items-start justify-between gap-3 border-b bg-muted/30 px-3 py-2">
						<div className="min-w-0 space-y-1">
							<div className="flex flex-wrap items-center gap-2">
								<span className="font-mono font-semibold text-sm">
									{row.key || `Parameter ${index + 1}`}
								</span>
								<Badge variant="outline">
									{DIRECT_PARAMETER_TYPE_LABELS[row.type]}
								</Badge>
							</div>
							{parameterOptions.find(
								(parameter) => parameter.name === row.key,
							)?.description && (
								<p className="text-muted-foreground text-xs">
									{
										parameterOptions.find(
											(parameter) =>
												parameter.name === row.key,
										)?.description
									}
								</p>
							)}
						</div>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							aria-label={`Delete direct parameter ${row.key || index + 1}`}
							onClick={() =>
								onChange(
									value.filter(
										(other) => other.id !== row.id,
									),
								)
							}
							disabled={disabled}
							className="text-destructive hover:text-destructive"
						>
							<Trash2 className="size-4" aria-hidden />
							Delete
						</Button>
					</div>
					<div className="p-3">
						{row.type === "boolean" ? (
							<FormField
								name={`${namePrefix}.${index}.value`}
								render={({ field, fieldState }) => (
									<Field
										orientation="horizontal"
										data-invalid={!!fieldState.error}
									>
										<Switch
											id={`${idPrefix}-param-${index}-value`}
											checked={field.value === "true"}
											onCheckedChange={(checked) =>
												field.onChange(String(checked))
											}
											disabled={disabled}
										/>
										<FieldLabel
											htmlFor={`${idPrefix}-param-${index}-value`}
										>
											Value
										</FieldLabel>
									</Field>
								)}
							/>
						) : row.type.endsWith("-array") ||
							row.type === "json" ? (
							<FormTextarea
								name={`${namePrefix}.${index}.value`}
								label="Value"
								placeholder={
									structuredValueHelp(row.type).placeholder
								}
								description={
									structuredValueHelp(row.type).description
								}
								rows={4}
								disabled={disabled}
							/>
						) : (
							<FormInput
								name={`${namePrefix}.${index}.value`}
								label="Value"
								inputMode={
									row.type === "number"
										? "decimal"
										: undefined
								}
								placeholder={
									row.type === "number"
										? "Value (e.g. 0.8)"
										: "Value"
								}
								disabled={disabled}
							/>
						)}
					</div>
				</div>
			))}
		</div>
	);
};
