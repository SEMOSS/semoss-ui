import { ChevronDown, Search, X } from "lucide-react";
import type { ElementType } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui";
/**
 * VizTypeSelect — searchable, category-grouped chart-type picker.
 *
 * Replaces the plain native <select> in VizEditor's toolbar. The trigger shows
 * the current chart's icon + label; opening it reveals a popover with a search
 * input and items grouped by category (Comparison, Trends, …).
 */
import {
	VIZ_CATEGORY_ORDER,
	VIZ_TYPE_META,
	type VizCategory,
} from "@/lib/vizMeta";

interface Props {
	value: string;
	/** Restrict which types appear (e.g. only the ones supported in this view). */
	allowedTypes?: string[];
	onChange: (v: string) => void;
	/** Optional className applied to the trigger button. */
	className?: string;
}

interface Item {
	value: string;
	label: string;
	category: VizCategory;
	Icon: ElementType;
}

export function VizTypeSelect({
	value,
	allowedTypes,
	onChange,
	className,
}: Props) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const rootRef = useRef<HTMLDivElement | null>(null);
	const searchRef = useRef<HTMLInputElement | null>(null);

	const items: Item[] = useMemo(() => {
		const allow = allowedTypes ? new Set(allowedTypes) : null;
		return (
			Object.entries(VIZ_TYPE_META) as [
				string,
				(typeof VIZ_TYPE_META)[keyof typeof VIZ_TYPE_META],
			][]
		)
			.filter(([k]) => !allow || allow.has(k))
			.map(([k, m]) => ({
				value: k,
				label: m.label,
				category: m.category,
				Icon: m.icon,
			}));
	}, [allowedTypes]);

	const current = items.find((i) => i.value === value);

	// Filter + group by category, preserving the canonical category order.
	const grouped = useMemo(() => {
		const q = query.trim().toLowerCase();
		const filtered = q
			? items.filter(
					(i) =>
						i.label.toLowerCase().includes(q) ||
						i.value.toLowerCase().includes(q),
				)
			: items;
		const byCat = new Map<VizCategory, Item[]>();
		for (const it of filtered) {
			const list = byCat.get(it.category) ?? [];
			list.push(it);
			byCat.set(it.category, list);
		}
		return VIZ_CATEGORY_ORDER.map((cat) => ({
			category: cat,
			items: byCat.get(cat) ?? [],
		})).filter((g) => g.items.length > 0);
	}, [items, query]);

	// Close on outside click / Escape, and focus the search when opening.
	useEffect(() => {
		if (!open) return;
		setTimeout(() => searchRef.current?.focus(), 0);
		const onDown = (e: MouseEvent) => {
			if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setOpen(false);
		};
		document.addEventListener("mousedown", onDown);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onDown);
			document.removeEventListener("keydown", onKey);
		};
	}, [open]);

	const pick = (v: string) => {
		onChange(v);
		setOpen(false);
		setQuery("");
	};

	const CurrentIcon = current?.Icon;

	return (
		<div ref={rootRef} className="relative inline-block">
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				title="Visualization type"
				className={
					className ??
					"inline-flex h-8 items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 font-medium text-[13px] text-stone-700 hover:border-stone-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
				}
			>
				{CurrentIcon && (
					<CurrentIcon className="h-3.5 w-3.5 text-stone-500" />
				)}
				<span className="max-w-[10rem] truncate">
					{current?.label ?? value}
				</span>
				<ChevronDown
					className={`h-3.5 w-3.5 text-stone-400 transition-transform ${open ? "rotate-180" : ""}`}
				/>
			</button>

			{open && (
				<div className="absolute right-0 z-40 mt-1 w-72 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl ring-1 ring-black/5">
					{/* Search */}
					<div className="border-stone-100 border-b p-2">
						<div className="relative">
							<Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-2 h-3.5 w-3.5 text-stone-400" />
							<Input
								ref={searchRef}
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								placeholder="Search chart types"
								className="w-full rounded-md border border-stone-200 bg-white py-1.5 pr-7 pl-7 text-[12px] focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
							/>
							{query && (
								<button
									type="button"
									onClick={() => setQuery("")}
									className="-translate-y-1/2 absolute top-1/2 right-1.5 rounded p-0.5 text-stone-400 hover:text-stone-600"
									title="Clear search"
								>
									<X className="h-3 w-3" />
								</button>
							)}
						</div>
					</div>

					{/* Grouped list */}
					<div className="max-h-80 overflow-y-auto py-1">
						{grouped.length === 0 ? (
							<p className="px-3 py-3 text-[12px] text-stone-400">
								No chart types match "{query}".
							</p>
						) : (
							grouped.map((g) => (
								<div key={g.category} className="py-1">
									<div className="px-3 pt-1.5 pb-1 font-semibold text-[10px] text-stone-400 uppercase tracking-wider">
										{g.category}
									</div>
									{g.items.map((it) => {
										const Icon = it.Icon;
										const selected = it.value === value;
										return (
											<button
												key={it.value}
												type="button"
												onClick={() => pick(it.value)}
												className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[13px] transition-colors ${
													selected
														? "bg-indigo-50 font-medium text-indigo-700"
														: "text-stone-700 hover:bg-stone-50"
												}`}
											>
												<Icon
													className={`h-4 w-4 flex-shrink-0 ${selected ? "text-indigo-600" : "text-stone-500"}`}
												/>
												<span className="flex-1 truncate">
													{it.label}
												</span>
												{selected && (
													<span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-500" />
												)}
											</button>
										);
									})}
								</div>
							))
						)}
					</div>
				</div>
			)}
		</div>
	);
}
