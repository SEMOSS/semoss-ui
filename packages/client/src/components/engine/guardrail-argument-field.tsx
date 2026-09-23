import { useId, useState } from "react";
import {
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
import type { InterceptableMethodArgument } from "./engine-guardrail-settings.constants";

export interface GuardrailArgumentFieldProps {
	/** React Hook Form path for this mapping row's argument list. */
	name: string;

	/** Arguments the rule's method exposes in this phase. Empty falls back to
	 * free text, since the argument names cannot be known for a wildcard rule. */
	options: InterceptableMethodArgument[];

	/** Whether the field accepts edits. */
	disabled?: boolean;

	/** Prefix for this field's test ids. */
	testIdPrefix: string;
}

/** Sentinel for the option that reveals the free-text argument input. */
const CUSTOM_ARGUMENT_OPTION = "__custom-argument__";

const FREE_TEXT_DESCRIPTION =
	"Use the argument name the runtime resolves, such as arg0, or result for the model's return value. A dot path such as arg0.message reads inside a map argument, and several comma separated names are joined before the guardrail runs.";

const PICKER_DESCRIPTION =
	"Several comma separated names are joined before the guardrail runs, and a dot path such as arg0.message reads inside a map argument.";

/**
 * Selects which intercepted argument feeds one guardrail parameter. Offering
 * the engine's own argument names keeps the mapping resolvable, since a name
 * the runtime cannot find leaves the guardrail with nothing to screen.
 */
export const GuardrailArgumentField = ({
	name,
	options,
	disabled,
	testIdPrefix,
}: GuardrailArgumentFieldProps) => {
	// untyped so the caller can pass an arbitrary mapping row path
	const { control } = useFormContext();
	const selectId = useId();
	const customId = useId();
	const [showCustom, setShowCustom] = useState(false);

	if (options.length === 0) {
		return (
			<FormInput
				name={name}
				label="Reads from"
				placeholder="Argument name, such as arg0"
				description={FREE_TEXT_DESCRIPTION}
				disabled={disabled}
				data-testid={`${testIdPrefix}-args`}
			/>
		);
	}

	return (
		<FormField
			control={control}
			name={name}
			render={({ field, fieldState }) => {
				const current = String(field.value ?? "");
				const trimmed = current.trim();
				const matched = options.find(
					(option) => option.name === trimmed,
				);
				const isCustom = showCustom || (!!trimmed && !matched);

				return (
					<Field data-invalid={!!fieldState.error}>
						<FieldLabel htmlFor={selectId}>Reads from</FieldLabel>
						<Select
							value={isCustom ? CUSTOM_ARGUMENT_OPTION : trimmed}
							onValueChange={(next) => {
								// the hidden native select Radix adds for the
								// surrounding form reports an empty value while
								// the option list is unmounted, and no option
								// here is empty
								if (!next) {
									return;
								}
								if (next === CUSTOM_ARGUMENT_OPTION) {
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
								data-testid={`${testIdPrefix}-args`}
							>
								<SelectValue placeholder="Select the argument to read" />
							</SelectTrigger>
							<SelectContent>
								{options.map((option) => (
									<SelectItem
										key={option.name}
										value={option.name}
									>
										<span className="flex w-full min-w-0 items-center justify-between gap-4">
											<span className="truncate font-mono">
												{option.name}
											</span>
											<span className="shrink-0 text-muted-foreground text-xs">
												{option.type}
												{option.guardable
													? ""
													: " - not screenable text"}
											</span>
										</span>
									</SelectItem>
								))}
								<SelectItem value={CUSTOM_ARGUMENT_OPTION}>
									Another argument or a dot path...
								</SelectItem>
							</SelectContent>
						</Select>

						{isCustom && (
							<>
								<FieldLabel htmlFor={customId}>
									Argument name
								</FieldLabel>
								<Input
									id={customId}
									value={current}
									onChange={(event) =>
										field.onChange(event.target.value)
									}
									onBlur={field.onBlur}
									placeholder="Argument name(s), such as arg0 or arg0.message"
									disabled={disabled}
									aria-invalid={!!fieldState.error}
									data-testid={`${testIdPrefix}-args-custom`}
								/>
							</>
						)}

						<FieldDescription>
							{isCustom
								? FREE_TEXT_DESCRIPTION
								: PICKER_DESCRIPTION}
						</FieldDescription>
						{fieldState.error?.message && (
							<FieldError>{fieldState.error.message}</FieldError>
						)}
					</Field>
				);
			}}
		/>
	);
};
