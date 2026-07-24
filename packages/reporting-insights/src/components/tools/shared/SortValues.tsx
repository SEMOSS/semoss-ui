import {
	ChevronDown,
	ChevronRight,
	ChevronUp,
	Plus,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import { Select } from "@/components/ui";
import { columnLooksLikeDates, distinctColumnValues } from "@/lib/vizSort";
/**
 * "Sort Values" shared tool — lets the author define an ordered list of sort
 * rules (column + direction) applied client-side before the visualization
 * renders. Supports Ascending, Descending, Chronological (date columns only),
 * and Custom (drag-free arrow-based reordering of distinct values).
 */
import type { SortDirection, SortRule } from "@/types/dashboard";
import { ResetButton } from "./ResetButton";

interface SortValuesProps {
	columns: string[];
	rows?: Array<Record<string, unknown>>;
	value?: SortRule[];
	onChange: (next: SortRule[]) => void;
	onReset: () => void;
}

const FIELD =
	"w-full px-2.5 py-1.5 text-[13px] border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400";

function makeId(): string {
	return Math.random().toString(36).slice(2, 10);
}

function makeRule(column: string): SortRule {
	return { id: makeId(), column, direction: "asc" };
}

const DIR_LABELS: Record<SortDirection, string> = {
	asc: "Ascending",
	desc: "Descending",
	chronological: "Chronological",
	custom: "Custom",
};

export function SortValues({
	columns,
	rows = [],
	value = [],
	onChange,
	onReset,
}: SortValuesProps) {
	const [expanded, setExpanded] = useState<Set<string>>(new Set());

	const toggle = (id: string) =>
		setExpanded((prev) => {
			const next = new Set(prev);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});

	const update = (id: string, patch: Partial<SortRule>) =>
		onChange(value.map((r) => (r.id === id ? { ...r, ...patch } : r)));

	const remove = (id: string) => {
		onChange(value.filter((r) => r.id !== id));
		setExpanded((prev) => {
			const next = new Set(prev);
			next.delete(id);
			return next;
		});
	};

	const addRule = () => {
		const col = columns[0] ?? "";
		const rule = makeRule(col);
		onChange([...value, rule]);
		setExpanded((prev) => new Set(prev).add(rule.id));
	};

	// Columns already used in a prior rule (can't sort the same column twice)
	const usedCols = new Set(value.map((r) => r.column));

	return (
		<div className="space-y-2">
			{value.length === 0 && (
				<p className="rounded-lg border border-stone-200 border-dashed px-3 py-3 text-center text-[12px] text-stone-400">
					No sort rules yet.
				</p>
			)}

			{value.map((rule, idx) => {
				const isOpen = expanded.has(rule.id);
				const isDateCol = columnLooksLikeDates(rows, rule.column);
				// Available columns: own column + columns not used by other rules
				const availableCols = columns.filter(
					(c) => c === rule.column || !usedCols.has(c),
				);

				return (
					<div
						key={rule.id}
						className="overflow-hidden rounded-lg border border-stone-200 bg-white"
					>
						{/* Card header — always visible */}
						<div className="flex items-center gap-2 px-3 py-2.5">
							<button
								type="button"
								onClick={() => toggle(rule.id)}
								className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
							>
								{isOpen ? (
									<ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-stone-400" />
								) : (
									<ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-stone-400" />
								)}
								<span className="truncate font-semibold text-[13px] text-stone-700">
									{idx + 1}. {rule.column || "Select column"}
								</span>
								<span className="ml-1 flex-shrink-0 rounded-md bg-indigo-50 px-1.5 py-0.5 font-semibold text-[11px] text-indigo-600">
									{DIR_LABELS[rule.direction]}
								</span>
							</button>
							<button
								type="button"
								onClick={() => remove(rule.id)}
								title="Remove rule"
								className="flex-shrink-0 rounded p-1 text-stone-300 hover:bg-red-50 hover:text-red-500"
							>
								<Trash2 className="h-3.5 w-3.5" />
							</button>
						</div>

						{/* Expanded body */}
						{isOpen && (
							<div className="space-y-3 border-stone-100 border-t bg-stone-50/60 px-3 py-3">
								{/* Column selector */}
								<div>
									<label className="mb-1 block font-semibold text-[11px] text-stone-400 uppercase tracking-wider">
										Column
									</label>
									<Select
										value={rule.column}
										onChange={(e) => {
											const col = e.target.value;
											update(rule.id, {
												column: col,
												direction: "asc",
												customOrder: undefined,
											});
										}}
										className={FIELD}
									>
										{availableCols.map((c) => (
											<option key={c} value={c}>
												{c}
											</option>
										))}
									</Select>
								</div>

								{/* Direction button group */}
								<div>
									<label className="mb-1 block font-semibold text-[11px] text-stone-400 uppercase tracking-wider">
										Sort Direction
									</label>
									<div className="flex flex-wrap gap-1">
										{(
											["asc", "desc"] as SortDirection[]
										).map((dir) => (
											<DirButton
												key={dir}
												label={DIR_LABELS[dir]}
												active={rule.direction === dir}
												onClick={() =>
													update(rule.id, {
														direction: dir,
														customOrder: undefined,
													})
												}
											/>
										))}
										{isDateCol && (
											<DirButton
												label={DIR_LABELS.chronological}
												active={
													rule.direction ===
													"chronological"
												}
												onClick={() =>
													update(rule.id, {
														direction:
															"chronological",
														customOrder: undefined,
													})
												}
											/>
										)}
										<DirButton
											label={DIR_LABELS.custom}
											active={rule.direction === "custom"}
											onClick={() => {
												const vals =
													distinctColumnValues(
														rows,
														rule.column,
													);
												update(rule.id, {
													direction: "custom",
													customOrder: rule
														.customOrder?.length
														? rule.customOrder
														: vals,
												});
											}}
										/>
									</div>
								</div>

								{/* Custom order editor */}
								{rule.direction === "custom" && (
									<CustomOrderEditor
										column={rule.column}
										rows={rows}
										order={rule.customOrder ?? []}
										onChange={(customOrder) =>
											update(rule.id, { customOrder })
										}
									/>
								)}
							</div>
						)}
					</div>
				);
			})}

			{/* Add + Reset row */}
			<div className="flex items-center justify-between pt-1">
				<button
					type="button"
					onClick={addRule}
					disabled={
						columns.length === 0 || value.length >= columns.length
					}
					className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 font-semibold text-[12px] text-indigo-600 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-40"
				>
					<Plus className="h-3.5 w-3.5" /> Add Sort Rule
				</button>
				<ResetButton onReset={onReset} label="Reset All" />
			</div>
		</div>
	);
}

// ── Direction toggle button ───────────────────────────────────────────────────
function DirButton({
	label,
	active,
	onClick,
}: {
	label: string;
	active: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`rounded-md px-2.5 py-1 font-semibold text-[12px] transition-colors ${
				active
					? "bg-indigo-600 text-white shadow-soft"
					: "border border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
			}`}
		>
			{label}
		</button>
	);
}

