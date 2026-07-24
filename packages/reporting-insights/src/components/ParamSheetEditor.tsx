/**
 * ParamSheetEditor — two-panel editor shown in the dashboard editor when the
 * Parameters sheet is active. Left panel: accordion-based config. Right panel:
 * live preview of the param sheet.
 */

import {
	DragDropContext,
	Draggable,
	Droppable,
	type DropResult,
} from "@hello-pangea/dnd";
import {
	AlignCenter,
	AlignLeft,
	AlignRight,
	ChevronDown,
	GripVertical,
} from "lucide-react";
import { useState } from "react";
import { ParamSheet } from "@/components/ParamSheet";
import { ColorPicker } from "@/components/tools/shared/ColorPicker";
import type { ParamGroup } from "@/lib/resolveQuery";
import type { DashboardQuery, ParamSheetConfig } from "@/types/dashboard";

// ── Local accordion — open by default, no ToolSearchContext side-effects ──────
function Section({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	const [open, setOpen] = useState(true);
	return (
		<div className="border-stone-200 border-b last:border-b-0">
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				className="group flex w-full items-center justify-between px-5 py-3.5 transition-colors hover:bg-stone-50"
			>
				<span className="font-semibold text-sm text-stone-700 group-hover:text-stone-900">
					{title}
				</span>
				<ChevronDown
					className={`h-4 w-4 text-stone-400 transition-transform ${open ? "rotate-180" : ""}`}
				/>
			</button>
			{open && (
				<div className="border-stone-100 border-t bg-stone-50/50 px-5 py-4">
					<div className="space-y-4">{children}</div>
				</div>
			)}
		</div>
	);
}

// ── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle({
	checked,
	onChange,
}: {
	checked: boolean;
	onChange: (v: boolean) => void;
}) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			onClick={() => onChange(!checked)}
			className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
				checked ? "bg-indigo-600" : "bg-stone-200"
			}`}
		>
			<span
				className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
					checked ? "translate-x-4" : "translate-x-0"
				}`}
			/>
		</button>
	);
}

const inputCls =
	"w-full text-[13px] border border-stone-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400";
const labelCls = "block text-xs font-semibold text-stone-600 mb-1.5";

const FORM_ALIGN = [
	{
		val: "left" as const,
		icon: <AlignLeft className="h-3 w-3" />,
		lbl: "Left",
	},
	{
		val: "center" as const,
		icon: <AlignCenter className="h-3 w-3" />,
		lbl: "Center",
	},
	{
		val: "right" as const,
		icon: <AlignRight className="h-3 w-3" />,
		lbl: "Right",
	},
];

const BTN_ALIGN = [
	{ val: "full" as const, lbl: "Full" },
	{ val: "left" as const, lbl: "Left" },
	{ val: "center" as const, lbl: "Center" },
	{ val: "right" as const, lbl: "Right" },
];

interface ParamSheetEditorProps {
	paramGroups: ParamGroup[];
	queries: DashboardQuery[];
	config: ParamSheetConfig;
	onConfigChange: (patch: Partial<ParamSheetConfig>) => void;
	onUpdateQuery: (queryId: string, patch: Partial<DashboardQuery>) => void;
	previewValues: Record<string, string>;
	onPreviewValueChange: (name: string, val: string) => void;
	/** Run every query with the entered values (drives the Run button). */
	onRunAll?: () => void;
	/** Whether all required params have values (enables the Run button). */
	allSatisfied?: boolean;
	/** True while queries are running. */
	isRunning?: boolean;
}

