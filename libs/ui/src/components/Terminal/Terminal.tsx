import { ContentCopy, ContentPaste } from "@mui/icons-material";
import { Icon, IconButton, type SxProps, styled } from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import "@xterm/xterm/css/xterm.css";
import "./terminal.css";
import { ClipboardAddon } from "@xterm/addon-clipboard";
import { FitAddon } from "@xterm/addon-fit";
import { SearchAddon } from "@xterm/addon-search";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { Terminal as XTerm } from "@xterm/xterm";
import { TerminalSpinner } from "./TerminalSpinner";

const StyledTerminal = styled("div")({
	height: "100%",
	width: "100%",
	overflow: "hidden",
});

const StyledOption = styled("div")({
	height: "100px",
	width: "fit-content",
	position: "absolute",
	bottom: 0,
	left: "20px",
	right: "20px",
	overflowY: "auto",
	backgroundColor: "#1e1e1e",
	color: "#ffffff",
	padding: "10px",
	borderRadius: "5px",
	maxHeight: "110px",
	overflowX: "scroll",
	zIndex: 1000,
	"ul > li": {
		"&:hover": {
			cursor: "pointer",
			backgroundColor: "#4e4e4e",
		},
	},
	"ul > li.selected": {
		backgroundColor: "#b4b1b1ff",
		"&:hover": {
			cursor: "pointer",
			backgroundColor: "#4e4e4e",
		},
	},
});

const StyledCopyButton = styled("div")({
	position: "absolute",
	top: 15,
	right: 5,
	cursor: "pointer",
	zIndex: 1000,
	color: "#000",
	padding: "5px",
	borderRadius: "5px",
	display: "flex",
	flexDirection: "row",
	gap: "10px",
	"> button":{
		backgroundColor: "#686a6c",
		"&:hover":{
			backgroundColor: "#cbcdd0",
		}
	}
});

