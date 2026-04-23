import type React from "react";
import { useEffect, useState } from "react";
import { Button, Slider } from "@semoss/ui/next";
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
}) => {
	const sortedOptions = listOptions
		.map((opt) => parseInt(opt, 10))
		.filter((n) => !Number.isNaN(n))
		.sort((a, b) => a - b);

	const sliderMin = sortedOptions.length > 0 ? sortedOptions[0] : 0;
	const sliderMax =
		sortedOptions.length > 0
			? sortedOptions[sortedOptions.length - 1]
			: 100;

	const defaultCheckedNums = checkedValues
		.map((v) => parseInt(v, 10))
		.filter((v) => !Number.isNaN(v));

	const defaultRange =
		mode === "slider" && defaultCheckedNums.length > 0
			? [Math.min(...defaultCheckedNums), Math.max(...defaultCheckedNums)]
			: [sliderMin, sliderMax];

	const [range, setRange] = useState<number[]>(defaultRange);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
	useEffect(() => {
		const checkedNums = checkedValues
			.map((v) => parseInt(v, 10))
			.filter((v) => !Number.isNaN(v));
		setRange(
			checkedNums.length > 0
				? [Math.min(...checkedNums), Math.max(...checkedNums)]
				: [sliderMin, sliderMax],
		);
	}, [resetKey, mode, JSON.stringify(checkedValues)]);

	const handleApply = () => {
		const [min, max] = range;
		const step = sliderSensitivity > 0 ? sliderSensitivity : 1;
		const selected = listOptions.filter((opt) => {
			const num = parseInt(opt, 10);
			return (
				!Number.isNaN(num) &&
				num >= min &&
				num <= max &&
				(num - min) % step === 0
			);
		});
		onApply(selected, mode ?? "slider");
	};

	const handleReset = () => {
		setRange([sliderMin, sliderMax]);
		if (onReset) onReset();
	};

	return (
		<div className="flex h-full w-full flex-col gap-4 rounded-md border border-border p-4">
			<div className="px-2">
				<span className="mb-2 block text-muted-foreground text-sm">
					{range[0]} - {range[1]}
				</span>
				<div className="flex items-center gap-2">
					<FilterIconComponent handleReset={handleReset} />
					<Slider
						value={range}
						onValueChange={(val) => setRange(val)}
						min={sliderMin}
						max={sliderMax}
						step={sliderSensitivity > 0 ? sliderSensitivity : 1}
						className="flex-1"
					/>
				</div>
			</div>
			<div className="mt-4 flex items-center justify-end border-border border-t pt-4">
				<Button onClick={handleApply}>Apply</Button>
			</div>
		</div>
	);
};

export default FilterSliderComponent;
