import { Plus } from "lucide-react";
import { lazy, Suspense } from "react";
import { useTranslation } from "@semoss/i18n";
import { InsightProvider } from "@semoss/sdk/react";
import {
	FileExplorer,
	FileExplorerHeader,
	FileExplorerNewAction,
	FileExplorerRefreshAction,
	type FileItem,
	getFileIconComponent,
	NewFileOverlay,
	useFileExplorer,
} from "@semoss/shared";
import type {
	WorkbenchChromeProps,
	WorkbenchPanelConfig,
	WorkbenchPanelProps,
} from "@semoss/workbench";
import { useWorkbench, useWorkbenchControl } from "@semoss/workbench";
import type { FileMode, SelectedFile } from "../../types";
import { modeKey } from "../../utility/file-mode";
import type { FileEditorTabConfig } from "../terminal-file/terminal-file";
import { ScopePicker } from "./scope-picker";
import { useTerminal } from "./terminal-context";

// Lazy-load the heavy editor panes so Monaco doesn't sit in the main bundle.
// The dock renders `content` inside Suspense; the inner one covers the file
// editor's own wrapper.
const TerminalConsole = lazy(() =>
	import("../terminal-console/terminal-console").then((m) => ({
		default: m.TerminalConsole,
	})),
);
const TerminalFile = lazy(() =>
	import("../terminal-file/terminal-file").then((m) => ({
		default: m.TerminalFile,
	})),
);

/**
 * Panel type ids for the terminal's dock.
 *
 * Persisted into the cached layout, so changing one drops that panel out of
 * every saved terminal arrangement.
 */
export const TERMINAL_PANEL_TYPES = {
	FILE_EXPLORER: "terminal-file-explorer",
	FILE_EDITOR: "terminal-file-editor",
	REPL: "terminal-repl",
} as const;

const PaneLoader = () => (
	<div className="flex h-full w-full items-center justify-center bg-background">
		<div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
	</div>
);

/**
 * Binds a file pane to an *existing* terminal-tab insight instead of the
 * ambient app-level one, so browsing, uploading and REPL commands share a
 * single workspace. Passing `insightId` makes the SDK attach to the already
 * live insight rather than spin up a new one, and `destroyOnUnmount` is off so
 * unmounting a pane never drops the insight the terminal owns.
 *
 * While no console has attached yet (`insightId` null) this shows the loader —
 * rendering a provider with an empty id would create a throwaway third insight
 * and reintroduce the split it exists to fix.
 */
const AdoptingInsight = ({
	insightId,
	children,
}: {
	insightId: string | null;
	children: React.ReactNode;
}) => {
	if (!insightId) return <PaneLoader />;
	return (
		<InsightProvider options={{ insightId }} destroyOnUnmount={false}>
			{children}
		</InsightProvider>
	);
};

/** The Files pane: scope picker over the explorer, on the active insight. */
const TerminalFileExplorerPanel = () => {
	const terminal = useTerminal();

	return (
		<AdoptingInsight insightId={terminal.activeInsightId}>
			<TerminalFileExplorerPane />
		</AdoptingInsight>
	);
};

/** Inside the adopted insight, so `useFileExplorer` reads the right one. */
const TerminalFileExplorerPane = () => {
	const terminal = useTerminal();
	const explorer = useFileExplorer({
		mode: terminal.fileMode,
		onItemSelect: (item: FileItem) => {
			if (item.type === "directory") return;
			terminal.openFile({
				name: item.name,
				path: item.path,
				date: item.lastModified ?? "",
				split: item.path.split("/"),
				content: "",
				open: false,
				history: [],
				new: false,
				space: "",
				updated: "",
				ext: (item.name.split(".").pop() || "pixel").toLowerCase(),
			} satisfies SelectedFile);
		},
	});

	return (
		<div className="flex h-full flex-col bg-background">
			<ScopePicker />
			<div className="relative min-h-0 flex-1">
				<FileExplorer
					explorer={explorer}
					header={
						<FileExplorerHeader
							explorer={explorer}
							actions={
								<>
									<FileExplorerRefreshAction
										explorer={explorer}
									/>
									<FileExplorerNewAction
										explorer={explorer}
									/>
								</>
							}
						/>
					}
					newFileOverlay={NewFileOverlay}
				/>
			</div>
		</div>
	);
};

/** The Files border panel. Pinned open-or-closed by the rail, never closable. */
export const TERMINAL_FILE_EXPLORER_PANEL: WorkbenchPanelConfig = {
	name: "Files",
	canClose: false,
	canDrag: false,
	canRename: false,
	mount: "keepAlive",
	content: TerminalFileExplorerPanel,
};

