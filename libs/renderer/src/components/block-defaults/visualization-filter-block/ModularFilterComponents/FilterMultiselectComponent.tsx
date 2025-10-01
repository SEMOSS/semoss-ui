import {
	Checkbox,
	FormControl,
	InputLabel,
	ListItemText,
	MenuItem,
	Paper,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import Select from "@mui/material/Select";
import type React from "react";
import {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from "react";
import { Box, Button, Chip } from "@semoss/ui";
import type {
	ChipData,
	ChipsArrayHandle,
	ChipsArrayProps,
	FilterComponentProps,
} from "../filter";
import FilterIconComponent from "./FilterIconComponent";

const ChipsArray = forwardRef<ChipsArrayHandle, ChipsArrayProps>(
	({ chips, onDelete }, ref) => {
		useImperativeHandle(ref, () => ({
			getChips: () => chips,
		}));

		return (
			<Paper
				component="ul"
				sx={{
					display: "flex",
					justifyContent: "center",
					flexWrap: "wrap",
					listStyle: "none",
					p: 0.5,
					m: 0,
				}}
			>
				{chips.map((chip) => (
					<li
						key={chip.key}
						style={{
							display: "inline-block",
							margin: 4,
							listStyle: "none",
						}}
					>
						<Chip
							sx={{ m: 0.5 }}
							label={chip.label}
							onDelete={() => onDelete(chip)}
						/>
					</li>
				))}
			</Paper>
		);
	},
);

const FilterMultiselectComponent: React.FC<FilterComponentProps> = ({
	resetKey,
	mode,
	listOptions = [],
	onApply,
	onReset,
	color = "primary",
	size = "medium",
}) => {
	const [searchText, setSearchText] = useState("");
	const chipsRef = useRef<ChipsArrayHandle>(null);

	const initialChips = useMemo(
		() =>
			listOptions.map((label, index) => ({
				key: index,
				label,
			})),
		[listOptions],
	);
	const [chipData, setChipData] = useState<ChipData[]>(initialChips);

	// Dropdown state
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const [selectedDropdown, setSelectedDropdown] = useState<string[]>(
		chipData.map((chip) => chip.label),
	);

	useEffect(() => {
		setSearchText("");
	}, [resetKey]);

	// Keep dropdown selection in sync with chips
	useEffect(() => {
		setSelectedDropdown(chipData.map((chip) => chip.label));
	}, [chipData]);

	const handleApply = () => {
		let selected: string[] = [];

		const remaining = chipsRef.current?.getChips() || [];

		const safeChipData = remaining.map((chip, index) => ({
			key: index,
			label: chip.label,
		}));

		selected = safeChipData.map((chip) => chip.label);

		setChipData(safeChipData);

		onApply(selected, mode);
	};

	const handleReset = () => {
		setSearchText("");
		if (onReset) {
			onReset();
			setChipData(initialChips);
		}
	};

	const handleDropdownChange = (event: SelectChangeEvent<string[]>) => {
		const value = event.target.value as string[];
		setSelectedDropdown(value);

		// Add chips for newly selected, remove chips for deselected
		const newChips = listOptions
			.filter((label) => value.includes(label))
			.map((label, idx) => ({
				key: idx,
				label,
			}));
		setChipData(newChips);
	};

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
			<Box
				sx={{
					display: "flex",
					gap: 1,
					alignItems: "center",
					width: "100%",
				}}
			>
				<FilterIconComponent handleReset={handleReset} />
			</Box>

			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					gap: 1,
					maxHeight: 200,
					overflowY: "auto",
				}}
			>
				<Box sx={{ paddingBottom: "8px" }}>
					<ChipsArray
						chips={chipData.filter((chip) =>
							chip.label
								.toLowerCase()
								.includes(searchText.toLowerCase()),
						)}
						ref={chipsRef}
						onDelete={(chipToDelete) => {
							const updated = chipData.filter(
								(chip) => chip.key !== chipToDelete.key,
							);
							setChipData(updated);
						}}
					/>
				</Box>
				<FormControl sx={{ minWidth: "100%" }}>
					{/** biome-ignore lint/correctness/useUniqueElementIds: <the id should be sufficient> */}
					<InputLabel id="filter-multiselect-dropdown-label">
						Select Options
					</InputLabel>
					<Select
						labelId="filter-multiselect-dropdown-label"
						multiple
						open={dropdownOpen}
						onOpen={() => setDropdownOpen(true)}
						onClose={() => setDropdownOpen(false)}
						value={selectedDropdown}
						onChange={handleDropdownChange}
						renderValue={(selected) => selected.join(", ")}
						label="Select Options"
					>
						{listOptions.map((option) => (
							<MenuItem key={option} value={option}>
								<Checkbox
									checked={
										selectedDropdown.indexOf(option) > -1
									}
								/>
								<ListItemText primary={option} />
							</MenuItem>
						))}
					</Select>
				</FormControl>
			</Box>
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
