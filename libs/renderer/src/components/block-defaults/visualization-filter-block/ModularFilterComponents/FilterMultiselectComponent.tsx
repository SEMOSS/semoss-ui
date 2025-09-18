import Paper from "@mui/material/Paper";
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
							// maxHeight: "50%",
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

	useEffect(() => {
		setSearchText("");
	}, [resetKey]);

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
