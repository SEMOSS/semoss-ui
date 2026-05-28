import type * as monacoType from "monaco-editor";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	getPixelAsyncResult,
	console as getPixelConsole,
	runPixelAsync,
} from "@semoss/sdk";
import { useInsight } from "@semoss/sdk/react";
import { MonacoEditor } from "@semoss/shared";
import { useTheme } from "@semoss/ui/next";
import { CopyIcon, Logo } from "../../assets/logos";
import type {
	ConsoleContext,
	ConsoleHistoryStep,
	ConsoleState,
} from "../../types";
import { runPixel } from "../../utility/pixel";
import { useResizableHandle } from "../../utility/resizable";
import { useTerminal } from "../terminal/terminal-context";
import { Tooltip } from "../tooltip";
import { TranscriptRow } from "./transcript-row";

interface ReactorSuggestion {
	/** Reactor name — both the display label and the inserted text. */
	name: string;
	/** Category from `help()`, shown next to the label as `detail`. */
	meta: string;
}

const ACTIONS = new Set([
	"clear",
	"r",
	"p",
	"R",
	"P",
	"%r",
	"%p",
	"%R",
	"%P",
	"multi",
	"raw",
]);

const addContext = (input: string, context: ConsoleContext): string => {
	const trimmed = input.trim();
	if (context === "R") return `R("<encode>${trimmed}</encode>");`;
	if (context === "Python") return `Py("<encode>${trimmed}</encode>");`;
	if (context === "Shell")
		return `Command("${trimmed.replace(/"/g, '\\"')}");`;
	return trimmed;
};

const monacoLanguageForContext = (context: ConsoleContext): string => {
	if (context === "R") return "r";
	if (context === "Python") return "python";
	if (context === "Shell") return "shell";
	// Monaco doesn't ship a "pixel" language; plaintext gives us no
	// highlighting but keeps the completer registration simple.
	return "plaintext";
};

