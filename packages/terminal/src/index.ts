export {
	EmbedTerminal,
	type EmbedTerminalProps,
} from "./components/embed-terminal/embed-terminal";
export { Terminal, type TerminalProps } from "./components/terminal/terminal";
export {
	TerminalProvider,
	useTerminal,
} from "./components/terminal/terminal-context";
export { TerminalConsole } from "./components/terminal-console/terminal-console";
export {
	TerminalConsolePanel,
	type TerminalConsolePanelProps,
} from "./components/terminal-console-panel/terminal-console-panel";
export { TerminalFile } from "./components/terminal-file/terminal-file";
export type {
	ConsoleContext,
	ConsoleHistoryStep,
	HistoryStep,
	SelectedFile,
	TerminalLocation,
	TerminalMode,
	TerminalView,
} from "./types";
