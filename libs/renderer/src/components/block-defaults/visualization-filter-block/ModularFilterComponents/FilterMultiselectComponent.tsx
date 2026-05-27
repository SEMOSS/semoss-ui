import { Check, X } from "lucide-react";
import type * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@semoss/ui/next";
import type { FilterComponentProps } from "../filter";
import FilterIconComponent from "./FilterIconComponent";

const FilterMultiselectComponent: React.FC<FilterComponentProps> = ({
	mode,
	listOptions = [],
	onApply,
	onReset,
}) => {
	const [inputValue, setInputValue] = useState("");
	const [selected, setSelected] = useState<string[]>([]);
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const filteredOptions = useMemo(
		() =>
			listOptions.filter((opt) =>
				opt.toLowerCase().includes(inputValue.toLowerCase()),
			),
		[inputValue, listOptions],
	);

	useEffect(() => {
		const handleClickOutside = (e: globalThis.MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				setDropdownOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleToggleOption = (option: string) => {
		setSelected((prev) =>
			prev.includes(option)
				? prev.filter((item) => item !== option)
				: [...prev, option],
		);
		setDropdownOpen(true);
	};

	const handleRemoveChip = (option: string) => {
		setSelected((prev) => prev.filter((item) => item !== option));
	};

	const handleApply = () => {
		onApply(selected, mode ?? "multiselect");
	};

	const handleReset = () => {
		setSelected([]);
		setInputValue("");
		if (onReset) onReset();
	};

	return (
		<div className="flex w-full flex-col gap-4 rounded-md border border-border p-4">
			<div className="flex items-center gap-2">
				<FilterIconComponent handleReset={handleReset} />
			</div>
			<div ref={containerRef} className="relative w-full">
				<div className="flex w-full flex-wrap items-center gap-1 rounded-md border border-input bg-background p-1 focus-within:ring-1 focus-within:ring-ring">
					{selected.map((option) => (
						<span
							key={option}
							className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 font-medium text-secondary-foreground text-xs"
						>
							{option}
							<button
								type="button"
								onClick={() => handleRemoveChip(option)}
								className="ml-0.5 rounded-full hover:bg-secondary-foreground/20"
							>
								<X className="size-3" />
							</button>
						</span>
					))}
					<input
						value={inputValue}
						onChange={(e) => {
							setInputValue(e.target.value);
							setDropdownOpen(true);
						}}
						onFocus={() => setDropdownOpen(true)}
						placeholder="Search or select options..."
						className="min-w-[120px] flex-1 border-none bg-transparent px-2 py-1.5 text-sm outline-none"
					/>
				</div>
				{dropdownOpen && (
					<ul className="absolute top-full z-[1305] m-0 mt-1 max-h-[220px] w-full list-none overflow-y-auto rounded-md border border-border bg-background p-0 shadow-md">
						{filteredOptions.map((option) => (
							<li
								key={option}
								className="flex cursor-pointer items-center px-3 py-1.5 text-sm hover:bg-muted"
								onMouseDown={() => handleToggleOption(option)}
							>
								<span className="flex-1">{option}</span>
								{selected.includes(option) && (
									<Check className="size-4 text-primary" />
								)}
							</li>
						))}
					</ul>
				)}
			</div>
			<div className="mt-4 flex items-center justify-end border-border border-t pt-4">
				<Button onClick={handleApply}>Apply</Button>
			</div>
		</div>
	);
};

export default FilterMultiselectComponent;