export const TerminalConsole = () => {
	const terminal = useTerminal();
	const { actions, insightId, isAuthorized } = useInsight();
	const { theme } = useTheme();
	const { t } = useTranslation("console");
	const insightIdRef = useRef(insightId);
	insightIdRef.current = insightId;

	// Track the resolved theme (light/dark) so Monaco picks the right
	// editor theme when the user is on "system" and toggles their OS theme.
	const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() =>
		document.documentElement.classList.contains("dark") ? "dark" : "light",
	);
	useEffect(() => {
		const root = document.documentElement;
		const sync = () =>
			setResolvedTheme(
				root.classList.contains("dark") ? "dark" : "light",
			);
		sync();
		const observer = new MutationObserver(sync);
		observer.observe(root, {
			attributes: true,
			attributeFilter: ["class"],
		});
		return () => observer.disconnect();
	}, [theme]);
	const monacoTheme = resolvedTheme === "dark" ? "vs-dark" : "vs";

	const [state, setStateValue] = useState<ConsoleState>({
		context: "Pixel",
		rawOutput: false,
		maxRecords: 10,
		executeOnEnter: true,
		wordWrap: false,
	});
	const stateRef = useRef(state);
	stateRef.current = state;
	const setState = (next: Partial<ConsoleState>) =>
		setStateValue((curr) => ({ ...curr, ...next }));

	const [input, setInput] = useState("");
	const inputRef = useRef(input);
	inputRef.current = input;

	const [history, setHistory] = useState<ConsoleHistoryStep[]>([]);
	const historyRef = useRef(history);
	historyRef.current = history;
	const [, setHistoryCursor] = useState<number | null>(null);
	const stepIdCounterRef = useRef(0);

	const transcriptEleRef = useRef<HTMLDivElement | null>(null);
	const editorRef = useRef<monacoType.editor.IStandaloneCodeEditor | null>(
		null,
	);
	const monacoRef = useRef<typeof monacoType | null>(null);
	// Tracks whether we've registered the pixel completion provider on the
	// singleton monaco namespace (multiple <MonacoEditor> mounts share it).
	const completerRegisteredRef = useRef(false);

	// Vertical split between editor (top) and transcript (bottom). The
	// editor's height percentage = drag-handle Y position within the pane.
	const [editorHeight, setEditorHeight] = useState(30); // % of split area
	const splitHandle = useResizableHandle({
		direction: "vertical",
		onResize: (percent) => setEditorHeight(percent),
		min: 10,
		max: 80,
	});

	const appendStep = useCallback((step: Omit<ConsoleHistoryStep, "id">) => {
		stepIdCounterRef.current += 1;
		const withId: ConsoleHistoryStep = {
			...step,
			id: `step-${stepIdCounterRef.current}`,
		};
		setHistory((curr) => [...curr, withId]);
		setHistoryCursor(null);
		setTimeout(() => {
			const el = transcriptEleRef.current;
			if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
		}, 0);
	}, []);

	/** Patch a transcript row in place. Used to stream logs into a row while
	 * the async pixel job is still running, and to fill in the final output
	 * when it completes. */
	const updateStep = useCallback(
		(idx: number, patch: Partial<ConsoleHistoryStep>) => {
			setHistory((curr) => {
				if (!curr[idx]) return curr;
				const next = curr.slice();
				next[idx] = { ...next[idx], ...patch };
				return next;
			});
			// keep the transcript scrolled to the latest entry
			setTimeout(() => {
				const el = transcriptEleRef.current;
				if (el)
					el.scrollTo({
						top: el.scrollHeight,
						behavior: "smooth",
					});
			}, 0);
		},
		[],
	);

	/**
	 * Mirror of the notebook code-cell pattern: kick off the pixel as an
	 * async job, poll `console` for stdout/stderr while it runs, then unwrap
	 * the final result per operationType.
	 */
	const runPixelWithLogs = useCallback(
		async (input: string, pixel: string, context: ConsoleContext) => {
			const stepIdx = historyRef.current.length;
			appendStep({
				executed: true,
				expression: pixel,
				type: "RUNNING",
				context,
				input,
				output: "",
				messages: [],
				pending: true,
			});

			const targetInsightId = insightIdRef.current;
			if (!targetInsightId) {
				updateStep(stepIdx, {
					type: "ERROR",
					output: t("results.insightNotReady"),
					pending: false,
				});
				return;
			}

			try {
				const { jobId } = await runPixelAsync(pixel, targetInsightId);

				const collected: string[] = [];
				let lastStatus: string | undefined;
				let polling = true;
				while (polling) {
					try {
						const { message: msgs, status } =
							await getPixelConsole(jobId);
						if (status) lastStatus = status;
						if (msgs?.length) {
							collected.push(...msgs);
							updateStep(stepIdx, {
								messages: collected.slice(),
								lastStatus,
							});
						}
						if (
							status === "Complete" ||
							status === "ProgressComplete" ||
							status === "Streaming"
						) {
							polling = false;
						} else {
							await new Promise((r) => setTimeout(r, 1000));
						}
					} catch {
						polling = false;
					}
				}

				// one more flush to grab any logs written between the last
				// poll and the result being ready
				try {
					const { message: finalMsgs, status: finalStatus } =
						await getPixelConsole(jobId);
					if (finalStatus) lastStatus = finalStatus;
					if (finalMsgs?.length) {
						collected.push(...finalMsgs);
					}
				} catch {
					// ignore
				}

				const { errors, results } = await getPixelAsyncResult(jobId);

				if (errors.length > 0) {
					updateStep(stepIdx, {
						type: "ERROR",
						output: errors.join("\n"),
						messages: collected.slice(),
						lastStatus,
						pending: false,
					});
					return;
				}

				const last = results[results.length - 1];
				const opType = (last?.operationType?.[0] as string) || "";
				const output = unwrapPixelOutput(last);
				const formatted = formatOutputForDisplay(
					output,
					opType,
					stateRef.current,
				);
				// CODE_EXECUTION pixels (Py/R/Command) with no return value
				// and no stdout produce an empty output — render nothing,
				// which looks like the command never ran. Substitute a
				// success marker so the user gets confirmation.
				const isErrorType =
					opType === "ERROR" || opType === "INVALID_SYNTAX";
				const finalOutput =
					!formatted && !isErrorType
						? t("results.successNoOutput")
						: formatted;

				updateStep(stepIdx, {
					type: opType,
					output: finalOutput,
					messages: collected.slice(),
					lastStatus,
					pending: false,
				});
			} catch (err) {
				updateStep(stepIdx, {
					type: "ERROR",
					output:
						err instanceof Error
							? err.message
							: typeof err === "string"
								? err
								: t("results.unknownError"),
					pending: false,
				});
			}
		},
		[appendStep, t, updateStep],
	);

	const applyContext = useCallback((context: ConsoleContext) => {
		setState({ context });
		editorRef.current?.focus();
	}, []);

	const execute = useCallback(async () => {
		const raw = inputRef.current;
		if (!raw.trim()) return;

		const context = stateRef.current.context;
		const trimmed = raw.trim();

		if (ACTIONS.has(trimmed)) {
			if (trimmed === "clear") {
				setHistory([]);
			} else if (
				trimmed === "r" ||
				trimmed === "%r" ||
				trimmed === "R" ||
				trimmed === "%R"
			) {
				applyContext("R");
				appendStep({
					executed: true,
					expression: trimmed,
					type: "ACTION",
					context,
					input: trimmed,
					output: t("actions.enteredRMode"),
				});
			} else if (
				trimmed === "p" ||
				trimmed === "%p" ||
				trimmed === "P" ||
				trimmed === "%P"
			) {
				applyContext("Python");
				appendStep({
					executed: true,
					expression: trimmed,
					type: "ACTION",
					context,
					input: trimmed,
					output: t("actions.enteredPythonMode"),
				});
			} else if (trimmed === "multi") {
				setState({ executeOnEnter: !stateRef.current.executeOnEnter });
			} else if (trimmed === "raw") {
				setState({ rawOutput: !stateRef.current.rawOutput });
			}
			setInput("");
			editorRef.current?.focus();
			return;
		}

		const pixel = addContext(raw, context);
		setInput("");
		editorRef.current?.focus();

		await runPixelWithLogs(raw, pixel, context);
	}, [appendStep, applyContext, runPixelWithLogs, t]);

	// history recall: Up at row 0 / Down at last row pulls the previous /
	// next submitted command into the editor. We also switch the console
	// context to the one the recalled step was executed in, so the editor
	// mode (syntax highlighting) matches and a subsequent Submit runs the
	// command in the same persona as before.
	const moveCursorToEnd = () => {
		// schedule after the controlled value flushes through React
		setTimeout(() => {
			const editor = editorRef.current;
			if (!editor) return;
			editor.gotoLine(editor.session.getLength(), Infinity, false);
			editor.focus();
		}, 0);
	};

	const recallStep = (step: ConsoleHistoryStep) => {
		setInput(step.input);
		if (step.context && step.context !== stateRef.current.context) {
			const ctx = step.context as ConsoleContext;
			if (
				ctx === "Pixel" ||
				ctx === "R" ||
				ctx === "Python" ||
				ctx === "Shell"
			) {
				setState({ context: ctx });
			}
		}
		moveCursorToEnd();
	};

	const historyUp = useCallback(() => {
		const steps = historyRef.current.filter((s) => s.executed);
		if (!steps.length) return;
		setHistoryCursor((curr) => {
			const next =
				curr === null ? steps.length - 1 : Math.max(0, curr - 1);
			recallStep(steps[next]);
			return next;
		});
	}, []);
	const historyDown = useCallback(() => {
		const steps = historyRef.current.filter((s) => s.executed);
		if (!steps.length) return;
		setHistoryCursor((curr) => {
			if (curr === null) return null;
			const next = curr + 1;
			if (next >= steps.length) {
				setInput("");
				moveCursorToEnd();
				return null;
			}
			recallStep(steps[next]);
			return next;
		});
	}, []);

	// Focus on mount
	useEffect(() => {
		const t = setTimeout(() => editorRef.current?.focus(), 100);
		return () => clearTimeout(t);
	}, []);

	// ---- pixel reactor typeahead -----------------------------------------
	// Fetch the reactor catalog once via `help()` and stash it in a ref so
	// the Monaco completion provider can read it without re-registering.
	const reactorsRef = useRef<ReactorSuggestion[]>([]);

	useEffect(() => {
		if (!isAuthorized) return;
		let cancelled = false;
		(async () => {
			const resp = await runPixel<string>(actions, `help();`);
			if (cancelled || !resp) return;
			if (resp.operationType.some((t) => t.indexOf("ERROR") > -1)) return;
			const raw =
				typeof resp.output === "string"
					? resp.output
					: String(resp.output ?? "");
			// collapse runs of 2+ spaces, then split on the now-uniform "  "
			const tokens = raw.replace(/(\s\s)+/g, "  ").split("  ");
			const items: ReactorSuggestion[] = [];
			let category = "";
			for (const tk of tokens) {
				const t = tk.trim();
				if (!t) continue;
				if (t.endsWith(":")) {
					category = t.slice(0, -1);
				} else {
					items.push({ name: t, meta: category || "pixel" });
				}
			}
			reactorsRef.current = items;
		})();
		return () => {
			cancelled = true;
		};
	}, [isAuthorized, actions]);

	// Expose an external submission path so other panes (the file editor's
	// Run button) can pipe their pixel through this transcript — same async
	// flow with stdout/stderr capture as the in-pane execute().
	useEffect(() => {
		terminal.registerSubmitToConsole((pixel, opts) => {
			runPixelWithLogs(opts.displayInput, pixel, opts.context);
		});
		return () => terminal.registerSubmitToConsole(() => {});
	}, [terminal, runPixelWithLogs]);

	/**
	 * Hook up Monaco keybindings + the reactor completion provider when the
	 * editor first mounts. Runs once per editor instance.
	 */
	const wireMonacoBindings = useCallback(
		(
			editor: monacoType.editor.IStandaloneCodeEditor,
			monaco: typeof monacoType,
		) => {
			const KeyMod = monaco.KeyMod;
			const KeyCode = monaco.KeyCode;

			// Cmd/Ctrl-Enter → Submit
			editor.addCommand(KeyMod.CtrlCmd | KeyCode.Enter, () => execute());

			// Cmd/Ctrl-Up / Down → unconditional history recall
			editor.addCommand(KeyMod.CtrlCmd | KeyCode.UpArrow, () =>
				historyUp(),
			);
			editor.addCommand(KeyMod.CtrlCmd | KeyCode.DownArrow, () =>
				historyDown(),
			);

			// Plain Up / Down → conditional. Recall history only when the
			// cursor is at the boundary; otherwise fall through to Monaco's
			// built-in cursor navigation.
			editor.addCommand(KeyCode.UpArrow, () => {
				const pos = editor.getPosition();
				if (pos?.lineNumber === 1) {
					historyUp();
				} else {
					editor.trigger("history", "cursorUp", null);
				}
			});
			editor.addCommand(KeyCode.DownArrow, () => {
				const pos = editor.getPosition();
				const total = editor.getModel()?.getLineCount() ?? 1;
				if (pos?.lineNumber === total) {
					historyDown();
				} else {
					editor.trigger("history", "cursorDown", null);
				}
			});

			// Register the reactor catalog completer on the languages we use.
			// The provider checks the active context so it only fires for
			// Pixel — R/Python/Shell get Monaco's built-in word suggestions.
			if (!completerRegisteredRef.current) {
				completerRegisteredRef.current = true;
				const provider: monacoType.languages.CompletionItemProvider = {
					provideCompletionItems: (model, position) => {
						if (stateRef.current.context !== "Pixel") {
							return { suggestions: [] };
						}
						const word = model.getWordUntilPosition(position);
						const range = {
							startLineNumber: position.lineNumber,
							endLineNumber: position.lineNumber,
							startColumn: word.startColumn,
							endColumn: word.endColumn,
						};
						const suggestions = reactorsRef.current.map((r) => ({
							label: r.name,
							kind: monaco.languages.CompletionItemKind.Function,
							insertText: `${r.name}()`,
							detail: r.meta,
							range,
						}));
						return { suggestions };
					},
				};
				for (const lang of [
					"plaintext",
					"python",
					"r",
					"shell",
				] as const) {
					monaco.languages.registerCompletionItemProvider(
						lang,
						provider,
					);
				}
			}
		},
		[execute, historyUp, historyDown],
	);

	const copyRecipe = useCallback(async () => {
		const content = historyRef.current
			.filter((s) => s.executed)
			.map((s) => s.expression)
			.join("\n");
		try {
			await navigator.clipboard.writeText(content);
			terminal.alert("success", t("copyAll.success"));
		} catch {
			terminal.alert("error", t("copyAll.error"));
		}
	}, [t, terminal]);

	return (
		<div className="absolute inset-0 flex flex-col overflow-hidden bg-background">
			<div
				className="terminal-repl-editor relative"
				style={{
					flexBasis: `${editorHeight}%`,
					flexGrow: 0,
					flexShrink: 0,
					minHeight: 60,
				}}
			>
				{state.context !== "Pixel" && (
					<div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.08]">
						<Logo name={state.context} className="h-24 w-24" />
					</div>
				)}
				<Suspense fallback={null}>
					<MonacoEditor
						value={input}
						onChange={(v) => setInput(v ?? "")}
						language={monacoLanguageForContext(state.context)}
						theme={monacoTheme}
						height="100%"
						width="100%"
						options={{
							fontSize: 13,
							minimap: { enabled: false },
							lineNumbers: "on",
							scrollBeyondLastLine: false,
							renderLineHighlight: "none",
							folding: false,
							// Tighten the gutter so the small REPL doesn't
							// burn horizontal space on Monaco's defaults.
							lineNumbersMinChars: 2,
							lineDecorationsWidth: 4,
							glyphMargin: false,
							// Trigger the completion popup as the user types
							// rather than only on Ctrl-Space.
							quickSuggestions: {
								other: true,
								comments: true,
								strings: true,
							},
							suggestOnTriggerCharacters: true,
							wordBasedSuggestions: "off",
							tabSize: 2,
							scrollbar: {
								vertical: "auto",
								horizontal: "auto",
								useShadows: false,
							},
						}}
						onMount={(editor, monaco) => {
							editorRef.current = editor;
							monacoRef.current = monaco;
							wireMonacoBindings(editor, monaco);
						}}
					/>
				</Suspense>
			</div>

			{/* Upper toolbar — input-affecting controls live with the editor.
                Persona switcher + Submit clustered together on the right so
                "I'm submitting in <persona>" reads as one visual group. */}
			<div className="flex h-10 items-center gap-2 border-border border-t bg-muted px-2">
				<div className="ml-auto inline-flex overflow-hidden rounded border border-border">
					{(["Pixel", "R", "Python", "Shell"] as const).map((c) => (
						<Tooltip
							key={c}
							label={t("context.switchTo", { context: c })}
						>
							<button
								type="button"
								className={`flex items-center justify-center border-border border-r px-2 py-1 last:border-r-0 ${
									state.context === c
										? "bg-primary/15 text-primary"
										: "bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
								}`}
								onClick={() => applyContext(c)}
							>
								<Logo name={c} className="h-4 w-4" />
							</button>
						</Tooltip>
					))}
				</div>

				<Tooltip label={t("run.tooltip")} align="end">
					<button
						type="button"
						className="rounded bg-primary px-3 py-1 text-primary-foreground text-sm hover:bg-primary/90"
						onClick={execute}
					>
						{t("run.button")}
					</button>
				</Tooltip>
			</div>

			{/* Drag handle separating the input zone (editor + toolbar) from
                the output transcript below. */}
			<div
				ref={splitHandle}
				className="h-1.5 cursor-ns-resize border-border border-y bg-muted hover:bg-primary/30"
				title="Drag to resize"
			/>

			<div
				ref={transcriptEleRef}
				// Light mode: tint the transcript with `bg-muted/40` so it
				// reads as a distinct surface from the editor pane above
				// (Monaco's `vs` theme is pure white, matches our
				// `bg-background`, and the two panes blur together).
				// Dark mode already has good contrast because Monaco's
				// `vs-dark` ships its own shade — so explicitly fall back to
				// `bg-background` there to preserve the current look.
				className="min-h-0 flex-1 overflow-y-auto bg-muted/70 font-mono text-[13px] text-foreground leading-relaxed dark:bg-background"
				data-section="transcript"
			>
				{history.length === 0 ? (
					<div className="px-3 py-2 text-muted-foreground">
						{t("emptyState.prefix")}{" "}
						<kbd className="rounded border border-border bg-muted px-1 text-foreground">
							Ctrl
						</kbd>{" "}
						{t("emptyState.and")}{" "}
						<kbd className="rounded border border-border bg-muted px-1 text-foreground">
							Enter
						</kbd>{" "}
						{t("emptyState.suffix")}
					</div>
				) : (
					history.map((step) => (
						<TranscriptRow key={step.id} step={step} />
					))
				)}
			</div>

			{/* Bottom toolbar — passive output controls (Copy recipe). The
                old settings popover (Raw Output / Row Limit / Word Wrap)
                wasn't actually wired into the rendering pipeline anymore;
                per-row Raw/Formatted toggles + the JsonViewer cover those
                needs now. */}
			<div className="flex h-9 items-center gap-1 border-border border-t bg-muted px-2">
				<Tooltip label={t("copyAll.tooltip")} align="start">
					<button
						type="button"
						className="flex items-center gap-1.5 rounded px-2 py-1 text-muted-foreground text-xs hover:bg-accent hover:text-accent-foreground"
						onClick={copyRecipe}
					>
						<CopyIcon className="h-3.5 w-3.5" />
						{t("copyAll.button")}
					</button>
				</Tooltip>
			</div>
		</div>
	);
};

