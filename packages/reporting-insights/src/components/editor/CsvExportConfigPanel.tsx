import {
	DragDropContext,
	Draggable,
	Droppable,
	type DropResult,
} from "@hello-pangea/dnd";
import { GripVertical, Hash, Search, Type, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@semoss/ui/next";
import { ColorPicker } from "@/components/tools/shared/ColorPicker";
import { ToolAccordion } from "@/components/tools/shared/ToolAccordion";
import { Input, Select } from "@/components/ui";
import type { Column } from "@/components/VizConfigTabs";
import { csvAggOptionsForType, normalizeDataType } from "@/lib/tableAggregate";
import type { VizLike } from "./VizEditor";

function TypeIcon({ dt }: { dt: string }) {
	return normalizeDataType(dt) === "NUMBER" ? (
		<Hash className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
	) : (
		<Type className="h-3.5 w-3.5 flex-shrink-0 text-stone-400" />
	);
}

interface Props {
	viz: VizLike;
	columns: Column[];
	onUpdate: (patch: Partial<VizLike>) => void;
}

export function CsvExportConfigPanel({ viz, columns, onUpdate }: Props) {
	const [activeTab, setActiveTab] = useState<"data" | "tools">("data");
	const [search, setSearch] = useState("");

	const patch = (p: Record<string, unknown>) =>
		onUpdate({ config: { ...viz.config, ...p } });
	const cfg = viz.config ?? {};

	// exportColumns: ordered list of columns in the drop zone.
	// undefined means the widget exports all columns by default.
	const exportColumns: string[] = cfg.exportColumns ?? [];
	const exportAggregations: Record<string, string> =
		cfg.exportAggregations ?? {};
	const selectedSet = new Set(exportColumns);

	const colByName = (name: string): Column =>
		columns.find((c) => c.name === name) ?? { name, dataType: "STRING" };

	const filteredAvailable = useMemo(() => {
		const available = columns.filter((c) => !selectedSet.has(c.name));
		if (!search.trim()) return available;
		const term = search.toLowerCase();
		return available.filter((c) => c.name.toLowerCase().includes(term));
	}, [columns, exportColumns, search]); // eslint-disable-line react-hooks/exhaustive-deps

	const setExportColumns = (
		next: string[],
		nextAggs?: Record<string, string>,
	) => {
		const aggs = nextAggs ?? exportAggregations;
		patch({
			exportColumns: next.length === 0 ? undefined : next,
			exportAggregations:
				Object.keys(aggs).length === 0 ? undefined : aggs,
		});
	};

	const removeColumn = (name: string) => {
		const next = { ...exportAggregations };
		delete next[name];
		setExportColumns(
			exportColumns.filter((c) => c !== name),
			next,
		);
	};

	const setAgg = (name: string, agg: string) => {
		const next = { ...exportAggregations };
		if (!agg) delete next[name];
		else next[name] = agg;
		patch({
			exportAggregations:
				Object.keys(next).length === 0 ? undefined : next,
		});
	};

	const handleDragEnd = (result: DropResult) => {
		const { source, destination, draggableId } = result;
		if (!destination) return;
		const src = source.droppableId;
		const dst = destination.droppableId;

		if (src === "csv-available" && dst === "csv-selected") {
			const name = draggableId.replace(/^avail-/, "");
			if (selectedSet.has(name)) return;
			const next = [...exportColumns];
			next.splice(destination.index, 0, name);
			setExportColumns(next);
		} else if (src === "csv-selected" && dst === "csv-selected") {
			const next = [...exportColumns];
			const [moved] = next.splice(source.index, 1);
			next.splice(destination.index, 0, moved);
			setExportColumns(next);
		} else if (src === "csv-selected" && dst === "csv-available") {
			const name = exportColumns[source.index];
			if (name) removeColumn(name);
		}
	};

	return (
		<Tabs
			value={activeTab}
			onValueChange={(v) => setActiveTab(v as "data" | "tools")}
			className="flex h-full flex-col gap-0"
		>
			<TabsList className="w-full justify-start rounded-none border-stone-200 border-b bg-stone-50/50 px-2">
				<TabsTrigger value="data">Data</TabsTrigger>
				<TabsTrigger value="tools">Tools</TabsTrigger>
			</TabsList>

			<div className="min-h-0 flex-1 overflow-hidden">
				{activeTab === "data" ? (
					<DragDropContext onDragEnd={handleDragEnd}>
						<div className="flex h-full w-full items-stretch">
							{/* Left: searchable column list */}
							<div className="flex min-h-0 w-[40%] flex-shrink-0 flex-col border-stone-200 border-r p-3">
								<span className="mb-2 px-1 font-semibold text-stone-400 text-xs uppercase tracking-wider">
									Dimensions
								</span>
								<div className="mb-2">
									<div className="relative">
										<Search className="-translate-y-1/2 absolute top-1/2 left-2 h-3.5 w-3.5 text-stone-400" />
										<Input
											className="w-full rounded border border-stone-200 py-1.5 pr-2 pl-8 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
											placeholder="Search columns…"
											value={search}
											onChange={(e) =>
												setSearch(e.target.value)
											}
										/>
									</div>
								</div>
								<Droppable droppableId="csv-available">
									{(provided) => (
										<div
											ref={provided.innerRef}
											{...provided.droppableProps}
											className="min-h-0 flex-1 space-y-1 overflow-y-auto"
										>
											{filteredAvailable.map(
												(col, index) => (
													<Draggable
														key={col.name}
														draggableId={`avail-${col.name}`}
														index={index}
													>
														{(p, snap) => (
															<div
																ref={p.innerRef}
																{...p.draggableProps}
																{...p.dragHandleProps}
																className={`flex cursor-move items-center gap-2 rounded border px-2.5 py-1.5 text-xs transition-colors ${
																	snap.isDragging
																		? "border-indigo-400 bg-indigo-50 shadow-sm"
																		: "border-stone-200 bg-white hover:bg-stone-50"
																}`}
															>
																<TypeIcon
																	dt={
																		col.dataType
																	}
																/>
																<span className="flex-1 truncate font-medium text-stone-700">
																	{col.name}
																</span>
															</div>
														)}
													</Draggable>
												),
											)}
											{provided.placeholder}
											{filteredAvailable.length === 0 && (
												<p className="py-6 text-center text-stone-400 text-xs">
													{columns.length === 0
														? "Run the query to see columns."
														: "All columns added."}
												</p>
											)}
										</div>
									)}
								</Droppable>
							</div>

							{/* Right: button label + Columns drop zone */}
							<div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
								{/* Button label input */}
								<div className="flex-shrink-0">
									<label className="mb-1.5 block font-semibold text-stone-600 text-xs">
										Button Label
									</label>
									<Input
										type="text"
										value={cfg.csvExportLabel ?? ""}
										onChange={(e) =>
											patch({
												csvExportLabel:
													e.target.value || undefined,
											})
										}
										placeholder="Export to CSV"
										className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[13px] focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
									/>
								</div>

								{/* Columns drop zone */}
								<div className="flex min-h-0 flex-1 flex-col">
									<div className="mb-1.5 flex items-center justify-between">
										<label className="font-semibold text-stone-600 text-xs">
											Columns
											{exportColumns.length > 0
												? ` · ${exportColumns.length}`
												: ""}
										</label>
										<div className="flex items-center gap-1">
											<button
												type="button"
												onClick={() =>
													setExportColumns(
														columns.map(
															(c) => c.name,
														),
													)
												}
												disabled={
													filteredAvailable.length ===
														0 && search === ""
												}
												className="rounded border border-stone-200 bg-white px-2 py-0.5 font-medium text-[11px] text-stone-600 transition-colors hover:border-stone-300 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
											>
												Add all
											</button>
											<button
												type="button"
												onClick={() =>
													setExportColumns([], {})
												}
												disabled={
													exportColumns.length === 0
												}
												className="rounded border border-stone-200 bg-white px-2 py-0.5 font-medium text-[11px] text-stone-600 transition-colors hover:border-stone-300 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
											>
												Remove all
											</button>
										</div>
									</div>
									<Droppable droppableId="csv-selected">
										{(provided, snapshot) => (
											<div
												ref={provided.innerRef}
												{...provided.droppableProps}
												className={`min-h-[120px] flex-1 space-y-1.5 overflow-y-auto rounded-lg border-2 border-dashed p-2 transition-colors ${
													snapshot.isDraggingOver
														? "border-indigo-400 bg-indigo-50/50"
														: "border-stone-200 bg-stone-50/40"
												}`}
											>
												{exportColumns.length === 0 &&
													!snapshot.isDraggingOver && (
														<p className="flex h-full min-h-[80px] items-center justify-center text-center text-stone-400 text-xs">
															Drag columns here to
															include in the
															export
														</p>
													)}
												{exportColumns.map(
													(name, index) => {
														const col =
															colByName(name);
														const agg =
															exportAggregations[
																name
															] ?? "";
														return (
															<Draggable
																key={name}
																draggableId={`sel-${name}`}
																index={index}
															>
																{(p, snap) => (
																	<div
																		ref={
																			p.innerRef
																		}
																		{...p.draggableProps}
																		className={`flex items-center gap-1.5 rounded-md border px-2 py-1.5 transition-all ${
																			snap.isDragging
																				? "border-indigo-400 bg-indigo-50 shadow-lg"
																				: "border-stone-200 bg-white hover:border-stone-300"
																		}`}
																	>
																		<span
																			{...p.dragHandleProps}
																			className="flex-shrink-0 cursor-grab text-stone-300 hover:text-stone-500"
																			title="Drag to reorder"
																		>
																			<GripVertical className="h-3.5 w-3.5" />
																		</span>
																		<TypeIcon
																			dt={
																				col.dataType
																			}
																		/>
																		<span
																			className="min-w-0 flex-1 truncate font-medium text-stone-700 text-xs"
																			title={
																				name
																			}
																		>
																			{
																				name
																			}
																		</span>
																		<Select
																			value={
																				agg
																			}
																			onChange={(
																				e,
																			) =>
																				setAgg(
																					name,
																					e
																						.target
																						.value,
																				)
																			}
																			className="flex-shrink-0 rounded border border-stone-200 bg-white px-1 py-0.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
																		>
																			{csvAggOptionsForType(
																				col.dataType,
																			).map(
																				(
																					o,
																				) => (
																					<option
																						key={
																							o.value
																						}
																						value={
																							o.value
																						}
																					>
																						{
																							o.label
																						}
																					</option>
																				),
																			)}
																		</Select>
																		<button
																			type="button"
																			onClick={() =>
																				removeColumn(
																					name,
																				)
																			}
																			className="flex-shrink-0 rounded p-0.5 text-stone-300 transition-colors hover:text-red-500"
																			title="Remove"
																		>
																			<X className="h-3.5 w-3.5" />
																		</button>
																	</div>
																)}
															</Draggable>
														);
													},
												)}
												{provided.placeholder}
											</div>
										)}
									</Droppable>
									<p className="mt-1.5 text-[11px] text-stone-400">
										{exportColumns.length === 0
											? "No columns added — all query columns are exported."
											: "Columns set to Raw are exported as-is. Columns with an aggregation are grouped and summarized."}
									</p>
								</div>
							</div>
						</div>
					</DragDropContext>
				) : (
					<div>
						<ToolAccordion title="Button Style">
							<ColorPicker
								label="Background Color"
								value={cfg.buttonBgColor ?? ""}
								onChange={(v) =>
									patch({ buttonBgColor: v || undefined })
								}
								defaultColor="#40a0ff"
							/>
						</ToolAccordion>

						<ToolAccordion title="Border">
							<div className="space-y-3">
								<div>
									<label className="mb-1.5 block font-semibold text-stone-600 text-xs">
										Style
									</label>
									<Select
										value={cfg.borderStyle ?? "none"}
										onChange={(e) =>
											patch({
												borderStyle:
													e.target.value === "none"
														? undefined
														: e.target.value,
											})
										}
										className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
									>
										{(
											[
												"none",
												"solid",
												"dashed",
												"dotted",
												"double",
											] as const
										).map((s) => (
											<option key={s} value={s}>
												{s}
											</option>
										))}
									</Select>
								</div>
								{cfg.borderStyle &&
									cfg.borderStyle !== "none" && (
										<>
											<div>
												<label className="mb-1.5 block font-semibold text-stone-600 text-xs">
													Width (px)
												</label>
												<Input
													type="number"
													min={0}
													value={
														cfg.borderWidth ?? ""
													}
													onChange={(e) =>
														patch({
															borderWidth:
																e.target
																	.value ||
																undefined,
														})
													}
													placeholder="1"
													className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
												/>
											</div>
											<ColorPicker
												label="Color"
												value={cfg.borderColor ?? ""}
												onChange={(v) =>
													patch({
														borderColor:
															v || undefined,
													})
												}
												defaultColor="#e2e8f0"
											/>
										</>
									)}
							</div>
						</ToolAccordion>

						<ToolAccordion title="Font Style">
							<div className="space-y-3">
								<div>
									<label className="mb-1.5 block font-semibold text-stone-600 text-xs">
										Font Size
									</label>
									<div className="flex gap-2">
										<Input
											type="number"
											min={0}
											value={cfg.fontSize ?? ""}
											onChange={(e) =>
												patch({
													fontSize:
														e.target.value ||
														undefined,
												})
											}
											placeholder="14"
											className="flex-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
										/>
										<Select
											value={cfg.fontSizeUnit ?? "px"}
											onChange={(e) =>
												patch({
													fontSizeUnit:
														e.target.value,
												})
											}
											className="w-20 rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
										>
											{(["px", "em", "%"] as const).map(
												(u) => (
													<option key={u} value={u}>
														{u}
													</option>
												),
											)}
										</Select>
									</div>
								</div>
								<ColorPicker
									label="Font Color"
									value={cfg.fontColor ?? ""}
									onChange={(v) =>
										patch({ fontColor: v || undefined })
									}
									defaultColor="#ffffff"
								/>
								<div>
									<label className="mb-1.5 block font-semibold text-stone-600 text-xs">
										Text Alignment
									</label>
									<Select
										value={cfg.textAlign ?? "center"}
										onChange={(e) =>
											patch({ textAlign: e.target.value })
										}
										className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
									>
										<option value="left">Left</option>
										<option value="center">Center</option>
										<option value="right">Right</option>
									</Select>
								</div>
							</div>
						</ToolAccordion>

						<ToolAccordion title="Size">
							<div className="space-y-3">
								<div>
									<label className="mb-1.5 block font-semibold text-stone-600 text-xs">
										Height
									</label>
									<div className="flex gap-2">
										<Input
											type="number"
											min={0}
											value={cfg.buttonHeight ?? ""}
											onChange={(e) =>
												patch({
													buttonHeight:
														e.target.value ||
														undefined,
												})
											}
											placeholder="100"
											className="flex-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
										/>
										<Select
											value={cfg.buttonHeightUnit ?? "%"}
											onChange={(e) =>
												patch({
													buttonHeightUnit:
														e.target.value,
												})
											}
											className="w-20 rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
										>
											{(["px", "em", "%"] as const).map(
												(u) => (
													<option key={u} value={u}>
														{u}
													</option>
												),
											)}
										</Select>
									</div>
								</div>
								<div>
									<label className="mb-1.5 block font-semibold text-stone-600 text-xs">
										Width
									</label>
									<div className="flex gap-2">
										<Input
											type="number"
											min={0}
											value={cfg.buttonWidth ?? ""}
											onChange={(e) =>
												patch({
													buttonWidth:
														e.target.value ||
														undefined,
												})
											}
											placeholder="100"
											className="flex-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
										/>
										<Select
											value={cfg.buttonWidthUnit ?? "%"}
											onChange={(e) =>
												patch({
													buttonWidthUnit:
														e.target.value,
												})
											}
											className="w-20 rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
										>
											{(["px", "em", "%"] as const).map(
												(u) => (
													<option key={u} value={u}>
														{u}
													</option>
												),
											)}
										</Select>
									</div>
								</div>
							</div>
						</ToolAccordion>

						<ToolAccordion title="Alignment">
							<div>
								<label className="mb-1.5 block font-semibold text-stone-600 text-xs">
									Horizontal Alignment
								</label>
								<Select
									value={cfg.alignment ?? "center"}
									onChange={(e) =>
										patch({ alignment: e.target.value })
									}
									className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
								>
									<option value="left">Left</option>
									<option value="center">Center</option>
									<option value="right">Right</option>
								</Select>
							</div>
						</ToolAccordion>
					</div>
				)}
			</div>
		</Tabs>
	);
}
