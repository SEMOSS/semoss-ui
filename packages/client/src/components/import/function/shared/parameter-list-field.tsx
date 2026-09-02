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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";

const PARAMETER_TYPES = [
	"string",
	"number",
	"integer",
	"boolean",
	"object",
	"array",
];

interface ParameterRow {
	parameterName?: string;
	parameterType?: string;
	parameterDescription?: string;
}

interface ParameterListFieldProps {
	/** Schema field name this is bound to (a ParameterRow[]). */
	name: string;
	/** Label shown above the row list. */
	label: string;
	/** Helper text shown under the row list. */
	description?: string;
	disabled?: boolean;
}

/**
 * Editable list of {name, type, description} rows for a FUNCTION_PARAMETERS
 * metadata field, shared across every connector form that exposes it.
 */
export const ParameterListField = ({
	name,
	label,
	description,
	disabled,
}: ParameterListFieldProps) => {
	const { control } = useFormContext();

	return (
		<FormField
			control={control}
			name={name}
			render={({ field, fieldState: { error } }) => {
				const rows: ParameterRow[] = Array.isArray(field.value)
					? field.value
					: [];
				const updateRow = (
					idx: number,
					patch: Partial<ParameterRow>,
				) => {
					field.onChange(
						rows.map((row, i) =>
							i === idx ? { ...row, ...patch } : row,
						),
					);
				};

				return (
					<Field data-invalid={!!error}>
						<FieldLabel>{label}</FieldLabel>
						<div
							className="flex flex-col gap-2"
							data-testid={`function-form-input-${name}`}
						>
							{rows.length === 0 && (
								<Muted className="text-sm">
									No parameters defined.
								</Muted>
							)}
							{rows.map((row, idx) => (
								<div
									// biome-ignore lint/suspicious/noArrayIndexKey: row order is stable
									key={idx}
									className="flex flex-col gap-2 rounded-md border border-input p-2 sm:flex-row sm:items-start"
								>
									<Input
										className="flex-1"
										placeholder="Name"
										value={row.parameterName ?? ""}
										disabled={disabled}
										onChange={(e) =>
											updateRow(idx, {
												parameterName: e.target.value,
											})
										}
										data-testid={`function-form-input-${name}-name-${idx}`}
									/>
									<Select
										value={row.parameterType || "string"}
										onValueChange={(value) =>
											updateRow(idx, {
												parameterType: value,
											})
										}
										disabled={disabled}
									>
										<SelectTrigger
											className="w-full sm:w-32"
											data-testid={`function-form-input-${name}-type-${idx}`}
										>
											<SelectValue placeholder="Type" />
										</SelectTrigger>
										<SelectContent>
											{PARAMETER_TYPES.map((type) => (
												<SelectItem
													key={type}
													value={type}
												>
													{type}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<Input
										className="flex-1"
										placeholder="Description"
										value={row.parameterDescription ?? ""}
										disabled={disabled}
										onChange={(e) =>
											updateRow(idx, {
												parameterDescription:
													e.target.value,
											})
										}
										data-testid={`function-form-input-${name}-desc-${idx}`}
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
								onClick={() =>
									field.onChange([
										...rows,
										{
											parameterName: "",
											parameterType: "string",
											parameterDescription: "",
										},
									])
								}
								data-testid={`function-form-add-${name}`}
							>
								+ Add parameter
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
