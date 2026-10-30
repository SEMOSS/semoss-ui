import { useId } from "react";
import { type Engine, EngineSelect, EngineSubtypeIcon } from "@semoss/shared";
import { Field, FieldDescription, FieldLabel } from "@semoss/ui/next";

/** What the picker reads when no default is chosen. */
const NO_DEFAULT_LABEL = "No default";

/** Props for {@link DefaultModelField}. */
export interface DefaultModelFieldProps {
	/** The field's label, such as Text Generation Model. */
	label: string;
	/** What the default is used for, shown under the picker. */
	description: string;
	/** The chosen model's engine id, or empty when there is no default. */
	value: string;
	/** Called with the chosen model's engine id, or empty to remove the default. */
	onChange: (engineId: string) => void;
	/** The models the user can choose from. */
	engines: Engine[];
	/** Whether the models are still being read. */
	isLoading: boolean;
	/** Whether the picker is locked, such as when the models could not be read. */
	disabled?: boolean;
}

/**
 * One of the user's default models: the shared EngineSelect over the models
 * they can use, each with its logo, name and id, with No default first to
 * remove it. A default the list no longer offers is kept, marked unavailable,
 * so it can still be seen and removed.
 */
export const DefaultModelField = ({
	label,
	description,
	value,
	onChange,
	engines,
	isLoading,
	disabled = false,
}: DefaultModelFieldProps) => {
	const id = useId();
	const descriptionId = `${id}-description`;
	const selected = engines.find((engine) => engine.engine_id === value);
	const isUnavailable = !isLoading && !!value && !selected;

	let name = NO_DEFAULT_LABEL;
	if (isLoading) {
		name = "Loading models...";
	} else if (selected) {
		name = selected.engine_display_name || selected.engine_name;
	} else if (value) {
		name = value;
	}

	return (
		<Field>
			<FieldLabel htmlFor={id}>{label}</FieldLabel>
			<EngineSelect
				id={id}
				name={name}
				value={value}
				onChange={(engine) => onChange(engine.engine_id)}
				engines={engines}
				noneOption={{
					label: NO_DEFAULT_LABEL,
					onSelect: () => onChange(""),
				}}
				unavailable={
					isUnavailable
						? {
								engine: {
									engine_id: value,
									engine_name: value,
									engine_type: "MODEL",
								},
								note: "No longer available to you",
							}
						: undefined
				}
				showEngineId
				triggerIcon={
					selected ? (
						<EngineSubtypeIcon
							engineType="MODEL"
							engineSubtype={selected.engine_subtype}
							alt=""
							className="size-5 shrink-0 object-contain"
						/>
					) : undefined
				}
				popoverContentProps={{ align: "start" }}
				disabled={disabled || isLoading}
				aria-describedby={descriptionId}
			/>
			<FieldDescription id={descriptionId}>
				{description}
			</FieldDescription>
		</Field>
	);
};
