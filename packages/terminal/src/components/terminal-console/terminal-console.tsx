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
import { Logo } from "../../assets/logos";
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

interface TerminalConsoleProps {
	/** When set, fetches app-specific reactors via GetProjectAvailableReactors
	 *  and merges them with the platform catalog from help(). */
	projectId?: string;
}

export const TerminalConsole = ({ projectId }: TerminalConsoleProps) => {
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
	const completerRegisteredRef = useRef(false);
	// Disposables for the completion providers — cleaned up on unmount so
	// that re-mounting (e.g. after SetContext) doesn't stack stale providers.
	const completionDisposablesRef = useRef<monacoType.IDisposable[]>([]);

	useEffect(() => {
		return () => {
			for (const d of completionDisposablesRef.current) {
				try {
					d.dispose();
				} catch {
					// ignore if already disposed
				}
			}
			completionDisposablesRef.current = [];
			completerRegisteredRef.current = false;
		};
	}, []);

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
	// The autocomplete catalog is the merge of two independent sources:
	//   - platform reactors from help() — identical for every project, so it
	//     is fetched once on auth and never on a context switch.
	//   - app-specific reactors via GetProjectAvailableReactors — re-fetched
	//     only when the effective project changes.
	// Keeping them in separate refs lets the project-dependent fetch re-run
	// without dragging the project-independent help() call along with it.
	const reactorsRef = useRef<ReactorSuggestion[]>([]);
	const platformReactorsRef = useRef<ReactorSuggestion[]>([]);
	const appReactorsRef = useRef<ReactorSuggestion[]>([]);

	// Effective project: explicit prop wins; fall back to the terminal
	// context's selectedApp when the file-explorer is in APP scope.
	const effectiveProjectId =
		projectId !== undefined
			? projectId
			: terminal.fileMode.type === "APP"
				? terminal.selectedApp?.project_id
				: undefined;

	// Merge the two sources into the consumed catalog; platform names win.
	const rebuildReactorCatalog = useCallback(() => {
		const seen = new Set(platformReactorsRef.current.map((i) => i.name));
		const merged = [...platformReactorsRef.current];
		for (const r of appReactorsRef.current) {
			if (!seen.has(r.name)) {
				seen.add(r.name);
				merged.push(r);
			}
		}
		reactorsRef.current = merged;
	}, []);

	// Platform reactors via help() — fetched once per auth, not per project.
	useEffect(() => {
		if (!isAuthorized) return;
		let cancelled = false;
		(async () => {
			try {
				const helpResp = await runPixel<string>(actions, `Help();`);
				if (cancelled) return;

				const items: ReactorSuggestion[] = [];

				if (
					helpResp &&
					Array.isArray(helpResp.operationType) &&
					!helpResp.operationType.some((t) => t.indexOf("ERROR") > -1)
				) {
					const raw =
						typeof helpResp.output === "string"
							? helpResp.output
							: String(helpResp.output ?? "");
					const tokens = raw.replace(/(\s\s)+/g, "  ").split("  ");
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
				}

				if (cancelled) return;
				platformReactorsRef.current = items;
				rebuildReactorCatalog();
			} catch {
				// silently preserve whatever was previously in the catalog
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [isAuthorized, actions, rebuildReactorCatalog]);

	// App-specific reactors — re-fetched only when the project context changes.
	useEffect(() => {
		if (!isAuthorized || !effectiveProjectId) {
			appReactorsRef.current = [];
			rebuildReactorCatalog();
			return;
		}
		let cancelled = false;
		(async () => {
			try {
				const appResp = await runPixel<string[]>(
					actions,
					`GetProjectAvailableReactors(project=['${effectiveProjectId}']);`,
				);
				if (cancelled) return;
				if (appResp && Array.isArray(appResp.output)) {
					appReactorsRef.current = appResp.output
						.filter((name) => !!name)
						.map((name) => ({ name, meta: "app" }));
					rebuildReactorCatalog();
				}
			} catch {
				// silently preserve whatever was previously in the catalog
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [isAuthorized, actions, effectiveProjectId, rebuildReactorCatalog]);

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

			// Enter → Submit (only when autocomplete popup is closed)
			editor.addCommand(KeyMod.CtrlCmd | KeyCode.Enter, () => execute());
			editor.addCommand(
				KeyCode.Enter,
				() => execute(),
				"!suggestWidgetVisible && !inlineSuggestionVisible",
			);

			// Cmd/Ctrl-Up / Down → unconditional history recall
			editor.addCommand(KeyMod.CtrlCmd | KeyCode.UpArrow, () =>
				historyUp(),
			);
			editor.addCommand(KeyMod.CtrlCmd | KeyCode.DownArrow, () =>
				historyDown(),
			);

			// Plain Up / Down → history at boundary, cursor otherwise.
			// Guard on !suggestWidgetVisible so arrow keys navigate the
			// autocomplete list instead of jumping to history.
			editor.addCommand(
				KeyCode.UpArrow,
				() => {
					const pos = editor.getPosition();
					if (pos?.lineNumber === 1) historyUp();
					else editor.trigger("history", "cursorUp", null);
				},
				"!suggestWidgetVisible",
			);
			editor.addCommand(
				KeyCode.DownArrow,
				() => {
					const pos = editor.getPosition();
					const total = editor.getModel()?.getLineCount() ?? 1;
					if (pos?.lineNumber === total) historyDown();
					else editor.trigger("history", "cursorDown", null);
				},
				"!suggestWidgetVisible",
			);

			// Register the reactor catalog completer on the languages we use.
			// The provider checks the active context so it only fires for
			// Pixel — R/Python/Shell get Monaco's built-in word suggestions.
			if (!completerRegisteredRef.current) {
				completerRegisteredRef.current = true;
				const provider: monacoType.languages.CompletionItemProvider = {
					provideCompletionItems: (model, position) => {
						// Scope to this editor's model — prevents stacked providers
						// from multiple mounted TerminalConsole instances (e.g. tabs)
						// each returning suggestions for every Monaco editor.
						if (editorRef.current?.getModel() !== model) {
							return { suggestions: [] };
						}
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
					completionDisposablesRef.current.push(
						monaco.languages.registerCompletionItemProvider(
							lang,
							provider,
						),
					);
				}
			}
		},
		[execute, historyUp, historyDown],
	);

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

			{/* Upper toolbar — context switcher only; Enter submits */}
			<div className="flex h-9 items-center border-border border-t bg-muted/60 px-2">
				<div className="ml-auto inline-flex overflow-hidden rounded-md border border-border/70">
					{(["Pixel", "R", "Python", "Shell"] as const).map((c) => (
						<Tooltip
							key={c}
							label={t("context.switchTo", { context: c })}
						>
							<button
								type="button"
								className={`flex items-center justify-center border-border/70 border-r px-2 py-1 last:border-r-0 ${
									state.context === c
										? "bg-primary/15 text-primary"
										: "bg-background/80 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
								}`}
								onClick={() => applyContext(c)}
							>
								<Logo name={c} className="h-3.5 w-3.5" />
							</button>
						</Tooltip>
					))}
				</div>
			</div>

			{/* Drag handle separating the input zone (editor + toolbar) from
                the output transcript below. */}
			<div
				ref={splitHandle}
				className="h-1.5 cursor-ns-resize border-border border-y bg-muted hover:bg-primary/30"
				title={t("dragToResize")}
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
					<div className="px-3 py-2 text-muted-foreground/70 text-xs">
						Type a Pixel and press{" "}
						<kbd className="rounded border border-border bg-muted px-1 text-[11px] text-foreground/80">
							Enter
						</kbd>{" "}
						to run. Use{" "}
						<kbd className="rounded border border-border bg-muted px-1 text-[11px] text-foreground/80">
							↑↓
						</kbd>{" "}
						for history.
					</div>
				) : (
					history.map((step) => (
						<TranscriptRow key={step.id} step={step} />
					))
				)}
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
