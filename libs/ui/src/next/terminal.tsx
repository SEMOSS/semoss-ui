import { Clipboard, Copy, Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import "@xterm/xterm/css/xterm.css";
import "../components/Terminal/terminal.css";
import { ClipboardAddon } from "@xterm/addon-clipboard";
import { FitAddon } from "@xterm/addon-fit";
import { SearchAddon } from "@xterm/addon-search";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { Terminal as XTerm } from "@xterm/xterm";
import { cn } from "@/lib/utils";
import { TerminalSpinner } from "../components/Terminal/TerminalSpinner";
import { Button } from "./button";

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

const PROMPT = `\x1b[1;30m> \x1b[0m`;
const PROMPT_LENGTH = 2;

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
	onRun: () => Promise<void>;
	/** Suggestions to show in the terminal */
	suggestions?: string[];
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
	onRun = () => null,
	suggestions = [],
	className,
}) => {
	const terminalRef = useRef<HTMLDivElement>(null);
	const spinnerRef = useRef<TerminalSpinner>(null);

	const [buffer, setBuffer] = useState<{ command: string; position: number }>(
		{
			command: defaultCommand,
			position: defaultCommand.length,
		},
	);
	const [historyPosition, setHistoryPosition] = useState<number>(
		history.length,
	);
	const [terminalInstance, setTerminalInstance] = useState<XTerm>(null);
	const positionData = useRef({ top: 60, left: 20 });
	const suggesstionRef = useRef(null);
	const [suggesstionData, setSuggesstionData] = useState({
		chosenSuggestion: "",
		selectedSuggestion: "",
		chosenSuggestionIndex: -1,
	});
	const [customHideOption, setCustomHideOption] = useState(false);
	const [terminalTheme, setTerminalTheme] = useState("dark");

	const isDisabled = loading || disabled;

	useEffect(() => {
		if (!terminalRef.current) return;

		const t = new XTerm({
			cursorBlink: true,
			cursorStyle: "bar",
			allowTransparency: true,
			theme: THEME_OPTIONS.darkTheme,
			fontFamily: 'Menlo, Monaco, "Courier New", monospace',
			fontSize: 14,
			lineHeight: 1.2,
		});

		spinnerRef.current = new TerminalSpinner(t);

		const fitAddon = new FitAddon();
		t.loadAddon(fitAddon);
		t.loadAddon(new WebLinksAddon());
		t.loadAddon(new SearchAddon());
		t.loadAddon(new ClipboardAddon());

		t.open(terminalRef.current);

		const observer = new ResizeObserver(() => fitAddon.fit());
		observer.observe(terminalRef.current);
		fitAddon.fit();

		setTerminalInstance(t);

		return () => {
			t.dispose();
			spinnerRef.current?.destroy();
			observer.disconnect();
			setTerminalInstance(null);
		};
	}, []);

	const showOptionList = useMemo(() => {
		const filtered =
			suggestions
				.filter((s) =>
					s.toLowerCase().includes(buffer.command.toLowerCase()),
				)
				.slice(0, 3) || [];
		if (
			filtered.length === 0 ||
			filtered[0] === buffer.command ||
			buffer.command === "" ||
			customHideOption
		) {
			return [];
		}
		return filtered;
	}, [buffer.command, suggestions, customHideOption]);

	const handleSuggestionClick = useCallback(
		(suggestion: string, runCommandOnComplete = true) => {
			terminalInstance.write(`\r\x1b[0J${PROMPT}${suggestion}`);
			setBuffer((prev) => ({
				...prev,
				command: suggestion,
				position: suggestion.length,
			}));
			if (runCommandOnComplete) onCommand(suggestion);
		},
		[onCommand, terminalInstance],
	);

	useEffect(() => {
		if (!terminalInstance) return;

		const _cols = () => terminalInstance.cols || 80;

		const eraseCmd = (prevPos: number) => {
			const linesUp = Math.floor((PROMPT_LENGTH + prevPos) / _cols());
			terminalInstance.write(
				linesUp > 0 ? `\x1b[${linesUp}F\x1b[0J` : "\r\x1b[0J",
			);
		};

		const moveCursor = (cmd: string, pos: number) => {
			const c = _cols();
			const endLine = Math.floor((PROMPT_LENGTH + cmd.length) / c);
			const targetLine = Math.floor((PROMPT_LENGTH + pos) / c);
			const targetCol = (PROMPT_LENGTH + pos) % c;
			const linesUp = endLine - targetLine;
			let seq = linesUp > 0 ? `\x1b[${linesUp}A\r` : "\r";
			if (targetCol > 0) seq += `\x1b[${targetCol}C`;
			terminalInstance.write(seq);
		};

		const onData = terminalInstance.onData(async (key: string) => {
			if (isDisabled) return;

			let updatedBuffer = { ...buffer };
			let updatedHistoryPosition = historyPosition;

			switch (key) {
				case "\r": {
					if (showOptionList.length === 0 || customHideOption) {
						if (updatedBuffer?.command?.trim() !== "") {
							await onRun();
						}
						updatedBuffer = { command: "", position: 0 };
					} else if (
						suggesstionData.chosenSuggestionIndex !== -1 &&
						suggesstionData.chosenSuggestion !== ""
					) {
						const chosen = suggesstionData.chosenSuggestion;
						handleSuggestionClick(chosen, false);
						setSuggesstionData((prev) => ({
							...prev,
							chosenSuggestionIndex: -1,
							chosenSuggestion: "",
							selectedSuggestion: chosen,
						}));
						updatedBuffer = {
							command: chosen,
							position: chosen.length,
						};
					}
					break;
				}
				case "\x7F": {
					if (updatedBuffer.position > 0) {
						updatedBuffer.command =
							updatedBuffer.command.slice(
								0,
								updatedBuffer.position - 1,
							) +
							updatedBuffer.command.slice(updatedBuffer.position);
						updatedBuffer.position--;
						eraseCmd(buffer.position);
						terminalInstance.write(
							`${PROMPT}${updatedBuffer.command}`,
						);
						moveCursor(
							updatedBuffer.command,
							updatedBuffer.position,
						);
					}
					break;
				}
				case "\x1b[A": {
					if (showOptionList.length === 0 || customHideOption) {
						updatedHistoryPosition = Math.max(
							0,
							updatedHistoryPosition - 1,
						);
						if (updatedHistoryPosition < history.length) {
							updatedBuffer.command =
								history[updatedHistoryPosition].command;
							updatedBuffer.position =
								history[updatedHistoryPosition].command.length;
						}
						eraseCmd(buffer.position);
						terminalInstance.write(
							`${PROMPT}${updatedBuffer.command}`,
						);
					} else if (suggesstionData.chosenSuggestion === "") {
						setSuggesstionData((prev) => ({
							...prev,
							selectedSuggestion: "",
							chosenSuggestion:
								showOptionList[showOptionList.length - 1],
							chosenSuggestionIndex: showOptionList.length - 1,
						}));
					} else {
						setSuggesstionData((prev) => {
							const idx =
								prev.chosenSuggestionIndex > 0 &&
								prev.chosenSuggestionIndex <
									showOptionList.length
									? prev.chosenSuggestionIndex - 1
									: showOptionList.length - 1;
							return {
								...prev,
								chosenSuggestion:
									showOptionList[idx] ?? showOptionList[0],
								chosenSuggestionIndex: showOptionList[idx]
									? idx
									: 0,
							};
						});
					}
					break;
				}
				case "\x1b[B": {
					if (showOptionList.length === 0 || customHideOption) {
						updatedHistoryPosition = Math.min(
							history.length,
							updatedHistoryPosition + 1,
						);
						if (updatedHistoryPosition === history.length) {
							updatedBuffer.command = "";
							updatedBuffer.position = 0;
						} else {
							updatedBuffer.command =
								history[updatedHistoryPosition].command;
							updatedBuffer.position =
								history[updatedHistoryPosition].command.length;
						}
						eraseCmd(buffer.position);
						terminalInstance.write(
							`${PROMPT}${updatedBuffer.command}`,
						);
					} else if (suggesstionData.chosenSuggestion === "") {
						setSuggesstionData((prev) => ({
							...prev,
							selectedSuggestion: "",
							chosenSuggestion: showOptionList[0],
							chosenSuggestionIndex: 0,
						}));
					} else {
						setSuggesstionData((prev) => {
							const nextIdx = prev.chosenSuggestionIndex + 1;
							return {
								...prev,
								chosenSuggestion:
									showOptionList[nextIdx] ??
									showOptionList[0],
								chosenSuggestionIndex: showOptionList[nextIdx]
									? nextIdx
									: 0,
							};
						});
					}
					break;
				}
				case "\x1b[D": {
					updatedBuffer.position = Math.max(
						0,
						updatedBuffer.position - 1,
					);
					const _c = _cols();
					const _oldCol = (PROMPT_LENGTH + buffer.position) % _c;
					const _onLine0 =
						Math.floor((PROMPT_LENGTH + buffer.position) / _c) ===
						0;
					if (_oldCol === 0 && !_onLine0) {
						terminalInstance.write(`\x1b[1A\x1b[${_c}G`);
					} else {
						terminalInstance.write("\x1b[1D");
					}
					break;
				}
				case "\x1b[C": {
					updatedBuffer.position = Math.min(
						updatedBuffer.command.length,
						updatedBuffer.position + 1,
					);
					const _nc = _cols();
					const _newTot = PROMPT_LENGTH + updatedBuffer.position;
					const _oldTot = PROMPT_LENGTH + buffer.position;
					if (Math.floor(_newTot / _nc) > Math.floor(_oldTot / _nc)) {
						terminalInstance.write("\x1b[1B\r");
					} else {
						terminalInstance.write("\x1b[1C");
					}
					break;
				}
				default: {
					if (
						key >= String.fromCharCode(32) &&
						key <= String.fromCharCode(126)
					) {
						updatedBuffer.command =
							updatedBuffer.command.slice(
								0,
								updatedBuffer.position,
							) +
							key +
							updatedBuffer.command.slice(updatedBuffer.position);
						updatedBuffer.position += key.length;
						eraseCmd(buffer.position);
						terminalInstance.write(
							`${PROMPT}${updatedBuffer.command}`,
						);
						moveCursor(
							updatedBuffer.command,
							updatedBuffer.position,
						);
						const cursorY = terminalInstance.buffer.active.cursorY;
						positionData.current = {
							...positionData.current,
							top:
								cursorY > 20
									? cursorY * 19.6 - 125
									: cursorY * 19.6 + 30,
							left: 0,
						};
					}
					if (key === String.fromCharCode(27)) {
						setCustomHideOption(true);
						setSuggesstionData((prev) => ({
							...prev,
							selectedSuggestion: "",
							chosenSuggestion: "",
							chosenSuggestionIndex: -1,
						}));
					} else {
						setCustomHideOption(false);
					}
				}
			}

			setBuffer(updatedBuffer);
			setHistoryPosition(updatedHistoryPosition);
			onCommand(updatedBuffer.command);
		});

		return () => {
			onData.dispose();
		};
	}, [
		terminalInstance,
		isDisabled,
		buffer,
		historyPosition,
		history,
		showOptionList,
		suggesstionData,
		onRun,
		onCommand,
		handleSuggestionClick,
		customHideOption,
	]);

	useEffect(() => {
		if (!terminalInstance) return;

		terminalInstance.reset();
		terminalInstance.attachCustomKeyEventHandler((e) => {
			if (e.ctrlKey && e.shiftKey && e.code === "KeyC") {
				const selection = terminalInstance.getSelection();
				navigator.clipboard
					.writeText(selection)
					.then(() => terminalInstance.clearSelection())
					.catch(() => null);
				return true;
			}
		});

		if (welcome) {
			terminalInstance.writeln(welcome);
			terminalInstance.write(`\n\r`);
		}

		for (const h of history) {
			if (h.instructions) {
				terminalInstance.writeln(`${h.instructions}`);
			}
			terminalInstance.writeln(`${PROMPT}${h.command}`);
			const sep = h.response.includes("\n")
				? "\n"
				: h.response.includes("\r")
					? "\r"
					: null;
			if (sep) {
				for (const line of h.response.split(sep)) {
					terminalInstance.writeln(line);
				}
			} else {
				terminalInstance.writeln(h.response);
			}
			terminalInstance.write(`\n\r`);
		}

		if (instructions) {
			terminalInstance.writeln(`${instructions}`);
		}
		terminalInstance.write(`${PROMPT}${defaultCommand}`);

		setBuffer({ command: defaultCommand, position: defaultCommand.length });
		setHistoryPosition(history.length);
	}, [terminalInstance, welcome, history, instructions, defaultCommand]);

	useEffect(() => {
		if (loading) {
			spinnerRef.current?.start();
		} else {
			spinnerRef.current?.stop();
		}
	}, [loading]);

	const handleCopyButtonClick = async () => {
		try {
			await navigator.clipboard.writeText(
				terminalInstance.getSelection(),
			);
			terminalInstance.clearSelection();
		} catch {
			console.log("failed to copy selection");
		}
	};

	const handlePasteButtonClick = async () => {
		try {
			const data = await navigator.clipboard.readText();
			const completeData = buffer.command + data;
			const _pUp = Math.floor(
				(PROMPT_LENGTH + buffer.position) /
					(terminalInstance.cols || 80),
			);
			terminalInstance.write(
				_pUp > 0
					? `\x1b[${_pUp}F\x1b[0J${PROMPT}${completeData}`
					: `\r\x1b[0J${PROMPT}${completeData}`,
			);
			setBuffer((prev) => ({
				...prev,
				command: completeData,
				position: completeData.length,
			}));
		} catch {
			console.log("failed to paste");
		}
	};

	const handleThemeChange = () => {
		setTerminalInstance((prev) => {
			prev.options.theme =
				terminalTheme === "dark"
					? THEME_OPTIONS.lightTheme
					: THEME_OPTIONS.darkTheme;
			return prev;
		});
		setTerminalTheme(terminalTheme === "dark" ? "light" : "dark");
	};

	const isDark = terminalTheme === "dark";
	const btnClass = isDark
		? "bg-[#686a6c] hover:bg-[#cbcdd0] text-white"
		: "bg-[#cbcdd0] hover:bg-[#686a6c] text-black";

	return (
		<div className={cn("relative h-full", className)}>
			<div className="absolute top-[15px] right-[5px] z-[1000] flex flex-row gap-2.5">
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={handleCopyButtonClick}
					className={btnClass}
					aria-label="Copy selection"
				>
					<Copy className="size-3.5" />
				</Button>
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={handlePasteButtonClick}
					className={btnClass}
					aria-label="Paste"
				>
					<Clipboard className="size-3.5" />
				</Button>
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={handleThemeChange}
					className={btnClass}
					aria-label="Toggle theme"
				>
					{isDark ? (
						<Sun className="size-3.5" />
					) : (
						<Moon className="size-3.5" />
					)}
				</Button>
			</div>
			<div ref={terminalRef} className="h-full w-full overflow-hidden" />
			{showOptionList?.length > 0 && !customHideOption && (
				<div
					className={cn(
						"absolute z-[1000] h-[100px] max-h-[110px] w-fit overflow-y-auto overflow-x-scroll rounded-[5px] border border-black p-2.5",
						isDark
							? "bg-[#1e1e1e] text-white"
							: "bg-[#fcf9f9] text-black",
					)}
					style={{
						top: `${positionData.current.top}px`,
						left: `${positionData.current.left}px`,
					}}
					ref={suggesstionRef}
				>
					<ul
						style={{ listStyleType: "none", padding: 0, margin: 0 }}
						aria-roledescription="list"
					>
						{buffer.command !== "" &&
							showOptionList.map((suggestion) => (
								// biome-ignore lint/a11y/useKeyWithClickEvents: TODO
								<li
									key={suggestion}
									onClick={() =>
										handleSuggestionClick(suggestion)
									}
									onFocus={() =>
										setSuggesstionData((prev) => ({
											...prev,
											chosenSuggestion: suggestion,
										}))
									}
									onMouseOver={() =>
										setSuggesstionData((prev) => ({
											...prev,
											chosenSuggestion: suggestion,
										}))
									}
									className={cn(
										"cursor-pointer px-1",
										isDark
											? "hover:bg-[#4e4e4e]"
											: "hover:bg-[#E0E0E0]",
										suggesstionData.chosenSuggestion ===
											suggestion &&
											(isDark
												? "bg-[#b4b1b1ff]"
												: "bg-[#E0E0E0]"),
									)}
									aria-roledescription="option"
								>
									{suggestion}
								</li>
							))}
					</ul>
				</div>
			)}
		</div>
	);
};
