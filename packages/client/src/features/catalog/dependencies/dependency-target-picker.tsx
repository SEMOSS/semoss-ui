import { Search } from "lucide-react";
import { type Ref, useState } from "react";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	ToggleGroup,
	ToggleGroupItem,
} from "@semoss/ui/next";
import { ACTIVE_TOGGLE_CLASS } from "@/features/dependency-map/active-toggle";
import type { DependencyOption } from "./catalog-dependency-draft";
import { DependencyOptionList } from "./dependency-option-list";
import {
	type DependencySource,
	useDependencyOptions,
} from "./use-dependency-options";

/** Props for {@link DependencyTargetPicker}. */
interface DependencyTargetPickerProps {
	/** The owner, which is never offered */
	catalogId: string;
	/** The targets the draft already links to, listed as Added and not pickable */
	linkedIds: ReadonlySet<string>;
	/** The id of the target picked, or null for none yet */
	value: string | null;
	/** Picks a target */
	onChange: (option: DependencyOption) => void;
	/** Whether the field shows a problem, such as nothing picked */
	isInvalid?: boolean;
	/** The id of the field's error, which the list is described by */
	errorId?: string;
	/** The search box, so the dialog can give it focus as it opens */
	searchRef?: Ref<HTMLInputElement>;
}

/**
 * The target field of the Add Dependency dialog, as the automation canvas's
 * add-node menu picks a step: Engines or Projects, then a search over the
 * ones the user can see (`DependencyOptionList`). A target already linked
 * reads Added and cannot be picked; the one picked reads Selected.
 */
export const DependencyTargetPicker = ({
	catalogId,
	linkedIds,
	value,
	onChange,
	isInvalid = false,
	errorId,
	searchRef,
}: DependencyTargetPickerProps) => {
	const [source, setSource] = useState<DependencySource>("ENGINE");
	const [search, setSearch] = useState("");
	const read = useDependencyOptions({ catalogId, search, source });
	const sourceLabel = source === "ENGINE" ? "engines" : "projects";

	return (
		<div className="flex flex-col gap-3">
			<ToggleGroup
				type="single"
				size="sm"
				variant="outline"
				aria-label="What to add"
				value={source}
				onValueChange={(next: DependencySource | "") => {
					if (next) {
						setSource(next);
					}
				}}
			>
				<ToggleGroupItem value="ENGINE" className={ACTIVE_TOGGLE_CLASS}>
					Engines
				</ToggleGroupItem>
				<ToggleGroupItem
					value="PROJECT"
					className={ACTIVE_TOGGLE_CLASS}
				>
					Projects
				</ToggleGroupItem>
			</ToggleGroup>
			<InputGroup>
				<InputGroupAddon>
					<Search aria-hidden="true" />
				</InputGroupAddon>
				<InputGroupInput
					ref={searchRef}
					type="search"
					aria-label={`Search ${sourceLabel}`}
					placeholder={`Search ${sourceLabel}`}
					value={search}
					onChange={(event) => setSearch(event.target.value)}
				/>
			</InputGroup>
			<DependencyOptionList
				read={read}
				sourceLabel={sourceLabel}
				isSelected={(option) => option.catalog_id === value}
				isDisabled={(option) => linkedIds.has(option.catalog_id)}
				getStatus={(option) =>
					linkedIds.has(option.catalog_id)
						? "Added"
						: option.catalog_id === value
							? "Selected"
							: null
				}
				onPick={onChange}
				isInvalid={isInvalid}
				errorId={errorId}
				className="h-64"
			/>
		</div>
	);
};
