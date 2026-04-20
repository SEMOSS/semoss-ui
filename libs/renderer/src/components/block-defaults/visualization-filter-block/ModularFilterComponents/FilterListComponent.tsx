import { Minus } from "lucide-react";
import { useEffect } from "react";
import { Checkbox } from "@semoss/ui/next";

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
			const allFilteredChecked = filteredOptions.every((opt) =>
				checked.includes(opt),
			);
			if (allFilteredChecked) {
				setChecked(checked.filter((c) => !filteredOptions.includes(c)));
			} else {
				setChecked(
					Array.from(new Set([...checked, ...filteredOptions])),
				);
			}
		} else {
			const newChecked = checked.includes(value)
				? checked.filter((c) => c !== value)
				: [...checked, value];
			setChecked(newChecked);
		}
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
	useEffect(() => {
		if (resetChecked) {
			setChecked([...listOptions]);
			setResetChecked(false);
		}
	}, [resetChecked]);

	const allFilteredChecked =
		filteredOptions.length > 0 &&
		filteredOptions.every((opt) => checked.includes(opt));
	const indeterminate =
		checked.some((c) => filteredOptions.includes(c)) && !allFilteredChecked;

	return (
		<ul className="max-h-[200px] space-y-0.5 overflow-y-auto">
			{multi && (
				// biome-ignore lint/a11y/useKeyWithClickEvents: click-only interaction by design
				<li
					className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1 hover:bg-muted"
					onClick={handleToggle("Select All")}
				>
					<div className="relative">
						<Checkbox
							checked={allFilteredChecked}
							onCheckedChange={() => handleToggle("Select All")()}
						/>
						{indeterminate && (
							<Minus className="pointer-events-none absolute inset-0 m-auto size-3" />
						)}
					</div>
					<span className="text-sm">Select All</span>
				</li>
			)}
			{filteredOptions.map((option) => (
				// biome-ignore lint/a11y/useKeyWithClickEvents: click-only interaction by design
				<li
					key={option}
					className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1 hover:bg-muted"
					onClick={handleToggle(option)}
				>
					<Checkbox
						checked={checked.includes(option)}
						onCheckedChange={() => handleToggle(option)()}
					/>
					<span className="text-sm">{option}</span>
				</li>
			))}
		</ul>
	);
};

export default FilterListComponent;
