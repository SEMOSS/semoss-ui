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
			setChecked(
				checked.length === listOptions.length ? [] : [...listOptions],
			);
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

	const allChecked = checked.length === listOptions.length;
	const indeterminate = checked.length > 0 && !allChecked;

	return (
		<List sx={{ maxHeight: 200, overflowY: "auto" }} dense>
			{multi && (
				<List.Item
					key="select-all"
					onClick={handleToggle("Select All")}
				>
					<List.Icon>
						<Checkbox
							edge="start"
							checked={allChecked}
							indeterminate={indeterminate}
							tabIndex={-1}
							disableRipple
						/>
					</List.Icon>
					<List.ItemText primary="Select All" />
				</List.Item>
			)}

			{filteredOptions.map((option) => (
				<List.Item key={option} onClick={handleToggle(option)}>
					<List.Icon>
						<Checkbox
							edge="start"
							checked={checked.includes(option)}
							tabIndex={-1}
							disableRipple
						/>
					</List.Icon>
					<List.ItemText primary={option} />
				</List.Item>
			))}
		</List>
	);
};

export default FilterListComponent;
