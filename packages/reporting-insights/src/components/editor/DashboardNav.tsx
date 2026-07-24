import { BarChart2, Pencil, Plus, ShieldAlert, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@semoss/ui/next";
import { cx } from "@/components/ui";
import { VIZ_TYPE_META } from "@/lib/vizMeta";

/** Minimal shapes the navigator reads — decoupled from the full dashboard types. */
interface NavViz {
	id: string;
	title: string;
	visualizationType: string;
	phi?: boolean;
}
interface NavSheet {
	id: string;
	name: string;
	color?: string;
	visualizations: NavViz[];
	layout: { vizId: string }[];
	/** The auto-managed Parameters sheet — rendered without rename/delete/charts. */
	isParamSheet?: boolean;
}

export interface DashboardNavProps {
	sheets: NavSheet[];
	activeSheetId: string;
	selectedVizId: string;
	editingVizId: string | null;
	/** Sheet accent palette (for the color picker). */
	colors: string[];
	onSelectSheet: (id: string) => void;
	onSelectViz: (sheetId: string, vizId: string) => void;
	onRenameSheet: (id: string, name: string) => void;
	onDeleteSheet: (id: string) => void;
	onColorChange: (id: string, color: string) => void;
	onAddSheet: () => void;
	onAddViz: (sheetId: string) => void;
	onRenameViz: (id: string, title: string) => void;
	onEditViz: (id: string | null) => void;
	onRemoveViz: (id: string) => void;
	/** Toggle the PHI/PII flag on a visualization. */
	onTogglePhi: (id: string) => void;
	/** Mobile drawer: whether the off-canvas nav is open (ignored ≥ lg). */
	open?: boolean;
	/** Close the mobile drawer (backdrop / after selecting). */
	onClose?: () => void;
}

/**
 * Left navigator for the dashboard editor: a single rail that lists every sheet
 * with its visualizations nested underneath. Replaces the old horizontal viz
 * strip AND the bottom sheet tabs, so navigation lives in one place and the
 * sheet → visualization hierarchy is finally visible.
 */
export function DashboardNav({
	sheets,
	activeSheetId,
	selectedVizId,
	editingVizId,
	colors,
	onSelectSheet,
	onSelectViz,
	onRenameSheet,
	onDeleteSheet,
	onColorChange,
	onAddSheet,
	onAddViz,
	onRenameViz,
	onEditViz,
	onRemoveViz,
	onTogglePhi,
	open = false,
	onClose,
}: DashboardNavProps) {
	const [editingSheetId, setEditingSheetId] = useState<string | null>(null);

	return (
		<>
			{/* Mobile backdrop */}
			{open && (
				<div
					className="fixed inset-0 z-30 bg-black/30 lg:hidden"
					onClick={onClose}
					aria-hidden
				/>
			)}
			<aside
				className={cx(
					"flex w-64 flex-col border-stone-200 border-r bg-white",
					// Off-canvas drawer on small screens; static sidebar from lg up.
					"fixed inset-y-0 left-0 z-40 transform transition-transform duration-200 lg:static lg:z-auto lg:w-60 lg:flex-shrink-0 lg:translate-x-0 lg:bg-white/60",
					open ? "translate-x-0 shadow-xl" : "-translate-x-full",
				)}
			>
				{/* Mobile close button */}
				<div className="flex items-center justify-between border-stone-100 border-b px-3 py-2 lg:hidden">
					<span className="font-semibold text-[13px] text-stone-700">
						Sheets & charts
					</span>
					<button
						onClick={onClose}
						className="rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
					>
						<X className="h-4 w-4" />
					</button>
				</div>
				{/* Utility bar — Sheets label + add (stays put as sheets are added) */}
				<div className="flex flex-shrink-0 items-center justify-between border-stone-200 border-b bg-stone-100/70 px-3 py-2">
					<span className="font-semibold text-[10px] text-stone-500 uppercase tracking-widest">
						Sheets
					</span>
					<button
						type="button"
						onClick={onAddSheet}
						title="Add sheet"
						className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 font-medium text-[11px] text-stone-500 transition-colors hover:bg-stone-200/70 hover:text-indigo-600"
					>
						<Plus className="h-3.5 w-3.5" /> Sheet
					</button>
				</div>

				{/* Sheets → visualizations */}
				<div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-2">
					{sheets.map((sheet) => {
						const isActiveSheet = sheet.id === activeSheetId;
						const inLayout = new Set(
							sheet.layout.map((l) => l.vizId),
						);
						// The auto-managed Parameters sheet: no rename/delete/charts.
						const isParam = !!sheet.isParamSheet;
						return (
							<div key={sheet.id}>
								{/* Sheet header */}
								<div
									className={cx(
										"group flex items-center gap-1.5 rounded-md px-1.5 py-1",
										isActiveSheet
											? "bg-stone-100"
											: "hover:bg-stone-50",
									)}
								>
									<Popover>
										<PopoverTrigger asChild>
											<button
												type="button"
												title="Sheet color"
												className="h-3 w-3 flex-shrink-0 rounded-full ring-1 ring-black/5"
												style={{
													backgroundColor:
														sheet.color ??
														"#94a3b8",
												}}
												onClick={(e) =>
													e.stopPropagation()
												}
											/>
										</PopoverTrigger>
										<PopoverContent
											align="start"
											className="w-auto p-2"
										>
											<div
												className="flex flex-wrap gap-1.5"
												style={{ maxWidth: 140 }}
											>
												{colors.map((c) => (
													<button
														key={c}
														type="button"
														onClick={() =>
															onColorChange(
																sheet.id,
																c,
															)
														}
														className={cx(
															"h-5 w-5 rounded-full ring-1 ring-black/5 transition-transform hover:scale-110",
															sheet.color === c &&
																"ring-2 ring-indigo-500",
														)}
														style={{
															backgroundColor: c,
														}}
													/>
												))}
											</div>
										</PopoverContent>
									</Popover>

									{editingSheetId === sheet.id ? (
										<input
											autoFocus
											value={sheet.name}
											onChange={(e) =>
												onRenameSheet(
													sheet.id,
													e.target.value,
												)
											}
											onBlur={() =>
												setEditingSheetId(null)
											}
											onKeyDown={(e) => {
												if (
													e.key === "Enter" ||
													e.key === "Escape"
												) {
													e.preventDefault();
													setEditingSheetId(null);
												}
											}}
											className="min-w-0 flex-1 rounded border border-indigo-300 bg-white px-1 py-0 font-semibold text-[12px] text-stone-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
										/>
									) : (
										<button
											type="button"
											onClick={() =>
												onSelectSheet(sheet.id)
											}
											onDoubleClick={
												isParam
													? undefined
													: () =>
															setEditingSheetId(
																sheet.id,
															)
											}
											title={
												isParam
													? "Parameters"
													: "Double-click to rename"
											}
											className="min-w-0 flex-1 truncate text-left font-semibold text-[12px] text-stone-700"
										>
											{sheet.name}
										</button>
									)}
									{!isParam && (
										<>
											<span className="flex-shrink-0 text-[10px] text-stone-400 tabular-nums">
												{sheet.visualizations.length}
											</span>
											<button
												type="button"
												onClick={() =>
													setEditingSheetId(sheet.id)
												}
												className="flex-shrink-0 rounded p-0.5 text-stone-400 opacity-0 transition-opacity hover:text-indigo-600 group-hover:opacity-100"
												title="Rename sheet"
											>
												<Pencil className="h-3 w-3" />
											</button>
										</>
									)}
									{!isParam && sheets.length > 1 && (
										<button
											type="button"
											onClick={() =>
												onDeleteSheet(sheet.id)
											}
											className="flex-shrink-0 rounded p-0.5 text-stone-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
											title="Delete sheet"
										>
											<Trash2 className="h-3 w-3" />
										</button>
									)}
								</div>

								{/* Visualizations under this sheet (hidden for the Parameters sheet) */}
								{!isParam && (
									<div className="mt-0.5 space-y-0.5 pl-3">
										{sheet.visualizations.map((viz) => {
											const VizIcon =
												VIZ_TYPE_META[
													viz.visualizationType as keyof typeof VIZ_TYPE_META
												]?.icon ?? BarChart2;
											const active =
												selectedVizId === viz.id &&
												isActiveSheet;
											return (
												<div
													key={viz.id}
													className={cx(
														"group flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs",
														active
															? "bg-indigo-50 text-indigo-700"
															: "text-stone-600 hover:bg-stone-50",
													)}
												>
													<VizIcon
														className={cx(
															"h-3.5 w-3.5 flex-shrink-0",
															active
																? "text-indigo-500"
																: "text-stone-400",
														)}
													/>
													{editingVizId === viz.id ? (
														<input
															autoFocus
															value={viz.title}
															onChange={(e) =>
																onRenameViz(
																	viz.id,
																	e.target
																		.value,
																)
															}
															onBlur={() =>
																onEditViz(null)
															}
															onKeyDown={(e) => {
																if (
																	e.key ===
																		"Enter" ||
																	e.key ===
																		"Escape"
																) {
																	e.preventDefault();
																	onEditViz(
																		null,
																	);
																}
															}}
															placeholder="Untitled"
															className="min-w-0 flex-1 rounded border border-indigo-300 bg-white px-1 py-0 font-medium text-stone-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
														/>
													) : (
														<button
															type="button"
															onClick={() =>
																onSelectViz(
																	sheet.id,
																	viz.id,
																)
															}
															onDoubleClick={() => {
																onSelectViz(
																	sheet.id,
																	viz.id,
																);
																onEditViz(
																	viz.id,
																);
															}}
															title="Double-click to rename"
															className={cx(
																"min-w-0 flex-1 truncate text-left",
																active &&
																	"font-semibold",
															)}
														>
															{viz.title ||
																"Untitled"}
														</button>
													)}
													{/* PHI/PII shield — red when flagged (always shown); a faint toggle on hover otherwise */}
													<button
														type="button"
														onClick={() =>
															onTogglePhi(viz.id)
														}
														title={
															viz.phi
																? "PHI/PII flagged — click to remove"
																: "Flag as PHI/PII"
														}
														aria-label="Toggle PHI/PII flag"
														className={cx(
															"flex-shrink-0 rounded p-0.5 transition-colors",
															viz.phi
																? "text-red-500 hover:text-red-600"
																: "hidden text-stone-400 hover:text-stone-600 group-hover:inline-flex",
														)}
													>
														<ShieldAlert className="h-3 w-3" />
													</button>
													{inLayout.has(viz.id) && (
														<span
															className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500 group-hover:hidden"
															title="In layout"
														/>
													)}
													{editingVizId !==
														viz.id && (
														<button
															type="button"
															onClick={() => {
																onSelectViz(
																	sheet.id,
																	viz.id,
																);
																onEditViz(
																	viz.id,
																);
															}}
															className="hidden flex-shrink-0 rounded p-0.5 text-stone-400 transition-colors hover:text-indigo-600 group-hover:inline-flex"
															title="Rename visualization"
														>
															<Pencil className="h-3 w-3" />
														</button>
													)}
													{sheet.visualizations
														.length > 1 && (
														<button
															type="button"
															onClick={() =>
																onRemoveViz(
																	viz.id,
																)
															}
															className="flex-shrink-0 rounded p-0.5 text-stone-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
															title="Remove visualization"
														>
															<X className="h-3 w-3" />
														</button>
													)}
												</div>
											);
										})}
										<button
											type="button"
											onClick={() => onAddViz(sheet.id)}
											className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 font-medium text-stone-400 text-xs transition-colors hover:bg-stone-50 hover:text-indigo-600"
										>
											<Plus className="h-3.5 w-3.5" />{" "}
											Visualization
										</button>
									</div>
								)}
							</div>
						);
					})}
				</div>
			</aside>
		</>
	);
}
