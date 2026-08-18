import type { Engine } from "@semoss/shared";
import { Field, FieldLabel } from "@semoss/ui/next";
import { AutomationEngineSelect } from "./engine-select";

export interface EnginePickerFieldProps {
	/** Field label shown above the engine picker */
	label: string;
	/** Currently selected engine's display name */
	name: string;
	/** Currently selected engine ID */
	value: string;
	/** Engine types to filter the picker to (e.g. ["DATABASE"]) */
	engineTypes: Engine["engine_type"][];
	/** Called with the full engine object when the user selects an engine */
	onChange: (e: Engine) => void;
	/** Whether a selected engine is required before the automation can run */
	required?: boolean;
}

export function EnginePickerField({
	label,
	name,
	value,
	engineTypes,
	onChange,
	required = false,
}: EnginePickerFieldProps) {
	return (
		<Field>
			<FieldLabel>
				{label}
				{required && (
					<span className="ml-1 text-destructive" aria-hidden>
						*
					</span>
				)}
			</FieldLabel>
			<AutomationEngineSelect
				name={name}
				value={value}
				engineTypes={engineTypes}
				onChange={onChange}
			/>
		</Field>
	);
}
