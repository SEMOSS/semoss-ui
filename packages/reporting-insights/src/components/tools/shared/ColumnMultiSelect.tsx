import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ColumnMultiSelectProps {
	label: string;
	columns: string[];
	selectedColumns: string[];
	onChange: (selected: string[]) => void;
	placeholder?: string;
}

export function ColumnMultiSelect({
	label,
	columns,
	selectedColumns,
	onChange,
	placeholder: _placeholder = "Select columns...",
}: ColumnMultiSelectProps) {
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen]);

	const toggleColumn = (column: string) => {
		if (selectedColumns.includes(column)) {
			onChange(selectedColumns.filter((c) => c !== column));
		} else {
			onChange([...selectedColumns, column]);
		}
	};

	const selectAll = () => {
		onChange([...columns]);
	};

	const clearAll = () => {
		onChange([]);
	};

	const displayText =
		selectedColumns.length === 0
			? "All columns"
			: selectedColumns.length === columns.length
				? "All columns"
				: `${selectedColumns.length} column${selectedColumns.length !== 1 ? "s" : ""}`;

	return (
		<div className="space-y-1.5" ref={containerRef}>
			<label className="block font-semibold text-stone-600 text-xs">
				{label}
			</label>
			<div className="relative">
				{/* Trigger button */}
				<button
					type="button"
					onClick={() => setIsOpen(!isOpen)}
					className="flex w-full items-center justify-between rounded border border-stone-200 bg-white px-3 py-2 text-left text-sm transition-colors hover:bg-stone-50 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
				>
					<span className="text-stone-700">{displayText}</span>
					<svg
						className={`h-4 w-4 text-stone-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</button>

				{/* Dropdown menu */}
				{isOpen && (
					<div className="absolute z-50 mt-1 flex max-h-64 w-full flex-col overflow-hidden rounded-lg border border-stone-200 bg-white shadow-lg">
						{/* Actions bar */}
						<div className="flex items-center justify-between border-stone-100 border-b bg-stone-50 px-3 py-2">
							<button
								type="button"
								onClick={selectAll}
								className="font-semibold text-indigo-600 text-xs hover:text-indigo-700"
							>
								Select All
							</button>
							<button
								type="button"
								onClick={clearAll}
								className="font-semibold text-stone-500 text-xs hover:text-stone-700"
							>
								Clear
							</button>
						</div>

						{/* Column list */}
						<div className="overflow-y-auto">
							{columns.length === 0 ? (
								<div className="px-3 py-4 text-center text-stone-400 text-xs">
									No columns available
								</div>
							) : (
								columns.map((column) => {
									const isSelected =
										selectedColumns.includes(column);
									return (
										<button
											key={column}
											type="button"
											onClick={() => toggleColumn(column)}
											className="group flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-stone-50"
										>
											<span className="truncate pr-2 text-stone-700">
												{column}
											</span>
											{isSelected && (
												<Check className="h-4 w-4 flex-shrink-0 text-indigo-600" />
											)}
										</button>
									);
								})
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
