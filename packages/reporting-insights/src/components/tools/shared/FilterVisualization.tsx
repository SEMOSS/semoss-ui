import { Plus, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Input, Select } from "@/components/ui";
/**
 * "Filter Visualization" tool — build an author-defined rule tree that always
 * filters this single visualization's rows. Mirrors the rule/nested-rule UX of
 * Color by Value, but produces a boolean filter (see `@/lib/vizFilter`).
 *
 *   + Rule          → adds `<column> <comparator> <values>` to the current group
 *   + Nested Rule   → adds a nested group, e.g. col >= 1 && (col <= 2 || col > 0)
 *   AND / OR        → per-group conjunction joining its children
 */
import {
	comparatorTakesValues,
	makeVizFilterCondition,
	makeVizFilterGroup,
	VIZ_FILTER_COMPARATORS,
	type VizFilterComparator,
	type VizFilterCondition,
	type VizFilterGroup,
	type VizFilterNode,
} from "@/lib/vizFilter";
import { ResetButton } from "./ResetButton";
import { SearchableSelect } from "./SearchableSelect";

interface FilterVisualizationProps {
	columns: string[];
	/** Sample rows (from the editor preview) used to suggest distinct values. */
	rows?: Array<Record<string, unknown>>;
	value?: VizFilterGroup;
	onChange: (next: VizFilterGroup) => void;
	onReset: () => void;
}

const FIELD =
	"w-full px-2.5 py-1.5 text-[13px] border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400";

/** Distinct, non-empty cell values for a column from the sample rows (capped). */
function distinctValues(
	rows: Array<Record<string, unknown>> | undefined,
	column: string,
): string[] {
	if (!rows?.length || !column) return [];
	const seen = new Set<string>();
	for (const row of rows) {
		const v = row?.[column];
		const s = v == null ? "" : String(v);
		if (s && !seen.has(s)) seen.add(s);
		if (seen.size >= 500) break;
	}
	return Array.from(seen).sort((a, b) =>
		a.localeCompare(b, undefined, { numeric: true }),
	);
}

export function FilterVisualization({
	columns,
	rows,
	value,
	onChange,
	onReset,
}: FilterVisualizationProps) {
	// The root is always a group; create a default empty one for editing.
	const root: VizFilterGroup = value ?? makeVizFilterGroup("AND");

	return (
		<div className="space-y-3">
			<p className="text-[12px] text-stone-500 leading-relaxed">
				Filter this visualization to rows that match your rules. Add
				rules and combine them with{" "}
				<span className="font-semibold">AND</span> /{" "}
				<span className="font-semibold">OR</span>, or nest groups for
				expressions like{" "}
				<code className="rounded bg-stone-100 px-1 font-mono">
					a ≥ 1 AND (b ≤ 2 OR c &gt; 0)
				</code>
				.
			</p>

			<GroupEditor
				group={root}
				columns={columns}
				rows={rows}
				depth={0}
				isRoot
				onChange={onChange}
			/>

			<div className="pt-1">
				<ResetButton onReset={onReset} />
			</div>
		</div>
	);
}

// ── Group (recursive) ──────────────────────────────────────────────────────────
function GroupEditor({
	group,
	columns,
	rows,
	depth,
	isRoot,
	onChange,
	onRemove,
}: {
	group: VizFilterGroup;
	columns: string[];
	rows?: Array<Record<string, unknown>>;
	depth: number;
	isRoot?: boolean;
	onChange: (next: VizFilterGroup) => void;
	onRemove?: () => void;
}) {
	const setChild = (id: string, next: VizFilterNode) =>
		onChange({
			...group,
			children: group.children.map((c) => (c.id === id ? next : c)),
		});
	const removeChild = (id: string) =>
		onChange({
			...group,
			children: group.children.filter((c) => c.id !== id),
		});
	const addRule = () =>
		onChange({
			...group,
			children: [
				...group.children,
				makeVizFilterCondition(columns[0] ?? ""),
			],
		});
	const addNested = () =>
		onChange({
			...group,
			children: [...group.children, makeVizFilterGroup("AND")],
		});
	const setConjunction = (conjunction: "AND" | "OR") =>
		onChange({ ...group, conjunction });

	return (
		<div
			className={
				isRoot
					? "space-y-2"
					: "space-y-2 rounded-lg border border-stone-200 bg-stone-50/60 p-2.5"
			}
		>
			{!isRoot && (
				<div className="flex items-center justify-between">
					<span className="font-semibold text-[10px] text-stone-400 uppercase tracking-widest">
						Nested group
					</span>
					{onRemove && (
						<button
							type="button"
							onClick={onRemove}
							title="Remove group"
							className="rounded p-1 text-stone-400 hover:bg-red-50 hover:text-red-500"
						>
							<Trash2 className="h-3.5 w-3.5" />
						</button>
					)}
				</div>
			)}

			{group.children.length === 0 && (
				<p className="rounded-lg border border-stone-200 border-dashed px-3 py-3 text-center text-[12px] text-stone-400">
					No rules yet.
				</p>
			)}

			{group.children.map((child, idx) => (
				<div key={child.id} className="space-y-2">
					{/* Conjunction connector between children */}
					{idx > 0 && (
						<div className="flex items-center gap-2">
							<div className="inline-flex items-center gap-0.5 rounded-md bg-stone-100 p-0.5">
								{(["AND", "OR"] as const).map((c) => (
									<button
										key={c}
										type="button"
										onClick={() => setConjunction(c)}
										className={`rounded px-2 py-0.5 font-semibold text-[11px] transition-colors ${
											group.conjunction === c
												? "bg-white text-indigo-600 shadow-soft"
												: "text-stone-500 hover:text-stone-700"
										}`}
									>
										{c}
									</button>
								))}
							</div>
							<div className="h-px flex-1 bg-stone-100" />
						</div>
					)}

					{child.kind === "group" ? (
						<GroupEditor
							group={child}
							columns={columns}
							rows={rows}
							depth={depth + 1}
							onChange={(next) => setChild(child.id, next)}
							onRemove={() => removeChild(child.id)}
						/>
					) : (
						<ConditionEditor
							condition={child}
							columns={columns}
							rows={rows}
							onChange={(next) => setChild(child.id, next)}
							onRemove={() => removeChild(child.id)}
						/>
					)}
				</div>
			))}

			<div className="flex flex-wrap gap-2 pt-0.5">
				<button
					type="button"
					onClick={addRule}
					className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 font-semibold text-[12px] text-indigo-600 hover:bg-indigo-100"
				>
					<Plus className="h-3.5 w-3.5" /> Rule
				</button>
				{depth < 3 && (
					<button
						type="button"
						onClick={addNested}
						className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 font-semibold text-[12px] text-stone-600 hover:bg-stone-50"
					>
						<Plus className="h-3.5 w-3.5" /> Nested Rule
					</button>
				)}
			</div>
		</div>
	);
}

