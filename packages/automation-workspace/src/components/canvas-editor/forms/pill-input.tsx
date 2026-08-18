import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FieldLabel } from "@semoss/ui/next";

export interface PillInputProps {
	/** Field label */
	label: string;
	/** Current string value — may contain `${varName}` references */
	value: string;
	/** Called on every change */
	onChange: (v: string) => void;
	/** Upstream variable names available for insertion */
	upstreamVars: string[];
	/** Placeholder text shown when value is empty */
	placeholder?: string;
	/** Monospace font and block layout (for SQL / multi-line content) */
	mono?: boolean;
	/** Minimum rows height hint for mono mode (default 4) */
	minRows?: number;
	/** Whether the form must be completed before the automation can run */
	required?: boolean;
}

const VAR_REGEX = /\$\{([^}]+)\}/g;

/** Splits a value string into text segments and known-variable segments. */
function parseSegments(
	str: string,
	knownVars: string[],
): Array<{ type: "text"; text: string } | { type: "var"; name: string }> {
	const out: Array<
		{ type: "text"; text: string } | { type: "var"; name: string }
	> = [];
	let last = 0;
	VAR_REGEX.lastIndex = 0;
	let m = VAR_REGEX.exec(str);
	while (m !== null) {
		if (m.index > last)
			out.push({ type: "text", text: str.slice(last, m.index) });
		if (knownVars.includes(m[1])) {
			out.push({ type: "var", name: m[1] });
		} else {
			out.push({ type: "text", text: m[0] });
		}
		last = m.index + m[0].length;
		m = VAR_REGEX.exec(str);
	}
	if (last < str.length) out.push({ type: "text", text: str.slice(last) });
	return out;
}

/** Reads a contenteditable div back to a `${varName}` string value. */
function readDOM(el: HTMLElement): string {
	let result = "";
	for (const child of el.childNodes) {
		if (child.nodeType === Node.TEXT_NODE) {
			result += child.textContent ?? "";
		} else if (child instanceof HTMLElement) {
			const varName = child.dataset.var;
			if (varName !== undefined) {
				result += `\${${varName}}`;
			} else if (child.tagName === "BR") {
				result += "\n";
			} else {
				result += child.textContent ?? "";
			}
		}
	}
	return result;
}

/** Creates a pill span for a known variable. */
function makePill(name: string): HTMLSpanElement {
	const span = document.createElement("span");
	span.contentEditable = "false";
	span.dataset.var = name;
	span.className =
		"inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-mono font-medium " +
		"bg-primary/10 text-primary border border-primary/20 select-none cursor-default mx-0.5";
	span.textContent = `\${${name}}`;
	return span;
}

/** Replaces the full DOM content of the editor from a value string. Tries to preserve cursor at end. */
function renderDOM(el: HTMLElement, value: string, knownVars: string[]) {
	el.innerHTML = "";
	const segs = parseSegments(value, knownVars);
	for (const seg of segs) {
		if (seg.type === "var") {
			el.appendChild(makePill(seg.name));
		} else {
			// Split on newlines, inserting <br> for each line break
			const lines = seg.text.split("\n");
			lines.forEach((line, i) => {
				if (line) el.appendChild(document.createTextNode(line));
				if (i < lines.length - 1)
					el.appendChild(document.createElement("br"));
			});
		}
	}
	// Ensure there's always a trailing text node so caret can be placed after last pill
	if (
		el.lastChild?.nodeType !== Node.TEXT_NODE &&
		!(el.lastChild instanceof HTMLBRElement)
	) {
		el.appendChild(document.createTextNode(""));
	}
}

/** Scans text nodes near the current caret for a complete `${knownVar}` pattern and converts it. */
function tryConvertPillAtCaret(el: HTMLElement, knownVars: string[]) {
	const sel = window.getSelection();
	if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return;
	const range = sel.getRangeAt(0);
	const anchor = range.startContainer;
	if (anchor.nodeType !== Node.TEXT_NODE || anchor.parentElement !== el)
		return;

	const text = anchor.textContent ?? "";
	const caretOffset = range.startOffset;
	const textBefore = text.slice(0, caretOffset);
	const matchIdx = textBefore.lastIndexOf("${");
	if (matchIdx === -1) return;
	// Strip trailing `}` — the browser inserts it before this function runs via rAF
	const potential = textBefore.slice(matchIdx + 2).replace(/\}$/, "");
	if (!knownVars.includes(potential)) return;

	// Replace the full `${varName}` token in the text with a pill
	const before = document.createTextNode(text.slice(0, matchIdx));
	const after = document.createTextNode(text.slice(caretOffset));
	const pill = makePill(potential);

	el.insertBefore(after, anchor);
	el.insertBefore(pill, after);
	el.insertBefore(before, pill);
	el.removeChild(anchor);

	// Move caret to after pill
	const newRange = document.createRange();
	newRange.setStartAfter(pill);
	newRange.collapse(true);
	sel.removeAllRanges();
	sel.addRange(newRange);
}

