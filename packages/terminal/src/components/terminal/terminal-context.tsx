import type { ReactNode } from "react";
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
} from "react";
import type {
	AppRef,
	ConsoleContext,
	FileMode,
	SelectedFile,
	TerminalLocation,
	TerminalMode,
	TerminalView,
} from "../../types";

export interface SubmitToConsoleOptions {
	/** What appears as the "(Px) > ..." line in the transcript. */
	displayInput: string;
	/** Which persona to label the transcript entry with. */
	context: ConsoleContext;
}

interface SaveModalState {
	open: boolean;
	name: string;
	comment: string;
	selected: Partial<SelectedFile>;
}

interface UploadModalState {
	open: boolean;
	files: File[];
	comment: string;
}

interface TerminalContextValue {
	location: TerminalLocation;
	mode: TerminalMode;
	setMode: (mode: TerminalMode) => void;
	view: TerminalView;
	setView: (view: TerminalView) => void;
	title: string;
	setTitle: (title: string) => void;
	open: boolean;
	setOpen: (open: boolean) => void;

	save: SaveModalState;
	upload: UploadModalState;
	openSave: (selected: SelectedFile) => void;
	closeSave: () => void;
	setSave: (next: Partial<SaveModalState>) => void;
	openUpload: () => void;
	closeUpload: () => void;
	setUpload: (next: Partial<UploadModalState>) => void;

	// legacy "scope.terminal.openFile / updateFile / selectFile" hooks
	// overridden by child components via `register*`
	openFile: (file: SelectedFile) => void;
	updateFile: (file: Partial<SelectedFile>) => void;
	selectFile: (file: SelectedFile) => void;
	registerOpenFile: (fn: (file: SelectedFile) => void) => void;
	registerUpdateFile: (fn: (file: Partial<SelectedFile>) => void) => void;
	registerSelectFile: (fn: (file: SelectedFile) => void) => void;

	/**
	 * Submit a pixel through the REPL transcript. `pixel` is what runs against
	 * the insight; `opts.displayInput` is what shows in the "(context) >" row;
	 * `opts.context` is which persona label to use. Used by the file editor's
	 * "Run" button so output lands in the same transcript as REPL submissions.
	 */
	submitToConsole: (pixel: string, opts: SubmitToConsoleOptions) => void;
	registerSubmitToConsole: (
		fn: (pixel: string, opts: SubmitToConsoleOptions) => void,
	) => void;

	/**
	 * Current file scope — which Pixel reactor family the file explorer
	 * (and any newly opened file tabs) should target. INSIGHT-scoped uses
	 * `GetInsightAssets` etc.; APP-scoped uses `GetAppAssets(project=...)`.
	 * Tabs snapshot this value when opened, so switching scope here doesn't
	 * change the scope of files already open.
	 */
	fileMode: FileMode;
	setFileMode: (mode: FileMode) => void;
	/**
	 * Current app selection — present only when the explorer is in App
	 * scope. Tabs snapshot this at open time so the scope-changed banner
	 * can show the human-readable project name + id, not just the id.
	 */
	selectedApp: AppRef | undefined;
	setSelectedApp: (app: AppRef | undefined) => void;

	// browser pane needs to broadcast its current path/space to other panes
	getBrowserPath: () => string;
	getBrowserSpace: () => string;
	setBrowserPath: (path: string) => void;
	setBrowserSpace: (space: string) => void;

	// render token bumps when something asks the browser to refresh
	browserRenderToken: number;
	requestBrowserRender: () => void;

	// alerts surface to the embedder
	alert: (level: "info" | "warn" | "error" | "success", text: string) => void;
}

const noop = () => {};

const TerminalContextInternal = createContext<TerminalContextValue | undefined>(
	undefined,
);

interface TerminalProviderProps {
	children: ReactNode;
	location?: TerminalLocation;
	initialMode?: TerminalMode;
	initialView?: TerminalView;
	onAlert?: (
		level: "info" | "warn" | "error" | "success",
		text: string,
	) => void;
}

