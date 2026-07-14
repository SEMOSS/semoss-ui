import { HelpCircle, Plus, XIcon } from "lucide-react";
import {
	lazy,
	Suspense,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";
import { getLanguageDirection, useTranslation } from "@semoss/i18n";
import { InsightProvider } from "@semoss/sdk/react";
import { FileExplorer, FlexLayout, getFileIconComponent } from "@semoss/shared";
import type { FileMode, SelectedFile } from "../../types";
import { modeKey } from "../../utility/file-mode";
import {
	type FileEditorTabConfig,
	inferExt,
} from "../terminal-file/terminal-file";
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

/**
 * Binds a file pane (explorer or editor) to an *existing* terminal-tab insight
 * instead of the ambient app-level one, so browsing/uploading and REPL commands
 * share a single workspace. Passing `insightId` makes the SDK attach to the
 * already-live insight rather than spin up a new one, and `destroyOnUnmount`
 * is off so unmounting this pane never drops the insight the terminal owns.
 *
 * While no console has attached yet (`insightId` null) we show the loader —
 * rendering a provider with an empty id would create a throwaway third insight
 * and reintroduce the very split this fixes.
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

const REPL_TABSET_ID = "REPL_TABSET";

// The original REPL tabset is no longer guaranteed to exist (it can be closed
// or emptied), so resolve a live terminal tabset to dock file editors against.
// The min-one-terminal rule guarantees at least one terminal tab — and thus one
// terminal tabset — always exists.
const findReplTabsetId = (model: FlexLayout.Model): string => {
	if (model.getNodeById(REPL_TABSET_ID)) return REPL_TABSET_ID;
	let found: string | null = null;
	model.visitNodes((node) => {
		if (
			!found &&
			node instanceof FlexLayout.TabNode &&
			node.getComponent() === "repl"
		) {
			const parent = node.getParent();
			if (parent instanceof FlexLayout.TabSetNode) found = parent.getId();
		}
	});
	return found ?? REPL_TABSET_ID;
};

/**
 * Initial layout: left border for the file explorer (starts collapsed —
 * user clicks the "Files" tab strip to expand), main area holds a single
 * REPL tabset. A file-editor tabset is created on demand when the user
 * opens their first file, and is auto-removed when its last tab closes
 * (via `tabSetEnableDeleteWhenEmpty`).
 */
const buildInitialModel = (
	t: (key: string) => string,
	borderLocation: "left" | "right" = "left",
): FlexLayout.IJsonModel => ({
	global: {
		rootOrientationVertical: true,
		tabEnableRename: false,
		tabSetEnableDeleteWhenEmpty: true,
	},
	borders: [
		{
			type: "border",
			// `borderLocation` reflects the user's reading direction at boot:
			// `"left"` for LTR, `"right"` for RTL. The FlexLayout container
			// itself stays `dir="ltr"` (so its splitter drag math works), so
			// switching the location here is how we get the Files panel onto
			// the visual leading edge in Arabic.
			location: borderLocation,
			size: 300,
			// -1 → no tab selected → border starts collapsed. The user
			// expands it by clicking the "Files" strip on the edge.
			selected: -1,
			children: [
				{
					id: "FILE_EXPLORER",
					type: "tab",
					name: t("tabs.files"),
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
				// Removed once empty (e.g. its terminals are split out or closed);
				// the min-one-terminal rule guarantees a terminal still lives
				// somewhere and file opens re-target the live terminal tabset.
				enableDeleteWhenEmpty: true,
				children: [
					{
						id: "REPL",
						type: "tab",
						name: `${t("tabs.terminal")} 1`,
						component: "repl",
						// Closable like any terminal; onModelChange flips this off
						// when only one terminal remains (you can't close the last).
						// `n` drives both the label and its re-localization.
						enableClose: false,
						enableDrag: false,
						config: { n: 1 },
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
const SidebarFooter = ({ onHelpClick }: SidebarFooterProps) => {
	const { t } = useTranslation("chrome");
	return (
		<div className="terminal-sidebar-footer flex flex-col items-center gap-1 py-1.5">
			<Tooltip label={t("actions.help")} side="right" align="center">
				<button
					type="button"
					className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground"
					onClick={onHelpClick}
					aria-label={t("actions.help")}
				>
					<HelpCircle className="h-4 w-4" />
				</button>
			</Tooltip>
			<UserMenu />
		</div>
	);
};

export interface TerminalProps {
	/**
	 * Allow opening more than one terminal tab (a "+" affordance plus
	 * closable/draggable tabs). Set to `false` to embed a single fixed
	 * terminal. Defaults to `true`.
	 */
	allowMultipleTerminals?: boolean;
}

export const Terminal = ({
	allowMultipleTerminals = true,
}: TerminalProps = {}) => {
	const terminal = useTerminal();
	const { t, i18n } = useTranslation("chrome");
	// FlexLayout-react ships LTR-only positioning and splitter drag math
	// (`e.clientX - startX` applied without flipping for writing direction).
	// In RTL the visual layout reverses but the math doesn't, so dragging
	// the splitter feels inverted and can pin the panel at a boundary you
	// can't drag back from. Fence FlexLayout into LTR and re-establish the
	// user's reading direction inside each pane (see `factory` below).
	const paneDir = getLanguageDirection(i18n.language);

	const [helpOpen, setHelpOpen] = useState(false);

	// Model lives in state so we can swap it out when the user changes
	// language mid-session — see the paneDir effect below for the round-trip
	// rebuild that moves the Files border to the other side without losing
	// open file tabs.
	const [model, setModel] = useState<FlexLayout.Model>(() =>
		FlexLayout.Model.fromJson(
			buildInitialModel(t, paneDir === "rtl" ? "right" : "left"),
		),
	);

	// When the user switches language, rebuild the model from its own
	// serialized JSON with the border location flipped to match the new
	// reading direction. `toJson()` → `fromJson()` preserves tab state, IDs,
	// sizes, and active selections — so open file tabs survive the swap.
	const lastBorderLocationRef = useRef<"left" | "right">(
		paneDir === "rtl" ? "right" : "left",
	);
	useEffect(() => {
		const wanted: "left" | "right" = paneDir === "rtl" ? "right" : "left";
		if (lastBorderLocationRef.current === wanted) return;
		lastBorderLocationRef.current = wanted;
		setModel((current) => {
			const json = current.toJson();
			if (json.borders?.[0]) json.borders[0].location = wanted;
			return FlexLayout.Model.fromJson(json);
		});
	}, [paneDir]);

	// Keep tab labels in sync with the active language. The Files tab plus every
	// terminal tab are localized here ("Terminal 1", "Terminal 2", …) using each
	// terminal's stored `n`. File-editor tabs are renamed elsewhere (their name
	// is the on-disk filename and isn't localized).
	useEffect(() => {
		const rename = (id: string, name: string) => {
			const node = model.getNodeById(id);
			if (node && node.getName() !== name) {
				model.doAction(FlexLayout.Actions.renameTab(id, name));
			}
		};
		rename("FILE_EXPLORER", t("tabs.files"));
		model.visitNodes((node) => {
			if (
				node instanceof FlexLayout.TabNode &&
				node.getComponent() === "repl"
			) {
				const n = (node.getConfig() as { n?: number })?.n ?? 1;
				rename(node.getId(), `${t("tabs.terminal")} ${n}`);
			}
		});
	}, [model, t]);

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
				ext: inferExt(file.name),
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
						findReplTabsetId(model),
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

	// Find FlexLayout's border toolbar slot so we can portal the
	// Help + User strip into it. We re-query on mutation since FlexLayout
	// can recreate the border DOM on layout changes. Slot class follows the
	// border's location (`*_left` vs `*_right`), which we mirror to the
	// user's reading direction.
	useEffect(() => {
		const container = flexLayoutContainerRef.current;
		if (!container) return;
		const toolbarClass =
			paneDir === "rtl"
				? ".flexlayout__border_toolbar_right"
				: ".flexlayout__border_toolbar_left";
		const findToolbar = () => {
			const el = container.querySelector<HTMLElement>(toolbarClass);
			setBorderToolbarEl((prev) => (prev === el ? prev : el));
		};
		findToolbar();
		const observer = new MutationObserver(findToolbar);
		observer.observe(container, { childList: true, subtree: true });
		return () => observer.disconnect();
	}, [paneDir]);

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

	// Display number for spawned tabs. The anchor is "Terminal 1"; spawned tabs
	// continue "Terminal 2", "Terminal 3", … The number is stored in each tab's
	// config so the rename effect can re-localize it on language change.
	const replCounterRef = useRef(1);

	// Add a new, independent terminal tab into the given tabset and focus it.
	const addReplTab = useCallback(
		(targetTabsetId: string) => {
			replCounterRef.current += 1;
			const n = replCounterRef.current;
			model.doAction(
				FlexLayout.Actions.addNode(
					{
						id: `REPL--${n}`,
						type: "tab",
						name: `${t("tabs.terminal")} ${n}`,
						component: "repl",
						enableClose: true,
						enableDrag: true,
						config: { n },
					},
					targetTabsetId,
					FlexLayout.DockLocation.CENTER,
					-1,
					true, // select the freshly added tab
				),
			);
		},
		[model, t],
	);

	// Enforce "always at least one terminal": a terminal tab is closable only
	// while more than one exists. When the count drops to one, that tab's close
	// affordance disappears (mirrors the panel hiding its × on the last tab).
	const enforceMinOneTerminal = useCallback((current: FlexLayout.Model) => {
		const replTabs: FlexLayout.TabNode[] = [];
		current.visitNodes((node) => {
			if (
				node instanceof FlexLayout.TabNode &&
				node.getComponent() === "repl"
			) {
				replTabs.push(node);
			}
		});
		const closable = replTabs.length > 1;
		for (const tab of replTabs) {
			if (tab.isEnableClose() !== closable) {
				current.doAction(
					FlexLayout.Actions.updateNodeAttributes(tab.getId(), {
						enableClose: closable,
					}),
				);
			}
		}
	}, []);

	// Keep the file editor's "Run" target pointed at the terminal the user last
	// focused. Only repl selections update it — focusing a file tab leaves the
	// previously active terminal in place. Also re-checks the min-one rule.
	const handleModelChange = useCallback(
		(current: FlexLayout.Model) => {
			const selected = current.getActiveTabset()?.getSelectedNode();
			if (
				selected instanceof FlexLayout.TabNode &&
				selected.getComponent() === "repl"
			) {
				terminal.setActiveConsoleId(selected.getId());
			}
			enforceMinOneTerminal(current);
		},
		[terminal, enforceMinOneTerminal],
	);

	// No initial seed needed: while activeConsoleId is null, submitToConsole
	// falls back to the first-registered (anchor) console — so "Run" works
	// before the user has focused any terminal tab.

	// Render a "+" on every tabset that holds terminal tabs so users can spawn
	// more (and split them side-by-side via drag). Skipped entirely when the
	// embedder opts into a single terminal.
	const onRenderTabSet = useCallback(
		(
			tabSetNode: FlexLayout.TabSetNode | FlexLayout.BorderNode,
			renderValues: { stickyButtons: React.ReactNode[] },
		) => {
			if (!allowMultipleTerminals) return;
			if (!(tabSetNode instanceof FlexLayout.TabSetNode)) return;
			const hasRepl = tabSetNode
				.getChildren()
				.some(
					(child) =>
						child instanceof FlexLayout.TabNode &&
						child.getComponent() === "repl",
				);
			if (!hasRepl) return;
			const tabsetId = tabSetNode.getId();
			renderValues.stickyButtons.push(
				<button
					key="add-repl"
					type="button"
					title={t("tabs.newTerminal")}
					aria-label={t("tabs.newTerminal")}
					className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground"
					onClick={() => addReplTab(tabsetId)}
				>
					<Plus className="size-4" />
				</button>,
			);
		},
		[addReplTab, allowMultipleTerminals, t],
	);

	const factory = useCallback(
		(node: FlexLayout.TabNode) => {
			const component = node.getComponent();
			// FlexLayout's outer container is forced to `dir="ltr"` (see the
			// container below) so its splitter drag math works. Re-establish
			// the user's reading direction inside each rendered pane so the
			// FileExplorer columns, REPL prompt, etc. still flip in Arabic.
			const wrap = (children: React.ReactNode) => (
				<div dir={paneDir} className="h-full w-full">
					{children}
				</div>
			);
			if (component === "file-explorer") {
				// Follows the *live* active terminal: switching tabs re-points
				// the explorer (and its uploads) at that tab's insight.
				return wrap(
					<AdoptingInsight insightId={terminal.activeInsightId}>
						<FileExplorerPane
							mode={terminal.fileMode}
							onItemSelect={handleItemSelect}
						/>
					</AdoptingInsight>,
				);
			}
			if (component === "file-editor") {
				// Bind to the insight the file was opened against (snapshotted
				// into the tab's mode) so an open editor keeps reading/saving
				// the right workspace even after the user switches terminals —
				// the "scope changed" overlay in TerminalFile fences edits when
				// that snapshot no longer matches the active tab. APP/USER/…
				// files are insight-independent, so they fall back to the
				// active insight.
				const cfg = node.getConfig() as { mode?: FileMode } | undefined;
				const snapshotInsightId =
					cfg?.mode?.type === "INSIGHT"
						? cfg.mode.insightId
						: undefined;
				return wrap(
					<AdoptingInsight
						insightId={
							snapshotInsightId ?? terminal.activeInsightId
						}
					>
						<Suspense fallback={<PaneLoader />}>
							<TerminalFile node={node} />
						</Suspense>
					</AdoptingInsight>,
				);
			}
			if (component === "repl") {
				// Each terminal tab gets its own insight so sessions are
				// independent (separate R/Python/variable state). consoleId ties
				// this console to its tab for the file editor's "Run" routing.
				const id = node.getId();
				return wrap(
					<Suspense fallback={<PaneLoader />}>
						<InsightProvider>
							<TerminalConsole consoleId={id} />
						</InsightProvider>
					</Suspense>,
				);
			}
			return null;
		},
		[
			handleItemSelect,
			openHelp,
			paneDir,
			terminal.fileMode,
			terminal.activeInsightId,
		],
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
										["inline", "⮞", "views.inline"],
										["overlay", "▢", "views.overlay"],
										["side", "⬓", "views.side"],
										["popup", "↗", "views.popup"],
									] as const
								).map(([v, icon, titleKey]) => (
									<button
										key={v}
										type="button"
										className={`border-border border-r px-2 py-1 text-sm last:border-r-0 ${
											terminal.view === v
												? "bg-primary/15 text-primary"
												: "bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
										}`}
										onClick={() => terminal.setView(v)}
										title={t(titleKey)}
									>
										{icon}
									</button>
								))}
							</div>
							<button
								type="button"
								className="rounded px-2 py-1 text-destructive hover:bg-destructive/10"
								onClick={closeTerminal}
								title={t("actions.closeTerminal")}
							>
								✕
							</button>
						</div>
					</div>
				)}

				<div
					ref={flexLayoutContainerRef}
					// Fence FlexLayout into LTR — its splitter / border-resize
					// drag math is hardcoded for left-to-right (see paneDir
					// comment above). Pane content opts back into the user's
					// direction via the factory wrapper.
					dir="ltr"
					className="terminal-flex-layout flexlayout__theme_smss relative min-h-0 flex-1 overflow-hidden"
				>
					<FlexLayout.Layout
						model={model}
						factory={factory}
						onModelChange={handleModelChange}
						onRenderTabSet={onRenderTabSet}
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
							// SidebarFooter is portaled into FlexLayout's
							// (now LTR) toolbar slot, so the tooltip side
							// math + dropdown alignment land correctly. The
							// menu contents (theme/language/logout) still
							// read RTL because their own children inherit
							// from `<html dir>`.
							<div dir={paneDir}>
								<SidebarFooter onHelpClick={openHelp} />
							</div>,
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
