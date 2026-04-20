import { ChevronDown, X } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@semoss/ui/next";
import type { FilterComponentProps } from "../filter";
import FilterIconComponent from "./FilterIconComponent";
import FilterListComponent from "./FilterListComponent";
import FilterSearchFilterHeader from "./FilterSearchFilterHeader";

const FilterDropdownComponent: React.FC<FilterComponentProps> = ({
	resetKey,
	mode,
	listOptions = [],
	checkedValues = [],
	onApply,
	onReset,
	multi = true,
	filterLabel,
	resetChecked = false,
	setResetChecked = () => {},
}) => {
	const [checked, setChecked] = useState<string[]>([]);
	const [searchText, setSearchText] = useState("");
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
	useEffect(() => {
		setSearchText("");
		if (mode === "dropdown" || mode === "checklist") {
			setChecked(
				(checkedValues?.length ?? 0) > 0
					? // biome-ignore lint/style/noNonNullAssertion: value is guaranteed non-null at this point
						[...checkedValues!]
					: [...listOptions],
			);
		}
	}, [resetKey, mode]);

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

	const handleApply = () => {
		onApply(mode === "dropdown" ? checked : [], mode);
	};

	const handleReset = () => {
		if (mode === "dropdown") {
			setChecked([]);
		}
		setSearchText("");
		if (onReset) onReset();
	};

	const filteredOptions = listOptions.filter((opt) =>
		opt.toLowerCase().includes(searchText.toLowerCase()),
	);

	return (
		<div className="flex h-full w-full flex-col gap-4 rounded-md border border-border p-4">
			<div ref={containerRef} className="relative w-full">
				<div className="flex items-center gap-2">
					{/* biome-ignore lint/a11y/noStaticElementInteractions: interactive element with click handler */}
					{/* biome-ignore lint/a11y/useKeyWithClickEvents: click-only interaction by design */}
					<div
						className="flex min-h-[40px] flex-1 cursor-pointer items-center justify-between rounded-md border border-border px-3 py-2"
						onClick={() => setDropdownOpen((prev) => !prev)}
					>
						<span className="text-sm">{filterLabel}</span>
						<div className="flex items-center gap-1">
							<ChevronDown className="size-4" />
							<X
								className="size-4 cursor-pointer"
								onClick={(e) => {
									e.stopPropagation();
									setChecked([]);
									setDropdownOpen(false);
								}}
							/>
						</div>
					</div>
					<FilterIconComponent handleReset={handleReset} />
				</div>

				{dropdownOpen && (
					<div className="absolute top-full z-[1305] mt-1 w-full rounded-md border border-border bg-background shadow-md">
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
					</div>
				)}
			</div>

			<div className="mt-4 flex items-center justify-end border-border border-t pt-4">
				<Button onClick={handleApply}>Apply</Button>
			</div>
		</div>
	);
};

export default FilterDropdownComponent;
