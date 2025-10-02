import CheckIcon from "@mui/icons-material/Check";
import Chip from "@mui/material/Chip";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import { styled } from "@mui/material/styles";
import type * as React from "react";
import { useMemo, useState } from "react";
import { Box, Button } from "@semoss/ui";
import type { FilterComponentProps } from "../filter";
import FilterIconComponent from "./FilterIconComponent";

const Root = styled("div")(({ theme }) => ({
	color: theme.palette.text.primary,
	fontSize: 14,
	width: "100%",
}));

const InputArea = styled("div")(({ theme }) => ({
	width: "100%",
	border: `1px solid ${theme.palette.divider}`,
	backgroundColor: theme.palette.background.paper,
	borderRadius: 4,
	padding: 2,
	display: "flex",
	flexWrap: "wrap",
	alignItems: "center",
	"&:focus-within": {
		borderColor: theme.palette.primary.main,
		boxShadow: `0 0 0 2px ${theme.palette.primary.light}33`,
	},
}));

const DropdownList = styled("ul")(({ theme }) => ({
	position: "absolute",
	width: "100%",
	maxHeight: 220,
	overflowY: "auto",
	background: theme.palette.background.paper,
	border: `1px solid ${theme.palette.divider}`,
	borderRadius: 4,
	boxShadow: theme.shadows[2],
	margin: 0,
	padding: 0,
	listStyle: "none",
	zIndex: 1305,
}));

const DropdownItem = styled("li")(({ theme }) => ({
	fontFamily: "Inter, sans-serif",
	display: "flex",
	alignItems: "center",
	padding: "6px 12px",
	cursor: "pointer",
	"&:hover": {
		background: theme.palette.action.hover,
	},
	zIndex: theme.zIndex.modal + 1,
}));

const SearchInput = styled("input")({
	border: "none",
	outline: "none",
	flex: 1,
	fontSize: 14,
	background: "transparent",
	padding: "8.5px 14px",
});

const FilterMultiselectComponent: React.FC<FilterComponentProps> = ({
	mode,
	listOptions = [],
	onApply,
	onReset,
	color = "primary",
	size = "medium",
}) => {
	const [inputValue, setInputValue] = useState("");
	const [selected, setSelected] = useState<string[]>([]);
	const [dropdownOpen, setDropdownOpen] = useState(false);

	const filteredOptions = useMemo(
		() =>
			listOptions.filter((opt) =>
				opt.toLowerCase().includes(inputValue.toLowerCase()),
			),
		[inputValue, listOptions],
	);

	const handleInputFocus = () => setDropdownOpen(true);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInputValue(e.target.value);
		// Ensure dropdown stays open while typing
		setDropdownOpen(true);
	};

	const handleToggleOption = (option: string) => {
		setSelected((prev) =>
			prev.includes(option)
				? prev.filter((item) => item !== option)
				: [...prev, option],
		);
		// Keep dropdown open after selection
		setDropdownOpen(true);
	};

	const handleRemoveChip = (option: string) => {
		setSelected((prev) => prev.filter((item) => item !== option));
	};

	const handleApply = () => {
		onApply(selected, mode);
	};

	const handleReset = () => {
		setSelected([]);
		setInputValue("");
		if (onReset) onReset();
	};

	const handleClickAway = () => {
		setDropdownOpen(false);
	};

	return (
		<Box
			sx={{
				width: "100%",
				border: "1px solid #ccc",
				borderRadius: 1,
				p: 2,
				display: "flex",
				flexDirection: "column",
				gap: 2,
			}}
		>
			<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
				<FilterIconComponent handleReset={handleReset} />
			</Box>
			<Root>
				<Box sx={{ position: "relative" }}>
					<ClickAwayListener onClickAway={handleClickAway}>
						<div>
							<InputArea>
								{selected.map((option) => (
									<Chip
										key={option}
										label={option}
										onDelete={() =>
											handleRemoveChip(option)
										}
										sx={{ m: 0.5 }}
									/>
								))}
								<SearchInput
									value={inputValue}
									onChange={handleInputChange}
									onFocus={handleInputFocus}
									placeholder="Search or select options..."
								/>
							</InputArea>
							{dropdownOpen && (
								<DropdownList>
									{filteredOptions.map((option) => (
										<DropdownItem
											key={option}
											onMouseDown={() =>
												handleToggleOption(option)
											}
										>
											<span style={{ flex: 1 }}>
												{option}
											</span>
											{selected.includes(option) && (
												<CheckIcon
													fontSize="small"
													color="primary"
												/>
											)}
										</DropdownItem>
									))}
								</DropdownList>
							)}
						</div>
					</ClickAwayListener>
				</Box>
			</Root>
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

export default FilterMultiselectComponent;
