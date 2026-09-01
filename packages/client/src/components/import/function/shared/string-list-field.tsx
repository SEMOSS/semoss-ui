import { X } from "lucide-react";
import { useFormContext } from "react-hook-form";
import {
	Button,
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
	FormField,
	Input,
	Muted,
} from "@semoss/ui/next";

interface StringListFieldProps {
	/** Schema field name this is bound to (a string[]). */
	name: string;
	/** Label shown above the row list. */
	label: string;
	/** Helper text shown under the row list. */
	description?: string;
	disabled?: boolean;
}

/**
 * Editable list of plain strings for a FUNCTION_REQUIRED_PARAMETERS metadata
 * field, shared across every connector form that exposes it.
 */
export const StringListField = ({
	name,
	label,
	description,
	disabled,
}: StringListFieldProps) => {
	const { control } = useFormContext();

	return (
		<FormField
			control={control}
			name={name}
			render={({ field, fieldState: { error } }) => {
				const rows: string[] = Array.isArray(field.value)
					? field.value
					: [];

				return (
					<Field data-invalid={!!error}>
						<FieldLabel>{label}</FieldLabel>
						<div
							className="flex flex-col gap-2"
							data-testid={`function-form-input-${name}`}
						>
							{rows.length === 0 && (
								<Muted className="text-sm">
									No required parameters defined.
								</Muted>
							)}
							{rows.map((row, idx) => (
								<div
									// biome-ignore lint/suspicious/noArrayIndexKey: row order is stable
									key={idx}
									className="flex items-center gap-2"
								>
									<Input
										className="flex-1"
										placeholder="Parameter name"
										value={row}
										disabled={disabled}
										onChange={(e) =>
											field.onChange(
												rows.map((r, i) =>
													i === idx
														? e.target.value
														: r,
												),
											)
										}
										data-testid={`function-form-input-${name}-${idx}`}
									/>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										disabled={disabled}
										onClick={() =>
											field.onChange(
												rows.filter(
													(_, i) => i !== idx,
												),
											)
										}
										data-testid={`function-form-remove-${name}-${idx}`}
									>
										<X className="size-4" />
									</Button>
								</div>
							))}
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="self-start"
								disabled={disabled}
								onClick={() => field.onChange([...rows, ""])}
								data-testid={`function-form-add-${name}`}
							>
								+ Add required parameter
							</Button>
						</div>
						{error ? (
							<FieldError>{error.message}</FieldError>
						) : (
							description && (
								<FieldDescription>
									{description}
								</FieldDescription>
							)
						)}
					</Field>
				);
			}}
		/>
	);
};
