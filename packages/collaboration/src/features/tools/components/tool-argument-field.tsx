import { useId } from "react";
import {
	Field,
	FieldDescription,
	FieldLabel,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import type { ToolProperty } from "../api/use-tool-definition";

interface ToolArgumentFieldProps {
	name: string;
	property: ToolProperty;
	value: unknown;
	required: boolean;
	disabled: boolean;
	onChange: (value: unknown) => void;
}

/** A typed argument control; clearing an optional field removes it from the request. */
export function ToolArgumentField({
	name,
	property,
	value,
	required,
	disabled,
	onChange,
}: ToolArgumentFieldProps) {
	const id = useId();
	const helpId = `${id}-help`;
	const numeric = property.type === "number" || property.type === "integer";
	const options =
		property.type === "boolean" ? ["true", "false"] : property.enum;
	return (
		<Field>
			<FieldLabel htmlFor={id}>
				{name}
				{required ? " (required)" : " (optional)"}
			</FieldLabel>
			{options ? (
				<Select
					value={
						value === undefined ? "unset" : `value:${String(value)}`
					}
					disabled={disabled}
					onValueChange={(next) =>
						onChange(
							next === "unset"
								? undefined
								: property.type === "boolean"
									? next === "value:true"
									: next.slice("value:".length),
						)
					}
				>
					<SelectTrigger
						id={id}
						aria-describedby={
							property.description ? helpId : undefined
						}
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="unset">Not set</SelectItem>
						{options.map((option) => (
							<SelectItem key={option} value={`value:${option}`}>
								{option || "Empty text"}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			) : (
				<Input
					id={id}
					aria-describedby={property.description ? helpId : undefined}
					required={required}
					disabled={disabled}
					type={numeric ? "number" : "text"}
					step={property.type === "integer" ? 1 : "any"}
					min={property.minimum}
					max={property.maximum}
					minLength={property.minLength}
					maxLength={property.maxLength}
					value={
						typeof value === "string" || typeof value === "number"
							? value
							: ""
					}
					onChange={(event) =>
						onChange(
							numeric
								? event.target.value === ""
									? undefined
									: event.target.valueAsNumber
								: event.target.value === "" && !required
									? undefined
									: event.target.value,
						)
					}
				/>
			)}
			{property.description && (
				<FieldDescription id={helpId}>
					{property.description}
				</FieldDescription>
			)}
		</Field>
	);
}
