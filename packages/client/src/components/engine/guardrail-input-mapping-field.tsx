import { Plus, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import {
	Button,
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
	FormField,
	FormInput,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	useFormContext,
} from "@semoss/ui/next";
import {
	createGuardrailMappingEntry,
	type GuardrailMappingEntryFormValue,
	type InterceptableMethodArgument,
} from "./engine-guardrail-settings.constants";
import { GuardrailArgumentField } from "./guardrail-argument-field";
import type {
	GuardrailParameterOption,
	GuardrailParametersStatus,
} from "./guardrail-engine-parameters";

export interface GuardrailInputMappingFieldProps {
	/** Mapping rows currently held for this check. */
	value: GuardrailMappingEntryFormValue[];

	/** Replaces the mapping rows. */
	onChange: (next: GuardrailMappingEntryFormValue[]) => void;

	/** Parameters the selected guardrail engine declares. */
	parameterOptions: GuardrailParameterOption[];

	/** Load state of the guardrail engine's parameters. */
	parametersStatus: GuardrailParametersStatus;

	/** Arguments the rule's method exposes in this phase. */
	argumentOptions: InterceptableMethodArgument[];

	/** Whether the fields accept edits. */
	disabled?: boolean;

	/** Prefix for this field's test ids. */
	testIdPrefix: string;

	/** React Hook Form path for this mapping array. */
	namePrefix: string;
}

/** Sentinel for the option that reveals the free-text parameter input. */
const CUSTOM_PARAMETER_OPTION = "__custom-parameter__";

/**
 * Editor for a check's inputMapping: each row names a guardrail parameter and
 * the intercepted argument that feeds it. Multiple comma-separated arguments
 * are concatenated by the runtime.
 */
export const GuardrailInputMappingField = ({
	value,
	onChange,
	parameterOptions,
	parametersStatus,
	argumentOptions,
	disabled,
	testIdPrefix,
	namePrefix,
}: GuardrailInputMappingFieldProps) => {
	return (
		<div className="space-y-2">
			<FieldLabel>Inputs</FieldLabel>
			<FieldDescription>
				Each row hands one guardrail parameter the value of an
				intercepted argument. A check with no inputs receives nothing to
				screen, so at least one row is required.
			</FieldDescription>
			{value.map((row, index) => (
				<div key={row.id} className="space-y-3 rounded-md border p-3">
					<div className="flex items-center justify-between gap-2">
						<p className="font-medium text-sm">Input {index + 1}</p>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() =>
								onChange(
									value.filter(
										(other) => other.id !== row.id,
									),
								)
							}
							disabled={disabled || value.length === 1}
							aria-label={`Delete mapping ${index + 1}`}
							title={
								value.length === 1
									? "At least one mapping is required"
									: `Delete mapping ${index + 1}`
							}
						>
							<Trash2 className="size-4" aria-hidden />
							Delete mapping
						</Button>
					</div>
					<div className="grid items-start gap-3 sm:grid-cols-2">
						<GuardrailParameterNameField
							name={`${namePrefix}.${index}.key`}
							parameterOptions={parameterOptions}
							parametersStatus={parametersStatus}
							takenNames={value
								.filter((other) => other.id !== row.id)
								.map((other) => other.key.trim())}
							disabled={disabled}
							testIdPrefix={`${testIdPrefix}-mapping-${index}`}
						/>
						<GuardrailArgumentField
							name={`${namePrefix}.${index}.args`}
							options={argumentOptions}
							disabled={disabled}
							testIdPrefix={`${testIdPrefix}-mapping-${index}`}
						/>
					</div>
				</div>
			))}
			<Button
				type="button"
				variant="outline"
				size="sm"
				className="w-fit"
				onClick={() =>
					onChange([...value, createGuardrailMappingEntry()])
				}
				disabled={disabled}
			>
				<Plus className="size-4" aria-hidden />
				Add Input
			</Button>
		</div>
	);
};

