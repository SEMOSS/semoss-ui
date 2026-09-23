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
import {
	GUARDRAIL_ALL_METHODS,
	type GuardrailConfigFormValue,
	type InterceptableMethod,
} from "./engine-guardrail-settings.constants";

export interface GuardrailMethodFieldProps {
	/** React Hook Form path for this rule's method field. */
	name: `pipelines.${number}.method`;

	/** Methods the engine reports as interceptable. Empty falls back to free text. */
	methods: InterceptableMethod[];

	/** Methods already claimed by another rule, listed but not selectable since
	 * two rules cannot cover the same call. */
	takenMethods?: string[];

	/** Whether the field accepts edits. */
	disabled?: boolean;

	/** Prefix for this field's test ids. */
	testIdPrefix: string;

	/** Class applied to the wrapping field. */
	className?: string;
}

/** Sentinel for the option that reveals the free-text method input. */
const CUSTOM_METHOD_OPTION = "__custom-method__";

const methodSignature = (method: InterceptableMethod): string =>
	`${method.name}(${method.arguments.map((argument) => argument.type).join(", ")})`;

/**
 * Picks the engine call a rule applies to. Choosing from the engine's reported
 * methods keeps the stored name one the runtime resolves, while the custom
 * option covers calls the engine exposes through another interface.
 *
 * The trigger stays a single line whatever is selected, so switching between
 * rules does not change the height of the panel.
 */
export const GuardrailMethodField = ({
	name,
	methods,
	takenMethods = [],
	disabled,
	testIdPrefix,
	className,
}: GuardrailMethodFieldProps) => {
	const { control } = useFormContext<GuardrailConfigFormValue>();
	const selectId = useId();
	const customId = useId();
	const [showCustom, setShowCustom] = useState(false);

	if (methods.length === 0) {
		return (
			<FormInput
				className={className}
				name={name}
				label="Applies to"
				placeholder="Method name, or * for all calls"
				description="Enter the Java method name, such as askRoom, or * to apply this rule to every call."
				disabled={disabled}
				data-testid={`${testIdPrefix}-method`}
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
				const isAllCalls = trimmed === GUARDRAIL_ALL_METHODS;
				const matched = methods.find(
					(method) => method.name === trimmed,
				);
				const isCustom = showCustom || (!isAllCalls && !matched);
				const taken = new Set(
					takenMethods.map((method) => method.trim()).filter(Boolean),
				);

				return (
					<Field
						data-invalid={!!fieldState.error}
						className={className}
					>
						<FieldLabel htmlFor={selectId}>Applies to</FieldLabel>
						<Select
							value={isCustom ? CUSTOM_METHOD_OPTION : trimmed}
							onValueChange={(next) => {
								// the hidden native select Radix adds for the
								// surrounding form reports an empty value while
								// the option list is unmounted, and no option
								// here is empty
								if (!next) {
									return;
								}
								if (next === CUSTOM_METHOD_OPTION) {
									setShowCustom(true);
									field.onChange("");
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
								data-testid={`${testIdPrefix}-method`}
							>
								<SelectValue placeholder="Select the calls this rule applies to" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem
									value={GUARDRAIL_ALL_METHODS}
									disabled={taken.has(GUARDRAIL_ALL_METHODS)}
								>
									<span className="flex w-full items-center justify-between gap-6">
										<span className="truncate font-mono">
											{GUARDRAIL_ALL_METHODS}
										</span>
										<span className="shrink-0 text-muted-foreground text-xs">
											{taken.has(GUARDRAIL_ALL_METHODS)
												? "already covered"
												: "every call with no rule of its own"}
										</span>
									</span>
								</SelectItem>
								{methods.map((method) => {
									const isTaken = taken.has(method.name);
									return (
										<SelectItem
											key={method.name}
											value={method.name}
											disabled={isTaken}
										>
											<span className="flex w-full items-center justify-between gap-6">
												<span className="truncate font-mono">
													{method.name}
												</span>
												<span className="shrink-0 text-muted-foreground text-xs">
													{isTaken
														? "already covered"
														: method.deprecated
															? "deprecated"
															: ""}
												</span>
											</span>
										</SelectItem>
									);
								})}
								<SelectItem value={CUSTOM_METHOD_OPTION}>
									Another method...
								</SelectItem>
							</SelectContent>
						</Select>

						{isCustom && (
							<Input
								id={customId}
								value={current}
								onChange={(event) =>
									field.onChange(event.target.value)
								}
								onBlur={field.onBlur}
								placeholder="Java method name, such as askRoom"
								aria-label="Method name"
								disabled={disabled}
								aria-invalid={!!fieldState.error}
								data-testid={`${testIdPrefix}-method-custom`}
							/>
						)}

						{/* the reserved line keeps the field one height whatever is
						    selected, so switching rules does not shift what follows */}
						<FieldDescription
							className="min-h-4 truncate font-mono text-xs"
							title={
								matched ? methodSignature(matched) : undefined
							}
						>
							{matched
								? methodSignature(matched)
								: isAllCalls
									? "Any call with no rule of its own"
									: null}
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