const MIN_H_MAP: Record<number, string> = {
	1: "min-h-[1.5rem]",
	2: "min-h-[3rem]",
	3: "min-h-[4.5rem]",
	4: "min-h-[6rem]",
	5: "min-h-[7.5rem]",
	6: "min-h-[9rem]",
	7: "min-h-[10.5rem]",
	8: "min-h-[12rem]",
};

export function PillInput({
	label,
	value,
	onChange,
	upstreamVars,
	placeholder,
	mono,
	minRows = 4,
	required = false,
}: PillInputProps) {
	const editorRef = useRef<HTMLDivElement>(null);
	const lastValueRef = useRef<string>(value);
	const skipSyncRef = useRef(false);

	// Autocomplete dropdown for `${` partial matches
	const [acVars, setAcVars] = useState<string[]>([]);
	const [acPartialStart, setAcPartialStart] = useState(-1);

	// +Variable picker
	const [showPicker, setShowPicker] = useState(false);
	const pickerRef = useRef<HTMLDivElement>(null);

	// Sync external value → DOM only when it differs from what we last wrote
	useEffect(() => {
		const el = editorRef.current;
		if (!el || skipSyncRef.current) return;
		if (readDOM(el) !== value) {
			renderDOM(el, value, upstreamVars);
			lastValueRef.current = value;
		}
	}, [value, upstreamVars]);

	// Close picker on outside click
	useEffect(() => {
		if (!showPicker) return;
		const handler = (e: MouseEvent) => {
			if (
				pickerRef.current &&
				!pickerRef.current.contains(e.target as Node)
			) {
				setShowPicker(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [showPicker]);

	const detectAutocomplete = useCallback(
		(el: HTMLElement) => {
			const sel = window.getSelection();
			if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) {
				setAcVars([]);
				return;
			}
			const range = sel.getRangeAt(0);
			const anchor = range.startContainer;
			if (
				anchor.nodeType !== Node.TEXT_NODE ||
				anchor.parentElement !== el
			) {
				setAcVars([]);
				return;
			}
			const textBefore = (anchor.textContent ?? "").slice(
				0,
				range.startOffset,
			);
			const openIdx = textBefore.lastIndexOf("${");
			if (openIdx === -1 || textBefore.slice(openIdx + 2).includes("}")) {
				setAcVars([]);
				return;
			}
			const filter = textBefore.slice(openIdx + 2).toLowerCase();
			setAcPartialStart(openIdx);
			setAcVars(
				upstreamVars.filter((v) => v.toLowerCase().includes(filter)),
			);
		},
		[upstreamVars],
	);

	const emitChange = useCallback(
		(el: HTMLElement) => {
			skipSyncRef.current = true;
			const str = readDOM(el);
			lastValueRef.current = str;
			onChange(str);
			requestAnimationFrame(() => {
				skipSyncRef.current = false;
			});
		},
		[onChange],
	);

	const handleInput = useCallback(() => {
		const el = editorRef.current;
		if (!el) return;
		emitChange(el);
		detectAutocomplete(el);
	}, [emitChange, detectAutocomplete]);

	/**
	 * Handles three special key cases: Enter prevention in single-line mode,
	 * `}` key conversion of a completed `${varName}` token into an atomic pill,
	 * and Backspace deletion of the whole pill when caret is immediately after one.
	 */
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			const el = editorRef.current;
			if (!el) return;

			// Prevent newlines in single-line mode
			if (e.key === "Enter" && !mono) {
				e.preventDefault();
				return;
			}

			if (e.key === "Escape") {
				setAcVars([]);
				return;
			}

			// Convert completed `${var}` to pill when `}` is pressed
			if (e.key === "}") {
				requestAnimationFrame(() => {
					if (!editorRef.current) return;
					tryConvertPillAtCaret(editorRef.current, upstreamVars);
					emitChange(editorRef.current);
					detectAutocomplete(editorRef.current);
				});
				return;
			}

			// Backspace: delete pill atomically when caret is right after one
			if (e.key === "Backspace") {
				const sel = window.getSelection();
				if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return;
				const range = sel.getRangeAt(0);
				const anchor = range.startContainer;

				// Caret in a text node at offset 0: check previous sibling for a pill
				if (
					anchor.nodeType === Node.TEXT_NODE &&
					range.startOffset === 0
				) {
					const prev = anchor.previousSibling;
					if (
						prev instanceof HTMLElement &&
						prev.dataset.var !== undefined
					) {
						e.preventDefault();
						el.removeChild(prev);
						emitChange(el);
						return;
					}
				}
				// Caret directly in the editor div pointing at a pill index
				if (anchor === el && range.startOffset > 0) {
					const target = el.childNodes[range.startOffset - 1];
					if (
						target instanceof HTMLElement &&
						target.dataset.var !== undefined
					) {
						e.preventDefault();
						el.removeChild(target);
						emitChange(el);
						return;
					}
				}
			}
		},
		[mono, upstreamVars, emitChange, detectAutocomplete],
	);

	/** Inserts a known variable as a pill at the current caret position. */
	const insertVar = useCallback(
		(varName: string) => {
			const el = editorRef.current;
			if (!el) return;
			el.focus();

			const sel = window.getSelection();
			if (sel && sel.rangeCount > 0 && sel.isCollapsed) {
				const range = sel.getRangeAt(0);
				const anchor = range.startContainer;

				// If we're in a partial `${` match, replace it with the pill
				if (
					anchor.nodeType === Node.TEXT_NODE &&
					anchor.parentElement === el &&
					acPartialStart >= 0
				) {
					const textNode = anchor as Text;
					const textContent = textNode.textContent ?? "";
					const caretOffset = range.startOffset;
					const before = document.createTextNode(
						textContent.slice(0, acPartialStart),
					);
					const after = document.createTextNode(
						textContent.slice(caretOffset),
					);
					const pill = makePill(varName);
					el.insertBefore(after, textNode);
					el.insertBefore(pill, after);
					el.insertBefore(before, pill);
					el.removeChild(textNode);
					const newRange = document.createRange();
					newRange.setStartAfter(pill);
					newRange.collapse(true);
					sel.removeAllRanges();
					sel.addRange(newRange);
				} else {
					// Insert pill at current caret position via Range API
					const span = makePill(varName);
					range.insertNode(span);
					range.setStartAfter(span);
					range.collapse(true);
					sel.removeAllRanges();
					sel.addRange(range);
				}
			} else {
				el.appendChild(makePill(varName));
				el.appendChild(document.createTextNode(""));
			}

			setAcVars([]);
			setAcPartialStart(-1);
			setShowPicker(false);
			emitChange(el);
		},
		[acPartialStart, emitChange],
	);

	return (
		<div className="flex flex-col gap-1">
			<div className="flex items-center justify-between">
				<FieldLabel>
					{label}
					{required && (
						<span className="ml-1 text-destructive" aria-hidden>
							*
						</span>
					)}
				</FieldLabel>
				{upstreamVars.length > 0 && (
					<div ref={pickerRef} className="relative">
						<button
							type="button"
							onClick={() => setShowPicker((p) => !p)}
							className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] text-primary hover:bg-primary/10"
						>
							+ Variable
							<ChevronDown className="h-2.5 w-2.5" />
						</button>
						{showPicker && (
							<div className="absolute top-full right-0 z-50 mt-1 min-w-[160px] rounded-md border bg-popover shadow-md">
								{upstreamVars.map((v) => (
									<button
										key={v}
										type="button"
										onMouseDown={(e) => {
											e.preventDefault();
											insertVar(v);
										}}
										className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left font-mono text-xs hover:bg-accent hover:text-accent-foreground"
									>
										<span className="text-[10px] text-muted-foreground">
											{/* biome-ignore lint/suspicious/noTemplateCurlyInString: intentional literal display of ${} syntax */}
											{"${}"}
										</span>
										{v}
									</button>
								))}
							</div>
						)}
					</div>
				)}
			</div>
			<div className="relative">
				{/* biome-ignore lint/a11y/useSemanticElements: contenteditable div is required for inline pill rendering */}
				<div
					ref={editorRef}
					role="textbox"
					tabIndex={0}
					aria-label={label}
					aria-multiline={mono}
					contentEditable
					suppressContentEditableWarning
					onInput={handleInput}
					onKeyDown={handleKeyDown}
					onKeyUp={() => {
						if (editorRef.current)
							detectAutocomplete(editorRef.current);
					}}
					onPaste={(e) => {
						e.preventDefault();
						const text = e.clipboardData.getData("text/plain");
						if (!text || !editorRef.current) return;
						const sel = window.getSelection();
						if (sel && sel.rangeCount > 0) {
							const range = sel.getRangeAt(0);
							range.deleteContents();
							range.insertNode(document.createTextNode(text));
							range.collapse(false);
							sel.removeAllRanges();
							sel.addRange(range);
						} else {
							editorRef.current.appendChild(
								document.createTextNode(text),
							);
						}
						emitChange(editorRef.current);
					}}
					className={[
						"w-full rounded-md border bg-background px-3 py-2 text-sm outline-none",
						"focus:ring-2 focus:ring-ring focus:ring-offset-0",
						mono
							? `overflow-auto font-mono text-xs leading-relaxed ${MIN_H_MAP[minRows] ?? "min-h-[6rem]"}`
							: "overflow-x-auto whitespace-nowrap",
					].join(" ")}
				/>
				{/* Placeholder — shown when editor is empty */}
				{!value && placeholder && (
					<span
						aria-hidden="true"
						className="pointer-events-none absolute top-0 left-0 select-none px-3 py-2 text-muted-foreground text-sm"
					>
						{placeholder}
					</span>
				)}
				{/* Autocomplete dropdown */}
				{acVars.length > 0 && (
					<div className="absolute top-full right-0 left-0 z-50 mt-0.5 max-h-40 overflow-y-auto rounded-md border bg-popover shadow-md">
						{acVars.map((v) => (
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
									{/* biome-ignore lint/suspicious/noTemplateCurlyInString: intentional literal display of ${} syntax */}
									{"${}"}
								</span>
								{v}
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

export type { PillInputProps as BoundInputProps };
export { PillInput as BoundInput };
