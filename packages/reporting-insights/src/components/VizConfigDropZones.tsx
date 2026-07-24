import {
	DragDropContext,
	Draggable,
	Droppable,
	type DropResult,
} from "@hello-pangea/dnd";
import { GripVertical, Hash, Plus, Search, Type, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@semoss/ui/next";
import { Input } from "@/components/ui";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { aggOptionsForType, normalizeDataType } from "@/lib/tableAggregate";
import type {
	VisualizationStyling,
	VisualizationType,
} from "@/types/dashboard";

// ── Drop zone configuration by visualization type ────────────────────────────
interface DropZone {
	id: string;
	label: string;
	multiColumn: boolean;
	aggregation?: boolean;
	placeholder?: string;
}

const DROP_ZONES_CONFIG: Record<VisualizationType, DropZone[]> = {
	kpi: [
		{
			id: "metrics",
			label: "Metrics (Y)",
			multiColumn: true,
			aggregation: true,
			placeholder: "Drag one or more metrics",
		},
	],
	bar: [
		{
			id: "xAxis",
			label: "X-Axis (Category)",
			multiColumn: false,
			placeholder: "Drag one dimension",
		},
		{
			id: "yAxis",
			label: "Y-Axis (Values)",
			multiColumn: true,
			aggregation: true,
			placeholder: "Drag one or more dimensions",
		},
		{
			id: "tooltip",
			label: "Tooltip (Optional)",
			multiColumn: true,
			aggregation: true,
			placeholder: "Drag one or more dimensions",
		},
		{
			id: "facet",
			label: "Facet (Optional)",
			multiColumn: false,
			placeholder: "Drag a column to slice data by its values",
		},
	],
	stackbar: [
		{
			id: "xAxis",
			label: "X-Axis",
			multiColumn: false,
			placeholder: "Drag one dimension",
		},
		{
			id: "yAxis",
			label: "Y-Axis",
			multiColumn: true,
			aggregation: true,
			placeholder: "Drag the measure(s) to stack",
		},
		{
			id: "category",
			label: "Category",
			multiColumn: false,
			placeholder: "Drag a category — its values become the stacks",
		},
		{
			id: "tooltip",
			label: "Tooltip (Optional)",
			multiColumn: true,
			aggregation: true,
			placeholder: "Drag one or more dimensions",
		},
		{
			id: "facet",
			label: "Facet (Optional)",
			multiColumn: false,
			placeholder: "Drag a column to slice data by its values",
		},
	],
	line: [
		{
			id: "xAxis",
			label: "X-Axis (Category)",
			multiColumn: false,
			placeholder: "Drag one dimension",
		},
		{
			id: "yAxis",
			label: "Y-Axis (Values)",
			multiColumn: true,
			aggregation: true,
			placeholder: "Drag one or more dimensions",
		},
		{
			id: "tooltip",
			label: "Tooltip (Optional)",
			multiColumn: true,
			aggregation: true,
			placeholder: "Drag one or more dimensions",
		},
		{
			id: "facet",
			label: "Facet (Optional)",
			multiColumn: false,
			placeholder: "Drag a column to slice data by its values",
		},
	],
	area: [
		{
			id: "xAxis",
			label: "X-Axis (Category)",
			multiColumn: false,
			placeholder: "Drag one dimension",
		},
		{
			id: "yAxis",
			label: "Y-Axis (Values)",
			multiColumn: true,
			aggregation: true,
			placeholder: "Drag one or more dimensions",
		},
		{
			id: "tooltip",
			label: "Tooltip (Optional)",
			multiColumn: true,
			aggregation: true,
			placeholder: "Drag one or more dimensions",
		},
		{
			id: "facet",
			label: "Facet (Optional)",
			multiColumn: false,
			placeholder: "Drag a column to slice data by its values",
		},
	],
	scatter: [
		{
			id: "label",
			label: "Label (Category)",
			multiColumn: false,
			placeholder: "Drag one dimension",
		},
		{
			id: "xAxis",
			label: "X-Axis (Numeric)",
			multiColumn: false,
			aggregation: true,
			placeholder: "Drag one dimension",
		},
		{
			id: "yAxis",
			label: "Y-Axis (Numeric)",
			multiColumn: false,
			aggregation: true,
			placeholder: "Drag one dimension",
		},
		{
			id: "size",
			label: "Size (Numeric)",
			multiColumn: false,
			aggregation: true,
			placeholder: "Drag one dimension",
		},
		{
			id: "color",
			label: "Color (Category)",
			multiColumn: false,
			placeholder: "Drag one dimension",
		},
		{
			id: "tooltip",
			label: "Tooltip (Optional)",
			multiColumn: true,
			aggregation: true,
			placeholder: "Drag one or more dimensions",
		},
		{
			id: "facet",
			label: "Facet (Optional)",
			multiColumn: false,
			placeholder: "Drag a column to slice data by its values",
		},
	],
	pie: [
		{
			id: "name",
			label: "Name (Category)",
			multiColumn: false,
			placeholder: "Drag one dimension",
		},
		{
			id: "value",
			label: "Value (Numeric)",
			multiColumn: false,
			aggregation: true,
			placeholder: "Drag one dimension",
		},
		{
			id: "tooltip",
			label: "Tooltip (Optional)",
			multiColumn: true,
			aggregation: true,
			placeholder: "Drag one or more dimensions",
		},
		{
			id: "facet",
			label: "Facet (Optional)",
			multiColumn: false,
			placeholder: "Drag a column to slice data by its values",
		},
	],
	radar: [
		{
			id: "xAxis",
			label: "X-Axis (Category)",
			multiColumn: false,
			placeholder: "Drag one dimension",
		},
		{
			id: "yAxis",
			label: "Y-Axis (Values)",
			multiColumn: true,
			aggregation: true,
			placeholder: "Drag one or more dimensions",
		},
		{
			id: "tooltip",
			label: "Tooltip (Optional)",
			multiColumn: true,
			aggregation: true,
			placeholder: "Drag one or more dimensions",
		},
		{
			id: "facet",
			label: "Facet (Optional)",
			multiColumn: false,
			placeholder: "Drag a column to slice data by its values",
		},
	],
	treemap: [
		{
			id: "name",
			label: "Name (Category)",
			multiColumn: false,
			placeholder: "Drag one dimension",
		},
		{
			id: "size",
			label: "Size (Numeric)",
			multiColumn: false,
			aggregation: true,
			placeholder: "Drag one dimension",
		},
		{
			id: "tooltip",
			label: "Tooltip (Optional)",
			multiColumn: true,
			aggregation: true,
			placeholder: "Drag one or more dimensions",
		},
		{
			id: "facet",
			label: "Facet (Optional)",
			multiColumn: false,
			placeholder: "Drag a column to slice data by its values",
		},
	],
	pivot: [
		{
			id: "rows",
			label: "Rows",
			multiColumn: true,
			placeholder: "Drag dimensions to group rows",
		},
		{
			id: "columns",
			label: "Columns",
			multiColumn: true,
			placeholder: "Drag dimensions to pivot as columns",
		},
		{
			id: "values",
			label: "Values (Calculations)",
			multiColumn: true,
			aggregation: true,
			placeholder: "Drag measures to aggregate",
		},
	],
	table: [],
	heatmap: [
		{
			id: "xAxis",
			label: "X Axis (Required)",
			multiColumn: false,
			placeholder: "Drag a categorical column",
		},
		{
			id: "yAxis",
			label: "Y Axis (Required)",
			multiColumn: false,
			placeholder: "Drag a categorical column",
		},
		{
			id: "value",
			label: "Value (Required)",
			multiColumn: false,
			aggregation: true,
			placeholder: "Drag a numeric column",
		},
	],
	halfdonut: [
		{
			id: "xAxis",
			label: "Category (Required)",
			multiColumn: false,
			placeholder: "Drag a categorical column",
		},
		{
			id: "yAxis",
			label: "Values (Required)",
			multiColumn: false,
			aggregation: true,
			placeholder: "Drag a numeric column",
		},
	],
	worldmap: [
		{
			id: "label",
			label: "Label (Required)",
			multiColumn: false,
			placeholder: "Drag one dimension",
		},
		{
			id: "latitude",
			label: "Latitude (Required)",
			multiColumn: false,
			placeholder: "Drag a numeric column",
		},
		{
			id: "longitude",
			label: "Longitude (Required)",
			multiColumn: false,
			placeholder: "Drag a numeric column",
		},
		{
			id: "size",
			label: "Size (Optional)",
			multiColumn: false,
			aggregation: true,
			placeholder: "Drag a numeric column",
		},
		{
			id: "color",
			label: "Color (Optional)",
			multiColumn: false,
			placeholder: "Drag a categorical column",
		},
		{
			id: "tooltip",
			label: "Tooltip (Optional)",
			multiColumn: true,
			aggregation: true,
			placeholder: "Drag one or more dimensions",
		},
		{
			id: "facet",
			label: "Facet (Optional)",
			multiColumn: false,
			placeholder: "Drag a column to slice data by its values",
		},
	],
	boxplot: [
		{
			id: "xAxis",
			label: "Category (Required)",
			multiColumn: false,
			placeholder: "Drag a categorical column",
		},
		{
			id: "yAxis",
			label: "Values (Required)",
			multiColumn: false,
			aggregation: false,
			placeholder: "Drag a numeric column",
		},
	],
	polarbar: [
		{
			id: "yAxis",
			label: "Values (Required)",
			multiColumn: true,
			aggregation: true,
			placeholder: "Drag one or more numeric columns",
		},
	],
	cluster: [
		{
			id: "xAxis",
			label: "Category (Required)",
			multiColumn: false,
			placeholder: "Drag a categorical column",
		},
		{
			id: "yAxis",
			label: "Values (Required)",
			multiColumn: true,
			aggregation: false,
			placeholder: "Drag one or more numeric columns",
		},
	],
	htmlblock: [],
	multiline: [
		{
			id: "xAxis",
			label: "X Axis (Required)",
			multiColumn: false,
			placeholder: "Drag a dimension column",
		},
		{
			id: "yAxis",
			label: "Y Axis (Required)",
			multiColumn: false,
			aggregation: true,
			placeholder: "Drag a numeric column",
		},
		{
			id: "category",
			label: "Category (Required)",
			multiColumn: false,
			placeholder: "Drag a categorical column",
		},
		{
			id: "tooltip",
			label: "Tooltip (Optional)",
			multiColumn: true,
			aggregation: true,
			placeholder: "Drag one or more dimensions",
		},
		{
			id: "facet",
			label: "Facet (Optional)",
			multiColumn: false,
			placeholder: "Drag a column to slice data by its values",
		},
	],
	wordcloud: [
		{
			id: "words",
			label: "Words (Required)",
			multiColumn: false,
			placeholder: "Drag one categorical column",
		},
		{
			id: "size",
			label: "Size",
			multiColumn: false,
			aggregation: true,
			placeholder: "Drag a numeric column",
		},
		{
			id: "tooltip",
			label: "Tooltip (Optional)",
			multiColumn: true,
			aggregation: true,
			placeholder: "Drag one or more dimensions",
		},
		{
			id: "facet",
			label: "Facet (Optional)",
			multiColumn: false,
			placeholder: "Drag a column to slice data by its values",
		},
	],
	bubble: [
		{
			id: "bubbles",
			label: "Bubbles (Required)",
			multiColumn: false,
			placeholder: "Drag one categorical column",
		},
		{
			id: "size",
			label: "Size (Required)",
			multiColumn: false,
			aggregation: true,
			placeholder: "Drag a numeric column",
		},
		{
			id: "tooltip",
			label: "Tooltip (Optional)",
			multiColumn: true,
			aggregation: true,
			placeholder: "Drag one or more dimensions",
		},
		{
			id: "facet",
			label: "Facet (Optional)",
			multiColumn: false,
			placeholder: "Drag a column to slice data by its values",
		},
	],
	sunburst: [
		{
			id: "levels",
			label: "Hierarchy Levels (Required)",
			multiColumn: true,
			placeholder: "Drag columns — first = innermost ring",
		},
		{
			id: "value",
			label: "Value (Required)",
			multiColumn: false,
			aggregation: true,
			placeholder: "Drag a numeric column",
		},
	],
	puck: [
		{
			id: "puckGroups",
			label: "Group",
			multiColumn: true,
			placeholder: "Drag one or more dimensions (order = nesting depth)",
		},
		{
			id: "size",
			label: "Value (Required)",
			multiColumn: false,
			aggregation: true,
			placeholder: "Drag a numeric column",
		},
		{
			id: "tooltip",
			label: "Tooltip",
			multiColumn: true,
			aggregation: true,
			placeholder: "Drag one or more dimensions",
		},
	],
	// Button / control widgets — configured via dedicated panels, not drop zones.
	csvexport: [],
	filter: [],
};

const NUMERIC_AGGREGATION_OPTIONS = [
	{ value: "avg", label: "Average" },
	{ value: "sum", label: "Sum" },
	{ value: "count", label: "Count" },
	{ value: "countUnique", label: "Unique Count" },
	{ value: "min", label: "Minimum" },
	{ value: "max", label: "Maximum" },
	{ value: "median", label: "Median" },
];

const STRING_AGGREGATION_OPTIONS = [
	{ value: "count", label: "Count" },
	{ value: "countUnique", label: "Unique Count" },
];

const getAggregationOptionsForColumn = (dataType: string) => {
	return dataType === "NUMBER"
		? NUMERIC_AGGREGATION_OPTIONS
		: STRING_AGGREGATION_OPTIONS;
};

// ── Types ─────────────────────────────────────────────────────────────────────
export interface Column {
	name: string;
	dataType: string; // 'NUMBER', 'STRING', 'DATE', etc.
}

export interface DroppedColumn {
	name: string;
	dataType: string;
	aggregation?: string; // For KPI metrics
}

export type DropZoneData = {
	[zoneId: string]: DroppedColumn[] | undefined;
};

export type DropZoneDataWithTable = DropZoneData & {
	tableColumns?: string[]; // For table type: ordered list of visible column names
	/** For table type: per-column aggregation/group-by role (column name → 'group' | fn | 'none'). */
	columnAggregations?: Record<string, string>;
	styling?: VisualizationStyling; // Visual styling and behavior configuration
};

interface VizConfigDropZonesProps {
	columns: Column[];
	visualizationType: VisualizationType;
	value: DropZoneDataWithTable;
	onChange: (data: DropZoneDataWithTable) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function VizConfigDropZones({
	columns,
	visualizationType,
	value,
	onChange,
}: VizConfigDropZonesProps) {
	const [search, setSearch] = useState("");
	// Which column's "add to zone" menu is open (the + next to a column name).
	const [addColMenu, setAddColMenu] = useState<string | null>(null);

	const zones = DROP_ZONES_CONFIG[visualizationType] || [];

	const filteredColumns = useMemo(() => {
		if (!search.trim()) return columns;
		const term = search.toLowerCase();
		return columns.filter((col) => col.name.toLowerCase().includes(term));
	}, [columns, search]);

	const handleDragEnd = (result: DropResult) => {
		const { source, destination, draggableId } = result;

		if (!destination) return;

		// Dragging from column list to drop zone
		if (
			source.droppableId === "column-list" &&
			destination.droppableId.startsWith("drop-zone-")
		) {
			const zoneId = destination.droppableId.replace("drop-zone-", "");
			const zone = zones.find((z) => z.id === zoneId);
			if (!zone) return;

			const column = columns.find((c) => c.name === draggableId);
			if (!column) return;

			const existing = value[zoneId] || [];

			// Check if already dropped
			if (existing.some((c) => c.name === column.name)) return;

			// For single-column zones, replace; for multi-column, append
			const newDropped: DroppedColumn = {
				name: column.name,
				dataType: column.dataType,
				aggregation: zone.aggregation
					? column.dataType === "NUMBER"
						? "avg"
						: "count"
					: undefined,
			};

			onChange({
				...value,
				[zoneId]: zone.multiColumn
					? [...existing, newDropped]
					: [newDropped],
			});
		}

		// Reordering within a drop zone
		if (
			source.droppableId === destination.droppableId &&
			source.droppableId.startsWith("drop-zone-")
		) {
			const zoneId = source.droppableId.replace("drop-zone-", "");
			const existing = value[zoneId] || [];
			const reordered = [...existing];
			const [moved] = reordered.splice(source.index, 1);
			reordered.splice(destination.index, 0, moved);
			onChange({ ...value, [zoneId]: reordered });
		}
	};

	const handleRemoveColumn = (zoneId: string, columnName: string) => {
		const existing = value[zoneId] || [];
		onChange({
			...value,
			[zoneId]: existing.filter((c) => c.name !== columnName),
		});
	};

	// Add a column to a zone by click (same result as dragging it in).
	const addColumnToZone = (zoneId: string, columnName: string) => {
		const zone = zones.find((z) => z.id === zoneId);
		const column = columns.find((c) => c.name === columnName);
		if (!zone || !column) return;
		const existing = value[zoneId] || [];
		if (existing.some((c) => c.name === column.name)) return;
		const dropped: DroppedColumn = {
			name: column.name,
			dataType: column.dataType,
			aggregation: zone.aggregation
				? column.dataType === "NUMBER"
					? "avg"
					: "count"
				: undefined,
		};
		onChange({
			...value,
			[zoneId]: zone.multiColumn ? [...existing, dropped] : [dropped],
		});
	};

	// Remove every column from a zone at once (bulk clear).
	const handleClearZone = (zoneId: string) =>
		onChange({ ...value, [zoneId]: [] });

	const handleAggregationChange = (
		zoneId: string,
		columnIndex: number,
		aggregation: string,
	) => {
		const existing = value[zoneId] || [];
		const updated = [...existing];
		updated[columnIndex] = { ...updated[columnIndex], aggregation };
		onChange({ ...value, [zoneId]: updated });
	};

	// For table type: manual column selection + per-column aggregation / group-by.
	if (visualizationType === "table") {
		// Empty by default — the user adds the columns they want.
		const selected = value.tableColumns ?? [];
		const aggs = value.columnAggregations ?? {};
		const selectedSet = new Set(selected);
		const term = search.trim().toLowerCase();
		const availableCols = columns.filter(
			(c) =>
				!selectedSet.has(c.name) &&
				(!term || c.name.toLowerCase().includes(term)),
		);
		const colByName = (name: string): Column =>
			columns.find((c) => c.name === name) ??
			columns.find(
				(c) => c.name.toLowerCase() === name.toLowerCase(),
			) ?? { name, dataType: "STRING" };
		const groupingActive = selected.some(
			(c) => aggs[c] && aggs[c] !== "none",
		);

		const emit = (next: Record<string, unknown>) =>
			onChange({ ...value, ...next } as DropZoneDataWithTable);
		const setSelected = (
			next: string[],
			nextAggs?: Record<string, string>,
		) =>
			emit({
				tableColumns: next,
				...(nextAggs ? { columnAggregations: nextAggs } : {}),
			});

		const setAgg = (name: string, agg: string) => {
			const n = { ...aggs };
			if (!agg || agg === "none") delete n[name];
			else n[name] = agg;
			emit({ columnAggregations: n });
		};
		const addAll = () => setSelected(columns.map((c) => c.name));
		const removeAll = () => setSelected([], {});
		const removeOne = (name: string) => {
			const n = { ...aggs };
			delete n[name];
			setSelected(
				selected.filter((c) => c !== name),
				n,
			);
		};

		// DnD between the two panels (available ↔ in-table) and reorder within in-table.
		const handleTableDragEnd = (result: DropResult) => {
			const { source, destination } = result;
			if (!destination) return;
			const src = source.droppableId;
			const dst = destination.droppableId;
			const name =
				src === "tbl-selected"
					? selected[source.index]
					: availableCols[source.index]?.name;
			if (!name) return;
			if (dst === "tbl-selected") {
				const arr = [...selected];
				if (src === "tbl-selected") arr.splice(source.index, 1);
				arr.splice(destination.index, 0, name);
				setSelected(arr);
			} else if (dst === "tbl-available" && src === "tbl-selected") {
				removeOne(name);
			}
		};

		const TypeIcon = ({ dt }: { dt: string }) =>
			normalizeDataType(dt) === "NUMBER" ? (
				<Hash className="h-4 w-4 flex-shrink-0 text-emerald-500" />
			) : (
				<Type className="h-4 w-4 flex-shrink-0 text-stone-400" />
			);

		return (
			<DragDropContext onDragEnd={handleTableDragEnd}>
				<div className="flex h-full w-full flex-col p-4">
					<div className="mb-3 flex items-center justify-between">
						<div>
							<h3 className="font-semibold text-sm text-stone-700">
								Table Columns
							</h3>
							<p className="mt-0.5 text-stone-500 text-xs">
								Drag columns into{" "}
								<span className="font-medium">In table</span>,
								reorder, and pick an aggregation.
							</p>
						</div>
						<div className="flex items-center gap-1.5">
							<button
								onClick={addAll}
								disabled={availableCols.length === 0}
								className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 font-medium text-stone-600 text-xs transition-colors hover:bg-stone-100 hover:text-stone-900 disabled:opacity-50"
							>
								Add all
							</button>
							<button
								onClick={removeAll}
								disabled={selected.length === 0}
								className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 font-medium text-stone-600 text-xs transition-colors hover:bg-stone-100 hover:text-stone-900 disabled:opacity-50"
							>
								Remove all
							</button>
						</div>
					</div>

					<div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
						{/* Available (not in the table) */}
						<div className="flex min-h-0 flex-col rounded-lg border border-stone-200 bg-stone-50/40">
							<div className="flex-shrink-0 border-stone-200 border-b px-3 py-2 font-semibold text-[11px] text-stone-400 uppercase tracking-widest">
								Available ({availableCols.length})
							</div>
							<div className="flex-shrink-0 border-stone-200 border-b p-2">
								<div className="relative">
									<Search className="-translate-y-1/2 absolute top-1/2 left-2 h-3.5 w-3.5 text-stone-400" />
									<Input
										className="w-full rounded border border-stone-200 py-1.5 pr-2 pl-8 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
										placeholder="Search columns..."
										value={search}
										onChange={(e) =>
											setSearch(e.target.value)
										}
									/>
								</div>
							</div>
							<Droppable droppableId="tbl-available">
								{(provided, snapshot) => (
									<div
										ref={provided.innerRef}
										{...provided.droppableProps}
										className={`flex-1 space-y-1.5 overflow-y-auto p-2 ${snapshot.isDraggingOver ? "bg-indigo-50/50" : ""}`}
									>
										{availableCols.map((c, index) => (
											<Draggable
												key={c.name}
												draggableId={`a-${c.name}`}
												index={index}
											>
												{(p, snap) => (
													<div
														ref={p.innerRef}
														{...p.draggableProps}
														className={`flex items-center gap-1.5 rounded-md border px-2 py-2 transition-all ${
															snap.isDragging
																? "border-indigo-400 bg-indigo-50 shadow-lg"
																: "border-stone-200 bg-white hover:border-stone-300"
														}`}
													>
														<span
															{...p.dragHandleProps}
															className="flex-shrink-0 cursor-grab text-stone-300 hover:text-stone-500"
															title="Drag into the table"
														>
															<GripVertical className="h-4 w-4" />
														</span>
														<TypeIcon
															dt={c.dataType}
														/>
														<span
															className="min-w-0 flex-1 truncate text-sm text-stone-700"
															title={c.name}
														>
															{c.name}
														</span>
														<button
															type="button"
															onClick={() =>
																setSelected([
																	...selected,
																	c.name,
																])
															}
															className="flex-shrink-0 rounded p-0.5 text-stone-400 hover:bg-indigo-50 hover:text-indigo-600"
															title="Add to table"
														>
															<Plus className="h-4 w-4" />
														</button>
													</div>
												)}
											</Draggable>
										))}
										{provided.placeholder}
										{availableCols.length === 0 && (
											<p className="px-2 py-8 text-center text-stone-400 text-xs">
												All columns added
											</p>
										)}
									</div>
								)}
							</Droppable>
						</div>

						{/* In table (selected, ordered, with aggregation) */}
						<div className="flex min-h-0 flex-col rounded-lg border border-stone-200">
							<div className="flex-shrink-0 border-stone-200 border-b px-3 py-2 font-semibold text-[11px] text-stone-400 uppercase tracking-widest">
								In table ({selected.length})
							</div>
							<Droppable droppableId="tbl-selected">
								{(provided, snapshot) => (
									<div
										ref={provided.innerRef}
										{...provided.droppableProps}
										className={`flex-1 space-y-1.5 overflow-y-auto p-2 ${snapshot.isDraggingOver ? "bg-indigo-50/50" : ""}`}
									>
										{selected.map((name, index) => {
											const col = colByName(name);
											const role = aggs[name] ?? "none";
											return (
												<Draggable
													key={name}
													draggableId={`s-${name}`}
													index={index}
												>
													{(p, snap) => (
														<div
															ref={p.innerRef}
															{...p.draggableProps}
															className={`flex flex-col gap-1 rounded-md border px-2 py-1.5 transition-all ${
																snap.isDragging
																	? "border-indigo-400 bg-indigo-50 shadow-lg"
																	: "border-stone-200 bg-white hover:border-stone-300"
															}`}
														>
															{/* Row 1: name + remove (name always visible) */}
															<div className="flex items-center gap-1.5">
																<span
																	{...p.dragHandleProps}
																	className="flex-shrink-0 cursor-grab text-stone-300 hover:text-stone-500"
																	title="Drag to reorder (or back to Available)"
																>
																	<GripVertical className="h-4 w-4" />
																</span>
																<TypeIcon
																	dt={
																		col.dataType
																	}
																/>
																<span
																	className="min-w-0 flex-1 truncate text-sm text-stone-700"
																	title={name}
																>
																	{name}
																</span>
																<button
																	onClick={() =>
																		removeOne(
																			name,
																		)
																	}
																	className="flex-shrink-0 p-0.5 text-stone-400 hover:text-red-500"
																	title="Remove from table"
																>
																	<X className="h-4 w-4" />
																</button>
															</div>
															{/* Row 2: aggregation */}
															<div className="pl-[22px]">
																<SearchableSelect
																	ariaLabel="Aggregation"
																	value={role}
																	onChange={(
																		v,
																	) =>
																		setAgg(
																			name,
																			v,
																		)
																	}
																	options={aggOptionsForType(
																		col.dataType,
																	).map(
																		(
																			o,
																		) => ({
																			value: o.value,
																			label: o.label,
																		}),
																	)}
																	className="flex w-full items-center justify-between gap-1 rounded border border-stone-200 bg-white px-1.5 py-1 text-[11px] text-stone-600 hover:border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
																/>
															</div>
														</div>
													)}
												</Draggable>
											);
										})}
										{provided.placeholder}
										{selected.length === 0 && (
											<p className="px-2 py-8 text-center text-stone-400 text-xs">
												Drag columns here or use “Add
												all”.
											</p>
										)}
									</div>
								)}
							</Droppable>
						</div>
					</div>

					{groupingActive && (
						<p className="mt-2 flex-shrink-0 text-[11px] text-stone-500">
							Rows are grouped by the columns set to{" "}
							<span className="font-medium">Group by</span>; the
							rest are aggregated.
						</p>
					)}
				</div>
			</DragDropContext>
		);
	}

	return (
		<DragDropContext onDragEnd={handleDragEnd}>
			<div className="flex h-full w-full items-stretch">
				{/* Left: Column list */}
				<div className="flex min-h-[400px] w-[40%] flex-col border-stone-200 border-r p-3">
					<span className="mb-2 px-2 font-semibold text-stone-400 text-xs uppercase tracking-wider">
						Dimensions
					</span>
					<div className="mb-3 px-2">
						<div className="relative">
							<Search className="-translate-y-1/2 absolute top-1/2 left-2 h-3.5 w-3.5 text-stone-400" />
							<Input
								className="w-full rounded border border-stone-200 py-1.5 pr-2 pl-8 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
								placeholder="Search columns..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
						</div>
					</div>
					<Droppable droppableId="column-list">
						{(provided) => (
							<div
								ref={provided.innerRef}
								{...provided.droppableProps}
								className="flex-1 space-y-1 overflow-y-auto px-2"
							>
								{filteredColumns.map((col, index) => (
									<Draggable
										key={col.name}
										draggableId={col.name}
										index={index}
									>
										{(provided, snapshot) => (
											<div
												ref={provided.innerRef}
												{...provided.draggableProps}
												className={`relative flex items-center gap-1.5 rounded border px-2 py-1.5 text-xs transition-colors ${
													snapshot.isDragging
														? "border-indigo-400 bg-indigo-50 shadow-sm"
														: "border-stone-200 bg-white hover:bg-stone-50"
												}`}
											>
												<span
													{...provided.dragHandleProps}
													className="flex-shrink-0 cursor-grab text-stone-300 hover:text-stone-500"
													title="Drag into a zone"
												>
													<GripVertical className="h-3.5 w-3.5" />
												</span>
												{col.dataType === "NUMBER" ? (
													<Hash className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
												) : (
													<Type className="h-3.5 w-3.5 flex-shrink-0 text-stone-400" />
												)}
												<span
													className="flex-1 truncate font-medium text-stone-700"
													title={col.name}
												>
													{col.name}
												</span>
												{zones.length === 1 ? (
													<button
														type="button"
														onClick={() =>
															addColumnToZone(
																zones[0].id,
																col.name,
															)
														}
														className="flex-shrink-0 rounded p-0.5 text-stone-400 hover:bg-indigo-50 hover:text-indigo-600"
														title={`Add to ${zones[0].label}`}
													>
														<Plus className="h-3.5 w-3.5" />
													</button>
												) : (
													<Popover
														open={
															addColMenu ===
															col.name
														}
														onOpenChange={(o) =>
															setAddColMenu(
																o
																	? col.name
																	: null,
															)
														}
													>
														<PopoverTrigger asChild>
															<button
																type="button"
																className="flex-shrink-0 rounded p-0.5 text-stone-400 hover:bg-indigo-50 hover:text-indigo-600"
																title="Add to a zone"
															>
																<Plus className="h-3.5 w-3.5" />
															</button>
														</PopoverTrigger>
														<PopoverContent
															align="end"
															className="w-44 p-1 py-1"
														>
															<p className="px-3 pt-0.5 pb-1 font-semibold text-[10px] text-stone-400 uppercase tracking-wider">
																Add to
															</p>
															{zones.map((z) => {
																const already =
																	(
																		value[
																			z.id
																		] || []
																	).some(
																		(c) =>
																			c.name ===
																			col.name,
																	);
																return (
																	<button
																		key={
																			z.id
																		}
																		type="button"
																		disabled={
																			already
																		}
																		onClick={() => {
																			addColumnToZone(
																				z.id,
																				col.name,
																			);
																			setAddColMenu(
																				null,
																			);
																		}}
																		className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-stone-700 text-xs hover:bg-stone-50 disabled:cursor-default disabled:text-stone-300 disabled:hover:bg-transparent"
																	>
																		<span className="truncate">
																			{
																				z.label
																			}
																		</span>
																		{already && (
																			<span className="text-[10px]">
																				added
																			</span>
																		)}
																	</button>
																);
															})}
														</PopoverContent>
													</Popover>
												)}
											</div>
										)}
									</Draggable>
								))}
								{provided.placeholder}
							</div>
						)}
					</Droppable>
				</div>

				{/* Right: Drop zones */}
				<div className="flex-1 space-y-4 overflow-y-auto p-3">
					{zones.map((zone) => {
						const dropped = value[zone.id] || [];
						return (
							<div key={zone.id}>
								<div className="mb-2 flex items-center justify-between">
									<label className="font-semibold text-stone-600 text-xs">
										{zone.label}
									</label>
									{dropped.length > 0 && (
										<button
											onClick={() =>
												handleClearZone(zone.id)
											}
											className="rounded px-1 font-medium text-[11px] text-stone-400 transition-colors hover:text-red-500"
											title="Remove all columns from this zone"
										>
											Clear
										</button>
									)}
								</div>
								<Droppable droppableId={`drop-zone-${zone.id}`}>
									{(provided, snapshot) => (
										<div
											ref={provided.innerRef}
											{...provided.droppableProps}
											className={`min-h-[60px] rounded-lg border-2 border-dashed p-2 transition-colors ${
												snapshot.isDraggingOver
													? "border-indigo-400 bg-indigo-50"
													: "border-stone-200 bg-stone-50"
											}`}
										>
											{dropped.length === 0 ? (
												<div className="flex h-full items-center justify-center text-stone-400 text-xs">
													{zone.placeholder ||
														"Drag columns here"}
												</div>
											) : (
												<div className="space-y-1.5">
													{dropped.map(
														(col, index) => (
															<Draggable
																key={col.name}
																draggableId={`zone-chip-${zone.id}-${col.name}`}
																index={index}
																isDragDisabled={
																	!zone.multiColumn
																}
															>
																{(
																	chipProvided,
																	chipSnapshot,
																) => (
																	<div
																		ref={
																			chipProvided.innerRef
																		}
																		{...chipProvided.draggableProps}
																		className={`flex flex-col gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs ${chipSnapshot.isDragging ? "opacity-90 shadow-md ring-1 ring-indigo-300" : ""}`}
																	>
																		{/* Row 1: column name (+ drag handle) + remove */}
																		<div className="flex items-center gap-2">
																			{zone.multiColumn && (
																				<span
																					{...chipProvided.dragHandleProps}
																					className="flex-shrink-0 cursor-grab text-stone-300 hover:text-stone-500"
																					title="Drag to reorder"
																				>
																					<GripVertical className="h-3 w-3" />
																				</span>
																			)}
																			<span
																				className="flex-1 truncate font-medium text-stone-700"
																				title={
																					col.name
																				}
																			>
																				{
																					col.name
																				}
																			</span>
																			<button
																				onClick={() =>
																					handleRemoveColumn(
																						zone.id,
																						col.name,
																					)
																				}
																				className="flex-shrink-0 rounded p-0.5 text-stone-400 transition-colors hover:text-red-500"
																				title="Remove"
																			>
																				<X className="h-3 w-3" />
																			</button>
																		</div>
																		{/* Row 2: aggregation dropdown (own line so the name is never squeezed) */}
																		{zone.aggregation && (
																			<SearchableSelect
																				ariaLabel="Aggregation"
																				value={
																					col.aggregation ??
																					""
																				}
																				onChange={(
																					v,
																				) =>
																					handleAggregationChange(
																						zone.id,
																						index,
																						v,
																					)
																				}
																				options={getAggregationOptionsForColumn(
																					col.dataType,
																				).map(
																					(
																						o,
																					) => ({
																						value: o.value,
																						label: o.label,
																					}),
																				)}
																				className="rounded-md border border-stone-200 bg-stone-50 px-2 py-0.5 text-[11px] text-stone-600 hover:border-stone-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
																			/>
																		)}
																	</div>
																)}
															</Draggable>
														),
													)}
												</div>
											)}
											{provided.placeholder}
										</div>
									)}
								</Droppable>
							</div>
						);
					})}
				</div>
			</div>
		</DragDropContext>
	);
}