const TerminalFileEditorPanel = ({
	id,
	config,
	rename,
	setConfig,
}: WorkbenchPanelProps<FileEditorTabConfig>) => {
	// An editor stays bound to the insight its file was opened against, so it
	// keeps reading and saving the right workspace after the user switches
	// terminals. APP/USER/ENGINE files are insight-independent and fall back to
	// the active one.
	const terminal = useTerminal();
	const snapshotInsightId =
		config.mode?.type === "INSIGHT" ? config.mode.insightId : undefined;

	return (
		<AdoptingInsight
			insightId={snapshotInsightId ?? terminal.activeInsightId}
		>
			<Suspense fallback={<PaneLoader />}>
				<TerminalFile
					id={id}
					config={config}
					rename={rename}
					setConfig={setConfig}
				/>
			</Suspense>
		</AdoptingInsight>
	);
};

/** One open file. Dedupes on (scope, path), the way the tab ids used to. */
export const TERMINAL_FILE_EDITOR_PANEL: WorkbenchPanelConfig<FileEditorTabConfig> =
	{
		name: "File",
		canRename: false,
		mount: "keepAlive",
		matches: (a, b) =>
			Boolean(a.mode) &&
			Boolean(b.mode) &&
			modeKey(a.mode as FileMode) === modeKey(b.mode as FileMode) &&
			a.path === b.path,
		icon: ({ config, className }) => {
			const Icon = getFileIconComponent(config.baseName ?? "");
			return <Icon className={className} />;
		},
		content: TerminalFileEditorPanel,
	};

/** Which terminal this is, and whether the dock offers to add another. */
export interface TerminalReplParams {
	n: number;
	/**
	 * Whether to draw the "+". Carried per panel rather than read from a
	 * context because a chrome control only ever receives its panel's config —
	 * and a spawned terminal inherits it from the one that spawned it.
	 */
	allowMultiple?: boolean;
}

/**
 * Spawn another terminal.
 *
 * Registered per repl panel rather than drawn on the tabset, which is how the
 * dock places a panel-owned control: it shows beside the front tab of whichever
 * stack the panel is in, so splitting terminals side by side still gives each
 * strip its own "+".
 */
const TerminalReplControl = ({
	id,
	config,
}: WorkbenchChromeProps<TerminalReplParams>) => {
	const { t } = useTranslation("chrome");
	const actions = useWorkbench((state) => state.layout.actions);
	// the strip this terminal sits in, so a split pair each get their own "+"
	// that adds into their own side
	const tabsetId = useWorkbench(
		(state) =>
			state.layout.tabsets.find((tabset) => tabset.panelIds.includes(id))
				?.id,
	);

	if (!config?.allowMultiple) return null;

	return (
		<button
			type="button"
			title={t("tabs.newTerminal")}
			aria-label={t("tabs.newTerminal")}
			className="flex size-6 flex-none items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground"
			onClick={() => {
				// numbering continues from whatever is open, so it survives
				// the layout being restored from cache
				const used = actions
					.findPanels(
						(record) => record.type === TERMINAL_PANEL_TYPES.REPL,
					)
					.map((record) =>
						typeof record.config?.n === "number"
							? record.config.n
							: 0,
					);
				actions.spawnPanel(TERMINAL_PANEL_TYPES.REPL, {
					config: {
						n: Math.max(0, ...used) + 1,
						allowMultiple: true,
					},
					...(tabsetId
						? {
								target: {
									kind: "join" as const,
									tabsetId: tabsetId,
								},
							}
						: {}),
				});
			}}
		>
			<Plus className="size-4" />
		</button>
	);
};

const TerminalReplPanel = ({ id }: WorkbenchPanelProps<TerminalReplParams>) => {
	useWorkbenchControl(id, TerminalReplControl);

	// Each terminal gets its own insight, so sessions stay independent
	// (separate R/Python/variable state). `consoleId` ties this console to its
	// panel for the file editor's Run routing.
	return (
		<Suspense fallback={<PaneLoader />}>
			<InsightProvider>
				<TerminalConsole consoleId={id} />
			</InsightProvider>
		</Suspense>
	);
};

/** One terminal session. */
export const TERMINAL_REPL_PANEL: WorkbenchPanelConfig<TerminalReplParams> = {
	name: "Terminal",
	canRename: false,
	mount: "keepAlive",
	content: TerminalReplPanel,
};

/** Every panel the terminal's dock can hold. Module scope: identity matters. */
export const TERMINAL_PANEL_COMPONENTS = {
	[TERMINAL_PANEL_TYPES.FILE_EXPLORER]: TERMINAL_FILE_EXPLORER_PANEL,
	[TERMINAL_PANEL_TYPES.FILE_EDITOR]: TERMINAL_FILE_EDITOR_PANEL,
	[TERMINAL_PANEL_TYPES.REPL]: TERMINAL_REPL_PANEL,
};
