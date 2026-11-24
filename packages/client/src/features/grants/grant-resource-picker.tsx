import type { Ref } from "react";
import {
	type Engine,
	EngineSelect,
	type Project,
	ProjectSelect,
} from "@semoss/shared";
import {
	type PickedResource,
	toPickedEngine,
	toPickedProject,
} from "./picked-resource";

/** What the picker offers: projects of some types, or engines of some types */
export type GrantPickerTypes =
	| {
			/** Projects */
			kind: "PROJECT";
			/** The project types it offers */
			types: Project["project_type"][];
	  }
	| {
			/** Engines */
			kind: "ENGINE";
			/** The engine types it offers */
			types: Engine["engine_type"][];
	  };

/** Props for {@link GrantResourcePicker}. */
export type GrantResourcePickerProps = GrantPickerTypes & {
	/** The trigger's id, for its label */
	id: string;
	/** Focuses the trigger, as a form does for a field with a problem */
	ref?: Ref<HTMLButtonElement>;
	/** Whether the field has a problem */
	"aria-invalid"?: boolean;
	/** The hint and error the trigger is described by */
	"aria-describedby"?: string;
	/** The one picked, shown in the trigger, or null to show none */
	picked: PickedResource | null;
	/**
	 * Lets the user pick several without the list closing; these ids are shown
	 * checked and the trigger says how many are picked. The caller adds or
	 * takes off each one picked.
	 */
	selectedIds?: readonly string[];
	/** Whether the picker is disabled */
	disabled?: boolean;
	/** Whether to offer every engine or project, in admin mode */
	admin?: boolean;
	/**
	 * Whether to offer only the engines or projects the user owns, as for what
	 * the user shares; admin mode offers every one
	 */
	isOwnedOnly?: boolean;
	/** Called with what was picked */
	onPick: (picked: PickedResource) => void;
};

/**
 * Picks an engine or a project to give or get a permission: the shared
 * `ProjectSelect` or `EngineSelect`, by the kind it offers, each with its image
 * or logo and id, returning either as the same picked shape. With
 * `selectedIds` it picks several, staying open between picks, and with
 * `isOwnedOnly` it offers only what the user owns.
 */
export const GrantResourcePicker = (props: GrantResourcePickerProps) => {
	const pickedName =
		props.picked?.resourceType === props.kind ? props.picked.name : "";
	const shared = {
		id: props.id,
		ref: props.ref,
		"aria-invalid": props["aria-invalid"],
		"aria-describedby": props["aria-describedby"],
		name:
			props.selectedIds && props.selectedIds.length > 0
				? `${props.selectedIds.length} picked`
				: pickedName,
		value: props.picked?.resourceType === props.kind ? props.picked.id : "",
		disabled: props.disabled,
		admin: props.admin,
		isOwnedOnly: props.isOwnedOnly,
		modal: true,
		selectedIds: props.selectedIds,
	};
	if (props.kind === "PROJECT") {
		return (
			<ProjectSelect
				{...shared}
				projectTypes={props.types}
				showProjectId
				showProjectImage
				onChange={(project: Project) =>
					props.onPick(toPickedProject(project))
				}
			/>
		);
	}
	return (
		<EngineSelect
			{...shared}
			engineTypes={props.types}
			showEngineId
			onChange={(engine: Engine) => {
				const picked = toPickedEngine(engine);
				if (picked) {
					props.onPick(picked);
				}
			}}
		/>
	);
};
