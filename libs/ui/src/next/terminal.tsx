import { Clipboard, Copy, Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import "@xterm/xterm/css/xterm.css";
import "./terminal.css";
import { ClipboardAddon } from "@xterm/addon-clipboard";
import { FitAddon } from "@xterm/addon-fit";
import { SearchAddon } from "@xterm/addon-search";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { Terminal as XTerm } from "@xterm/xterm";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { TerminalSpinner } from "./terminal-spinner";

const THEME_OPTIONS = {
	darkTheme: {
		foreground: "#E9E9E9",
		background: "#262626",
		selectionBackground: "#aaa6a6ff",
		cursor: "#8BCAFF",
		black: "#000000",
		brightBlack: "#515151",
		red: "#BF0D02",
		brightRed: "#DA291C",
		green: "#00B4A4",
		brightGreen: "#008674",
		yellow: "#EF8326",
		brightYellow: "#FA9F2C",
		blue: "#22A4FF",
		brightBlue: "#0094FF",
		magenta: "#FF4E90",
		brightMagenta: "#D62C71",
		cyan: "#975FE4",
		brightCyan: "#6A32CE",
		white: "#FAFAFA",
		brightWhite: "#FFFFFF",
	},
	lightTheme: {
		foreground: "#262626",
		background: "#FAFAFA",
		selectionBackground: "#d3d3d3",
		cursor: "#0074D9",
		black: "#000000",
		brightBlack: "#757575",
		red: "#BF0D02",
		brightRed: "#DA291C",
		green: "#008674",
		brightGreen: "#00B4A4",
		yellow: "#EF8326",
		brightYellow: "#FA9F2C",
		blue: "#0074D9",
		brightBlue: "#0094FF",
		magenta: "#D62C71",
		brightMagenta: "#FF4E90",
		cyan: "#6A32CE",
		brightCyan: "#975FE4",
		white: "#E9E9E9",
		brightWhite: "#FFFFFF",
	},
};

const MAX_VISIBLE_SUGGESTIONS = 6;
const PROMPT_DISPLAY = "> ";
const PROMPT = PROMPT_DISPLAY;
const PROMPT_LENGTH = PROMPT_DISPLAY.length;

type TerminalTheme = "dark" | "light";

interface BufferState {
	command: string;
	position: number;
}

interface SuggestionState {
	activeIndex: number;
	hide: boolean;
}

interface SuggestionPosition {
	top: number;
	left: number;
	maxHeight: number;
}

interface CursorLayout {
	line: number;
	column: number;
}

const splitResponseLines = (response: string) => {
	if (!response) {
		return [""];
	}
	return response.split(/\r\n|\n|\r/g);
};

const getInitialTheme = (): TerminalTheme => {
	if (
		typeof window !== "undefined" &&
		window.matchMedia?.("(prefers-color-scheme: dark)").matches
	) {
		return "dark";
	}
	return "light";
};

const isPrintableInput = (value: string): boolean => {
	if (!value) {
		return false;
	}

	for (const char of value) {
		const code = char.codePointAt(0);
		if (code === undefined) {
			return false;
		}

		// Allow line breaks and tabs for multiline paste/input.
		if (code === 10 || code === 9) {
			continue;
		}

		if (code < 32 || code === 127) {
			return false;
		}
	}

	return true;
};

const normalizeInputText = (value: string): string => {
	return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
};

const getCursorLayout = (
	command: string,
	position: number,
	cols: number,
): CursorLayout => {
	const safeCols = Math.max(1, cols);
	const safePosition = Math.max(0, Math.min(position, command.length));

	let line = 0;
	let column = PROMPT_LENGTH;

	for (let index = 0; index < safePosition; index++) {
		const char = command[index];
		if (char === "\n") {
			line += 1;
			column = 0;
			continue;
		}

		column += 1;
		if (column >= safeCols) {
			line += 1;
			column = 0;
		}
	}

	return { line, column };
};

const getPromptLineCount = (command: string, cols: number): number => {
	return getCursorLayout(command, command.length, cols).line + 1;
};

export interface TerminalProps {
	/** Default command to display */
	defaultCommand?: string;
	/** Track if the terminal is disabled */
	disabled?: boolean;
	/** Track if the terminal is loading */
	loading?: boolean;
	/** Instructions to show in the terminal with the prompt */
	instructions?: string;
	/** Welcome message to show in the terminal */
	welcome?: string;
	/** History of the terminal */
	history: {
		instructions?: string;
		command: string;
		response: string;
	}[];
	/** Fired when the command is set */
	onCommand: (command: string) => void;
	/** Callback that is fired when a command is run */
	onRun: (command?: string) => Promise<void>;
	/** Suggestions to show in the terminal */
	suggestions?: string[];
	/** Transform selected suggestions before they are inserted */
	transformSuggestion?: (suggestion: string) => string;
	/** Optional class name for the wrapper */
	className?: string;
}

export const Terminal: React.FC<TerminalProps> = ({
	defaultCommand = "",
	disabled = false,
	loading = false,
	welcome = "",
	history = [],
	instructions = "",
	onCommand = () => null,
	onRun = async () => null,
	suggestions = [],
	transformSuggestion = (suggestion) => suggestion,
	className,
}) => {
	const terminalRef = useRef<HTMLDivElement>(null);
	const xtermRef = useRef<XTerm | null>(null);
	const spinnerRef = useRef<TerminalSpinner | null>(null);

	const onRunRef = useRef(onRun);
	const onCommandRef = useRef(onCommand);
	const historyRef = useRef(history);
	const suggestionsRef = useRef(suggestions);
	const instructionsRef = useRef(instructions);
	const welcomeRef = useRef(welcome);
	const transformSuggestionRef = useRef(transformSuggestion);

	const [terminalTheme, setTerminalTheme] =
		useState<TerminalTheme>(getInitialTheme);
	const [buffer, setBuffer] = useState<BufferState>({
		command: defaultCommand,
		position: defaultCommand.length,
	});
	const [historyPosition, setHistoryPosition] = useState<number>(
		history.length,
	);
	const [suggestionState, setSuggestionState] = useState<SuggestionState>({
		activeIndex: -1,
		hide: false,
	});
	const [suggestionPosition, setSuggestionPosition] =
		useState<SuggestionPosition>({
			top: 32,
			left: 8,
			maxHeight: 140,
		});

	const bufferRef = useRef(buffer);
	const renderedBufferRef = useRef(buffer);
	const historyPositionRef = useRef(historyPosition);
	const suggestionStateRef = useRef(suggestionState);
	const renderedHistoryCountRef = useRef(0);
	const welcomeRenderedRef = useRef(false);
	const isDisabledRef = useRef(loading || disabled);
	const hasInstructionLineRef = useRef(false);

	const isDisabled = loading || disabled;

	useEffect(() => {
		onRunRef.current = onRun;
	}, [onRun]);

	useEffect(() => {
		onCommandRef.current = onCommand;
	}, [onCommand]);

	useEffect(() => {
		historyRef.current = history;
	}, [history]);

	useEffect(() => {
		suggestionsRef.current = suggestions;
	}, [suggestions]);

	useEffect(() => {
		instructionsRef.current = instructions;
	}, [instructions]);

	useEffect(() => {
		welcomeRef.current = welcome;
	}, [welcome]);

	useEffect(() => {
		transformSuggestionRef.current = transformSuggestion;
	}, [transformSuggestion]);

	useEffect(() => {
		bufferRef.current = buffer;
	}, [buffer]);

	useEffect(() => {
		historyPositionRef.current = historyPosition;
	}, [historyPosition]);

	useEffect(() => {
		suggestionStateRef.current = suggestionState;
	}, [suggestionState]);

	useEffect(() => {
		isDisabledRef.current = isDisabled;
	}, [isDisabled]);

	const setBufferState = useCallback(
		(next: BufferState, notifyParent = true) => {
			bufferRef.current = next;
			setBuffer(next);
			if (notifyParent) {
				onCommandRef.current(next.command);
			}
		},
		[],
	);

	const setHistoryPointer = useCallback((next: number) => {
		historyPositionRef.current = next;
		setHistoryPosition(next);
	}, []);

	const setSuggestionUi = useCallback(
		(
			nextState:
				| SuggestionState
				| ((previous: SuggestionState) => SuggestionState),
		) => {
			setSuggestionState((previous) => {
				const next =
					typeof nextState === "function"
						? nextState(previous)
						: nextState;
				suggestionStateRef.current = next;
				return next;
			});
		},
		[],
	);

	const filterSuggestions = useCallback((command: string): string[] => {
		const query = command.trim().toLowerCase();
		if (!query) {
			return [];
		}

		const unique = new Set<string>();
		const filtered: string[] = [];

		for (const rawSuggestion of suggestionsRef.current) {
			const suggestion = rawSuggestion.trim();
			if (!suggestion) {
				continue;
			}

			const normalized = suggestion.toLowerCase();
			if (normalized === query || !normalized.includes(query)) {
				continue;
			}

			if (unique.has(suggestion)) {
				continue;
			}

			unique.add(suggestion);
			filtered.push(suggestion);
			if (filtered.length >= MAX_VISIBLE_SUGGESTIONS) {
				break;
			}
		}

		return filtered;
	}, []);

	const visibleSuggestions = useMemo(() => {
		if (isDisabled || suggestionState.hide) {
			return [];
		}

		return filterSuggestions(buffer.command);
	}, [buffer.command, filterSuggestions, isDisabled, suggestionState.hide]);

	const getVisibleSuggestions = useCallback(() => {
		if (isDisabledRef.current || suggestionStateRef.current.hide) {
			return [];
		}
		return filterSuggestions(bufferRef.current.command);
	}, [filterSuggestions]);

	const clearCommandLine = useCallback(
		(current: BufferState = renderedBufferRef.current) => {
			const terminal = xtermRef.current;
			if (!terminal) {
				return;
			}

			const cols = terminal.cols || 80;
			const cursor = getCursorLayout(
				current.command,
				current.position,
				cols,
			);
			const linesUp = cursor.line;

			terminal.write(
				linesUp > 0 ? `\x1b[${linesUp}F\x1b[0J` : "\r\x1b[0J",
			);
		},
		[],
	);

	const clearPromptArea = useCallback(() => {
		const terminal = xtermRef.current;
		if (!terminal) {
			return;
		}

		const cols = terminal.cols || 80;
		const promptLines = getPromptLineCount(
			renderedBufferRef.current.command,
			cols,
		);
		const totalLines = hasInstructionLineRef.current
			? promptLines + 1
			: promptLines;

		if (totalLines > 1) {
			terminal.write(`\x1b[${totalLines - 1}F`);
		}
		terminal.write("\r\x1b[0J");
	}, []);

	const moveCursor = useCallback((command: string, position: number) => {
		const terminal = xtermRef.current;
		if (!terminal) {
			return;
		}

		const cols = terminal.cols || 80;
		const endCursor = getCursorLayout(command, command.length, cols);
		const targetCursor = getCursorLayout(command, position, cols);
		const linesUp = endCursor.line - targetCursor.line;

		let sequence = linesUp > 0 ? `\x1b[${linesUp}A\r` : "\r";
		if (targetCursor.column > 0) {
			sequence += `\x1b[${targetCursor.column}C`;
		}

		terminal.write(sequence);
	}, []);

	const drawCommandLine = useCallback(
		(
			next: BufferState,
			current: BufferState = renderedBufferRef.current,
		) => {
			const terminal = xtermRef.current;
			if (!terminal) {
				return;
			}

			clearCommandLine(current);
			terminal.write(`${PROMPT}${next.command}`);
			moveCursor(next.command, next.position);
			renderedBufferRef.current = next;
		},
		[clearCommandLine, moveCursor],
	);

	const drawPrompt = useCallback(
		(next: BufferState, showInstructions = false, skipClear = false) => {
			const terminal = xtermRef.current;
			if (!terminal) {
				return;
			}

			if (showInstructions && instructionsRef.current) {
				if (!skipClear) {
					clearPromptArea();
				}
				terminal.writeln(instructionsRef.current);
				terminal.write(`${PROMPT}${next.command}`);
				moveCursor(next.command, next.position);
				hasInstructionLineRef.current = true;
				renderedBufferRef.current = next;
				return;
			}

			hasInstructionLineRef.current = false;
			if (skipClear) {
				terminal.write(`${PROMPT}${next.command}`);
				moveCursor(next.command, next.position);
				renderedBufferRef.current = next;
				return;
			}
			drawCommandLine(next);
		},
		[clearPromptArea, drawCommandLine, moveCursor],
	);

	const writeHistoryEntry = useCallback(
		(entry: TerminalProps["history"][number]) => {
			const terminal = xtermRef.current;
			if (!terminal) {
				return;
			}

			if (entry.instructions) {
				terminal.writeln(entry.instructions);
			}

			terminal.writeln(`${PROMPT}${entry.command}`);
			// Keep spacing consistent between command and output for all entries.
			terminal.writeln("");
			for (const line of splitResponseLines(entry.response)) {
				terminal.writeln(line);
			}
			terminal.write("\r\n");
		},
		[],
	);

	const renderWelcomeIfNeeded = useCallback(() => {
		const terminal = xtermRef.current;
		if (!terminal || welcomeRenderedRef.current || !welcomeRef.current) {
			return;
		}

		terminal.writeln(welcomeRef.current);
		terminal.write("\r\n");
		welcomeRenderedRef.current = true;
	}, []);

	const updateSuggestionPosition = useCallback(() => {
		const container = terminalRef.current;
		const terminal = xtermRef.current;
		if (!container || !terminal) {
			return;
		}

		const rect = container.getBoundingClientRect();
		const cols = Math.max(1, terminal.cols || 1);
		const rows = Math.max(1, terminal.rows || 1);
		const cellWidth = rect.width / cols;
		const cellHeight = rect.height / rows;

		const { column: cursorColumn } = getCursorLayout(
			bufferRef.current.command,
			bufferRef.current.position,
			cols,
		);
		const cursorRow = terminal.buffer.active.cursorY;

		let left = Math.round(cursorColumn * cellWidth + 8);
		let top = Math.round((cursorRow + 1) * cellHeight + 8);
		const maxHeight = Math.min(
			180,
			Math.max(96, Math.round(rect.height * 0.45)),
		);

		if (top + maxHeight > rect.height - 8) {
			top = Math.max(8, top - maxHeight - cellHeight);
		}

		left = Math.min(left, Math.max(8, Math.round(rect.width - 220)));

		setSuggestionPosition({
			top,
			left,
			maxHeight,
		});
	}, []);

	const rebuildTerminalFromHistory = useCallback(
		(next: BufferState) => {
			const terminal = xtermRef.current;
			if (!terminal) {
				return;
			}

			terminal.reset();
			welcomeRenderedRef.current = false;
			hasInstructionLineRef.current = false;
			renderedBufferRef.current = { command: "", position: 0 };

			renderWelcomeIfNeeded();
			for (const item of historyRef.current) {
				writeHistoryEntry(item);
			}

			renderedHistoryCountRef.current = historyRef.current.length;
			setHistoryPointer(historyRef.current.length);
			drawPrompt(next, Boolean(instructionsRef.current), true);
			updateSuggestionPosition();
		},
		[
			drawPrompt,
			renderWelcomeIfNeeded,
			setHistoryPointer,
			updateSuggestionPosition,
			writeHistoryEntry,
		],
	);

	const applySuggestion = useCallback(
		(suggestion: string) => {
			const currentBuffer = bufferRef.current;
			const transformed = transformSuggestionRef.current(suggestion);
			const nextCommand = transformed ? transformed : suggestion;
			const nextBuffer = {
				command: nextCommand,
				position: nextCommand.length,
			};

			setSuggestionUi({ activeIndex: -1, hide: true });
			setBufferState(nextBuffer);
			drawCommandLine(nextBuffer, currentBuffer);
			updateSuggestionPosition();
		},
		[
			drawCommandLine,
			setBufferState,
			setSuggestionUi,
			updateSuggestionPosition,
		],
	);

	const insertTextAtCursor = useCallback(
		(rawText: string) => {
			const normalizedText = normalizeInputText(rawText);
			if (!normalizedText) {
				return;
			}

			const currentBuffer = bufferRef.current;
			const nextBuffer = {
				command:
					currentBuffer.command.slice(0, currentBuffer.position) +
					normalizedText +
					currentBuffer.command.slice(currentBuffer.position),
				position: currentBuffer.position + normalizedText.length,
			};

			setSuggestionUi((previous) => ({
				...previous,
				activeIndex: 0,
				hide: false,
			}));
			setBufferState(nextBuffer);
			drawCommandLine(nextBuffer, currentBuffer);
			updateSuggestionPosition();
		},
		[
			drawCommandLine,
			setBufferState,
			setSuggestionUi,
			updateSuggestionPosition,
		],
	);

	const removeSelectedTextFromBuffer = useCallback(
		(currentBuffer: BufferState): BufferState | null => {
			const terminal = xtermRef.current;
			if (!terminal) {
				return null;
			}

			const selectedText = normalizeInputText(terminal.getSelection());
			if (!selectedText) {
				return null;
			}

			let selectionIndex = -1;
			const lastMatchBeforeCursor = currentBuffer.command.lastIndexOf(
				selectedText,
				Math.max(0, currentBuffer.position - 1),
			);
			if (
				lastMatchBeforeCursor !== -1 &&
				currentBuffer.position >= lastMatchBeforeCursor &&
				currentBuffer.position <=
					lastMatchBeforeCursor + selectedText.length
			) {
				selectionIndex = lastMatchBeforeCursor;
			} else {
				selectionIndex = currentBuffer.command.indexOf(selectedText);
			}

			if (selectionIndex === -1) {
				return null;
			}

			terminal.clearSelection();
			return {
				command:
					currentBuffer.command.slice(0, selectionIndex) +
					currentBuffer.command.slice(
						selectionIndex + selectedText.length,
					),
				position: selectionIndex,
			};
		},
		[],
	);

	useEffect(() => {
		if (!terminalRef.current) {
			return;
		}

		const initialTheme = getInitialTheme();
		const terminal = new XTerm({
			cursorBlink: true,
			cursorStyle: "bar",
			allowTransparency: true,
			theme:
				initialTheme === "dark"
					? THEME_OPTIONS.darkTheme
					: THEME_OPTIONS.lightTheme,
			fontFamily: 'Menlo, Monaco, "Courier New", monospace',
			fontSize: 13,
			lineHeight: 1.2,
			scrollback: 20000,
			convertEol: true,
		});

		const fitAddon = new FitAddon();
		terminal.loadAddon(fitAddon);
		terminal.loadAddon(new WebLinksAddon());
		terminal.loadAddon(new SearchAddon());
		terminal.loadAddon(new ClipboardAddon());

		terminal.open(terminalRef.current);
		fitAddon.fit();

		terminal.attachCustomKeyEventHandler((event) => {
			if (
				(event.ctrlKey || event.metaKey) &&
				event.shiftKey &&
				event.code === "KeyA"
			) {
				terminal.selectAll();
				return false;
			}

			if ((event.ctrlKey || event.metaKey) && event.code === "KeyC") {
				const selection = terminal.getSelection();
				if (selection) {
					navigator.clipboard
						.writeText(selection)
						.then(() => terminal.clearSelection())
						.catch(() => null);
					return false;
				}
			}
			if ((event.ctrlKey || event.metaKey) && event.code === "KeyV") {
				if (isDisabledRef.current) {
					return false;
				}

				navigator.clipboard
					.readText()
					.then((data) => {
						insertTextAtCursor(data);
						if (!isDisabledRef.current) {
							terminal.focus();
						}
					})
					.catch(() => null);
				return false;
			}

			return true;
		});

		xtermRef.current = terminal;
		spinnerRef.current = new TerminalSpinner(terminal);

		const resizeObserver = new ResizeObserver(() => {
			fitAddon.fit();
			updateSuggestionPosition();
		});
		resizeObserver.observe(terminalRef.current);

		renderWelcomeIfNeeded();

		for (const item of historyRef.current) {
			writeHistoryEntry(item);
		}
		renderedHistoryCountRef.current = historyRef.current.length;

		const initialBuffer = bufferRef.current;
		setBufferState(initialBuffer, false);
		setHistoryPointer(historyRef.current.length);
		drawPrompt(initialBuffer, Boolean(instructionsRef.current));
		updateSuggestionPosition();

		return () => {
			resizeObserver.disconnect();
			spinnerRef.current?.destroy();
			spinnerRef.current = null;
			xtermRef.current = null;
			hasInstructionLineRef.current = false;
			terminal.dispose();
		};
	}, [
		insertTextAtCursor,
		drawPrompt,
		renderWelcomeIfNeeded,
		setBufferState,
		setHistoryPointer,
		updateSuggestionPosition,
		writeHistoryEntry,
	]);

	useEffect(() => {
		const terminal = xtermRef.current;
		if (!terminal) {
			return;
		}

		const disposable = terminal.onData(async (key: string) => {
			if (isDisabledRef.current) {
				return;
			}

			const currentBuffer = bufferRef.current;
			const currentSuggestions = getVisibleSuggestions();

			switch (key) {
				case "\x03": {
					const terminalInstance = xtermRef.current;
					if (!terminalInstance) {
						return;
					}

					const canceledBuffer = {
						command: currentBuffer.command,
						position: currentBuffer.command.length,
					};
					drawCommandLine(canceledBuffer, currentBuffer);
					terminalInstance.write("^C\r\n");

					const clearedBuffer = { command: "", position: 0 };
					setSuggestionUi({ activeIndex: -1, hide: true });
					setBufferState(clearedBuffer);
					setHistoryPointer(historyRef.current.length);

					// Start a brand-new prompt block below the canceled line.
					hasInstructionLineRef.current = false;
					drawPrompt(clearedBuffer, Boolean(instructionsRef.current));
					updateSuggestionPosition();
					return;
				}
				case "\r": {
					if (currentSuggestions.length > 0) {
						const suggestionIndex =
							suggestionStateRef.current.activeIndex >= 0
								? suggestionStateRef.current.activeIndex
								: 0;
						const suggestion =
							currentSuggestions[suggestionIndex] ||
							currentSuggestions[0];
						if (suggestion) {
							applySuggestion(suggestion);
						}
						return;
					}

					if (!currentBuffer.command.trim()) {
						return;
					}

					setSuggestionUi({ activeIndex: -1, hide: true });
					const clearedBuffer = { command: "", position: 0 };
					setBufferState(clearedBuffer);
					setHistoryPointer(historyRef.current.length);
					rebuildTerminalFromHistory(clearedBuffer);
					await onRunRef.current(currentBuffer.command);
					return;
				}
				case "\t": {
					if (currentSuggestions.length > 0) {
						const suggestionIndex =
							suggestionStateRef.current.activeIndex >= 0
								? suggestionStateRef.current.activeIndex
								: 0;
						const suggestion =
							currentSuggestions[suggestionIndex] ||
							currentSuggestions[0];
						if (suggestion) {
							applySuggestion(suggestion);
						}
					}
					return;
				}
				case "\x1b": {
					setSuggestionUi((previous) => ({
						...previous,
						activeIndex: -1,
						hide: true,
					}));
					return;
				}
				case "\x1b[A": {
					if (currentSuggestions.length > 0) {
						setSuggestionUi((previous) => {
							const currentIndex =
								previous.activeIndex >= 0
									? previous.activeIndex
									: 0;
							const nextIndex =
								(currentIndex - 1 + currentSuggestions.length) %
								currentSuggestions.length;
							return {
								...previous,
								activeIndex: nextIndex,
								hide: false,
							};
						});
						return;
					}

					const nextHistoryIndex = Math.max(
						0,
						historyPositionRef.current - 1,
					);
					if (
						historyRef.current.length === 0 ||
						nextHistoryIndex === historyPositionRef.current
					) {
						return;
					}

					const fromHistory = historyRef.current[nextHistoryIndex];
					const nextBuffer = {
						command: fromHistory.command,
						position: fromHistory.command.length,
					};

					setHistoryPointer(nextHistoryIndex);
					setBufferState(nextBuffer);
					drawCommandLine(nextBuffer, currentBuffer);
					updateSuggestionPosition();
					return;
				}
				case "\x1b[B": {
					if (currentSuggestions.length > 0) {
						setSuggestionUi((previous) => {
							const currentIndex =
								previous.activeIndex >= 0
									? previous.activeIndex
									: -1;
							const nextIndex =
								(currentIndex + 1 + currentSuggestions.length) %
								currentSuggestions.length;
							return {
								...previous,
								activeIndex: nextIndex,
								hide: false,
							};
						});
						return;
					}

					const nextHistoryIndex = Math.min(
						historyRef.current.length,
						historyPositionRef.current + 1,
					);
					const fromHistory = historyRef.current[nextHistoryIndex];
					const nextCommand = fromHistory?.command || "";
					const nextBuffer = {
						command: nextCommand,
						position: nextCommand.length,
					};

					setHistoryPointer(nextHistoryIndex);
					setBufferState(nextBuffer);
					drawCommandLine(nextBuffer, currentBuffer);
					updateSuggestionPosition();
					return;
				}
				case "\x7F": {
					const bufferAfterSelectionDelete =
						removeSelectedTextFromBuffer(currentBuffer);
					if (bufferAfterSelectionDelete) {
						setSuggestionUi((previous) => ({
							...previous,
							activeIndex: 0,
							hide: false,
						}));
						setBufferState(bufferAfterSelectionDelete);
						drawCommandLine(
							bufferAfterSelectionDelete,
							currentBuffer,
						);
						updateSuggestionPosition();
						return;
					}

					if (currentBuffer.position === 0) {
						return;
					}

					const nextBuffer = {
						command:
							currentBuffer.command.slice(
								0,
								currentBuffer.position - 1,
							) +
							currentBuffer.command.slice(currentBuffer.position),
						position: currentBuffer.position - 1,
					};

					setSuggestionUi((previous) => ({
						...previous,
						activeIndex: 0,
						hide: false,
					}));
					setBufferState(nextBuffer);
					drawCommandLine(nextBuffer, currentBuffer);
					updateSuggestionPosition();
					return;
				}
				case "\x1b[3~": {
					const bufferAfterSelectionDelete =
						removeSelectedTextFromBuffer(currentBuffer);
					if (bufferAfterSelectionDelete) {
						setSuggestionUi((previous) => ({
							...previous,
							activeIndex: 0,
							hide: false,
						}));
						setBufferState(bufferAfterSelectionDelete);
						drawCommandLine(
							bufferAfterSelectionDelete,
							currentBuffer,
						);
						updateSuggestionPosition();
						return;
					}

					if (
						currentBuffer.position >= currentBuffer.command.length
					) {
						return;
					}

					const nextBuffer = {
						command:
							currentBuffer.command.slice(
								0,
								currentBuffer.position,
							) +
							currentBuffer.command.slice(
								currentBuffer.position + 1,
							),
						position: currentBuffer.position,
					};

					setSuggestionUi((previous) => ({
						...previous,
						activeIndex: 0,
						hide: false,
					}));
					setBufferState(nextBuffer);
					drawCommandLine(nextBuffer, currentBuffer);
					updateSuggestionPosition();
					return;
				}
				case "\x1b[D": {
					if (currentBuffer.position === 0) {
						return;
					}

					const nextBuffer = {
						...currentBuffer,
						position: currentBuffer.position - 1,
					};
					setBufferState(nextBuffer);
					drawCommandLine(nextBuffer, currentBuffer);
					updateSuggestionPosition();
					return;
				}
				case "\x1b[C": {
					if (
						currentBuffer.position >= currentBuffer.command.length
					) {
						return;
					}

					const nextBuffer = {
						...currentBuffer,
						position: currentBuffer.position + 1,
					};
					setBufferState(nextBuffer);
					drawCommandLine(nextBuffer, currentBuffer);
					updateSuggestionPosition();
					return;
				}
				case "\x1b[H":
				case "\x1b[1~":
				case "\x01": {
					const nextBuffer = {
						...currentBuffer,
						position: 0,
					};
					setBufferState(nextBuffer);
					drawCommandLine(nextBuffer, currentBuffer);
					updateSuggestionPosition();
					return;
				}
				case "\x1b[F":
				case "\x1b[4~":
				case "\x05": {
					const nextBuffer = {
						...currentBuffer,
						position: currentBuffer.command.length,
					};
					setBufferState(nextBuffer);
					drawCommandLine(nextBuffer, currentBuffer);
					updateSuggestionPosition();
					return;
				}
				case "\x0B": {
					const nextBuffer = {
						command: currentBuffer.command.slice(
							0,
							currentBuffer.position,
						),
						position: currentBuffer.position,
					};
					setBufferState(nextBuffer);
					drawCommandLine(nextBuffer, currentBuffer);
					updateSuggestionPosition();
					return;
				}
				case "\x15": {
					const nextBuffer = {
						command: currentBuffer.command.slice(
							currentBuffer.position,
						),
						position: 0,
					};
					setBufferState(nextBuffer);
					drawCommandLine(nextBuffer, currentBuffer);
					updateSuggestionPosition();
					return;
				}
				default: {
					if (!isPrintableInput(key)) {
						return;
					}

					const normalizedKey = normalizeInputText(key);
					const nextBuffer = {
						command:
							currentBuffer.command.slice(
								0,
								currentBuffer.position,
							) +
							normalizedKey +
							currentBuffer.command.slice(currentBuffer.position),
						position: currentBuffer.position + normalizedKey.length,
					};

					setSuggestionUi((previous) => ({
						...previous,
						activeIndex: 0,
						hide: false,
					}));
					setBufferState(nextBuffer);
					drawCommandLine(nextBuffer, currentBuffer);
					updateSuggestionPosition();
				}
			}
		});

		return () => {
			disposable.dispose();
		};
	}, [
		applySuggestion,
		drawCommandLine,
		drawPrompt,
		getVisibleSuggestions,
		rebuildTerminalFromHistory,
		removeSelectedTextFromBuffer,
		setBufferState,
		setHistoryPointer,
		setSuggestionUi,
		updateSuggestionPosition,
	]);

	useEffect(() => {
		if (visibleSuggestions.length === 0) {
			if (suggestionState.activeIndex !== -1) {
				setSuggestionUi((previous) => ({
					...previous,
					activeIndex: -1,
				}));
			}
			return;
		}

		if (
			suggestionState.activeIndex < 0 ||
			suggestionState.activeIndex >= visibleSuggestions.length
		) {
			setSuggestionUi((previous) => ({
				...previous,
				activeIndex: 0,
			}));
		}
	}, [
		suggestionState.activeIndex,
		setSuggestionUi,
		visibleSuggestions.length,
	]);

	useEffect(() => {
		if (!xtermRef.current) {
			return;
		}

		if (history.length < renderedHistoryCountRef.current) {
			xtermRef.current.reset();
			renderedHistoryCountRef.current = 0;
			welcomeRenderedRef.current = false;
			hasInstructionLineRef.current = false;
			renderedBufferRef.current = { command: "", position: 0 };
			renderWelcomeIfNeeded();
			setHistoryPointer(history.length);
			drawPrompt(
				bufferRef.current,
				Boolean(instructionsRef.current),
				true,
			);
			updateSuggestionPosition();
		}

		if (history.length > renderedHistoryCountRef.current) {
			clearPromptArea();

			const newEntries = history.slice(renderedHistoryCountRef.current);
			for (const entry of newEntries) {
				writeHistoryEntry(entry);
			}

			renderedHistoryCountRef.current = history.length;
			setHistoryPointer(history.length);
			drawPrompt(
				bufferRef.current,
				Boolean(instructionsRef.current),
				true,
			);
			updateSuggestionPosition();
		}
	}, [
		clearPromptArea,
		history,
		drawPrompt,
		renderWelcomeIfNeeded,
		setHistoryPointer,
		updateSuggestionPosition,
		writeHistoryEntry,
	]);

	useEffect(() => {
		if (!xtermRef.current) {
			return;
		}

		drawPrompt(bufferRef.current, Boolean(instructions));
		updateSuggestionPosition();
		if (!isDisabledRef.current) {
			xtermRef.current.focus();
		}
	}, [instructions, drawPrompt, updateSuggestionPosition]);

	useEffect(() => {
		const currentBuffer = bufferRef.current;
		const nextBuffer = {
			command: defaultCommand,
			position: defaultCommand.length,
		};

		setBufferState(nextBuffer, false);
		if (xtermRef.current) {
			drawCommandLine(nextBuffer, currentBuffer);
			updateSuggestionPosition();
		}
	}, [
		defaultCommand,
		drawCommandLine,
		setBufferState,
		updateSuggestionPosition,
	]);

	useEffect(() => {
		if (loading) {
			spinnerRef.current?.start();
		} else {
			spinnerRef.current?.stop();
			drawPrompt(bufferRef.current, Boolean(instructionsRef.current));
			updateSuggestionPosition();
		}
	}, [loading, drawPrompt, updateSuggestionPosition]);

	useEffect(() => {
		const terminal = xtermRef.current;
		if (!terminal) {
			return;
		}

		terminal.options.theme =
			terminalTheme === "dark"
				? THEME_OPTIONS.darkTheme
				: THEME_OPTIONS.lightTheme;
	}, [terminalTheme]);

	useEffect(() => {
		if (visibleSuggestions.length > 0) {
			updateSuggestionPosition();
		}
	}, [updateSuggestionPosition, visibleSuggestions.length]);

	const handleCopyButtonClick = async () => {
		const terminal = xtermRef.current;
		if (!terminal) {
			return;
		}

		const selection = terminal.getSelection() || bufferRef.current.command;
		if (!selection) {
			if (!isDisabledRef.current) {
				terminal.focus();
			}
			return;
		}

		try {
			await navigator.clipboard.writeText(selection);
			terminal.clearSelection();
		} catch {
			// Ignore clipboard failures and keep the input focused.
		}

		if (!isDisabledRef.current) {
			terminal.focus();
		}
	};

	const handlePasteButtonClick = async () => {
		const terminal = xtermRef.current;
		if (!terminal) {
			return;
		}

		try {
			const data = await navigator.clipboard.readText();
			if (!data) {
				if (!isDisabledRef.current) {
					terminal.focus();
				}
				return;
			}
			insertTextAtCursor(data);
		} catch {
			// Ignore clipboard failures and keep the input focused.
		}

		if (!isDisabledRef.current) {
			terminal.focus();
		}
	};

	const isDark = terminalTheme === "dark";
	const toolbarClass = isDark
		? "border-white/15 bg-black/45"
		: "border-black/10 bg-white/75";
	const btnClass = isDark
		? "bg-[#595c61] hover:bg-[#737882] text-white"
		: "bg-[#d7dce1] hover:bg-[#bfc5cc] text-black";

	return (
		<div className={cn("relative h-full", className)}>
			<div
				className={cn(
					"absolute top-1.5 right-4 z-[1000] flex flex-row items-center gap-0.5 rounded-md border p-[2px] shadow-sm backdrop-blur-sm",
					toolbarClass,
				)}
			>
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={handleCopyButtonClick}
					className={cn("h-6 w-6 rounded-sm p-0", btnClass)}
					aria-label="Copy selection"
				>
					<Copy className="size-3" />
				</Button>
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={handlePasteButtonClick}
					className={cn("h-6 w-6 rounded-sm p-0", btnClass)}
					aria-label="Paste"
				>
					<Clipboard className="size-3" />
				</Button>
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={() => {
						setTerminalTheme((previous) =>
							previous === "dark" ? "light" : "dark",
						);
						if (!isDisabledRef.current && xtermRef.current) {
							xtermRef.current.focus();
						}
					}}
					className={cn("h-6 w-6 rounded-sm p-0", btnClass)}
					aria-label="Toggle theme"
				>
					{isDark ? (
						<Sun className="size-3" />
					) : (
						<Moon className="size-3" />
					)}
				</Button>
			</div>

			<div ref={terminalRef} className="h-full w-full overflow-hidden" />

			{visibleSuggestions.length > 0 && !suggestionState.hide && (
				<div
					className={cn(
						"absolute z-[1000] min-w-[180px] max-w-[420px] overflow-y-auto rounded-[5px] border border-black p-1.5 shadow-lg",
						isDark
							? "bg-[#1e1e1e] text-white"
							: "bg-[#fcf9f9] text-black",
					)}
					style={{
						top: `${suggestionPosition.top}px`,
						left: `${suggestionPosition.left}px`,
						maxHeight: `${suggestionPosition.maxHeight}px`,
					}}
				>
					<ul className="m-0 p-0">
						{visibleSuggestions.map((suggestion, index) => {
							const isActive =
								suggestionState.activeIndex === index;

							return (
								<li key={suggestion}>
									<button
										type="button"
										onMouseDown={(event) =>
											event.preventDefault()
										}
										onMouseOver={() => {
											setSuggestionUi((previous) => ({
												...previous,
												activeIndex: index,
												hide: false,
											}));
										}}
										onFocus={() => {
											setSuggestionUi((previous) => ({
												...previous,
												activeIndex: index,
												hide: false,
											}));
										}}
										onClick={() =>
											applySuggestion(suggestion)
										}
										className={cn(
											"w-full rounded px-2 py-1 text-left text-sm",
											isDark
												? "hover:bg-[#4e4e4e]"
												: "hover:bg-[#E0E0E0]",
											isActive &&
												(isDark
													? "bg-[#5f5c5cff]"
													: "bg-[#E0E0E0]"),
										)}
									>
										{suggestion}
									</button>
								</li>
							);
						})}
					</ul>
				</div>
			)}
		</div>
	);
};