/**
 * Mirror of cell.state.ts unwrap logic in libs/renderer. Each operationType
 * stores its payload in a slightly different shape; pick the right slot so
 * the output we render is the actual user-facing value rather than the
 * envelope.
 */
const unwrapPixelOutput = (last: {
	operationType?: string[];
	output?: unknown;
}): unknown => {
	if (!last) return undefined;
	const op = last.operationType ?? [];
	// biome-ignore lint/suspicious/noExplicitAny: pixel envelope shapes
	const out: any = last.output;
	if (op.indexOf("CUSTOM_DATA_STRUCTURE") > -1) return out;
	if (op.indexOf("FORMATTED_DATA_SET") > -1) return out?.[0];
	if (op.indexOf("CODE_EXECUTION") > -1) return out?.[0]?.output;
	if (op.indexOf("CODE") > -1) return out?.[0]?.value?.[0];
	if (op.indexOf("ERROR") > -1) return out?.[0];
	if (op.indexOf("CONST_STRING") > -1) return out?.[0];
	if (op.indexOf("INVALID_SYNTAX") > -1) return out?.[0];
	if (op.indexOf("VECTOR") > -1) return out?.[0];
	return out;
};

const formatOutputForDisplay = (
	value: unknown,
	opType: string,
	state: ConsoleState,
): string => {
	if (value === undefined || value === null) return "";
	if (state.rawOutput) {
		if (typeof value === "string") return value;
		return JSON.stringify(value, null, 2);
	}
	if (typeof value === "string") {
		if (opType === "ERROR") return `Error: ${value}`;
		if (opType === "INVALID_SYNTAX") return `Invalid Syntax: ${value}`;
		return value;
	}
	if (typeof value === "number" || typeof value === "boolean") {
		return String(value);
	}
	// arrays + plain objects render as pretty JSON
	return JSON.stringify(value, null, 2);
};