export function ParamSheetEditor({
	paramGroups,
	queries,
	config,
	onConfigChange,
	onUpdateQuery,
	previewValues,
	onPreviewValueChange,
	onRunAll,
	allSatisfied = false,
	isRunning = false,
}: ParamSheetEditorProps) {
	const nonParamQueries = queries.filter((q) => q.parameters.length === 0);
	const allChecked =
		nonParamQueries.length > 0 &&
		nonParamQueries.every((q) => q.loadAfterParams);
	const someChecked = nonParamQueries.some((q) => q.loadAfterParams);
	const formAlignment = config.alignment ?? "center";
	const btnAlignment = config.runButtonAlignment ?? "full";
	const isCustomCols = config.columns !== undefined;

	return (
		<div className="flex h-full overflow-hidden">
			{/* ── Left panel: configuration ─────────────────────────────── */}
			<div className="w-72 flex-shrink-0 overflow-y-auto border-slate-200 border-r bg-white">
				{/* Layout */}
				<Section title="Layout">
					{/* Input Columns */}
					<div>
						<label className={labelCls}>Input Columns</label>
						<div className="flex items-center gap-3">
							<label className="flex cursor-pointer items-center gap-1.5">
								<input
									type="radio"
									name="cols-mode"
									checked={!isCustomCols}
									onChange={() =>
										onConfigChange({ columns: undefined })
									}
									className="text-indigo-600"
								/>
								<span className="text-stone-700 text-xs">
									Auto
								</span>
							</label>
							<label className="flex cursor-pointer items-center gap-1.5">
								<input
									type="radio"
									name="cols-mode"
									checked={isCustomCols}
									onChange={() =>
										onConfigChange({ columns: 2 })
									}
									className="text-indigo-600"
								/>
								<span className="text-stone-700 text-xs">
									Custom
								</span>
							</label>
							{isCustomCols && (
								<input
									type="number"
									min={1}
									max={6}
									value={config.columns ?? 2}
									onChange={(e) => {
										const v = Math.max(
											1,
											Math.min(6, Number(e.target.value)),
										);
										onConfigChange({
											columns: Number.isNaN(v) ? 2 : v,
										});
									}}
									className="w-16 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
								/>
							)}
						</div>
					</div>

					{/* Form Alignment */}
					<div>
						<label className={labelCls}>Form Alignment</label>
						<div className="flex gap-1">
							{FORM_ALIGN.map(({ val, icon, lbl }) => (
								<button
									key={val}
									type="button"
									onClick={() =>
										onConfigChange({ alignment: val })
									}
									className={`flex flex-1 items-center justify-center gap-1 rounded border py-1.5 text-xs transition-colors ${
										formAlignment === val
											? "border-indigo-600 bg-indigo-600 text-white"
											: "border-stone-200 bg-white text-stone-600 hover:border-indigo-300"
									}`}
								>
									{icon}
									{lbl}
								</button>
							))}
						</div>
					</div>
				</Section>

				{/* Labels */}
				<Section title="Labels">
					<div>
						<label className={labelCls}>Title</label>
						<input
							type="text"
							value={config.title ?? ""}
							placeholder="Query Parameters"
							onChange={(e) =>
								onConfigChange({
									title: e.target.value || undefined,
								})
							}
							className={inputCls}
						/>
					</div>
					<div>
						<label className={labelCls}>Description</label>
						<input
							type="text"
							value={config.description ?? ""}
							placeholder="Set values below, then click Run to load all charts."
							onChange={(e) =>
								onConfigChange({
									description: e.target.value || undefined,
								})
							}
							className={inputCls}
						/>
					</div>
					<div>
						<label className={labelCls}>Run Button Label</label>
						<input
							type="text"
							value={config.runButtonLabel ?? ""}
							placeholder="Run All"
							onChange={(e) =>
								onConfigChange({
									runButtonLabel: e.target.value || undefined,
								})
							}
							className={inputCls}
						/>
					</div>
				</Section>

				{/* Parameter Order */}
				<Section title="Parameter Order">
					{paramGroups.length === 0 ? (
						<p className="text-stone-400 text-xs italic">
							No parameters defined.
						</p>
					) : (
						<DragDropContext
							onDragEnd={(result: DropResult) => {
								if (!result.destination) return;
								const reordered = [...paramGroups];
								const [moved] = reordered.splice(
									result.source.index,
									1,
								);
								reordered.splice(
									result.destination.index,
									0,
									moved,
								);
								onConfigChange({
									paramGroupOrder: reordered.map(
										(g) => g.name,
									),
								});
							}}
						>
							<Droppable droppableId="param-order">
								{(provided) => (
									<div
										ref={provided.innerRef}
										{...provided.droppableProps}
										className="space-y-1.5"
									>
										{paramGroups.map((g, index) => (
											<Draggable
												key={g.name}
												draggableId={g.name}
												index={index}
											>
												{(p, snap) => (
													<div
														ref={p.innerRef}
														{...p.draggableProps}
														className={`flex items-center gap-2 rounded-md border px-2.5 py-2 text-xs transition-colors ${
															snap.isDragging
																? "border-indigo-400 bg-indigo-50 shadow-sm"
																: "border-stone-200 bg-white"
														}`}
													>
														<span
															{...p.dragHandleProps}
															className="cursor-grab text-stone-300 hover:text-stone-500"
														>
															<GripVertical className="h-3.5 w-3.5" />
														</span>
														<span className="flex-1 truncate font-medium text-stone-700">
															{g.label || g.name}
														</span>
														{g.param.required && (
															<span className="text-[10px] text-red-400">
																required
															</span>
														)}
													</div>
												)}
											</Draggable>
										))}
										{provided.placeholder}
									</div>
								)}
							</Droppable>
						</DragDropContext>
					)}
				</Section>

				{/* Connected Queries */}
				<Section title="Connected Queries">
					<p className="-mt-1 text-stone-400 text-xs leading-snug">
						Non-parameterized queries that run when Run is clicked.
					</p>
					{nonParamQueries.length === 0 ? (
						<p className="text-stone-400 text-xs italic">
							No non-parameterized queries.
						</p>
					) : (
						<div className="flex flex-col gap-2.5">
							{nonParamQueries.length > 1 && (
								<label className="flex cursor-pointer items-center gap-2.5 border-stone-100 border-b pb-2">
									<input
										type="checkbox"
										checked={allChecked}
										ref={(el) => {
											if (el)
												el.indeterminate =
													someChecked && !allChecked;
										}}
										onChange={(e) =>
											nonParamQueries.forEach((q) =>
												onUpdateQuery(q.id, {
													loadAfterParams:
														e.target.checked,
												}),
											)
										}
										className="h-3.5 w-3.5 rounded border-stone-300 text-indigo-600"
									/>
									<span className="font-semibold text-stone-600 text-xs">
										Select All
									</span>
								</label>
							)}
							{nonParamQueries.map((q) => (
								<label
									key={q.id}
									className="group flex cursor-pointer items-start gap-2.5"
								>
									<input
										type="checkbox"
										checked={q.loadAfterParams ?? false}
										onChange={(e) =>
											onUpdateQuery(q.id, {
												loadAfterParams:
													e.target.checked,
											})
										}
										className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 rounded border-stone-300 text-indigo-600"
									/>
									<span className="text-stone-700 text-xs leading-tight group-hover:text-stone-900">
										{q.name || "Untitled Query"}
									</span>
								</label>
							))}
						</div>
					)}
				</Section>

				{/* Button Customization */}
				<Section title="Button Customization">
					<ColorPicker
						label="Background Color"
						value={config.runButtonColor ?? ""}
						onChange={(v) =>
							onConfigChange({ runButtonColor: v || undefined })
						}
						defaultColor="#2563eb"
					/>

					<ColorPicker
						label="Font Color"
						value={config.runButtonFontColor ?? ""}
						onChange={(v) =>
							onConfigChange({
								runButtonFontColor: v || undefined,
							})
						}
						defaultColor="#ffffff"
					/>

					<div className="flex items-center justify-between">
						<span className="font-semibold text-stone-600 text-xs">
							Show Icon
						</span>
						<Toggle
							checked={config.runButtonShowIcon !== false}
							onChange={(v) =>
								onConfigChange({ runButtonShowIcon: v })
							}
						/>
					</div>

					<div>
						<label className={labelCls}>Button Alignment</label>
						<div className="flex gap-1">
							{BTN_ALIGN.map(({ val, lbl }) => (
								<button
									key={val}
									type="button"
									onClick={() =>
										onConfigChange({
											runButtonAlignment: val,
										})
									}
									className={`flex-1 rounded border py-1.5 text-[11px] transition-colors ${
										btnAlignment === val
											? "border-indigo-600 bg-indigo-600 text-white"
											: "border-stone-200 bg-white text-stone-600 hover:border-indigo-300"
									}`}
								>
									{lbl}
								</button>
							))}
						</div>
					</div>

					{btnAlignment !== "full" && (
						<div>
							<label className={labelCls}>Width</label>
							<div className="flex gap-2">
								<input
									type="number"
									min={0}
									value={config.runButtonWidth ?? ""}
									onChange={(e) =>
										onConfigChange({
											runButtonWidth:
												e.target.value || undefined,
										})
									}
									placeholder="200"
									className="flex-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
								/>
								<select
									value={config.runButtonWidthUnit ?? "px"}
									onChange={(e) =>
										onConfigChange({
											runButtonWidthUnit: e.target
												.value as "px" | "em" | "%",
										})
									}
									className="w-20 rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
								>
									{(["px", "em", "%"] as const).map((u) => (
										<option key={u} value={u}>
											{u}
										</option>
									))}
								</select>
							</div>
						</div>
					)}
				</Section>
			</div>

			{/* ── Right panel: preview ──────────────────────────────────── */}
			<div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-stone-50">
				<div className="flex flex-shrink-0 items-center gap-2 border-slate-200 border-b bg-white px-4 py-2.5">
					<span className="font-semibold text-slate-500 text-xs">
						Preview
					</span>
					<span className="text-[10px] text-slate-400">
						— values are for preview only
					</span>
				</div>
				<div className="flex-1 overflow-auto p-6">
					{paramGroups.length === 0 ? (
						<div className="flex h-full items-center justify-center text-center">
							<p className="text-slate-400 text-sm">
								Add{" "}
								<code className="rounded bg-slate-100 px-1 font-mono text-xs">
									{"{{paramName}}"}
								</code>{" "}
								tokens to a query to see a preview here.
							</p>
						</div>
					) : (
						<ParamSheet
							paramGroups={paramGroups}
							values={previewValues}
							onChangeValue={onPreviewValueChange}
							onRunAll={() => onRunAll?.()}
							allSatisfied={allSatisfied}
							isRunning={isRunning}
							config={config}
						/>
					)}
				</div>
			</div>
		</div>
	);
}