// ── Single condition ─────────────────────────────────────────────────────────
function ConditionEditor({
	condition,
	columns,
	rows,
	onChange,
	onRemove,
}: {
	condition: VizFilterCondition;
	columns: string[];
	rows?: Array<Record<string, unknown>>;
	onChange: (next: VizFilterCondition) => void;
	onRemove: () => void;
}) {
	const takesValues = comparatorTakesValues(condition.comparator);
	return (
		<div className="space-y-2 rounded-lg border border-stone-200 bg-white p-2.5">
			<div className="flex items-start gap-2">
				<div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
					<SearchableSelect
						value={condition.column}
						options={columns}
						onChange={(column) =>
							onChange({ ...condition, column })
						}
						placeholder="Select column…"
						searchPlaceholder="Search columns…"
						ariaLabel="Column"
					/>
					<Select
						value={condition.comparator}
						onChange={(e) =>
							onChange({
								...condition,
								comparator: e.target
									.value as VizFilterComparator,
							})
						}
						className={FIELD}
						aria-label="Comparator"
					>
						{VIZ_FILTER_COMPARATORS.map((c) => (
							<option key={c.value} value={c.value}>
								{c.label}
							</option>
						))}
					</Select>
				</div>
				<button
					type="button"
					onClick={onRemove}
					title="Remove rule"
					className="mt-0.5 flex-shrink-0 rounded p-1.5 text-stone-300 hover:bg-red-50 hover:text-red-500"
				>
					<Trash2 className="h-4 w-4" />
				</button>
			</div>

			{takesValues && (
				<ValuePicker
					column={condition.column}
					rows={rows}
					values={condition.values}
					onChange={(values) => onChange({ ...condition, values })}
				/>
			)}
		</div>
	);
}

// ── Value multiselect (distinct suggestions + free text) ───────────────────────
function ValuePicker({
	column,
	rows,
	values,
	onChange,
}: {
	column: string;
	rows?: Array<Record<string, unknown>>;
	values: string[];
	onChange: (next: string[]) => void;
}) {
	const [draft, setDraft] = useState("");
	const suggestions = useMemo(
		() => distinctValues(rows, column),
		[rows, column],
	);
	const listId = `vf-vals-${column || "col"}`;

	const add = (v: string) => {
		const t = v.trim();
		if (!t || values.includes(t)) {
			setDraft("");
			return;
		}
		onChange([...values, t]);
		setDraft("");
	};
	const remove = (v: string) => onChange(values.filter((x) => x !== v));
	const allSelected =
		suggestions.length > 0 && suggestions.every((s) => values.includes(s));

	return (
		<div className="space-y-1.5">
			{values.length > 0 && (
				<div className="flex flex-wrap gap-1">
					{values.map((v) => (
						<span
							key={v}
							className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[12px] text-indigo-700"
						>
							{v}
							<button
								type="button"
								onClick={() => remove(v)}
								className="text-indigo-400 hover:text-red-500"
							>
								<X className="h-3 w-3" />
							</button>
						</span>
					))}
				</div>
			)}
			<Input
				list={listId}
				value={draft}
				onChange={(e) => setDraft(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						e.preventDefault();
						add(draft);
					}
				}}
				onBlur={() => draft && add(draft)}
				placeholder={
					suggestions.length
						? "Pick or type a value, Enter to add"
						: "Type a value, Enter to add"
				}
				className={FIELD}
			/>
			{suggestions.length > 0 && (
				<datalist id={listId}>
					{suggestions.map((s) => (
						<option key={s} value={s} />
					))}
				</datalist>
			)}
			{suggestions.length > 0 && (
				<div className="flex items-center gap-3 text-[11px]">
					<button
						type="button"
						onClick={() =>
							onChange(
								allSelected
									? []
									: Array.from(
											new Set([
												...values,
												...suggestions,
											]),
										),
							)
						}
						className="font-semibold text-indigo-600 hover:text-indigo-700"
					>
						{allSelected ? "Clear all" : "Select all"}
					</button>
					<span className="text-stone-400">
						{suggestions.length} value
						{suggestions.length !== 1 ? "s" : ""} in sample
					</span>
				</div>
			)}
		</div>
	);
}
