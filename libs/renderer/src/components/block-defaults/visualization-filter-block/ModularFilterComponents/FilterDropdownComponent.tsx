import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import CloseIcon from "@mui/icons-material/Close";
import { ClickAwayListener } from "@mui/material";
import type React from "react";
import { useEffect, useState } from "react";
import { Box, Button, Typography } from "@semoss/ui";
import type { FilterComponentProps } from "../filter";
import FilterIconComponent from "./FilterIconComponent";
import FilterListComponent from "./FilterListComponent";
import FilterSearchFilterHeader from "./FilterSearchFilterHeader";

const FilterDropdownComponent: React.FC<FilterComponentProps> = ({
	resetKey,
	mode,
	listOptions,
	checkedValues,
	onApply,
	onReset,
	multi = true,
	filterLabel,
	color = "primary",
	size = "medium",
	resetChecked,
	setResetChecked,
}) => {
	const [checked, setChecked] = useState<string[]>([]);
	const [searchText, setSearchText] = useState("");
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const toggleDropdown = () => setDropdownOpen((prev) => !prev);
	const closeDropdown = () => setDropdownOpen(false);

	useEffect(() => {
		setSearchText("");
		if (mode === "dropdown" || mode === "checklist") {
			setChecked(
				checkedValues.length ? [...checkedValues] : [...listOptions],
			);
		}
	}, [resetKey, mode]);

	const handleApply = () => {
		let selected: string[] = [];

		if (mode === "dropdown") {
			selected = checked;
		}
		onApply(selected, mode);
	};

	const handleReset = () => {
		if (mode === "dropdown") {
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
			<ClickAwayListener onClickAway={closeDropdown}>
				<Box sx={{ position: "relative", width: "100%" }}>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 1,
						}}
					>
						<Box
							onClick={toggleDropdown}
							sx={{
								border: "1px solid #ccc",
								borderRadius: 1,
								px: 1.5,
								py: 1,
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								cursor: "pointer",
								minHeight: "40px",
								flex: 1,
							}}
						>
							<Typography variant="body2">
								{filterLabel}
							</Typography>
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 1,
								}}
							>
								<ArrowDropDownIcon />
								<CloseIcon
									fontSize="small"
									onClick={(e) => {
										e.stopPropagation();
										setChecked([]);
										closeDropdown();
									}}
									sx={{ cursor: "pointer" }}
								/>
							</Box>
						</Box>

						{/* Add icon beside dropdown */}
						<FilterIconComponent handleReset={handleReset} />
					</Box>

					{dropdownOpen && (
						<Box
							sx={{
								position: "relative",
								maxHeight: "100%",
								overflow: "visible",
								mt: 1,
								width: "100%",
								backgroundColor: "#fff",
								border: "1px solid #ccc",
								borderRadius: 1,
								boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
							}}
						>
							<FilterSearchFilterHeader
								searchText={searchText}
								setSearchText={setSearchText}
								setChecked={setChecked}
							/>
							<FilterListComponent
								listOptions={listOptions}
								filteredOptions={filteredOptions}
								multi={multi}
								checked={checked}
								setChecked={setChecked}
								resetChecked={resetChecked}
								setResetChecked={setResetChecked}
							/>
						</Box>
					)}
				</Box>
			</ClickAwayListener>

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

export default FilterDropdownComponent;
