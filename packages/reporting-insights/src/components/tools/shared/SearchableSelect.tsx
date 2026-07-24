/**
 * SearchableSelect — a compact, searchable single-select dropdown for a flat list
 * of string options. Matches the look & feel of the chart-type picker
 * (`VizTypeSelect`) and the query picker: a trigger button + a popover with a
 * search box and a scrollable, filterable list.
 */
import { ChevronDown, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui";

interface Props {
	value: string;
	options: string[];
	onChange: (v: string) => void;
	placeholder?: string;
	searchPlaceholder?: string;
	/** Accessible label for the trigger. */
	ariaLabel?: string;
}

export function SearchableSelect({
	value,
	options,
	onChange,
	placeholder = "Select…",
	searchPlaceholder = "Search…",
	ariaLabel,
}: Props) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const rootRef = useRef<HTMLDivElement | null>(null);
	const searchRef = useRef<HTMLInputElement | null>(null);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		return q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
	}, [options, query]);

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

	return (
		<div ref={rootRef} className="relative">
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				aria-label={ariaLabel}
				className="flex w-full items-center justify-between gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-left text-[13px] text-stone-700 hover:border-stone-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
			>
				<span className={`truncate ${value ? "" : "text-stone-400"}`}>
					{value || placeholder}
				</span>
				<ChevronDown
					className={`h-3.5 w-3.5 flex-shrink-0 text-stone-400 transition-transform ${open ? "rotate-180" : ""}`}
				/>
			</button>

			{open && (
				<div className="absolute left-0 z-40 mt-1 w-full min-w-[12rem] overflow-hidden rounded-xl border border-stone-200 bg-white shadow-xl ring-1 ring-black/5">
					<div className="border-stone-100 border-b p-2">
						<div className="relative">
							<Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-2 h-3.5 w-3.5 text-stone-400" />
							<Input
								ref={searchRef}
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								placeholder={searchPlaceholder}
								className="w-full rounded-md border border-stone-200 bg-white py-1.5 pr-7 pl-7 text-[12px] focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
							/>
							{query && (
								<button
									type="button"
									onClick={() => setQuery("")}
									title="Clear search"
									className="-translate-y-1/2 absolute top-1/2 right-1.5 rounded p-0.5 text-stone-400 hover:text-stone-600"
								>
									<X className="h-3 w-3" />
								</button>
							)}
						</div>
					</div>
					<div className="max-h-64 overflow-y-auto py-1">
						{filtered.length === 0 ? (
							<p className="px-3 py-3 text-[12px] text-stone-400">
								No matches for "{query}".
							</p>
						) : (
							filtered.map((o) => {
								const selected = o === value;
								return (
									<button
										key={o}
										type="button"
										onClick={() => pick(o)}
										className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] transition-colors ${
											selected
												? "bg-indigo-50 font-medium text-indigo-700"
												: "text-stone-700 hover:bg-stone-50"
										}`}
									>
										<span className="flex-1 truncate">
											{o}
										</span>
										{selected && (
											<span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-500" />
										)}
									</button>
								);
							})
						)}
					</div>
				</div>
			)}
		</div>
	);
}
