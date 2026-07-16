import { Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { Input } from "@semoss/ui/next";
import type { SetVariableConfig } from "@/pages/workflow/workflow.types";

/** Autocomplete for a variable name field — suggests from `suggestions` on plain typing. */
export function VarNameInput({
	value,
	suggestions,
	onChange,
}: {
	value: string;
	suggestions: string[];
	onChange: (v: string) => void;
}) {
	const inputRef = useRef<HTMLInputElement>(null);
	const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [open, setOpen] = useState(false);

	const filtered = suggestions.filter(
		(s) => s !== value && s.toLowerCase().includes(value.toLowerCase()),
	);

	const pick = (v: string) => {
		onChange(v);
		setOpen(false);
		requestAnimationFrame(() => inputRef.current?.focus());
	};

	return (
		<div className="relative flex-1">
			<Input
				ref={inputRef}
				value={value}
				onChange={(e) => {
					onChange(e.target.value);
					setOpen(true);
				}}
				onKeyUp={(e) => {
					if (e.key === "Escape") setOpen(false);
				}}
				onFocus={() => {
					if (closeTimer.current) clearTimeout(closeTimer.current);
					setOpen(true);
				}}
				onBlur={() => {
					closeTimer.current = setTimeout(() => setOpen(false), 150);
				}}
				placeholder="variableName"
				className="font-mono text-xs"
			/>
			{open && filtered.length > 0 && (
				<div className="absolute top-full right-0 left-0 z-50 mt-0.5 max-h-40 overflow-y-auto rounded-md border bg-popover shadow-md">
					{filtered.map((s) => (
						<button
							key={s}
							type="button"
							onMouseDown={(e) => {
								e.preventDefault();
								pick(s);
							}}
							className="flex w-full items-center px-3 py-1.5 text-left font-mono text-xs hover:bg-accent hover:text-accent-foreground"
						>
							{s}
						</button>
					))}
				</div>
			)}
		</div>
	);
}

/** Autocomplete for a variable value field — suggests from `vars` when typing `${`. */
export function VarValueInput({
	value,
	vars,
	onChange,
}: {
	value: string;
	vars: string[];
	onChange: (v: string) => void;
}) {
	const inputRef = useRef<HTMLInputElement>(null);
	const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [partialStart, setPartialStart] = useState(-1);

	const detect = (val: string, cursor: number) => {
		if (!vars.length) return;
		const before = val.slice(0, cursor);
		const lastOpen = before.lastIndexOf("${");
		if (lastOpen === -1 || before.slice(lastOpen + 2).includes("}")) {
			setSuggestions([]);
			return;
		}
		const filter = before.slice(lastOpen + 2).toLowerCase();
		setPartialStart(lastOpen);
		setSuggestions(vars.filter((v) => v.toLowerCase().includes(filter)));
	};

	const insertVar = (v: string) => {
		const el = inputRef.current;
		if (!el || partialStart === -1) return;
		const cursor = el.selectionStart ?? value.length;
		const inserted = `\${${v}}`;
		const newVal =
			value.slice(0, partialStart) + inserted + value.slice(cursor);
		onChange(newVal);
		setSuggestions([]);
		const newCursor = partialStart + inserted.length;
		requestAnimationFrame(() => {
			el.focus();
			el.setSelectionRange(newCursor, newCursor);
		});
	};

	return (
		<div className="relative">
			<Input
				ref={inputRef}
				value={value}
				onChange={(e) => {
					onChange(e.target.value);
					detect(
						e.target.value,
						e.target.selectionStart ?? e.target.value.length,
					);
				}}
				onKeyUp={(e) => {
					if (e.key === "Escape") {
						setSuggestions([]);
						return;
					}
					detect(
						e.currentTarget.value,
						e.currentTarget.selectionStart ??
							e.currentTarget.value.length,
					);
				}}
				onFocus={() => {
					if (closeTimer.current) clearTimeout(closeTimer.current);
				}}
				onBlur={() => {
					closeTimer.current = setTimeout(
						() => setSuggestions([]),
						150,
					);
				}}
				placeholder="${var}, literal, or math: ${counter} - 1"
				className="font-mono text-xs"
			/>
			{suggestions.length > 0 && (
				<div className="absolute top-full right-0 left-0 z-50 mt-0.5 max-h-40 overflow-y-auto rounded-md border bg-popover shadow-md">
					{suggestions.map((v) => (
						<button
							key={v}
							type="button"
							onMouseDown={(e) => {
								e.preventDefault();
								insertVar(v);
							}}
							className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-mono text-xs hover:bg-accent hover:text-accent-foreground"
						>
							<span className="text-[10px] text-muted-foreground">
								{/* biome-ignore lint/suspicious/noTemplateCurlyInString: intentional display of ${} syntax */}
								{"${}"}
							</span>
							{v}
						</button>
					))}
				</div>
			)}
		</div>
	);
}

export function SetVariableForm({
	config,
	upstreamVars,
	knownVarNames = [],
	onChange,
}: {
	config: SetVariableConfig;
	upstreamVars: string[];
	knownVarNames?: string[];
	onChange: (c: SetVariableConfig) => void;
}) {
	const entries = Object.entries(config.variables ?? {});
	// include this node's own declared variable names in both autocompletes
	const ownKeys = entries.map(([k]) => k).filter(Boolean);
	const keySuggestions = [...new Set([...knownVarNames, ...ownKeys])];
	const valueSuggestions = [...new Set([...upstreamVars, ...ownKeys])];

	const setEntry = (idx: number, key: string, value: string) => {
		const next: Record<string, string> = {};
		entries.forEach(([k, v], i) => {
			if (i === idx) next[key] = value;
			else next[k] = v;
		});
		onChange({ ...config, variables: next });
	};

	const addEntry = () => {
		const newKey = `var_${entries.length + 1}`;
		onChange({
			...config,
			variables: { ...config.variables, [newKey]: "" },
		});
	};

	const removeEntry = (idx: number) => {
		const next: Record<string, string> = {};
		entries.forEach(([k, v], i) => {
			if (i !== idx) next[k] = v;
		});
		onChange({ ...config, variables: next });
	};

	return (
		<div className="flex flex-col gap-3">
			{entries.length === 0 && (
				<p className="text-muted-foreground text-xs">
					No variables yet. Add one below.
				</p>
			)}
			{entries.map(([key, value], idx) => (
				<div
					key={key || idx}
					className="flex flex-col gap-1.5 rounded-md border border-border p-2"
				>
					<div className="flex items-center gap-1">
						<VarNameInput
							value={key}
							suggestions={keySuggestions}
							onChange={(k) => setEntry(idx, k, value)}
						/>
						<button
							type="button"
							onClick={() => removeEntry(idx)}
							className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
						>
							<Trash2 className="h-3.5 w-3.5" />
						</button>
					</div>
					<VarValueInput
						value={value}
						vars={valueSuggestions}
						onChange={(v) => setEntry(idx, key, v)}
					/>
				</div>
			))}
			<button
				type="button"
				onClick={addEntry}
				className="flex items-center gap-1.5 rounded-md border border-border border-dashed px-3 py-2 text-muted-foreground text-xs hover:bg-accent hover:text-foreground"
			>
				<Plus className="h-3.5 w-3.5" />
				Add Variable
			</button>
		</div>
	);
}