// prompt for new input
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
		/** Instructions to show in the terminal with the command */
		instructions?: string;

		/** Command that was executed */
		command: string;

		/** Response after the command */
		response: string;
	}[];

	/** Fired when the command is set */
	onCommand: (command: string) => void;

	/** Callback that is fired when a command is run */
	onRun: () => Promise<void>;

	/** custom style object */
	sx?: SxProps;
	/** Suggestions to show in the terminal */
	suggestions?: string[];
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
	sx,
	suggestions = [],
}) => {
	// hold at ref to the terminal element
	const terminalRef = useRef<HTMLDivElement>(null);
	const spinnerRef = useRef<TerminalSpinner>(null);

	// create a buffer to store the typed in command, position of the cursor, and idx in history
	const [buffer, setBuffer] = useState<{
		command: string;
		position: number;
	}>({
		command: defaultCommand,
		position: defaultCommand.length,
	});
	const [historyPosition, setHistoryPosition] = useState<number>(
		history.length,
	);

	// save the instance
	const [terminalInstance, setTerminalInstance] = useState<XTerm>(null);
	//show and hide option
	const [showOption, setShowOption] = useState(false);
	//get the x and y position of the terminal
	const positionData = useRef({ top: 60, left: 20 });
	const terminalOptions = useRef<{ hasSelectedText: boolean }>({
		hasSelectedText: false,
	});
	const clipboardAddonTerminal = new ClipboardAddon();
	const suggesstionRef = useRef(null);
	const [suggesstionData, setSuggesstionData] = useState({
		chosenSuggestion: "",
		selectedSuggestion: "",
		chosenSuggestionIndex: -1
	});

	const isDisabled = loading || disabled;

	// create the terminal on mount
	useEffect(() => {
		if (!terminalRef.current) {
			return;
		}

		// Create terminal instance
		const t = new XTerm({
			cursorBlink: true,
			cursorStyle: "bar",
			allowTransparency: true,
			theme: {
				foreground: "#E9E9E9",
				background: "#262626",
				selectionBackground: "#4E4E4E",
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
			fontFamily: 'Menlo, Monaco, "Courier New", monospace',
			fontSize: 14,
			lineHeight: 1.2,
		});

		// create a new spinner for loading
		spinnerRef.current = new TerminalSpinner(t);

		// Create fit addon to ensure terminal resizes properly
		const fitAddon = new FitAddon();
		t.loadAddon(fitAddon);

		// add links
		const webLinksAddon = new WebLinksAddon();
		t.loadAddon(webLinksAddon);

		// add search
		const searchAddon = new SearchAddon();
		t.loadAddon(searchAddon);

		const clipboardAddon = new ClipboardAddon();
		t.loadAddon(clipboardAddon);

		// mount it
		t.open(terminalRef.current);

		// resize
		const observer = new ResizeObserver(() => {
			fitAddon.fit();
		});

		observer.observe(terminalRef.current);

		// initialize size
		fitAddon.fit();

		// save the state
		setTerminalInstance(t);

		// cleanup
		return () => {
			if (t) {
				t.dispose();
			}

			spinnerRef.current?.destroy();

			observer.disconnect();

			setTerminalInstance(null);
		};
	}, []);

	// add the listeners
	useEffect(() => {
		if (!terminalInstance) {
			return;
		}

		// add listeners
		const onData = terminalInstance.onData(async (key: string) => {
			if (isDisabled) {
				return;
			}

			// copy the old buffer into the updated
			let updatedBuffer = {
				...buffer,
			};

			// copy the old position into the updated
			let updatedHistoryPosition = historyPosition;

			switch (key) {
				// Enter
				case "\r": {
					if(showOptionList.length === 0){
						if (updatedBuffer?.command?.trim() === "") {
							// If command is empty, ignore
							break;
						} else {
							// run the command with error handling
							await onRun();
						}

						// clear it
						updatedBuffer = {
							command: "",
							position: 0,
						};
					}else {
						if(suggesstionData.chosenSuggestionIndex !== -1 && suggesstionData.chosenSuggestion !== "") {
							const suggesstionToClick = suggesstionData.chosenSuggestion;
							handleSuggestionClick(suggesstionToClick, false);
							setSuggesstionData((prevSuggestion)=>{
								return {
									...prevSuggestion,
									chosenSuggestionIndex: -1,
									chosenSuggestion:'',
									selectedSuggestion: suggesstionToClick
								}
							});
							updatedBuffer = {
								command: suggesstionToClick,
								position: suggesstionToClick.length,
							};
						}
					}

					break;
				}
				// Backspace
				case "\x7F": {
					if (updatedBuffer.position > 0) {
						// subtract as the position
						updatedBuffer.command =
							updatedBuffer.command.slice(
								0,
								updatedBuffer.position - 1,
							) +
							updatedBuffer.command.slice(updatedBuffer.position);

						// shift the position
						updatedBuffer.position--;

						// clear the line, add the buffer, move to the first position and then move to the buffer position
						terminalInstance.write(
							`\r\x1b[2K${PROMPT}${updatedBuffer.command}\r\x1b[${
								PROMPT_LENGTH + updatedBuffer.position
							}C`,
						);
					}

					break;
				}

				// Arrow Up
				case "\x1b[A": {
					if(showOptionList.length === 0){
						console.log('in if');
						// decrement and make sure it is always greater than 0
						updatedHistoryPosition--;
						if (updatedHistoryPosition < 0) {
							updatedHistoryPosition = 0;
						}

						// set the buffer to the command from the history
						updatedBuffer.command =
							history[updatedHistoryPosition].command;
						updatedBuffer.position =
							history[updatedHistoryPosition].command.length;

						// clear the line and add the buffer
						terminalInstance.write(
							`\r\x1b[2K${PROMPT}${updatedBuffer.command}`,
						);
					} else {
						console.log('in else', suggesstionData.chosenSuggestion);
						if(suggesstionData.chosenSuggestion === ""){
							setSuggesstionData((prevSuggestion)=>{
								return {
									...prevSuggestion,
									selectedSuggestion: '',
									chosenSuggestion: showOptionList.length - 1 < 0 ? showOptionList[0] : showOptionList[showOptionList.length - 1],
									chosenSuggestionIndex: showOptionList.length - 1,
								}
							});
						}else{
							setSuggesstionData((prevSuggestion)=>{
								let currentChosenSuggestionIndex = 0;
								if(prevSuggestion.chosenSuggestionIndex < showOptionList.length && prevSuggestion.chosenSuggestionIndex > 0){
									currentChosenSuggestionIndex = prevSuggestion.chosenSuggestionIndex < 0 ? 0 : prevSuggestion.chosenSuggestionIndex - 1;
								} else{
									currentChosenSuggestionIndex = showOptionList.length - 1;
								}
								return {
									...prevSuggestion,
									chosenSuggestion: showOptionList?.[currentChosenSuggestionIndex] || showOptionList?.[0],
									chosenSuggestionIndex: showOptionList?.[currentChosenSuggestionIndex] ? currentChosenSuggestionIndex : 0,
								}
							})
						}
					}
					break;
				}

				// Arrow Down
				case "\x1b[B": {
					if(showOptionList.length === 0){
						// increment and make sure it is not longer than the history
						updatedHistoryPosition++;
						if (updatedHistoryPosition > history.length) {
							updatedHistoryPosition = history.length;
						}

						// if it is equal to this history, set as empty
						if (updatedHistoryPosition === history.length) {
							updatedBuffer.command = "";
							updatedBuffer.position = 0;
						} else {
							// set the buffer to the command from the history
							updatedBuffer.command =
								history[updatedHistoryPosition].command;
							updatedBuffer.position =
								history[updatedHistoryPosition].command.length;
						}

						// clear the line and add the buffer
						terminalInstance.write(
							`\r\x1b[2K${PROMPT}${updatedBuffer.command}`,
						);
					} else {
						// terminalInstance.blur();
						// suggesstionRef.current?.focus();
						console.log(suggesstionData, 'suggesstionData');
						if(suggesstionData.chosenSuggestion === ""){
							setSuggesstionData((prevSuggestion)=>{
								return {
									...prevSuggestion,
									selectedSuggestion: '',
									chosenSuggestion: showOptionList[0],
									chosenSuggestionIndex: 0,
								}
							});
						}else{
							setSuggesstionData((prevSuggestion)=>{
								return {
									...prevSuggestion,
									chosenSuggestion: showOptionList?.[prevSuggestion.chosenSuggestionIndex + 1] || showOptionList?.[0],
									chosenSuggestionIndex: showOptionList?.[prevSuggestion.chosenSuggestionIndex + 1] ? prevSuggestion.chosenSuggestionIndex + 1 : 0,
								}
							})
						}
					}
					break;
				}

				// Arrow Left
				case "\x1b[D": {
					// decrement and make sure it is always greater than or equal to 0
					updatedBuffer.position--;
					if (updatedBuffer.position < 0) {
						updatedBuffer.position = 0;
					}

					// move to the first charcter, then move to the buffer position
					terminalInstance.write(
						`\r\x1b[${PROMPT_LENGTH + updatedBuffer.position}C`,
					);

					break;
				}

				// Arrow Right
				case "\x1b[C": {
					// increment and make sure it is always greater than or equal to the current one
					updatedBuffer.position++;
					if (updatedBuffer.position > updatedBuffer.command.length) {
						updatedBuffer.position = updatedBuffer.command.length;
					}

					// move to the first charcter, then move to the buffer position
					terminalInstance.write(
						`\r\x1b[${PROMPT_LENGTH + updatedBuffer.position}C`,
					);

					break;
				}

				// check if is a valid alphanumeric by doing a string comparison
				// see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Less_than
				default: {
					if (
						key >= String.fromCharCode(32) &&
						key <= String.fromCharCode(126)
					) {
						// insert at the position
						updatedBuffer.command =
							updatedBuffer.command.slice(
								0,
								updatedBuffer.position,
							) +
							key +
							updatedBuffer.command.slice(updatedBuffer.position);

						// shift the position
						updatedBuffer.position += key.length;

						// clear the line, add the buffer, move to the first position and then move to the buffer position
						terminalInstance.write(
							`\r\x1b[2K${PROMPT}${updatedBuffer.command}\r\x1b[${
								PROMPT_LENGTH + updatedBuffer.position
							}C`,
						);
						// const topVal = (terminalInstance.buffer.active.cursorY) > 1 ? (terminalRef.current.offsetHeight - 30) : 45;
						const topVal =
							terminalInstance.buffer.active.cursorY > 20
								? terminalInstance.buffer.active.cursorY *
										19.6 - 125
								: terminalInstance.buffer.active.cursorY *
										19.6 + 30;
						const leftVal = 0;
							// terminalInstance.buffer.active.cursorY > 20
							// 	? 0
							// 	: terminalInstance.buffer.active.cursorX * 10;
						positionData.current = {
							...positionData.current,
							top: topVal,
							left: leftVal,
						};
						// if (!showOption) {
						// 	setShowOption(true);
						// }
					}
				}
			}

			// save the buffer
			setBuffer(updatedBuffer);
			setHistoryPosition(updatedHistoryPosition);

			// update the command
			onCommand(updatedBuffer.command);
		});
		// const selectionData = terminalInstance.onSelectionChange(() => {
		// 	const selectedTextLength = terminalInstance.getSelection().length;
		// 	terminalOptions.current.hasSelectedText = selectedTextLength > 0;
		// });

		// cleanup
		return () => {
			if (onData) {
				onData.dispose();
			}
		};
	}, [
		terminalInstance,
		isDisabled,
		buffer,
		historyPosition,
		history,
		onRun,
		onCommand,
	]);

	// render whenever the instance changes
	useEffect(() => {
		if (!terminalInstance) {
			return;
		}

		// reset + clear
		terminalInstance.reset();

		const terminalInstanceElement = terminalInstance.element as HTMLDivElement;
		if(terminalInstanceElement){
			console.log(terminalInstanceElement, 'terminalInstanceElement');
			terminalInstanceElement.addEventListener("dblclick", ()=>{
				console.log('double click');
				const selected = terminalInstance.getSelection();
				if(selected){
					try{
						navigator.clipboard.writeText(selected);
					} catch(e){
						console.log('Failed to copy');
					}
				}
			});
		}

		// message
		if (welcome) {
			terminalInstance.writeln(welcome);
			terminalInstance.write(`\n\r`);
		}

		// add the history
		history.forEach((h) => {
			if (h.instructions) {
				terminalInstance.writeln(`${h.instructions}`);
			}
			terminalInstance.writeln(`${PROMPT}${h.command}`);
			if (h.response.indexOf("\n") > -1) {
				h.response.split("\n").forEach((line) => {
					terminalInstance.writeln(line);
				});
			} else if (h.response.indexOf("\r") > -1) {
				h.response.split("\r").forEach((line) => {
					terminalInstance.writeln(line);
				});
			} else {
				terminalInstance.writeln(h.response);
			}
			terminalInstance.write(`\n\r`);
		});

		// add an empty one
		if (instructions) {
			terminalInstance.writeln(`${instructions}`);
		}
		terminalInstance.write(`${PROMPT}${defaultCommand}`);

		setBuffer({
			command: defaultCommand,
			position: defaultCommand.length,
		});
		setHistoryPosition(history.length);
	}, [terminalInstance, welcome, history, instructions, defaultCommand]);

	// trigger loading
	useEffect(() => {
		if (loading) {
			spinnerRef.current?.start();
		} else {
			spinnerRef.current?.stop();
		}
	}, [loading]);
	//handle the suggestions click
	const handleSuggestionClick = useCallback(
		(suggestion: string, runCommandOnComplete: boolean = true) => {
			terminalInstance.write(
				`\r\x1b[2K${PROMPT}${suggestion}\r\x1b[${
					PROMPT_LENGTH + suggestion.length
				}C`,
			);
			setBuffer((prevBuffer) => {
				return {
					...prevBuffer,
					command: suggestion,
					position: suggestion.length,
				};
			});
			if(runCommandOnComplete)
				onCommand(suggestion);
			// setShowOption(false);
		},
		[onCommand, terminalInstance],
	);
	const showOptionList = useMemo(() => {
		const filteredSuggestions =
			suggestions
				.filter((suggestion) =>
					suggestion
						.toLowerCase()
						.includes(buffer.command.toLowerCase()),
				)
				.slice(0, 3) || [];
		if (
			filteredSuggestions.length === 0 ||
			filteredSuggestions?.[0] === buffer.command ||
			buffer.command === ""
		) {
			return [];
		}
		return filteredSuggestions;
	}, [buffer.command, suggestions]);
	const handleCopyButtonClick = async () => {
		const selectedText = terminalInstance.getSelection();
		try {
			navigator.clipboard
				.writeText(selectedText)
				.then(() => {
					console.log(
						"selection copied to clipboard",
					);
					terminalInstance.clearSelection();
				});
		} catch {
			console.log("failed to copy selection");
		}
	};
	const handlePasteButtonClick = async () => {
		try {
			navigator.clipboard
				.readText()
				.then((data) => {
					const completeData = buffer.command + data;
					terminalInstance.write(
						`\r\x1b[2K${PROMPT}${completeData}\r\x1b[${
							PROMPT_LENGTH + completeData.length
						}C`,
					);
					setBuffer((prevBuffer) => {
						return {
							...prevBuffer,
							command: completeData,
							position: completeData.length,
						};
					});
					// terminalInstance.clearSelection();
				});
		} catch {
			console.log("failed to paste");
		}
	};
	// // reset historyPosition when history changes
	// useEffect(() => {
	//     setHistoryPosition(history.length);
	// }, [history]);

	// // reset historyPosition when history changes
	// useEffect(() => {
	//     setBuffer(history.length);
	// }, [defaultCommand]);

	return (
		<>
			{
				// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
				// biome-ignore lint/a11y/noStaticElementInteractions: <explanation>
				<StyledCopyButton>
					<IconButton onClick={handleCopyButtonClick}><ContentCopy /></IconButton>
					<IconButton onClick={handlePasteButtonClick}><ContentPaste /></IconButton>
				</StyledCopyButton>
			}
			<StyledTerminal ref={terminalRef} sx={sx} />	
			{showOptionList?.length > 0 && (
				<StyledOption
					style={{
						left: `${positionData.current.left}px`,
						top: `${positionData.current.top}px`,
					}}
					ref={suggesstionRef}
				>
					<ul
						style={{ listStyleType: "none", padding: 0, margin: 0 }}
						aria-roledescription="list"
					>
						{buffer.command !== "" &&
							showOptionList.map((suggestion) => (
								// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
								<li
									key={suggestion}
									onClick={() =>
										handleSuggestionClick(suggestion)
									}
									className={`${suggesstionData.chosenSuggestion === suggestion ? "selected" : ""}`}
									aria-roledescription="option"
								>
									{suggestion}
								</li>
							))
						}
					</ul>
				</StyledOption>
			)}
		</>
	);
};
