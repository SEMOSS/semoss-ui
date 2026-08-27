import { usePixel } from "@semoss/sdk/react";
import type { Engine } from "@semoss/shared";
import { EngineSelect } from "@semoss/shared";
import { Field, FieldLabel } from "@semoss/ui/next";

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
	// Workflow JSON persists the stable engine ID, not a display label that can
	// become stale. Resolve the label from the current user's accessible catalog
	// when reopening an existing node.
	const { data: selectedEngines } = usePixel<Engine[]>(
		value && !name
			? `META | MyEngines(engine=${JSON.stringify([value])}, engineTypes=${JSON.stringify(engineTypes)});`
			: "",
		{ data: [] },
	);
	const resolvedName = selectedEngines[0]
		? selectedEngines[0].engine_display_name ||
			selectedEngines[0].engine_name
		: "";

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
			<EngineSelect
				name={name || resolvedName || value}
				value={value}
				engineTypes={engineTypes}
				onChange={onChange}
			/>
		</Field>
	);
}
