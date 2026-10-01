import { useId } from "react";
import { EngineSelect } from "@semoss/shared";
import {
	Field,
	FieldError,
	FieldLabel,
	FormField,
	useFormContext,
} from "@semoss/ui/next";

export interface GuardrailEngineFieldProps {
	/** React Hook Form path for this check's guardrail engine id. */
	name: string;

	/** Display name of the selected engine, resolved by the caller. */
	engineName: string;

	/** Records the display name of a newly picked engine so it can be shown
	 * without refetching the configuration. */
	onEngineResolved: (engineId: string, engineName: string) => void;

	/** Whether the field accepts edits. */
	disabled?: boolean;

	/** Prefix for this field's test ids. */
	testIdPrefix: string;
}

/**
 * Picks the guardrail engine a check runs. Uses the shared engine select so
 * the options carry the same icon, name, and id as every other engine picker,
 * and so a long guardrail catalog stays searchable.
 */
export const GuardrailEngineField = ({
	name,
	engineName,
	onEngineResolved,
	disabled,
	testIdPrefix,
}: GuardrailEngineFieldProps) => {
	// untyped so the caller can pass an arbitrary check path
	const { control } = useFormContext();
	const fieldId = useId();

	return (
		<FormField
			control={control}
			name={name}
			render={({ field, fieldState }) => (
				<Field
					data-invalid={!!fieldState.error}
					data-testid={`${testIdPrefix}-engine`}
				>
					<FieldLabel htmlFor={fieldId}>Check with</FieldLabel>
					<EngineSelect
						className="h-9 w-full max-w-none justify-start border border-input px-3 shadow-xs"
						name={engineName}
						value={String(field.value ?? "")}
						engineTypes={["GUARDRAIL"]}
						showEngineId
						disabled={disabled}
						onChange={(engine) => {
							field.onChange(engine.engine_id);
							onEngineResolved(
								engine.engine_id,
								engine.engine_display_name ||
									engine.engine_name,
							);
						}}
						popoverContentProps={{ align: "start" }}
					/>
					{fieldState.error?.message && (
						<FieldError>{fieldState.error.message}</FieldError>
					)}
				</Field>
			)}
		/>
	);
};