export const TerminalProvider = ({
	children,
	location = "workspace",
	initialMode,
	initialView = "inline",
	onAlert,
}: TerminalProviderProps) => {
	const mode = useStateMode(location, initialMode);
	const [view, setView] = useState<TerminalView>(initialView);
	const [title, setTitle] = useState("");
	const [open, setOpen] = useState(true);

	const [save, setSaveState] = useState<SaveModalState>({
		open: false,
		name: "",
		comment: "",
		selected: {},
	});
	const [upload, setUploadState] = useState<UploadModalState>({
		open: false,
		files: [],
		comment: "",
	});

	const openFileRef = useRef<(file: SelectedFile) => void>(noop);
	const updateFileRef = useRef<(file: Partial<SelectedFile>) => void>(noop);
	const selectFileRef = useRef<(file: SelectedFile) => void>(noop);
	const submitToConsoleRef =
		useRef<(pixel: string, opts: SubmitToConsoleOptions) => void>(noop);

	const [fileMode, setFileMode] = useState<FileMode>({ type: "INSIGHT" });
	const [selectedApp, setSelectedApp] = useState<AppRef | undefined>(
		undefined,
	);

	const browserPathRef = useRef<string>("");
	const browserSpaceRef = useRef<string>("");

	const [browserRenderToken, setBrowserRenderToken] = useState(0);

	const setSave = useCallback((next: Partial<SaveModalState>) => {
		setSaveState((prev) => ({ ...prev, ...next }));
	}, []);

	const setUpload = useCallback((next: Partial<UploadModalState>) => {
		setUploadState((prev) => ({ ...prev, ...next }));
	}, []);

	const openSave = useCallback((selected: SelectedFile) => {
		const name = selected.new
			? `${selected.name}.${selected.ext}`
			: selected.name;
		setSaveState({
			open: true,
			name,
			comment: `Saving at ${new Date().toLocaleString("en-US")}`,
			selected,
		});
	}, []);

	const closeSave = useCallback(() => {
		setSaveState({ open: false, name: "", comment: "", selected: {} });
	}, []);

	const openUpload = useCallback(() => {
		setUploadState({
			open: true,
			files: [],
			comment: `Uploading at ${new Date().toLocaleString("en-US")}`,
		});
	}, []);

	const closeUpload = useCallback(() => {
		setUploadState({ open: false, files: [], comment: "" });
	}, []);

	const alert = useCallback(
		(level: "info" | "warn" | "error" | "success", text: string) => {
			if (onAlert) onAlert(level, text);
			else console.log(`[terminal:${level}]`, text);
		},
		[onAlert],
	);

	const value = useMemo<TerminalContextValue>(
		() => ({
			location,
			mode: mode.value,
			setMode: mode.set,
			view,
			setView,
			title,
			setTitle,
			open,
			setOpen,

			save,
			upload,
			openSave,
			closeSave,
			setSave,
			openUpload,
			closeUpload,
			setUpload,

			openFile: (file) => openFileRef.current(file),
			updateFile: (file) => updateFileRef.current(file),
			selectFile: (file) => selectFileRef.current(file),
			registerOpenFile: (fn) => {
				openFileRef.current = fn;
			},
			registerUpdateFile: (fn) => {
				updateFileRef.current = fn;
			},
			registerSelectFile: (fn) => {
				selectFileRef.current = fn;
			},

			submitToConsole: (pixel, opts) =>
				submitToConsoleRef.current(pixel, opts),
			registerSubmitToConsole: (fn) => {
				submitToConsoleRef.current = fn;
			},

			fileMode,
			setFileMode,
			selectedApp,
			setSelectedApp,

			getBrowserPath: () => browserPathRef.current,
			getBrowserSpace: () => browserSpaceRef.current,
			setBrowserPath: (p) => {
				browserPathRef.current = p;
			},
			setBrowserSpace: (s) => {
				browserSpaceRef.current = s;
			},

			browserRenderToken,
			requestBrowserRender: () => setBrowserRenderToken((t) => t + 1),

			alert,
		}),
		[
			location,
			mode,
			view,
			title,
			open,
			save,
			upload,
			openSave,
			closeSave,
			setSave,
			openUpload,
			closeUpload,
			setUpload,
			fileMode,
			selectedApp,
			browserRenderToken,
			alert,
		],
	);

	return (
		<TerminalContextInternal.Provider value={value}>
			{children}
		</TerminalContextInternal.Provider>
	);
};

export const useTerminal = (): TerminalContextValue => {
	const ctx = useContext(TerminalContextInternal);
	if (!ctx) {
		throw new Error("useTerminal must be used within a TerminalProvider");
	}
	return ctx;
};

/**
 * Compute the initial terminal mode the same way the legacy directive did:
 * - workspace/popup → user-saved or "repl"
 * - pipeline → "asset"
 * - everything else → "repl"
 */
const useStateMode = (
	location: TerminalLocation,
	initialMode?: TerminalMode,
) => {
	const [value, setValue] = useState<TerminalMode>(() => {
		if (initialMode) return initialMode;
		if (location === "pipeline") return "asset";
		return "repl";
	});
	return { value, set: setValue };
};
