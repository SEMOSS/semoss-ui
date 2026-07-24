import { ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Checkbox, Input, Select } from "@/components/ui";
import type {
	DefaultNumericFormat,
	FormatDelimiter,
	FormatNumberMode,
	FormatRule,
	FormatRuleType,
} from "@/types/dashboard";
import { ResetButton } from "./ResetButton";

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_BADGE: Record<
	FormatRuleType,
	{ label: string; bg: string; text: string; tip: string }
> = {
	string: {
		label: "STR",
		bg: "bg-sky-100",
		text: "text-sky-700",
		tip: "String",
	},
	int: {
		label: "INT",
		bg: "bg-emerald-100",
		text: "text-emerald-700",
		tip: "Integer",
	},
	double: {
		label: "DEC",
		bg: "bg-violet-100",
		text: "text-violet-700",
		tip: "Decimal",
	},
	date: {
		label: "DATE",
		bg: "bg-orange-100",
		text: "text-orange-700",
		tip: "Date",
	},
};

const FIELD =
	"w-full px-3 py-2 text-sm border border-stone-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white";

/** Each entry shows the example output as the label; the value is the format token string. */
const DATE_FORMATS: { label: string; value: string }[] = [
	{ label: "1879-03-14", value: "YYYY-MM-DD" },
	{ label: "03/14/1879", value: "MM/DD/YYYY" },
	{ label: "3/14/1879", value: "M/DD/YYYY" },
	{ label: "03/14/79", value: "MM/DD/YY" },
	{ label: "03/14", value: "MM/DD" },
	{ label: "March 14, 1879", value: "MMMM D, YYYY" },
	{ label: "14-Mar", value: "DD-MMM" },
	{ label: "14-Mar-79", value: "DD-MMM-YY" },
	{ label: "14-Mar-1879", value: "DD-MMM-YYYY" },
	{ label: "Mar-79", value: "MMM-YY" },
	{ label: "Friday, March 14, 1879", value: "dddd, MMMM D, YYYY" },
	{ label: "1879", value: "YYYY" },
	{ label: "187903", value: "YYYYMM" },
	{ label: "18790314", value: "YYYYMMDD" },
	{ label: "1879-03-14 13:30:55", value: "YYYY-MM-DD HH:mm:ss" },
	{ label: "1879-03-14 1:30 PM", value: "YYYY-MM-DD h:mm A" },
	{ label: "1879-03-14 13:30", value: "YYYY-MM-DD HH:mm" },
];

const DEFAULT_FORMATS: { label: string; value: DefaultNumericFormat }[] = [
	{ label: "1000", value: "raw" },
	{ label: "1,000", value: "comma" },
	{ label: "$1000", value: "dollar" },
	{ label: "$1,000", value: "dollar-comma" },
	{ label: "10%", value: "percent" },
	{ label: "1.00k", value: "k" },
	{ label: "1.00M", value: "M" },
	{ label: "1.00B", value: "B" },
	{ label: "1.00T", value: "T" },
	{ label: "Accounting ($)", value: "accounting" },
	{ label: "Scientific (1.00E+03)", value: "scientific" },
];

const FORMAT_NUMBER_OPTIONS: { label: string; value: FormatNumberMode }[] = [
	{ label: "None", value: "none" },
	{ label: "Thousand", value: "thousand" },
	{ label: "Million", value: "million" },
	{ label: "Billion", value: "billion" },
	{ label: "Trillion", value: "trillion" },
	{ label: "Accounting", value: "accounting" },
	{ label: "Scientific", value: "scientific" },
	{ label: "Percentage", value: "percentage" },
];

const DELIMITER_OPTIONS: { label: string; value: FormatDelimiter }[] = [
	{ label: "None", value: "none" },
	{ label: "Comma", value: "comma" },
	{ label: "Period", value: "period" },
];

// Helper functions

function inferColumnType(
	col: string,
	rows: Array<Record<string, unknown>>,
): FormatRuleType {
	const vals = rows
		.map((r) => r[col])
		.filter((v) => v != null && v !== "")
		.slice(0, 5);
	if (!vals.length) return "string";
	const first = vals[0];
	if (typeof first === "number") {
		return vals.every((v) => Number.isInteger(v as number))
			? "int"
			: "double";
	}
	if (typeof first === "string") {
		if (
			/^\d{4}-\d{2}-\d{2}/.test(first) ||
			/^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(first)
		)
			return "date";
		if (first.trim() !== "" && !isNaN(Number(first))) {
			return first.includes(".") ? "double" : "int";
		}
	}
	return "string";
}

