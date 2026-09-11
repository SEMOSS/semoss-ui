import { HelpCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { getLanguageDirection, useTranslation } from "@semoss/i18n";
import type { WorkbenchLayout } from "@semoss/workbench";
import {
	createWorkbenchStore,
	useWorkbench,
	useWorkbenchStoreApi,
	Workbench,
	WorkbenchProvider,
} from "@semoss/workbench";
import type { SelectedFile } from "../../types";
import { inferExt } from "../terminal-file/terminal-file";
import { Tooltip } from "../tooltip";
import { HelpDialog } from "./help-dialog";
import { SaveModal } from "./save-modal";
import {
	TERMINAL_PANEL_COMPONENTS,
	TERMINAL_PANEL_TYPES,
} from "./terminal.panels";
import { useTerminal } from "./terminal-context";
import { UploadModal } from "./upload-modal";
import { UserMenu } from "./user-menu";

/** The seeded terminal and explorer. Both are ids, not minted, so the
 * localization pass and the border can name them without a lookup. */
const MAIN_TABSET_ID = "main";
const FIRST_REPL_ID = "repl-1";
const FILE_EXPLORER_ID = "files";

/**
 * The default arrangement: one terminal filling the dock, the file explorer
 * collapsed onto a border rail.
 *
 * `side` follows the reading direction so Files sits on the visual leading
 * edge. `WorkbenchSide` is physical by design — the dock does not mirror
 * itself — so RTL puts the panel on the right border rather than flipping the
 * left one.
 */
const createTerminalLayout = (
	side: "left" | "right",
	allowMultiple: boolean,
): WorkbenchLayout => ({
	tree: {
		type: "tabset",
		id: MAIN_TABSET_ID,
		size: 1,
		panelIds: [FIRST_REPL_ID],
		activeId: FIRST_REPL_ID,
		// the min-one-terminal rule keeps a panel here, so this never empties
		enableDeleteWhenEmpty: false,
	},
	panels: {
		[FIRST_REPL_ID]: {
			id: FIRST_REPL_ID,
			type: TERMINAL_PANEL_TYPES.REPL,
			name: "Terminal 1",
			canDrag: allowMultiple,
			config: { n: 1, allowMultiple: allowMultiple },
		},
		[FILE_EXPLORER_ID]: {
			id: FILE_EXPLORER_ID,
			type: TERMINAL_PANEL_TYPES.FILE_EXPLORER,
			name: "Files",
			canClose: false,
			canDrag: false,
		},
	},
	borders: {
		// activeId null: the rail starts collapsed, and clicking Files opens it
		[side]: { panelIds: [FILE_EXPLORER_ID], activeId: null, size: 300 },
	},
});

interface SidebarFooterProps {
	onHelpClick: () => void;
}

/**
 * Help and User, in the border rail under the panel icons.
 *
 * A `borderSlots` entry rather than a portal into the dock's DOM: the rail
 * renders these even when it holds no open panel, so they stay reachable while
 * Files is collapsed — which is what the old `createPortal` into
 * `.flexlayout__border_toolbar_left` was buying.
 */
const SidebarFooter = ({ onHelpClick }: SidebarFooterProps) => {
	const { t } = useTranslation("chrome");
	return (
		<div className="flex flex-col items-center gap-1 py-1.5">
			<Tooltip label={t("actions.help")} side="right" align="center">
				<button
					type="button"
					className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground"
					onClick={onHelpClick}
					aria-label={t("actions.help")}
				>
					<HelpCircle className="size-4" />
				</button>
			</Tooltip>
			<UserMenu />
		</div>
	);
};

/**
 * Everything that has to reach into the dock: opening files, keeping tab
 * labels localized, and the min-one-terminal rule.
 *
 * Lives inside the provider as a renderless child so it can use
 * `useWorkbench`, and so the shell above it never re-renders on a layout
 * change it does not draw.
 */
const TerminalDockBindings = () => {
	const terminal = useTerminal();
	const { t } = useTranslation("chrome");
	const storeApi = useWorkbenchStoreApi();
	const actions = useWorkbench((state) => state.layout.actions);
	const selectedPanelId = useWorkbench(
		(state) => state.layout.selection.panel,
	);
	// `useShallow`, because a mapping selector returns a fresh array on every
	// store notification and plain `Object.is` would re-render this on all of
	// them
	const replPanels = useWorkbench(
		useShallow((state) =>
			state.layout.openPanelIds.filter(
				(pid) =>
					state.layout.panels[pid]?.type ===
					TERMINAL_PANEL_TYPES.REPL,
			),
		),
	);

	/**
	 * Open (or reveal) a file.
	 *
	 * Identity is (scope, path) through the blueprint's `matches`, so reopening
	 * the same file reveals its editor instead of stacking another. Scope is
	 * snapshotted at open time — changing the explorer's scope later does not
	 * retarget an editor that is already open.
	 *
	 * The first file splits a pane above the terminal; later ones join it. If a
	 * dock is maximized the user is focused on it, so the file lands there
	 * rather than behind the maximize.
	 *
	 * Reads live state off the store api rather than a selector: this runs from
	 * the explorer's click handler, and subscribing the whole binding component
	 * to the layout tree would re-render it on every drag.
	 */
	const openFile = useCallback(
		(file: SelectedFile) => {
			if (!file.path) return;
			const mode = terminal.fileMode;
			if (mode.type === "STORAGE") {
				// buckets have no read or save reactor; the scope picker never
				// selects one, so this is unreachable rather than a limitation
				return;
			}
			const appName =
				mode.type === "APP" &&
				terminal.selectedApp?.project_id === mode.app
					? terminal.selectedApp?.project_name
					: undefined;
			const config = {
				path: file.path,
				mode: mode,
				baseName: file.name,
				appName: appName,
				ext: inferExt(file.name),
			};

			if (
				actions.matchPanels(TERMINAL_PANEL_TYPES.FILE_EDITOR, config)
					.length > 0
			) {
				actions.selectPanel(TERMINAL_PANEL_TYPES.FILE_EDITOR, config);
				return;
			}

			const layout = storeApi.getState().layout;
			const tabsetOf = (pid: string | undefined) =>
				pid
					? layout.tabsets.find((tabset) =>
							tabset.panelIds.includes(pid),
						)?.id
					: undefined;

			const openEditor = actions.findPanels(
				(record) => record.type === TERMINAL_PANEL_TYPES.FILE_EDITOR,
			)[0];
			const host = layout.maximizedTabsetId ?? tabsetOf(openEditor?.id);

			const pid = actions.spawnPanel(TERMINAL_PANEL_TYPES.FILE_EDITOR, {
				name: file.name,
				config: config,
			});
			actions.movePanel(
				pid,
				host
					? { kind: "join", tabsetId: host }
					: // the first file opens a pane above the terminal
						{ kind: "split", tabsetId: MAIN_TABSET_ID, dir: "top" },
			);
		},
		[actions, storeApi, terminal.fileMode, terminal.selectedApp],
	);

	useEffect(() => {
		terminal.registerOpenFile(openFile);
		return () => terminal.registerOpenFile(() => {});
	}, [terminal, openFile]);

	// Always at least one terminal: a terminal is closable only while more
	// than one exists, so the last one's × disappears.
	useEffect(() => {
		const closable = replPanels.length > 1;
		for (const pid of replPanels) {
			actions.updatePanel(pid, { canClose: closable });
		}
	}, [actions, replPanels]);

	// Keep tab labels in the active language. File editors are named after the
	// file on disk and are deliberately left alone.
	useEffect(() => {
		actions.renamePanel(FILE_EXPLORER_ID, t("tabs.files"));
		const panels = storeApi.getState().layout.panels;
		for (const pid of replPanels) {
			const configured = panels[pid]?.config?.n;
			const n = typeof configured === "number" ? configured : 1;
			actions.renamePanel(pid, `${t("tabs.terminal")} ${n}`);
		}
	}, [actions, replPanels, storeApi, t]);

	// The file editor's Run targets the terminal the user last focused. Only a
	// terminal selection moves it — focusing a file leaves the previous one.
	useEffect(() => {
		if (selectedPanelId && replPanels.includes(selectedPanelId)) {
			terminal.setActiveConsoleId(selectedPanelId);
		}
	}, [selectedPanelId, replPanels, terminal]);

	return null;
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
	const [helpOpen, setHelpOpen] = useState(false);
	const openHelp = useCallback(() => setHelpOpen(true), []);

	const side =
		getLanguageDirection(i18n.language) === "rtl" ? "right" : "left";

	// The layout is read once per identity, so it must not churn — but the
	// border side genuinely changes when the user switches language, and
	// re-hydrating is how Files moves to the other edge.
	const layout = useMemo(
		() => createTerminalLayout(side, allowMultipleTerminals),
		[side, allowMultipleTerminals],
	);

	// One store per arrangement. `allowMultipleTerminals` is in the key because
	// an embedded single terminal and the full one are different layouts, and a
	// cached one must not hydrate into the other.
	const store = useMemo(
		() =>
			createWorkbenchStore(
				`terminal--${terminal.location}--${
					allowMultipleTerminals ? "multi" : "single"
				}`,
			),
		[terminal.location, allowMultipleTerminals],
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
										className={`border-border border-e px-2 py-1 text-sm last:border-e-0 ${
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
								onClick={() => terminal.setOpen(false)}
								title={t("actions.closeTerminal")}
							>
								✕
							</button>
						</div>
					</div>
				)}

				<div className="relative min-h-0 flex-1 overflow-hidden">
					<WorkbenchProvider store={store}>
						<TerminalDockBindings />
						<Workbench
							components={TERMINAL_PANEL_COMPONENTS}
							layout={layout}
							borderSlots={{
								[side]: {
									after: (
										<SidebarFooter onHelpClick={openHelp} />
									),
								},
							}}
						/>
					</WorkbenchProvider>
				</div>
			</div>

			<UploadModal />
			<SaveModal />
			<HelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
		</div>
	);
};
