import { Slider } from "@mui/material";
import type React from "react";
import { useEffect, useState } from "react";
import { Box, Button, Typography } from "@semoss/ui";
import type { FilterComponentProps } from "../filter";
import FilterIconComponent from "./FilterIconComponent";

const FilterSliderComponent: React.FC<FilterComponentProps> = ({
	resetKey,
	mode,
	listOptions = [],
	checkedValues = [],
	onApply,
	onReset,
	sliderSensitivity = 0,
	color = "primary",
	size = "medium",
}) => {
	const sortedOptions = listOptions
		.map((opt) => parseInt(opt, 10))
		.filter((n) => !isNaN(n))
		.sort((a, b) => a - b);

	const sliderMin = sortedOptions.length > 0 ? sortedOptions[0] : 0;
	const sliderMax =
		sortedOptions.length > 0
			? sortedOptions[sortedOptions.length - 1]
			: 100;

	const defaultCheckedNums = checkedValues
		.map((v) => parseInt(v, 10))
		.filter((v) => !isNaN(v));

	const defaultRange =
		mode === "slider" && defaultCheckedNums.length > 0
			? [Math.min(...defaultCheckedNums), Math.max(...defaultCheckedNums)]
			: [sliderMin, sliderMax];

	const [range, setRange] = useState<number[]>(defaultRange);

	useEffect(() => {
		const checkedNums = checkedValues
			.map((v) => parseInt(v, 10))
			.filter((v) => !isNaN(v));
		setRange(
			checkedNums.length > 0
				? [Math.min(...checkedNums), Math.max(...checkedNums)]
				: [sliderMin, sliderMax],
		);
	}, [resetKey, mode, JSON.stringify(checkedValues)]);

	const handleSliderChange = (event: Event, newValue: number | number[]) => {
		setRange(newValue as number[]);
	};

	const handleApply = () => {
		let selected: string[] = [];

		const [min, max] = range;
		const step = sliderSensitivity > 0 ? sliderSensitivity : 1;

		selected = listOptions.filter((opt) => {
			const num = parseInt(opt, 10);
			return (
				!isNaN(num) &&
				num >= min &&
				num <= max &&
				(num - min) % step === 0
			);
		});

		onApply(selected, mode);
	};
	const handleReset = () => {
		setRange([sliderMin, sliderMax]);

		if (onReset) {
			onReset();
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
			<Box sx={{ px: 2 }}>
				<Typography variant="body2" gutterBottom>
					{range[0]} - {range[1]}
				</Typography>
				<Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
					<FilterIconComponent handleReset={handleReset} />
					<Slider
						value={range}
						onChange={handleSliderChange}
						valueLabelDisplay="auto"
						min={sliderMin}
						max={sliderMax}
						step={sliderSensitivity > 0 ? sliderSensitivity : 1}
					/>
				</Box>
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

export default FilterSliderComponent;