function formatRuleSummary(rule: FormatRule): string {
	const parts: string[] = [];
	if (rule.prepend) parts.push(`"${rule.prepend}…"`);
	if (rule.append) parts.push(`…"${rule.append}"`);
	if (rule.type === "date" && rule.dateFormat) {
		const match = DATE_FORMATS.find((f) => f.value === rule.dateFormat);
		parts.push(match?.label ?? rule.dateFormat);
	} else if (rule.type === "int" || rule.type === "double") {
		if (rule.useDefaultFormat && rule.defaultFormat) {
			const match = DEFAULT_FORMATS.find(
				(f) => f.value === rule.defaultFormat,
			);
			if (match) parts.push(match.label);
		} else if (!rule.useDefaultFormat) {
			if (rule.formatNumber && rule.formatNumber !== "none") {
				const match = FORMAT_NUMBER_OPTIONS.find(
					(f) => f.value === rule.formatNumber,
				);
				parts.push(match?.label ?? rule.formatNumber);
			}
			if (rule.roundValue !== undefined && rule.roundValue > 0)
				parts.push(`${rule.roundValue} dec.`);
			if (rule.delimiter && rule.delimiter !== "none")
				parts.push(`${rule.delimiter} sep.`);
		}
	}
	return parts.length ? parts.join(" · ") : "No special format";
}

function makeDraft(col: string, type: FormatRuleType): FormatRule {
	return {
		id: `fmt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
		column: col,
		type,
		prepend: "",
		append: "",
		useDefaultFormat: true,
		defaultFormat: "comma",
		formatNumber: "none",
		roundValue: 0,
		delimiter: "none",
		dateFormat: "MM/DD/YYYY",
	};
}

interface DimensionSelectProps {
	columns: string[];
	columnTypes: Record<string, FormatRuleType>;
	value: string;
	onChange: (col: string, type: FormatRuleType) => void;
}

function DimensionSelect({
	columns,
	columnTypes,
	value,
	onChange,
}: DimensionSelectProps) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Close on outside click
	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				setOpen(false);
				setSearch("");
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	const filtered = search
		? columns.filter((c) => c.toLowerCase().includes(search.toLowerCase()))
		: columns;

	const selectedType = columnTypes[value];
	const badge = selectedType ? TYPE_BADGE[selectedType] : null;

	const openList = () => {
		setOpen(true);
		setSearch("");
		setTimeout(() => inputRef.current?.focus(), 0);
	};

	const select = (col: string) => {
		onChange(col, columnTypes[col] ?? "string");
		setOpen(false);
		setSearch("");
	};

	return (
		<div className="relative" ref={containerRef}>
			{/* Trigger */}
			<div
				role="combobox"
				aria-expanded={open}
				onClick={openList}
				className="flex w-full cursor-pointer items-center gap-2 rounded border border-stone-200 bg-white px-3 py-2 text-sm focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/20 hover:border-stone-300"
			>
				{open ? (
					<Input
						ref={inputRef}
						type="text"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Escape") {
								setOpen(false);
								setSearch("");
							}
							if (e.key === "Enter" && filtered.length > 0)
								select(filtered[0]);
						}}
						placeholder="Search dimensions…"
						className="flex-1 bg-transparent text-stone-800 outline-none placeholder:text-stone-400"
						onClick={(e) => e.stopPropagation()}
					/>
				) : (
					<span
						className={`flex-1 truncate ${value ? "text-stone-800" : "text-stone-400"}`}
					>
						{value || "Select dimension…"}
					</span>
				)}
				{/* Type badge for selected column (when closed) */}
				{!open && badge && (
					<span
						className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 font-bold text-xs ${badge.bg} ${badge.text}`}
					>
						{badge.label}
					</span>
				)}
				<ChevronDown
					className={`h-3.5 w-3.5 shrink-0 text-stone-400 transition-transform ${open ? "rotate-180" : ""}`}
				/>
			</div>

			{/* Dropdown list */}
			{open && (
				<div className="absolute top-full right-0 left-0 z-30 mt-1 max-h-48 overflow-y-auto rounded-lg border border-stone-200 bg-white shadow-lg">
					{filtered.length === 0 ? (
						<p className="px-3 py-2 text-stone-400 text-xs">
							No dimensions match
						</p>
					) : (
						filtered.map((col) => {
							const type = columnTypes[col] ?? "string";
							const b = TYPE_BADGE[type];
							const isSelected = col === value;
							return (
								<button
									key={col}
									type="button"
									onMouseDown={(e) => {
										e.preventDefault();
										select(col);
									}}
									className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors ${
										isSelected
											? "bg-indigo-50 font-medium text-indigo-700"
											: "text-stone-700 hover:bg-stone-50"
									}`}
								>
									<span className="truncate">{col}</span>
									<span
										className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 font-bold text-xs ${b.bg} ${b.text}`}
									>
										{b.label}
									</span>
								</button>
							);
						})
					)}
				</div>
			)}
		</div>
	);
}

