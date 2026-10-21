import { usePixel } from "@semoss/sdk/react";
import type { Engine } from "@semoss/shared";
import { EngineSelect } from "@semoss/shared";
import {
	Field,
	FieldLabel,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";

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
	/** When true, the picker is locked to its current selection */
	disabled?: boolean;
	/** Optional exact engine subtypes accepted by this node. */
	allowedEngineSubtypes?: string[];
	/** Optional engine subtypes that this node cannot execute. */
	excludedEngineSubtypes?: string[];
}

export function EnginePickerField({
	label,
	name,
	value,
	engineTypes,
	onChange,
	required = false,
	disabled = false,
	allowedEngineSubtypes,
	excludedEngineSubtypes,
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
	const subtypeRestricted = Boolean(
		allowedEngineSubtypes?.length || excludedEngineSubtypes?.length,
	);
	const { data: subtypeEngines } = usePixel<Engine[]>(
		subtypeRestricted
			? `META | MyEngines(engineTypes=${JSON.stringify(engineTypes)}, limit=[1000], offset=[0]);`
			: "",
		{ data: [] },
	);
	const selectableEngines = subtypeEngines.filter((engine) => {
		const subtype = engine.engine_subtype ?? "";
		if (
			allowedEngineSubtypes?.length &&
			!allowedEngineSubtypes.includes(subtype)
		) {
			return false;
		}
		return !excludedEngineSubtypes?.includes(subtype);
	});

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
			{subtypeRestricted ? (
				<Select
					value={value}
					onValueChange={(engineId) => {
						const engine = selectableEngines.find(
							(candidate) => candidate.engine_id === engineId,
						);
						if (engine) onChange(engine);
					}}
					disabled={disabled}
				>
					<SelectTrigger>
						<SelectValue
							placeholder={name || resolvedName || "Select"}
						/>
					</SelectTrigger>
					<SelectContent>
						{selectableEngines.map((engine) => (
							<SelectItem
								key={engine.engine_id}
								value={engine.engine_id}
							>
								{engine.engine_display_name ||
									engine.engine_name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			) : (
				<EngineSelect
					name={name || resolvedName || value}
					value={value}
					engineTypes={engineTypes}
					onChange={onChange}
					disabled={disabled}
				/>
			)}
		</Field>
	);
}
