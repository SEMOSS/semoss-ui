/**
 * TagInput — chip-style multi-tag editor with autocomplete.
 *
 * Tags ARE folders in this app: assigning a tag puts the dashboard into that
 * folder. Free-form (type + Enter / comma) with suggestions from existing tags.
 */
import { X } from "lucide-react";
import { useMemo, useRef, useState } from "react";

interface Props {
	value: string[];
	onChange: (tags: string[]) => void;
	/** Existing tags across the workspace, surfaced as suggestions. */
	suggestions?: string[];
	placeholder?: string;
	className?: string;
}

export function TagInput({
	value,
	onChange,
	suggestions = [],
	placeholder = "Add a tag…",
	className = "",
}: Props) {
	const [draft, setDraft] = useState("");
	const [open, setOpen] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const add = (raw: string) => {
		const t = raw.trim();
		if (!t) return;
		if (!value.some((v) => v.toLowerCase() === t.toLowerCase()))
			onChange([...value, t]);
		setDraft("");
	};
	const remove = (t: string) => onChange(value.filter((v) => v !== t));

	const matches = useMemo(() => {
		const q = draft.trim().toLowerCase();
		return suggestions
			.filter(
				(s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()),
			)
			.filter((s) => !q || s.toLowerCase().includes(q))
			.slice(0, 6);
	}, [draft, suggestions, value]);

	return (
		<div className={`relative ${className}`}>
			<div
				onClick={() => inputRef.current?.focus()}
				className="flex flex-wrap items-center gap-1 rounded-md border border-stone-200 bg-stone-50 px-2 py-1 focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/15"
			>
				{value.map((t) => (
					<span
						key={t}
						className="inline-flex items-center gap-1 rounded bg-indigo-50 px-1.5 py-0.5 font-medium text-[11px] text-indigo-700"
					>
						{t}
						<button
							type="button"
							onClick={() => remove(t)}
							className="text-indigo-400 hover:text-indigo-700"
							aria-label={`Remove ${t}`}
						>
							<X className="h-3 w-3" />
						</button>
					</span>
				))}
				<input
					ref={inputRef}
					value={draft}
					onChange={(e) => {
						setDraft(e.target.value);
						setOpen(true);
					}}
					onFocus={() => setOpen(true)}
					onBlur={() => {
						// Commit a typed-but-not-Entered tag so it isn't silently lost
						// when the user clicks away (e.g. straight onto Save).
						if (draft.trim()) add(draft);
						setTimeout(() => setOpen(false), 120);
					}}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === ",") {
							e.preventDefault();
							add(draft);
						} else if (
							e.key === "Backspace" &&
							!draft &&
							value.length
						)
							remove(value[value.length - 1]);
					}}
					placeholder={value.length ? "" : placeholder}
					className="min-w-[80px] flex-1 bg-transparent px-1 py-0.5 text-[13px] text-stone-700 placeholder:text-stone-300 focus:outline-none"
				/>
			</div>
			{open && matches.length > 0 && (
				<ul className="absolute z-20 mt-1 max-h-44 w-full overflow-auto rounded-md border border-stone-200 bg-white py-1 shadow-soft-lg">
					{matches.map((s) => (
						<li key={s}>
							<button
								type="button"
								onMouseDown={(e) => {
									e.preventDefault();
									add(s);
								}}
								className="block w-full px-3 py-1.5 text-left text-[13px] text-stone-600 hover:bg-indigo-50 hover:text-indigo-700"
							>
								{s}
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
