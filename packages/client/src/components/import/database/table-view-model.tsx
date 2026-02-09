/** biome-ignore-all lint/correctness/useUniqueElementIds: <explanation> */
import { useEffect, useState } from "react";
import { Button, Checkbox, Input, Label, P } from "@semoss/ui/next";

interface TableViewSelectorProps {
	tables?: string[];
	views?: string[];
	onApply: (selection: { tables: string[]; views: string[] }) => void;
	onClose: () => void;
}

const TableViewSelector = ({
	tables = [],
	views = [],
	onApply,
	onClose,
}: TableViewSelectorProps) => {
	const [tableSearch, setTableSearch] = useState("");
	const [viewSearch, setViewSearch] = useState("");
	const [selectedTables, setSelectedTables] = useState<string[]>([]);
	const [selectedViews, setSelectedViews] = useState<string[]>([]);

	// Filter dynamically as search changes
	const filteredTables = tables.filter((t) =>
		t.toLowerCase().includes(tableSearch.toLowerCase()),
	);
	const filteredViews = views.filter((v) =>
		v.toLowerCase().includes(viewSearch.toLowerCase()),
	);
	const isApplyDisabled =
		selectedTables.length === 0 && selectedViews.length === 0;

	// When tables/views data changes (or search changes), keep only valid selections
	useEffect(() => {
		// If there are no current selections, select all by default
		setSelectedTables((prev) =>
			prev.length === 0 ? tables : prev.filter((t) => tables.includes(t)),
		);
		setSelectedViews((prev) =>
			prev.length === 0 ? views : prev.filter((v) => views.includes(v)),
		);
	}, [tables, views]);

	const handleSelectAll = (type: "tables" | "views", checked: boolean) => {
		if (type === "tables") {
			setSelectedTables(checked ? filteredTables : []);
		} else {
			setSelectedViews(checked ? filteredViews : []);
		}
	};

	const handleSelectItem = (
		type: "tables" | "views",
		name: string,
		checked: boolean,
	) => {
		if (type === "tables") {
			setSelectedTables((prev) =>
				checked ? [...prev, name] : prev.filter((t) => t !== name),
			);
		} else {
			setSelectedViews((prev) =>
				checked ? [...prev, name] : prev.filter((v) => v !== name),
			);
		}
	};

	const handleApply = () => {
		onApply({
			tables: selectedTables,
			views: selectedViews,
		});
	};

	return (
		<div className="flex flex-col items-end p-4">
			<div className="mb-4 flex w-full justify-center gap-4">
				{/* Select Tables */}
				<div className="flex-1">
					<P className="mb-1 font-medium">Select Tables:</P>
					<Input
						placeholder="Search tables..."
						value={tableSearch}
						onChange={(e) => setTableSearch(e.target.value)}
						className="mb-2"
						data-testid="search-tables-input"
					/>
					<div className="flex max-h-[180px] flex-col overflow-y-auto">
						{/* Select All Checkbox */}
						<div className="mb-1 flex items-center gap-2">
							<Checkbox
								id="select-all-tables"
								checked={
									filteredTables.length > 0 &&
									selectedTables.length ===
										filteredTables.length
								}
								onCheckedChange={(checked) =>
									handleSelectAll(
										"tables",
										checked as boolean,
									)
								}
								data-testid="select-all-tables-checkbox"
							/>
							<Label
								htmlFor="select-all-tables"
								className="cursor-pointer font-normal"
							>
								(Select all)
							</Label>
						</div>

						{/* Individual Table Checkboxes */}
						{filteredTables.map((table) => (
							<div
								key={table}
								className="mb-1 flex items-center gap-2"
							>
								<Checkbox
									id={`table-${table}`}
									checked={selectedTables.includes(table)}
									onCheckedChange={(checked) =>
										handleSelectItem(
											"tables",
											table,
											checked as boolean,
										)
									}
									data-testid={`table-checkbox-${table}`}
								/>
								<Label
									htmlFor={`table-${table}`}
									className="cursor-pointer font-normal"
								>
									{table}
								</Label>
							</div>
						))}

						{/* Empty State */}
						{filteredTables.length === 0 && (
							<P className="py-2 text-center text-muted-foreground text-sm">
								No tables found
							</P>
						)}
					</div>
				</div>

				{/* Select Views */}
				<div className="flex-1">
					<P className="mb-1 font-medium">Select Views:</P>
					<Input
						placeholder="Search views..."
						value={viewSearch}
						onChange={(e) => setViewSearch(e.target.value)}
						className="mb-2"
						data-testid="search-views-input"
					/>
					<div className="flex max-h-[180px] flex-col overflow-y-auto">
						{/* Select All Checkbox */}
						<div className="mb-1 flex items-center gap-2">
							<Checkbox
								id="select-all-views"
								checked={
									filteredViews.length > 0 &&
									selectedViews.length ===
										filteredViews.length
								}
								onCheckedChange={(checked) =>
									handleSelectAll("views", checked as boolean)
								}
								data-testid="select-all-views-checkbox"
							/>
							<Label
								htmlFor="select-all-views"
								className="cursor-pointer font-normal"
							>
								(Select all)
							</Label>
						</div>

						{/* Individual View Checkboxes */}
						{filteredViews.map((view) => (
							<div
								key={view}
								className="mb-1 flex items-center gap-2"
							>
								<Checkbox
									id={`view-${view}`}
									checked={selectedViews.includes(view)}
									onCheckedChange={(checked) =>
										handleSelectItem(
											"views",
											view,
											checked as boolean,
										)
									}
									data-testid={`view-checkbox-${view}`}
								/>
								<Label
									htmlFor={`view-${view}`}
									className="cursor-pointer font-normal"
								>
									{view}
								</Label>
							</div>
						))}

						{/* Empty State */}
						{filteredViews.length === 0 && (
							<P className="py-2 text-center text-muted-foreground text-sm">
								No views found
							</P>
						)}
					</div>
				</div>
			</div>

			{/* Footer Buttons */}
			<div className="flex flex-row justify-end gap-4">
				<Button
					variant="ghost"
					onClick={onClose}
					data-testid="model-upload-close-button"
				>
					Close
				</Button>
				<Button
					variant="default"
					disabled={isApplyDisabled}
					onClick={handleApply}
					data-testid="model-upload-submit-button"
				>
					Apply
				</Button>
			</div>
		</div>
	);
};

export default TableViewSelector;