// ── Custom order editor ───────────────────────────────────────────────────────
function CustomOrderEditor({
	column,
	rows,
	order,
	onChange,
}: {
	column: string;
	rows: Array<Record<string, unknown>>;
	order: string[];
	onChange: (next: string[]) => void;
}) {
	// Merge: show ordered items first, then any sample values not yet in the list
	const sampleVals = distinctColumnValues(rows, column);
	const inOrder = order.filter((v) => v != null && v !== "");
	const missing = sampleVals.filter((v) => !inOrder.includes(v));
	const full = [...inOrder, ...missing];

	const move = (idx: number, dir: -1 | 1) => {
		const next = [...full];
		const target = idx + dir;
		if (target < 0 || target >= next.length) return;
		[next[idx], next[target]] = [next[target], next[idx]];
		onChange(next);
	};

	if (!full.length) {
		return (
			<p className="text-[12px] text-stone-400 italic">
				No values found in sample data for <strong>{column}</strong>.
			</p>
		);
	}

	return (
		<div>
			<label className="mb-1.5 block font-semibold text-[11px] text-stone-400 uppercase tracking-wider">
				Custom Order
			</label>
			<div className="divide-y divide-stone-100 overflow-hidden rounded-lg border border-stone-200 bg-white">
				{full.map((val, idx) => (
					<div
						key={val}
						className="flex items-center gap-2 px-2.5 py-1.5"
					>
						<span
							className="flex-1 truncate text-[13px] text-stone-700"
							title={val}
						>
							{val}
						</span>
						<div className="flex flex-shrink-0 items-center gap-0.5">
							<button
								type="button"
								onClick={() => move(idx, -1)}
								disabled={idx === 0}
								title="Move up"
								className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 disabled:cursor-not-allowed disabled:opacity-30"
							>
								<ChevronUp className="h-3.5 w-3.5" />
							</button>
							<button
								type="button"
								onClick={() => move(idx, 1)}
								disabled={idx === full.length - 1}
								title="Move down"
								className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 disabled:cursor-not-allowed disabled:opacity-30"
							>
								<ChevronDown className="h-3.5 w-3.5" />
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
