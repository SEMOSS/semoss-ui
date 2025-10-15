import { Checkbox } from "@mui/material";
import { useEffect } from "react";
import { List } from "@semoss/ui";

const FilterListComponent = ({
	listOptions,
	filteredOptions,
	multi,
	checked,
	setChecked,
	resetChecked,
	setResetChecked,
}: {
	listOptions: string[];
	filteredOptions: string[];
	multi: boolean;
	checked: string[];
	setChecked: (val: string[]) => void;
	resetChecked: boolean;
	setResetChecked: (checked: boolean) => void;
}) => {
	const handleToggle = (value: string) => () => {
		if (!multi) {
			setChecked(checked.includes(value) ? [] : [value]);
			return;
		}

		if (value === "Select All") {
			// Select all filtered options, not all listOptions
			const allFilteredChecked = filteredOptions.every((opt) =>
				checked.includes(opt),
			);
			if (allFilteredChecked) {
				// Uncheck all filtered options
				setChecked(checked.filter((c) => !filteredOptions.includes(c)));
			} else {
				// Add all filtered options to checked (avoid duplicates)
				const newChecked = Array.from(
					new Set([...checked, ...filteredOptions]),
				);
				setChecked(newChecked);
			}
		} else {
			const newChecked = checked.includes(value)
				? checked.filter((c) => c !== value)
				: [...checked, value];
			setChecked(newChecked);
		}
	};

	// reset checked when resetChecked changes to true (unfilter action)
	useEffect(() => {
		if (resetChecked) {
			setChecked([...listOptions]);
			setResetChecked(false);
		}
	}, [resetChecked]);

	// Select All should reflect only filteredOptions
	const allFilteredChecked =
		filteredOptions.length > 0 &&
		filteredOptions.every((opt) => checked.includes(opt));
	const indeterminate =
		checked.some((c) => filteredOptions.includes(c)) && !allFilteredChecked;

	return (
		<List sx={{ maxHeight: 200, overflowY: "auto" }} dense>
			{multi && (
				<List.Item
					key="select-all"
					onClick={handleToggle("Select All")}
				>
					<List.ItemIcon>
						<Checkbox
							edge="start"
							checked={allFilteredChecked}
							indeterminate={indeterminate}
							tabIndex={-1}
							disableRipple
						/>
					</List.ItemIcon>
					<List.ItemText primary="Select All" />
				</List.Item>
			)}

			{filteredOptions.map((option) => (
				<List.Item key={option} onClick={handleToggle(option)}>
					<List.ItemIcon>
						<Checkbox
							edge="start"
							checked={checked.includes(option)}
							tabIndex={-1}
							disableRipple
						/>
					</List.ItemIcon>
					<List.ItemText primary={option} />
				</List.Item>
			))}
		</List>
	);
};

export default FilterListComponent;