interface GuardrailParameterNameFieldProps {
	name: string;
	parameterOptions: GuardrailParameterOption[];
	parametersStatus: GuardrailParametersStatus;
	/** Parameter names already used by the check's other rows. */
	takenNames: string[];
	disabled?: boolean;
	testIdPrefix: string;
}

/** Names the guardrail parameter a row feeds, offering the engine's declared
 * parameters so a misspelled name does not leave the guardrail without it. */
const GuardrailParameterNameField = ({
	name,
	parameterOptions,
	parametersStatus,
	takenNames,
	disabled,
	testIdPrefix,
}: GuardrailParameterNameFieldProps) => {
	// untyped so the caller can pass an arbitrary mapping row path
	const { control } = useFormContext();
	const selectId = useId();
	const customId = useId();
	const [showCustom, setShowCustom] = useState(false);

	if (parametersStatus !== "loaded" || parameterOptions.length === 0) {
		return (
			<FormInput
				name={name}
				label="Guardrail parameter"
				placeholder="Guardrail parameter, such as prompt"
				description={
					parametersStatus === "loading"
						? "Loading the parameters this guardrail declares."
						: parametersStatus === "no-engine"
							? "Select a guardrail engine to list its parameters."
							: "The guardrail's parameters could not be listed, so enter the name it reads."
				}
				disabled={disabled}
				data-testid={`${testIdPrefix}-key`}
			/>
		);
	}

	const taken = new Set(takenNames);

	return (
		<FormField
			control={control}
			name={name}
			render={({ field, fieldState }) => {
				const current = String(field.value ?? "");
				const trimmed = current.trim();
				const matched = parameterOptions.some(
					(option) => option.name === trimmed,
				);
				const isCustom = showCustom || (!!trimmed && !matched);

				return (
					<Field data-invalid={!!fieldState.error}>
						<FieldLabel htmlFor={selectId}>
							Guardrail parameter
						</FieldLabel>
						<Select
							value={isCustom ? CUSTOM_PARAMETER_OPTION : trimmed}
							onValueChange={(next) => {
								// the hidden native select Radix adds for the
								// surrounding form reports an empty value while
								// the option list is unmounted, and no option
								// here is empty
								if (!next) {
									return;
								}
								if (next === CUSTOM_PARAMETER_OPTION) {
									setShowCustom(true);
									return;
								}
								setShowCustom(false);
								field.onChange(next);
							}}
							disabled={disabled}
						>
							<SelectTrigger
								id={selectId}
								className="w-full"
								aria-invalid={!!fieldState.error}
								data-testid={`${testIdPrefix}-key`}
							>
								<SelectValue placeholder="Select the parameter to fill" />
							</SelectTrigger>
							<SelectContent>
								{parameterOptions.map((option) => (
									<SelectItem
										key={option.name}
										value={option.name}
										disabled={
											option.name !== trimmed &&
											taken.has(option.name)
										}
									>
										<span className="flex w-full min-w-0 items-center justify-between gap-4">
											<span className="truncate font-mono">
												{option.name}
											</span>
											<span className="shrink-0 text-muted-foreground text-xs">
												{option.type}
												{option.required
													? " - required"
													: ""}
											</span>
										</span>
									</SelectItem>
								))}
								<SelectItem value={CUSTOM_PARAMETER_OPTION}>
									Another parameter...
								</SelectItem>
							</SelectContent>
						</Select>

						{isCustom && (
							<>
								<FieldLabel htmlFor={customId}>
									Parameter name
								</FieldLabel>
								<Input
									id={customId}
									value={current}
									onChange={(event) =>
										field.onChange(event.target.value)
									}
									onBlur={field.onBlur}
									placeholder="Parameter name, such as prompt"
									disabled={disabled}
									aria-invalid={!!fieldState.error}
									data-testid={`${testIdPrefix}-key-custom`}
								/>
							</>
						)}

						{fieldState.error?.message && (
							<FieldError>{fieldState.error.message}</FieldError>
						)}
					</Field>
				);
			}}
		/>
	);
};