interface FormatDataValuesProps {
	columns: string[];
	rows?: Array<Record<string, unknown>>;
	value: FormatRule[];
	onChange: (rules: FormatRule[]) => void;
	onReset: () => void;
}

export function FormatDataValues({
	columns,
	rows = [],
	value,
	onChange,
	onReset,
}: FormatDataValuesProps) {
	const [draft, setDraft] = useState<FormatRule | null>(null);
	const [editingId, setEditingId] = useState<string | null>(null);

	// Pre-compute type for every column once per columns/rows change
	const columnTypes = useMemo(
		() =>
			Object.fromEntries(
				columns.map((col) => [col, inferColumnType(col, rows)]),
			),
		[columns, rows],
	);

	const upd = (updates: Partial<FormatRule>) =>
		setDraft((prev) => (prev ? { ...prev, ...updates } : null));

	const openNew = () => {
		const col = columns[0] ?? "";
		setDraft(makeDraft(col, columnTypes[col] ?? "string"));
		setEditingId(null);
	};

	const openEdit = (rule: FormatRule) => {
		setDraft({ ...rule });
		setEditingId(rule.id);
	};

	const cancel = () => {
		setDraft(null);
		setEditingId(null);
	};

	const commit = () => {
		if (!draft?.column) return;
		if (editingId) {
			onChange(value.map((r) => (r.id === editingId ? draft : r)));
		} else {
			onChange([...value, draft]);
		}
		cancel();
	};

	const deleteRule = (id: string) =>
		onChange(value.filter((r) => r.id !== id));

	const isNumeric =
		draft && (draft.type === "int" || draft.type === "double");
	const isDate = draft?.type === "date";

	return (
		<div className="space-y-4">
			{/* Add button (only visible when form is closed) */}
			{!draft && (
				<button
					type="button"
					onClick={openNew}
					disabled={columns.length === 0}
					className="inline-flex w-full items-center justify-center gap-2 rounded bg-indigo-50 px-4 py-2 font-semibold text-indigo-600 text-sm transition-colors hover:bg-indigo-100 hover:text-indigo-700 disabled:pointer-events-none disabled:opacity-40"
				>
					<Plus className="h-4 w-4" />
					Add Format Rule
				</button>
			)}

			{/* Format Data ValuesForm */}
			{draft && (
				<div className="space-y-3 rounded-lg border border-indigo-200 bg-indigo-50/30 p-4">
					<p className="font-semibold text-indigo-700 text-xs">
						{editingId ? "Edit Format Rule" : "New Format Rule"}
					</p>

					{/* Select Dimension: Searchable combobox with type badges */}
					<div>
						<label className="mb-1.5 block font-medium text-stone-600 text-xs">
							Select Dimension
						</label>
						<DimensionSelect
							columns={columns}
							columnTypes={columnTypes}
							value={draft.column}
							onChange={(col, type) => upd({ column: col, type })}
						/>
					</div>

					{/* Prepend / Append */}
					<div className="grid grid-cols-2 gap-2">
						<div>
							<label className="mb-1.5 block font-medium text-stone-600 text-xs">
								Prepend Value
							</label>
							<Input
								type="text"
								value={draft.prepend ?? ""}
								onChange={(e) =>
									upd({ prepend: e.target.value })
								}
								placeholder="e.g. $"
								className={FIELD}
							/>
						</div>
						<div>
							<label className="mb-1.5 block font-medium text-stone-600 text-xs">
								Append Value
							</label>
							<Input
								type="text"
								value={draft.append ?? ""}
								onChange={(e) =>
									upd({ append: e.target.value })
								}
								placeholder="e.g. %"
								className={FIELD}
							/>
						</div>
					</div>

					{/* Numeric options */}
					{isNumeric && (
						<div className="space-y-3 border-stone-100 border-t pt-2">
							<label className="flex cursor-pointer items-center gap-2">
								<Checkbox
									checked={draft.useDefaultFormat ?? true}
									onChange={(e) =>
										upd({
											useDefaultFormat: e.target.checked,
										})
									}
								/>
								<span className="font-medium text-sm text-stone-700">
									Use default format
								</span>
							</label>

							{draft.useDefaultFormat ? (
								<div>
									<label className="mb-1.5 block font-medium text-stone-600 text-xs">
										Default Format Options
									</label>
									<Select
										value={draft.defaultFormat ?? "comma"}
										onChange={(e) =>
											upd({
												defaultFormat: e.target
													.value as DefaultNumericFormat,
											})
										}
										className={FIELD}
									>
										{DEFAULT_FORMATS.map((f) => (
											<option
												key={f.value}
												value={f.value}
											>
												{f.label}
											</option>
										))}
									</Select>
								</div>
							) : (
								<>
									<div>
										<label className="mb-1.5 block font-medium text-stone-600 text-xs">
											Format Number
										</label>
										<Select
											value={draft.formatNumber ?? "none"}
											onChange={(e) =>
												upd({
													formatNumber: e.target
														.value as FormatNumberMode,
												})
											}
											className={FIELD}
										>
											{FORMAT_NUMBER_OPTIONS.map((f) => (
												<option
													key={f.value}
													value={f.value}
												>
													{f.label}
												</option>
											))}
										</Select>
									</div>

									<div>
										<label className="mb-1.5 block font-medium text-stone-600 text-xs">
											Round Value{" "}
											<span className="font-normal text-stone-400">
												(decimal places)
											</span>
										</label>
										<Input
											type="number"
											min={0}
											max={10}
											step={1}
											value={draft.roundValue ?? 0}
											onChange={(e) =>
												upd({
													roundValue: Math.max(
														0,
														Math.min(
															10,
															parseInt(
																e.target.value,
															) || 0,
														),
													),
												})
											}
											className={FIELD}
										/>
									</div>

									<div>
										<label className="mb-1.5 block font-medium text-stone-600 text-xs">
											Delimiter
										</label>
										<Select
											value={draft.delimiter ?? "none"}
											onChange={(e) =>
												upd({
													delimiter: e.target
														.value as FormatDelimiter,
												})
											}
											className={FIELD}
										>
											{DELIMITER_OPTIONS.map((d) => (
												<option
													key={d.value}
													value={d.value}
												>
													{d.label}
												</option>
											))}
										</Select>
									</div>
								</>
							)}
						</div>
					)}

					{/* Date options*/}
					{isDate && (
						<div className="border-stone-100 border-t pt-2">
							<label className="mb-1.5 block font-medium text-stone-600 text-xs">
								Format Date / Timestamp
							</label>
							<Select
								value={draft.dateFormat ?? "MM/DD/YYYY"}
								onChange={(e) =>
									upd({ dateFormat: e.target.value })
								}
								className={FIELD}
							>
								{DATE_FORMATS.map((f) => (
									<option key={f.value} value={f.value}>
										{f.label}
									</option>
								))}
							</Select>
						</div>
					)}

					{/* Form actions */}
					<div className="flex gap-2 pt-1">
						<button
							type="button"
							onClick={commit}
							disabled={!draft.column}
							className="flex-1 rounded bg-indigo-600 px-3 py-1.5 font-semibold text-sm text-white transition-colors hover:bg-indigo-700 disabled:pointer-events-none disabled:opacity-40"
						>
							{editingId ? "Update Rule" : "Add Rule"}
						</button>
						<button
							type="button"
							onClick={cancel}
							className="flex-1 rounded bg-stone-100 px-3 py-1.5 font-semibold text-sm text-stone-600 transition-colors hover:bg-stone-200 hover:text-stone-800"
						>
							Cancel
						</button>
					</div>
				</div>
			)}

			{/* Empty state */}
			{value.length === 0 && !draft && (
				<p className="py-2 text-center text-stone-400 text-xs">
					No format rules defined
				</p>
			)}

			{/* Rules list */}
			{value.length > 0 && (
				<div className="space-y-2">
					{value.map((rule) => {
						const b = TYPE_BADGE[rule.type];
						return (
							<div
								key={rule.id}
								className={`flex items-start justify-between gap-2 rounded-lg border bg-white px-3 py-2.5 ${
									editingId === rule.id
										? "border-indigo-400 ring-1 ring-indigo-400/30"
										: "border-stone-200"
								}`}
							>
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-1.5">
										<p className="truncate font-semibold text-sm text-stone-800">
											{rule.column}
										</p>
										<span
											className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 font-bold text-xs ${b.bg} ${b.text}`}
										>
											{b.label}
										</span>
									</div>
									<p className="mt-0.5 truncate text-stone-500 text-xs">
										{formatRuleSummary(rule)}
									</p>
								</div>
								<div className="flex shrink-0 items-center gap-1">
									<button
										type="button"
										onClick={() => openEdit(rule)}
										title="Edit rule"
										className="p-1 text-stone-400 transition-colors hover:text-indigo-600"
									>
										<Pencil className="h-3.5 w-3.5" />
									</button>
									<button
										type="button"
										onClick={() => deleteRule(rule.id)}
										title="Delete rule"
										className="p-1 text-stone-400 transition-colors hover:text-red-500"
									>
										<Trash2 className="h-3.5 w-3.5" />
									</button>
								</div>
							</div>
						);
					})}
				</div>
			)}

			<div className="pt-2">
				<ResetButton onReset={onReset} />
			</div>
		</div>
	);
}
