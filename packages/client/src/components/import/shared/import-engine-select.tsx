import { type Ref, useState } from "react";
import { type Engine, EngineSelect, EngineSubtypeIcon } from "@semoss/shared";

/** Props for {@link ImportEngineSelect}. */
export interface ImportEngineSelectProps {
	/** Associates the field's label with the picker. */
	id: string;
	/** Focuses the picker, as a form does for a field with a problem. */
	ref?: Ref<HTMLButtonElement>;
	/** The chosen engine's id, or empty before one is chosen. */
	value: string;
	/** Called with the chosen engine's id. */
	onChange: (engineId: string) => void;
	/** The engine types the field offers, such as MODEL. */
	engineTypes: Engine["engine_type"][];
	/** Metadata the offered engines must have, such as [{ tag: "embeddings" }]. */
	metaFilters?: unknown[];
	/** Shown in the picker before an engine is chosen. */
	placeholder: string;
	/** Whether the picker is locked. */
	disabled?: boolean;
	/** Whether the field has a problem, for assistive technology. */
	"aria-invalid"?: boolean;
}

/**
 * An import form's engine field: the shared EngineSelect over the user's
 * engines of the field's types, each with its logo, its name and its id. The
 * form keeps only the engine's id, so the picker remembers the chosen engine
 * to show its name and logo.
 */
export const ImportEngineSelect = ({
	id,
	ref,
	value,
	onChange,
	engineTypes,
	metaFilters,
	placeholder,
	disabled = false,
	"aria-invalid": ariaInvalid,
}: ImportEngineSelectProps) => {
	const [chosen, setChosen] = useState<Engine | null>(null);
	// a value the form set some other way shows by its id until one is picked
	const shown = chosen?.engine_id === value ? chosen : null;

	return (
		<EngineSelect
			ref={ref}
			id={id}
			className="bg-background"
			name={
				shown
					? shown.engine_display_name || shown.engine_name
					: value || placeholder
			}
			value={value}
			onChange={(engine) => {
				setChosen(engine);
				onChange(engine.engine_id);
			}}
			engineTypes={engineTypes}
			metaFilters={metaFilters}
			showEngineId
			triggerIcon={
				shown ? (
					<EngineSubtypeIcon
						engineType={shown.engine_type}
						engineSubtype={shown.engine_subtype}
						alt=""
						className="size-5 shrink-0 object-contain"
					/>
				) : undefined
			}
			popoverContentProps={{ align: "start" }}
			disabled={disabled}
			aria-invalid={ariaInvalid}
		/>
	);
};
