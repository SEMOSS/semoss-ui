import { HelpCircle, XIcon } from "lucide-react";
import {
	lazy,
	Suspense,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";
import { FileExplorer, FlexLayout, getFileIconComponent } from "@semoss/shared";
import type { SelectedFile } from "../../types";
import { modeKey } from "../../utility/file-mode";
import type { FileEditorTabConfig } from "../terminal-file/terminal-file";
import { Tooltip } from "../tooltip";
import { HelpDialog } from "./help-dialog";
import { SaveModal } from "./save-modal";
import { ScopePicker } from "./scope-picker";
import { useTerminal } from "./terminal-context";
import { UploadModal } from "./upload-modal";
import { UserMenu } from "./user-menu";

// FileItem isn't re-exported from `@semoss/shared`'s public index — declare
// the subset we touch locally so we don't have to reach into deep paths.
interface FileExplorerItem {
	name: string;
	path: string;
	type?: "directory";
	lastModified?: string;
}

// Lazy-load the heavy editor panes so Monaco (file editor, via @semoss/shared's
// FileEditor) doesn't sit in the main bundle. The Suspense fallback below
// shows briefly while the chunk is fetched.
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

const PaneLoader = () => (
	<div className="flex h-full w-full items-center justify-center bg-background">
		<div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
	</div>
);

const REPL_TABSET_ID = "REPL_TABSET";

/**
 * Initial layout: left border for the file explorer (starts collapsed —
 * user clicks the "Files" tab strip to expand), main area holds a single
 * REPL tabset. A file-editor tabset is created on demand when the user
 * opens their first file, and is auto-removed when its last tab closes
 * (via `tabSetEnableDeleteWhenEmpty`).
 */
const buildInitialModel = (): FlexLayout.IJsonModel => ({
	global: {
		rootOrientationVertical: true,
		tabEnableRename: false,
		tabSetEnableDeleteWhenEmpty: true,
	},
	borders: [
		{
			type: "border",
			location: "left",
			size: 300,
			// -1 → no tab selected → border starts collapsed. The user
			// expands it by clicking the "Files" strip on the edge.
			selected: -1,
			children: [
				{
					id: "FILE_EXPLORER",
					type: "tab",
					name: "Files",
					component: "file-explorer",
					enableClose: false,
					enableDrag: false,
					config: {},
				},
			],
		},
	],
	layout: {
		type: "row",
		weight: 100,
		children: [
			{
				type: "tabset",
				id: REPL_TABSET_ID,
				weight: 100,
				// REPL is the anchor pane — it has only the (un-closable,
				// un-draggable) REPL tab, so even with the global
				// enableDeleteWhenEmpty it can't end up empty.
				enableDeleteWhenEmpty: false,
				children: [
					{
						id: "REPL",
						type: "tab",
						name: "Terminal",
						component: "repl",
						enableClose: false,
						enableDrag: false,
						config: {},
					},
				],
			},
		],
	},
});

const getFileTabIcon = (fileName: string) => {
	const Icon = getFileIconComponent(fileName);
	return <Icon className="size-4" />;
};

interface FileExplorerPaneProps {
	mode: ReturnType<typeof useTerminal>["fileMode"];
	onItemSelect: (item: FileExplorerItem) => void;
}

/**
 * The contents of the "Files" border tab. Wraps ScopePicker + FileExplorer.
 * Help + User live in a fixed-position footer outside this pane so they
 * stay visible even when the border is collapsed (see SidebarFooter below).
 */
const FileExplorerPane = ({ mode, onItemSelect }: FileExplorerPaneProps) => (
	<div className="flex h-full flex-col bg-background">
		<ScopePicker />
		<div className="relative min-h-0 flex-1">
			<FileExplorer mode={mode} onItemSelect={onItemSelect} />
		</div>
	</div>
);

interface SidebarFooterProps {
	onHelpClick: () => void;
}

/**
 * Help + User affordances that get portaled into FlexLayout's existing
 * `flexlayout__border_toolbar_left` slot (bottom of the left border).
 * Because they're rendered inside FlexLayout's own DOM, they inherit the
 * border's background/divider styling automatically and read as part of
 * the Files strip — visible whether the border is expanded or collapsed.
 */
const SidebarFooter = ({ onHelpClick }: SidebarFooterProps) => (
	<div className="terminal-sidebar-footer flex flex-col items-center gap-1 py-1.5">
		<Tooltip label="Help" side="top" align="start">
			<button
				type="button"
				className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground"
				onClick={onHelpClick}
				aria-label="Help"
			>
				<HelpCircle className="h-4 w-4" />
			</button>
		</Tooltip>
		<UserMenu />
	</div>
);

export const Terminal = () => {
	const terminal = useTerminal();

	const [helpOpen, setHelpOpen] = useState(false);

	const modelRef = useRef<FlexLayout.Model | null>(null);
	const model = useMemo(() => {
		if (!modelRef.current) {
			modelRef.current = FlexLayout.Model.fromJson(buildInitialModel());
		}
		return modelRef.current;
	}, []);

	// Track the most-recent file-editor tabset id so subsequent file opens
	// add tabs into the same pane instead of spawning a new one each time.
	// The id can go stale (user drags all tabs out → tabset auto-deletes), so
	// we re-validate against `getNodeById` on every open.
	const fileEditorTabsetIdRef = useRef<string | null>(null);

	// Portal target for the Help + User strip. FlexLayout renders a flex
	// column for the left border with `.flexlayout__border_toolbar_left` as
	// the bottom slot — we find it after mount and render our footer into
	// it so it inherits the border's exact styling.
	const flexLayoutContainerRef = useRef<HTMLDivElement | null>(null);
	const [borderToolbarEl, setBorderToolbarEl] = useState<HTMLElement | null>(
		null,
	);

	const closeTerminal = () => terminal.setOpen(false);

	/**
	 * Open (or focus) a file tab. Tab id is `(scope, path)` so reopening the
	 * same file refocuses the existing tab. Scope is snapshotted at open time
	 * — switching the explorer's scope later doesn't retarget already-open
	 * tabs.
	 *
	 * First file opens above the REPL via `DockLocation.TOP` (which spawns a
	 * new tabset). Subsequent files dock into that tabset by id. If the user
	 * drags all file tabs out, the tabset auto-deletes; the next open creates
	 * a fresh one again.
	 */
	const openFileTab = useCallback(
		(file: SelectedFile) => {
			if (!file.path) return;
			const tabMode = terminal.fileMode;
			const tabAppName =
				tabMode.type === "APP" &&
				terminal.selectedApp?.project_id === tabMode.app
					? terminal.selectedApp?.project_name
					: undefined;
			const tabId = `FILE--${modeKey(tabMode)}--${file.path}`;

			const existing = model.getNodeById(tabId);
			if (existing && existing instanceof FlexLayout.TabNode) {
				model.doAction(FlexLayout.Actions.selectTab(tabId));
				return;
			}

			const config: FileEditorTabConfig = {
				path: file.path,
				mode: tabMode,
				baseName: file.name,
				appName: tabAppName,
				ext: (file.name.split(".").pop() || "pixel").toLowerCase() as
					| "pixel"
					| "r"
					| "py"
					| "shell",
			};
			const tabJson: FlexLayout.IJsonTabNode = {
				id: tabId,
				type: "tab",
				name: file.name,
				component: "file-editor",
				enableClose: true,
				config: config as unknown as Record<string, unknown>,
			};

			// If something is maximized, the user is "focused" on that pane
			// — drop the new tab into it rather than fighting the layout by
			// creating a sibling tabset that the maximize is hiding anyway.
			const maximized = model.getMaximizedTabset();

			// Otherwise, re-validate the cached tabset id; the user may have
			// closed every file tab in the meantime, deleting the tabset.
			let targetTabsetId: string | null = maximized
				? maximized.getId()
				: fileEditorTabsetIdRef.current;
			if (targetTabsetId && !model.getNodeById(targetTabsetId)) {
				targetTabsetId = null;
			}

			if (targetTabsetId) {
				model.doAction(
					FlexLayout.Actions.addNode(
						tabJson,
						targetTabsetId,
						FlexLayout.DockLocation.CENTER,
						-1,
						true,
					),
				);
				// Remember this tabset as the file-editor target so subsequent
				// (non-maximized) opens land here too.
				fileEditorTabsetIdRef.current = targetTabsetId;
			} else {
				model.doAction(
					FlexLayout.Actions.addNode(
						tabJson,
						REPL_TABSET_ID,
						FlexLayout.DockLocation.TOP,
						-1,
						true,
					),
				);
				const newTab = model.getNodeById(tabId);
				if (newTab instanceof FlexLayout.TabNode) {
					const parent = newTab.getParent();
					if (parent && parent instanceof FlexLayout.TabSetNode) {
						fileEditorTabsetIdRef.current = parent.getId();
					}
				}
			}
		},
		[model, terminal.fileMode, terminal.selectedApp],
	);

	// Register `terminal.openFile` so other panes (e.g. FileExplorer) can ask
	// for a new tab via the context, mirroring the legacy pattern.
	useEffect(() => {
		terminal.registerOpenFile(openFileTab);
		return () => terminal.registerOpenFile(() => {});
	}, [terminal, openFileTab]);

	// Find FlexLayout's left-border toolbar slot so we can portal the
	// Help + User strip into it. We re-query on mutation since FlexLayout
	// can recreate the border DOM on layout changes.
	useEffect(() => {
		const container = flexLayoutContainerRef.current;
		if (!container) return;
		const findToolbar = () => {
			const el = container.querySelector<HTMLElement>(
				".flexlayout__border_toolbar_left",
			);
			setBorderToolbarEl((prev) => (prev === el ? prev : el));
		};
		findToolbar();
		const observer = new MutationObserver(findToolbar);
		observer.observe(container, { childList: true, subtree: true });
		return () => observer.disconnect();
	}, []);

	const handleItemSelect = useCallback(
		(item: FileExplorerItem) => {
			if (item.type === "directory") return;
			const stub: SelectedFile = {
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
			};
			terminal.openFile(stub);
		},
		[terminal],
	);

	const openHelp = useCallback(() => setHelpOpen(true), []);

	const factory = useCallback(
		(node: FlexLayout.TabNode) => {
			const component = node.getComponent();
			if (component === "file-explorer") {
				return (
					<FileExplorerPane
						mode={terminal.fileMode}
						onItemSelect={handleItemSelect}
					/>
				);
			}
			if (component === "file-editor") {
				return (
					<Suspense fallback={<PaneLoader />}>
						<TerminalFile node={node} />
					</Suspense>
				);
			}
			if (component === "repl") {
				return (
					<Suspense fallback={<PaneLoader />}>
						<TerminalConsole />
					</Suspense>
				);
			}
			return null;
		},
		[handleItemSelect, openHelp, terminal.fileMode],
	);

	if (!terminal.open) return null;

	// Top header is workspace/popup-only — for those embed modes we still
	// want the view selector + close-terminal button. Other locations (the
	// common "panel" + "pipeline" cases) skip the header entirely now that
	// the Mode toggle and Help/User have moved into the sidebar.
	const showHeader =
		terminal.location === "workspace" || terminal.location === "popup";

	return (
		<div className="absolute inset-0 bg-background text-foreground">
			<div className="absolute inset-0 flex flex-col">
				{showHeader && (
					<div className="z-[2] flex h-9 flex-none items-center overflow-hidden border-border border-b bg-muted px-3">
						<div className="flex flex-1 items-center gap-3">
							{terminal.title && (
								<span className="min-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap font-medium">
									{terminal.title}
								</span>
							)}
						</div>
						<div className="flex items-center gap-2">
							<div className="inline-flex overflow-hidden rounded border border-border">
								{(
									[
										["inline", "⮞", "Inline"],
										["overlay", "▢", "Overlay"],
										["side", "⬓", "Side"],
										["popup", "↗", "Pop out"],
									] as const
								).map(([v, icon, title]) => (
									<button
										key={v}
										type="button"
										className={`border-border border-r px-2 py-1 text-sm last:border-r-0 ${
											terminal.view === v
												? "bg-primary/15 text-primary"
												: "bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
										}`}
										onClick={() => terminal.setView(v)}
										title={title}
									>
										{icon}
									</button>
								))}
							</div>
							<button
								type="button"
								className="rounded px-2 py-1 text-destructive hover:bg-destructive/10"
								onClick={closeTerminal}
								title="Close Terminal"
							>
								✕
							</button>
						</div>
					</div>
				)}

				<div
					ref={flexLayoutContainerRef}
					className="terminal-flex-layout flexlayout__theme_smss relative min-h-0 flex-1 overflow-hidden"
				>
					<FlexLayout.Layout
						model={model}
						factory={factory}
						onRenderTab={(node, renderValues) => {
							const component = node.getComponent();
							if (component === "file-editor") {
								renderValues.leading = getFileTabIcon(
									node.getName(),
								);
							}
						}}
						icons={{
							close: <XIcon className="size-4" />,
						}}
					/>
					{borderToolbarEl &&
						createPortal(
							<SidebarFooter onHelpClick={openHelp} />,
							borderToolbarEl,
						)}
				</div>
			</div>

			<UploadModal />
			<SaveModal />
			<HelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
		</div>
	);
};
