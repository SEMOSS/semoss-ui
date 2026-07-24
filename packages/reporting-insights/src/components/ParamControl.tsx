/**
 * ParamControl — the runtime input for a query parameter, shared by the main app
 * (DashboardVisualization) and the portal (ViewMode) so they never drift.
 *
 * Input types:
 *   text        free text
 *   date        native date picker
 *   dropdown    single choice with typeahead
 *   multiselect many choices → value is a SQL list  'a','b'  for use as  IN ({{p}})
 */
import { Check, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui";

export type ParamInputType = "text" | "dropdown" | "multiselect" | "date";

export interface ParamSpec {
	name: string;
	defaultValue: string;
	inputType?: ParamInputType;
	required?: boolean;
}

// ── multiselect <-> SQL list helpers ────────────────────────────────────────
const sqlEscape = (s: string) => s.replace(/'/g, "''");
/** ['a', "b's"] → "'a','b''s'" */
export function formatSqlList(values: string[]): string {
	return values.map((v) => `'${sqlEscape(v)}'`).join(",");
}
/** "'a','b''s'" → ['a', "b's"] */
export function parseSqlList(value: string): string[] {
	if (!value) return [];
	const out: string[] = [];
	const re = /'((?:[^']|'')*)'/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(value)) !== null) out.push(m[1].replace(/''/g, "'"));
	return out;
}

/**
 * True when a parameter's required constraint is satisfied by `value`.
 * For multiselect, empty string means "all options" — always satisfied.
 */
export function isParamSatisfied(param: ParamSpec, value: string): boolean {
	if (!param.required) return true;
	if (param.inputType === "multiselect") return true; // empty = all selected = valid
	return value != null && String(value).trim().length > 0;
}

export function ParamControl({
	param,
	value,
	options,
	onChange,
	onEnter,
	size = "md",
}: {
	param: ParamSpec;
	value: string;
	options: string[];
	onChange: (v: string) => void;
	onEnter?: () => void;
	size?: "md" | "sm";
}) {
	const cls = `w-full px-3 ${size === "sm" ? "py-1.5" : "py-2"} text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white`;
	const type = param.inputType ?? "text";

	if (type === "date") {
		return (
			<Input
				type="date"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
				className={cls}
			/>
		);
	}
	if (type === "dropdown") {
		return (
			<SearchSelect
				options={options}
				value={value}
				onChange={onChange}
				onEnter={onEnter}
				cls={cls}
				placeholder={param.defaultValue || "Select…"}
			/>
		);
	}
	if (type === "multiselect") {
		return (
			<MultiSelect
				options={options}
				value={value}
				onChange={onChange}
				size={size}
			/>
		);
	}
	return (
		<Input
			type="text"
			value={value}
			onChange={(e) => onChange(e.target.value)}
			onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
			className={cls}
			placeholder={param.defaultValue || param.name}
		/>
	);
}

// ── single-select with typeahead ────────────────────────────────────────────
function SearchSelect({
	options,
	value,
	onChange,
	onEnter,
	cls,
	placeholder,
}: {
	options: string[];
	value: string;
	onChange: (v: string) => void;
	onEnter?: () => void;
	cls: string;
	placeholder: string;
}) {
	const [open, setOpen] = useState(false);
	const [q, setQ] = useState("");
	const filtered = useMemo(
		() =>
			options
				.filter((o) => o.toLowerCase().includes(q.trim().toLowerCase()))
				.slice(0, 50),
		[options, q],
	);
	return (
		<div className="relative">
			<Input
				className={cls}
				value={open ? q : value}
				placeholder={placeholder}
				onFocus={() => {
					setOpen(true);
					setQ("");
				}}
				onChange={(e) => {
					setQ(e.target.value);
					setOpen(true);
				}}
				onBlur={() => setTimeout(() => setOpen(false), 120)}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						if (open && filtered[0]) {
							onChange(filtered[0]);
							setOpen(false);
						} else onEnter?.();
					}
				}}
			/>
			{open && (
				<ul className="absolute z-30 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
					{filtered.length === 0 && (
						<li className="px-3 py-1.5 text-slate-400 text-xs">
							No matches
						</li>
					)}
					{filtered.map((o) => (
						<li key={o}>
							<button
								type="button"
								onMouseDown={(e) => {
									e.preventDefault();
									onChange(o);
									setOpen(false);
								}}
								className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-slate-50 ${o === value ? "font-semibold text-indigo-600" : "text-slate-700"}`}
							>
								<span className="truncate">{o}</span>
								{o === value && (
									<Check className="ml-2 h-3.5 w-3.5 flex-shrink-0" />
								)}
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

// ── multi-select with typeahead → SQL list ──────────────────────────────────
function MultiSelect({
	options,
	value,
	onChange,
	size,
}: {
	options: string[];
	value: string;
	onChange: (v: string) => void;
	size: "md" | "sm";
}) {
	const selected = useMemo(() => parseSqlList(value), [value]);
	const selectedSet = new Set(selected);
	const [open, setOpen] = useState(false);
	const [q, setQ] = useState("");
	const filtered = useMemo(
		() =>
			options
				.filter((o) => o.toLowerCase().includes(q.trim().toLowerCase()))
				.slice(0, 50),
		[options, q],
	);
	const toggle = (o: string) => {
		const next = selectedSet.has(o)
			? selected.filter((x) => x !== o)
			: [...selected, o];
		onChange(formatSqlList(next));
	};
	return (
		<div className="relative">
			<div
				onClick={() => setOpen(true)}
				className={`flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 ${size === "sm" ? "py-1" : "py-1.5"} cursor-text focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20`}
			>
				{selected.length === 0 ? (
					<span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-500 text-xs">
						All
					</span>
				) : (
					<>
						{selected.map((s) => (
							<span
								key={s}
								className="inline-flex items-center gap-1 rounded bg-indigo-50 px-1.5 py-0.5 font-medium text-indigo-700 text-xs"
							>
								{s}
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										toggle(s);
									}}
									className="text-indigo-400 hover:text-indigo-700"
								>
									<X className="h-3 w-3" />
								</button>
							</span>
						))}
						<button
							type="button"
							onClick={(e) => {
								e.stopPropagation();
								onChange("");
							}}
							className="ml-auto flex items-center gap-0.5 text-[11px] text-slate-400 hover:text-slate-600"
							title="Clear all — show all values"
						>
							<X className="h-3 w-3" /> Clear
						</button>
					</>
				)}
				<input
					className="min-w-[60px] flex-1 bg-transparent text-sm outline-none"
					value={q}
					placeholder={selected.length ? "" : "Filter options…"}
					onChange={(e) => {
						setQ(e.target.value);
						setOpen(true);
					}}
					onFocus={() => setOpen(true)}
					onBlur={() => setTimeout(() => setOpen(false), 120)}
				/>
			</div>
			{open && (
				<ul className="absolute z-30 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
					{filtered.length === 0 && (
						<li className="px-3 py-1.5 text-slate-400 text-xs">
							No matches
						</li>
					)}
					{filtered.map((o) => {
						const on = selectedSet.has(o);
						return (
							<li key={o}>
								<button
									type="button"
									onMouseDown={(e) => {
										e.preventDefault();
										toggle(o);
									}}
									className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-slate-50 ${on ? "font-semibold text-indigo-600" : "text-slate-700"}`}
								>
									<span
										className={`grid h-4 w-4 flex-shrink-0 place-items-center rounded border ${on ? "border-indigo-500 bg-indigo-500 text-white" : "border-slate-300"}`}
									>
										{on && <Check className="h-3 w-3" />}
									</span>
									<span className="truncate">{o}</span>
								</button>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
