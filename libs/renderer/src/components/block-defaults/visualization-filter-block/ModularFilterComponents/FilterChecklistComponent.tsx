import { Box, Button } from "@mui/material";
import { useEffect, useState } from "react";
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
	color = "primary",
	size = "medium",
	resetChecked,
	setResetChecked,
}) => {
	const [checked, setChecked] = useState<string[]>([]);
	const [searchText, setSearchText] = useState("");

	useEffect(() => {
		setSearchText("");
		if (mode === "checklist") {
			setChecked(checkedValues);
		}
	}, [resetKey, mode, JSON.stringify(checkedValues)]);

	const handleApply = async () => {
		let selected: string[] = [];

		selected = checked;
		onApply(selected, mode);
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
		<Box
			sx={{
				width: "100%",
				height: "100%",
				border: "1px solid #ccc",
				borderRadius: 1,
				p: 2,
				display: "flex",
				flexDirection: "column",
				gap: 2,
			}}
		>
			{mode === "checklist" && (
				<Box
					sx={{
						display: "flex",
						gap: 1,
						alignItems: "center",
						width: "100%",
					}}
				>
					{showSearch && (
						<Box sx={{ flex: 1 }}>
							<FilterSearchFilterHeader
								searchText={searchText}
								setSearchText={setSearchText}
								setChecked={setChecked}
							/>
						</Box>
					)}
					<FilterIconComponent handleReset={handleReset} />
				</Box>
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
			<Box
				sx={{
					display: "flex",
					justifyContent: "flex-end",
					mt: 2,
					alignItems: "center",
					borderTop: "1px solid #ddd",
					pt: 2,
				}}
			>
				<Button
					variant="contained"
					onClick={handleApply}
					color={color}
					size={size}
				>
					Apply
				</Button>
			</Box>
		</Box>
	);
};

export default FilterChecklistComponent;
