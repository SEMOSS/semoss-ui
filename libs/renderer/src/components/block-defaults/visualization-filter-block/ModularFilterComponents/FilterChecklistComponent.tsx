import { useEffect, useState } from "react";
import { Button } from "@semoss/ui/next";
import type { FilterComponentProps } from "../filter";
import FilterIconComponent from "./FilterIconComponent";
import FilterListComponent from "./FilterListComponent";
import FilterSearchFilterHeader from "./FilterSearchFilterHeader";

const FilterChecklistComponent: React.FC<FilterComponentProps> = ({
	resetKey,
	mode,
	listOptions = [],
	checkedValues = [],
	onApply,
	onReset,
	showSearch = true,
	multi = true,
	// biome-ignore lint/correctness/noUnusedFunctionParameters: props destructuring pattern
	color = "primary",
	// biome-ignore lint/correctness/noUnusedFunctionParameters: props destructuring pattern
	size = "medium",
	resetChecked,
	setResetChecked,
}) => {
	const [checked, setChecked] = useState<string[]>([]);
	const [searchText, setSearchText] = useState("");

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
	useEffect(() => {
		setSearchText("");
		if (mode === "checklist") {
			setChecked(checkedValues);
		}
	}, [resetKey, mode, JSON.stringify(checkedValues)]);

	const handleApply = async () => {
		onApply(checked, mode);
	};

	const handleReset = () => {
		if (mode === "checklist") {
			setChecked([]);
		}
		setSearchText("");
		if (onReset) {
			onReset();
		}
	};

	const filteredOptions = listOptions.filter((opt) =>
		opt.toLowerCase().includes(searchText.toLowerCase()),
	);

	return (
		<div className="flex h-full w-full flex-col gap-4 rounded-md border border-border p-4">
			{mode === "checklist" && (
				<div className="flex w-full items-center gap-2">
					{showSearch && (
						<div className="flex-1">
							<FilterSearchFilterHeader
								searchText={searchText}
								setSearchText={setSearchText}
								setChecked={setChecked}
							/>
						</div>
					)}
					<FilterIconComponent handleReset={handleReset} />
				</div>
			)}
			<FilterListComponent
				listOptions={listOptions}
				filteredOptions={filteredOptions}
				multi={multi}
				checked={checked}
				setChecked={setChecked}
				resetChecked={resetChecked}
				setResetChecked={setResetChecked}
			/>
			<div className="mt-4 flex items-center justify-end border-border border-t pt-4">
				<Button onClick={handleApply}>Apply</Button>
			</div>
		</div>
	);
};

export default FilterChecklistComponent;
