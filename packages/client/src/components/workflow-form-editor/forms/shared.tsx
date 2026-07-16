import { Check, Copy } from "lucide-react";
import { useRef, useState } from "react";
import {
	Field,
	FieldLabel,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
} from "@semoss/ui/next";
import type {
	EngineOption,
	OutputTransform,
	WorkflowNode,
} from "@/pages/workflow/workflow.types";
import { TRANSFORM_MODES } from "../../workflow-workspace/workflow-utils";

/**
 * Autocomplete-aware text input / textarea that suggests upstream variable
 * names when the user types `${`. Used by form files that need to bind
 * workflow variables into string fields.
 *
 * Set `mono` to render a <Textarea> (monospace, multi-line) instead of
 * a single-line <Input>.
 */
export function BoundInput({
	label,
	value,
	placeholder,
	onChange,
	upstreamVars,
	mono,
}: {
	label: string;
	value: string;
	placeholder?: string;
	onChange: (v: string) => void;
	upstreamVars: string[];
	mono?: boolean;
}) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [partialStart, setPartialStart] = useState(-1);

	const detect = (val: string, cursor: number) => {
		if (!upstreamVars.length) return;
		const before = val.slice(0, cursor);
		const lastOpen = before.lastIndexOf("${");
		if (lastOpen === -1 || before.slice(lastOpen + 2).includes("}")) {
			setSuggestions([]);
			return;
		}
		const filter = before.slice(lastOpen + 2).toLowerCase();
		setPartialStart(lastOpen);
		setSuggestions(
			upstreamVars.filter((v) => v.toLowerCase().includes(filter)),
		);
	};

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		onChange(e.target.value);
		detect(
			e.target.value,
			e.target.selectionStart ?? e.target.value.length,
		);
	};

	const handleKeyUp = (
		e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		if (e.key === "Escape") {
			setSuggestions([]);
			return;
		}
		const el = e.currentTarget;
		detect(el.value, el.selectionStart ?? el.value.length);
	};

	const handleBlur = () => {
		closeTimer.current = setTimeout(() => setSuggestions([]), 150);
	};

	const handleFocus = () => {
		if (closeTimer.current) clearTimeout(closeTimer.current);
	};

	const insertVar = (v: string) => {
		const el = (mono ? textareaRef.current : inputRef.current) as
			| HTMLInputElement
			| HTMLTextAreaElement
			| null;
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

	const sharedProps = {
		value,
		onChange: handleChange,
		onKeyUp: handleKeyUp,
		onBlur: handleBlur,
		onFocus: handleFocus,
		placeholder,
	};

	return (
		<Field>
			<FieldLabel>{label}</FieldLabel>
			<div className="relative">
				{mono ? (
					<Textarea
						ref={textareaRef}
						{...sharedProps}
						className="font-mono text-xs"
						rows={4}
					/>
				) : (
					<Input ref={inputRef} {...sharedProps} />
				)}
				{suggestions.length > 0 && (
					<div className="absolute top-full right-0 left-0 z-50 mt-0.5 max-h-40 overflow-y-auto rounded-md border bg-popover shadow-md">
						{suggestions.map((v) => (
							<button
								key={v}
								type="button"
								onMouseDown={(e) => {
									e.preventDefault(); // keep focus, prevent blur closing dropdown
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
		</Field>
	);
}

/**
 * Shared engine dropdown used by all step-form files and the canvas settings panel.
 * Pass `triggerClassName` / `labelClassName` to override default sizing for
 * panel or inline-card contexts.
 */
export function EngineSelect({
	label,
	value,
	engines,
	onChange,
	triggerClassName = "h-8 text-xs",
	labelClassName = "text-xs",
}: {
	label: string;
	value: string;
	engines: EngineOption[];
	onChange: (v: string) => void;
	triggerClassName?: string;
	labelClassName?: string;
}) {
	return (
		<Field>
			<FieldLabel className={labelClassName}>{label}</FieldLabel>
			<Select value={value} onValueChange={onChange}>
				<SelectTrigger className={triggerClassName}>
					<SelectValue
						placeholder={
							engines.length
								? `Select ${label.toLowerCase()}\u2026`
								: "No engines available"
						}
					/>
				</SelectTrigger>
				<SelectContent>
					{engines.map((e) => (
						<SelectItem
							key={e.engine_id}
							value={e.engine_id}
							className="py-1.5 text-xs"
						>
							<span className="flex flex-col gap-0.5">
								<span>
									{e.engine_display_name ?? e.engine_name}
								</span>
								<span className="font-mono text-[10px] text-muted-foreground">
									{e.engine_id}
								</span>
							</span>
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</Field>
	);
}

// ─── output variable hint ─────────────────────────────────────────────────────

export function outputVarHint(type: string): string {
	switch (type) {
		case "for-each":
			return "Contains {processed, succeeded, failed, totalRows}. Per-row results are only accessible within the loop body.";
		case "parallel":
			return "Contains a JSON array of each branch's output, in order.";
		case "try-catch":
		case "conditional":
			return "Contains the last executed node's output from whichever branch ran.";
		case "while-loop":
			return "Contains the last node's output from the final iteration.";
		case "retry":
			return "Contains {attempts, succeeded}. For the actual computed result, reference an inner node's output variable.";
		case "switch":
			return "Contains {matched, switchValue, output} — the matched case label and its branch's last output.";
		default:
			return "";
	}
}

// ─── smart output preview ─────────────────────────────────────────────────────

export function OutputPreview({ value }: { value: string }) {
	const parsed = (() => {
		try {
			return JSON.parse(value);
		} catch {
			return null;
		}
	})();

	// Array of objects → table
	if (
		Array.isArray(parsed) &&
		parsed.length > 0 &&
		typeof parsed[0] === "object" &&
		parsed[0] !== null
	) {
		const keys = Object.keys(parsed[0] as object);
		return (
			<div className="max-h-64 overflow-auto rounded border text-[11px]">
				<table className="w-full border-collapse">
					<thead>
						<tr className="sticky top-0 border-b bg-muted/50">
							{keys.map((k) => (
								<th
									key={k}
									className="whitespace-nowrap px-2 py-1.5 text-left font-semibold text-foreground"
								>
									{k}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{(parsed as Record<string, unknown>[]).map((row, i) => (
							<tr
								key={JSON.stringify(row) || i}
								className="border-muted/40 border-b last:border-0"
							>
								{keys.map((k) => (
									<td
										key={k}
										className="max-w-[200px] truncate px-2 py-1 text-foreground"
										title={
											row[k] != null ? String(row[k]) : ""
										}
									>
										{row[k] != null ? String(row[k]) : "—"}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		);
	}

	// LLM / markdown text
	if (
		typeof parsed === "string" &&
		(value.includes("**") || value.includes("\n#") || value.includes("\n-"))
	) {
		return (
			<pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words font-sans text-[11px] text-foreground">
				{value}
			</pre>
		);
	}

	// Default: raw JSON / text
	return (
		<pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all font-mono text-[10px]">
			{value}
		</pre>
	);
}

// ─── per-node output transform section ───────────────────────────────────────

export function OutputTransformSection({
	node,
	onUpdate,
}: {
	node: WorkflowNode;
	onUpdate: (n: WorkflowNode) => void;
}) {
	const t = node.outputTransform;
	const set = (patch: Partial<OutputTransform> | undefined) =>
		onUpdate({
			...node,
			outputTransform:
				patch === undefined
					? undefined
					: { mode: "raw", ...t, ...patch },
		});

	return (
		<details className="group rounded-md border border-border">
			<summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-muted-foreground text-xs hover:text-foreground">
				<span className="flex items-center gap-1.5">
					Output Transform
					{t && t.mode !== "raw" && (
						<span className="rounded bg-primary/10 px-1.5 py-0.5 font-medium text-[10px] text-primary">
							{
								TRANSFORM_MODES.find((m) => m.value === t.mode)
									?.label
							}
						</span>
					)}
				</span>
				<span className="text-[10px]">▸</span>
			</summary>
			<div className="flex flex-col gap-3 border-border border-t p-3">
				<p className="text-[10px] text-muted-foreground">
					Reshape the raw output before it's stored in the variable.
					Applied in both test runs and full workflow runs.
				</p>
				<Field>
					<FieldLabel>Mode</FieldLabel>
					<Select
						value={t?.mode ?? "raw"}
						onValueChange={(v) =>
							set(
								v === "raw"
									? undefined
									: { mode: v as OutputTransform["mode"] },
							)
						}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{TRANSFORM_MODES.map((m) => (
								<SelectItem key={m.value} value={m.value}>
									{m.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</Field>
				{t?.mode === "column" && (
					<Field>
						<FieldLabel>Column Name</FieldLabel>
						<Input
							value={t.column ?? ""}
							onChange={(e) => set({ column: e.target.value })}
							placeholder="column_name"
							className="font-mono text-xs"
						/>
					</Field>
				)}
				{t?.mode === "jsonpath" && (
					<Field>
						<FieldLabel>Path</FieldLabel>
						<Input
							value={t.path ?? ""}
							onChange={(e) => set({ path: e.target.value })}
							placeholder="data.results"
							className="font-mono text-xs"
						/>
						<p className="mt-1 text-[10px] text-muted-foreground">
							Dot-notation path, e.g. <code>data.results</code> or{" "}
							<code>$.items.0.name</code>
						</p>
					</Field>
				)}
			</div>
		</details>
	);
}

// ─── copy button ──────────────────────────────────────────────────────────────

export function CopyButton({
	value,
	label,
}: {
	value: string;
	label?: string;
}) {
	const [copied, setCopied] = useState(false);
	return (
		<button
			type="button"
			onClick={() => {
				navigator.clipboard.writeText(value);
				setCopied(true);
				setTimeout(() => setCopied(false), 1500);
			}}
			className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted"
		>
			{copied ? (
				<Check className="h-3 w-3 text-emerald-500" />
			) : (
				<Copy className="h-3 w-3" />
			)}
			{label ?? "Copy"}
		</button>
	);
}
