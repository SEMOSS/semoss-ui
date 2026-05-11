import type { LucideIcon } from "lucide-react";
import { Database, LayoutList, Table2 } from "lucide-react";
import { useEffect, useId, useState } from "react";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Checkbox,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Muted,
	Separator,
} from "@semoss/ui/next";

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
	const idPrefix = useId();
	const [tableSearch, setTableSearch] = useState("");
	const [viewSearch, setViewSearch] = useState("");
	const [selectedTables, setSelectedTables] = useState<string[]>([]);
	const [selectedViews, setSelectedViews] = useState<string[]>([]);

	const filteredTables = tables.filter((t) =>
		t.toLowerCase().includes(tableSearch.toLowerCase()),
	);
	const filteredViews = views.filter((v) =>
		v.toLowerCase().includes(viewSearch.toLowerCase()),
	);
	const hasTables = tables.length > 0;
	const hasViews = views.length > 0;
	const hasNoTablesOrViews = tables.length === 0 && views.length === 0;
	const isApplyDisabled =
		selectedTables.length === 0 && selectedViews.length === 0;
	const totalSelectedCount = selectedTables.length + selectedViews.length;
	const areAllFilteredTablesSelected =
		filteredTables.length > 0 &&
		filteredTables.every((table) => selectedTables.includes(table));
	const areAllFilteredViewsSelected =
		filteredViews.length > 0 &&
		filteredViews.every((view) => selectedViews.includes(view));

	const getOptionId = (
		type: "tables" | "views",
		name: string,
		index: number,
	) => {
		const cleanName = name
			.toLowerCase()
			.replace(/[^a-z0-9-_]/g, "-")
			.replace(/-+/g, "-");

		return `${idPrefix}-${type}-${cleanName}-${index}`;
	};

	useEffect(() => {
		setSelectedTables((prev) =>
			prev.length === 0 ? tables : prev.filter((t) => tables.includes(t)),
		);
		setSelectedViews((prev) =>
			prev.length === 0 ? views : prev.filter((v) => views.includes(v)),
		);
	}, [tables, views]);

	const handleSelectAll = (type: "tables" | "views", checked: boolean) => {
		if (type === "tables") {
			setSelectedTables((prev) =>
				checked
					? Array.from(new Set([...prev, ...filteredTables]))
					: prev.filter((table) => !filteredTables.includes(table)),
			);
			return;
		}

		setSelectedViews((prev) =>
			checked
				? Array.from(new Set([...prev, ...filteredViews]))
				: prev.filter((view) => !filteredViews.includes(view)),
		);
	};

	const handleSelectItem = (
		type: "tables" | "views",
		name: string,
		checked: boolean,
	) => {
		if (type === "tables") {
			setSelectedTables((prev) =>
				checked
					? Array.from(new Set([...prev, name]))
					: prev.filter((t) => t !== name),
			);
			return;
		}

		setSelectedViews((prev) =>
			checked
				? Array.from(new Set([...prev, name]))
				: prev.filter((v) => v !== name),
		);
	};

	const handleApply = () => {
		onApply({
			tables: selectedTables,
			views: selectedViews,
		});
	};

	const renderEntityPanel = ({
		type,
		title,
		icon: Icon,
		items,
		filteredItems,
		search,
		setSearch,
		selectedItems,
		hasData,
		areAllFilteredSelected,
		searchPlaceholder,
		selectAllId,
		selectAllTestId,
		itemTestPrefix,
		emptyMessage,
	}: {
		type: "tables" | "views";
		title: string;
		icon: LucideIcon;
		items: string[];
		filteredItems: string[];
		search: string;
		setSearch: (value: string) => void;
		selectedItems: string[];
		hasData: boolean;
		areAllFilteredSelected: boolean;
		searchPlaceholder: string;
		selectAllId: string;
		selectAllTestId: string;
		itemTestPrefix: string;
		emptyMessage: string;
	}) => {
		return (
			<Card className="flex h-full min-h-0 flex-col border-border/70">
				<CardHeader
					className={hasData ? "space-y-3 pb-3" : "space-y-1 pb-4"}
				>
					<div className="flex flex-wrap items-center justify-between gap-2">
						<div className="flex items-center gap-2">
							<Icon className="size-4 text-primary" />
							<CardTitle className="text-base">{title}</CardTitle>
						</div>
						<div className="flex items-center gap-2">
							<Badge variant="outline">
								{items.length} total
							</Badge>
							<Badge variant="outline">
								{filteredItems.length} visible
							</Badge>
							<Badge variant="secondary">
								{selectedItems.length} selected
							</Badge>
						</div>
					</div>
					{hasData ? (
						<Input
							placeholder={searchPlaceholder}
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							data-testid={`search-${type}-input`}
						/>
					) : null}
				</CardHeader>

				{hasData ? (
					<CardContent className="min-h-0 flex-1 pt-0">
						<div className="h-full min-h-0 overflow-y-auto rounded-md border border-border/70">
							<div className="sticky top-0 z-10 flex items-center gap-2 border-border/60 border-b bg-muted/90 px-3 py-2 backdrop-blur-sm">
								<Checkbox
									id={selectAllId}
									checked={areAllFilteredSelected}
									onCheckedChange={(checked) =>
										handleSelectAll(
											type,
											checked as boolean,
										)
									}
									data-testid={selectAllTestId}
								/>
								<Label
									htmlFor={selectAllId}
									className="cursor-pointer font-normal text-sm"
								>
									Select all visible {title.toLowerCase()}
								</Label>
							</div>

							{filteredItems.map((item, index) => (
								<div
									key={item}
									className="flex items-start gap-2 border-border/40 border-b px-3 py-2.5 last:border-b-0 hover:bg-muted/20"
								>
									<Checkbox
										id={getOptionId(type, item, index)}
										checked={selectedItems.includes(item)}
										onCheckedChange={(checked) =>
											handleSelectItem(
												type,
												item,
												checked as boolean,
											)
										}
										data-testid={`${itemTestPrefix}-${item}`}
									/>
									<div className="min-w-0 flex-1">
										<Label
											htmlFor={getOptionId(
												type,
												item,
												index,
											)}
											className="block max-w-full cursor-pointer truncate font-mono text-xs sm:text-sm"
											title={item}
										>
											{item}
										</Label>
									</div>
								</div>
							))}

							{filteredItems.length === 0 && (
								<div className="px-3 py-6 text-center">
									<Muted>{emptyMessage}</Muted>
								</div>
							)}
						</div>
					</CardContent>
				) : null}
			</Card>
		);
	};

	if (hasNoTablesOrViews) {
		return (
			<div className="space-y-4 p-2 md:p-4">
				<DialogHeader className="text-left">
					<DialogTitle>External Database Connection</DialogTitle>
				</DialogHeader>

				<Card className="border-border/70">
					<CardContent className="p-6 text-center">
						<Database className="mx-auto mb-3 size-8 text-primary" />
						<CardTitle className="text-base">
							Connection was successful
						</CardTitle>
						<CardDescription className="mt-2 text-base">
							No tables or views were found. Continue with an
							empty metamodel upload?
						</CardDescription>
					</CardContent>
				</Card>

				<DialogFooter>
					<Button
						variant="ghost"
						onClick={onClose}
						data-testid="model-upload-empty-no-button"
					>
						No
					</Button>
					<Button
						variant="default"
						onClick={handleApply}
						data-testid="model-upload-empty-yes-button"
					>
						Yes, Continue
					</Button>
				</DialogFooter>
			</div>
		);
	}

	const tablesPanel = renderEntityPanel({
		type: "tables",
		title: "Tables",
		icon: Table2,
		items: tables,
		filteredItems: filteredTables,
		search: tableSearch,
		setSearch: setTableSearch,
		selectedItems: selectedTables,
		hasData: hasTables,
		areAllFilteredSelected: areAllFilteredTablesSelected,
		searchPlaceholder: "Search tables...",
		selectAllId: `${idPrefix}-select-all-tables`,
		selectAllTestId: "select-all-tables-checkbox",
		itemTestPrefix: "table-checkbox",
		emptyMessage: "No tables found for this search.",
	});

	const viewsPanel = renderEntityPanel({
		type: "views",
		title: "Views",
		icon: LayoutList,
		items: views,
		filteredItems: filteredViews,
		search: viewSearch,
		setSearch: setViewSearch,
		selectedItems: selectedViews,
		hasData: hasViews,
		areAllFilteredSelected: areAllFilteredViewsSelected,
		searchPlaceholder: "Search views...",
		selectAllId: `${idPrefix}-select-all-views`,
		selectAllTestId: "select-all-views-checkbox",
		itemTestPrefix: "view-checkbox",
		emptyMessage: "No views found for this search.",
	});

	return (
		<div className="flex h-full min-h-0 flex-col gap-4 p-2 md:p-4">
			<DialogHeader className="text-left">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<DialogTitle>Select Tables and Views</DialogTitle>
					<Badge variant="secondary">
						{totalSelectedCount} selected
					</Badge>
				</div>
				<DialogDescription>
					Choose the tables and views to import. By default, all
					available items are selected.
				</DialogDescription>
			</DialogHeader>

			<Separator />

			<div className="flex min-h-0 flex-1 flex-col gap-2">
				<div className={hasTables ? "min-h-0 flex-1" : "shrink-0"}>
					{tablesPanel}
				</div>
				<div className={hasViews ? "min-h-0 flex-1" : "shrink-0"}>
					{viewsPanel}
				</div>
			</div>

			<Separator />

			<DialogFooter className="shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				{isApplyDisabled ? (
					<Muted className="text-sm">
						Select at least one table or view to continue.
					</Muted>
				) : (
					<div />
				)}
				<div className="flex items-center justify-end gap-2">
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
			</DialogFooter>
		</div>
	);
};

export default TableViewSelector;
