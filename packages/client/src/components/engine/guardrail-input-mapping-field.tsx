import { Plus, X } from "lucide-react";
import { Button, FieldDescription, FieldLabel, Input } from "@semoss/ui/next";
import {
	createGuardrailMappingEntry,
	type GuardrailMappingEntryFormValue,
} from "./engine-guardrail-settings.constants";

export interface GuardrailInputMappingFieldProps {
	value: GuardrailMappingEntryFormValue[];
	onChange: (next: GuardrailMappingEntryFormValue[]) => void;
	disabled?: boolean;
	idPrefix: string;
	/** Set when masking is on - the row mapping this parameter must resolve
	 * to a single argument or the runtime blocks instead of masking. */
	maskTargetParam?: string | null;
}

/**
 * Editor for a guardrail entry's inputMapping: rows of guardrail parameter
 * name to the intercepted method argument name(s) that feed it. Multiple
 * comma-separated arguments are concatenated by the runtime.
 */
export const GuardrailInputMappingField = ({
	value,
	onChange,
	disabled,
	idPrefix,
	maskTargetParam,
}: GuardrailInputMappingFieldProps) => {
	const updateRow = (
		rowId: string,
		partial: Partial<GuardrailMappingEntryFormValue>,
	) =>
		onChange(
			value.map((row) =>
				row.id === rowId ? { ...row, ...partial } : row,
			),
		);

	const rowHasMaskConflict = (row: GuardrailMappingEntryFormValue) =>
		!!maskTargetParam &&
		row.key.trim() === maskTargetParam &&
		row.args.split(",").filter((arg) => arg.trim()).length > 1;

	return (
		<div className="space-y-2">
			<FieldLabel htmlFor={`${idPrefix}-mapping-0-key`}>
				Parameter Mapping
			</FieldLabel>
			{value.map((row, index) => (
				<div key={row.id} className="space-y-1">
					<div className="flex items-center gap-2">
						<Input
							id={`${idPrefix}-mapping-${index}-key`}
							placeholder="Guardrail parameter (e.g. prompt)"
							value={row.key}
							onChange={(event) =>
								updateRow(row.id, { key: event.target.value })
							}
							disabled={disabled}
						/>
						<Input
							id={`${idPrefix}-mapping-${index}-args`}
							placeholder="Argument name(s), comma separated (e.g. arg0)"
							value={row.args}
							onChange={(event) =>
								updateRow(row.id, { args: event.target.value })
							}
							disabled={disabled}
						/>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							aria-label="Remove parameter mapping"
							onClick={() =>
								onChange(
									value.filter(
										(other) => other.id !== row.id,
									),
								)
							}
							disabled={disabled}
						>
							<X className="h-4 w-4" />
						</Button>
					</div>
					{rowHasMaskConflict(row) && (
						<p
							className="text-destructive text-xs"
							data-testid={`${idPrefix}-mapping-${index}-mask-conflict`}
						>
							Masking needs this parameter mapped to a single
							argument - with several the guardrail blocks instead
							of masking.
						</p>
					)}
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
				<Plus className="h-4 w-4" />
				Add Mapping
			</Button>
			<FieldDescription>
				Maps each guardrail parameter to the intercepted method argument
				that feeds it - use arg0 for the method's first argument, or
				result (output phase) for the model's response. Several
				comma-separated arguments are concatenated before the guardrail
				runs.
			</FieldDescription>
		</div>
	);
};
