import { Plus, X } from "lucide-react";
import {
	Button,
	FieldDescription,
	FieldLabel,
	Input,
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

export interface GuardrailDirectParametersFieldProps {
	value: GuardrailDirectParamFormValue[];
	onChange: (next: GuardrailDirectParamFormValue[]) => void;
	disabled?: boolean;
	idPrefix: string;
}

/**
 * Editor for a guardrail entry's directParameters: literal values (e.g. a
 * threshold) passed straight to the guardrail engine on every call.
 */
export const GuardrailDirectParametersField = ({
	value,
	onChange,
	disabled,
	idPrefix,
}: GuardrailDirectParametersFieldProps) => {
	const updateRow = (
		rowId: string,
		partial: Partial<GuardrailDirectParamFormValue>,
	) =>
		onChange(
			value.map((row) =>
				row.id === rowId ? { ...row, ...partial } : row,
			),
		);

	return (
		<div className="space-y-2">
			<FieldLabel htmlFor={`${idPrefix}-param-0-key`}>
				Direct Parameters
			</FieldLabel>
			{value.map((row, index) => (
				<div key={row.id} className="flex items-center gap-2">
					<Input
						id={`${idPrefix}-param-${index}-key`}
						placeholder="Parameter name (e.g. threshold)"
						value={row.key}
						onChange={(event) =>
							updateRow(row.id, { key: event.target.value })
						}
						disabled={disabled}
					/>
					<Select
						value={row.type}
						onValueChange={(type) =>
							updateRow(row.id, {
								type: type as GuardrailDirectParamFormValue["type"],
								// a stale value makes no sense across types
								value: type === "boolean" ? "false" : "",
							})
						}
						disabled={disabled}
					>
						<SelectTrigger
							id={`${idPrefix}-param-${index}-type`}
							className="w-32 shrink-0"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="string">String</SelectItem>
							<SelectItem value="number">Number</SelectItem>
							<SelectItem value="boolean">Boolean</SelectItem>
						</SelectContent>
					</Select>
					{row.type === "boolean" ? (
						<div className="flex flex-1 justify-start">
							<Switch
								id={`${idPrefix}-param-${index}-value`}
								checked={row.value === "true"}
								onCheckedChange={(checked) =>
									updateRow(row.id, {
										value: String(checked),
									})
								}
								disabled={disabled}
							/>
						</div>
					) : (
						<Input
							id={`${idPrefix}-param-${index}-value`}
							inputMode={
								row.type === "number" ? "decimal" : undefined
							}
							placeholder={
								row.type === "number"
									? "Value (e.g. 0.8)"
									: "Value"
							}
							value={row.value}
							onChange={(event) =>
								updateRow(row.id, { value: event.target.value })
							}
							disabled={disabled}
						/>
					)}
					<Button
						type="button"
						variant="ghost"
						size="icon"
						aria-label="Remove direct parameter"
						onClick={() =>
							onChange(
								value.filter((other) => other.id !== row.id),
							)
						}
						disabled={disabled}
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
			))}
			<Button
				type="button"
				variant="outline"
				size="sm"
				className="w-fit"
				onClick={() =>
					onChange([...value, createGuardrailDirectParam()])
				}
				disabled={disabled}
			>
				<Plus className="h-4 w-4" />
				Add Parameter
			</Button>
			<FieldDescription>
				Literal values passed to the guardrail engine on every call,
				such as a detection threshold.
			</FieldDescription>
		</div>
	);
};
