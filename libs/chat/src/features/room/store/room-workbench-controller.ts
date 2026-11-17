import type { StoreApi } from "zustand";
import { getI18n } from "@semoss/i18n";
import {
	FILE_PANEL_TYPES,
	type FilePanelValue,
	getFilePanelType,
	isFilePanelType,
} from "@semoss/panels";
import type { FileExplorerApi } from "@semoss/shared";
import {
	createWorkbenchStore,
	type WorkbenchPanelConfigAny,
	type WorkbenchPanelId,
	type WorkbenchPanelParams,
	type WorkbenchPanelType,
	type WorkbenchSnapshot,
	type WorkbenchState,
} from "@semoss/workbench";
import type { ConnectorsStore } from "../../connectors/store/connectors.store";
import { CONNECTOR_SOURCES } from "../../connectors/viewers/connector-sources";
import {
	createRoomWorkbenchLayout,
	getPanelFileMode,
	getRoomFileMode,
	ROOM_PANEL_TYPES,
} from "./room-workbench-layout";
import type { ToolData, ToolStore } from "./tool.store";

/**
 * A default panel's tab label. There are no translations outside the app, as
 * in tests, so it falls back to the blueprint's own name.
 *
 * @param panel - Which default panel.
 * @param panelComponents - The blueprints, for their own names.
 * @returns The tab label.
 */
const getDefaultPanelName = (
	panel: "files" | "settings",
	panelComponents: Record<string, WorkbenchPanelConfigAny>,
): string => {
	const type =
		panel === "files"
			? FILE_PANEL_TYPES.FILE_EXPLORER
			: ROOM_PANEL_TYPES.CONFIGURATION;
	return (
		getI18n()?.t(`room:workspacePlaces.${panel}`) ??
		panelComponents[type]?.name ??
		panel
	);
};

/**
 * A new room's starting arrangement: Files (when the room offers it) and
 * Settings as tabs, labelled from the blueprints.
 *
 * @param options - The room's insight, whether it offers Files, and its
 * blueprints.
 * @returns The arrangement.
 */
export const createRoomWorkbenchSnapshot = (options: {
	insightId: string;
	includeFiles: boolean;
	panelComponents: Record<string, WorkbenchPanelConfigAny>;
}): WorkbenchSnapshot =>
	createRoomWorkbenchLayout({
		fileMode: options.includeFiles
			? getRoomFileMode(options.insightId)
			: null,
		filesName: getDefaultPanelName("files", options.panelComponents),
		settingsName: getDefaultPanelName("settings", options.panelComponents),
	});

/** What the Workbench needs from its room. */
export interface RoomWorkbenchControllerDependencies {
	/** The insight the room runs in now, which every file panel is opened in. */
	getInsightId: () => string;
	/** Every tool call the room has seen, by id. */
	getTools: () => Readonly<Record<string, ToolData>>;
	/** A tool call's view, or null when the room has not seen it. */
	getTool: (toolId: string) => ToolStore | null;
	/** Show or hide the Workspace. */
	setOpen: (isOpen: boolean) => void;
	/** Keep the arrangement the room's Workbench mounts start from. */
	setSnapshot: (snapshot: WorkbenchSnapshot) => void;
	/** The room's connectors, whose viewers close when they can no longer show. */
	connectors: ConnectorsStore;
}

/**
 * The room's Workspace dock: the workbench store, the panels the room opens
 * in it, and the watches that keep it in step with the room's tools and
 * connectors. Owned by `RoomStore`, which keeps its public `openWorkbench*`
 * actions as delegates.
 */
export class RoomWorkbenchController {
	/**
	 * The dock backing the Workbench.
	 *
	 * Owned by the room rather than by `<Workbench>` for two reasons: panels
	 * are opened from outside React (a tool store hearing a stream) and while
	 * the Workbench is closed, and the arrangement has to survive the Workbench
	 * being closed and reopened, which unmounts the shell.
	 */
	readonly workbench: StoreApi<WorkbenchState>;

	/** What the Workbench reads from and writes to its room. */
	private readonly deps: RoomWorkbenchControllerDependencies;

	/** Whether the Workspace's rail offers Files; a new chat's draft does not. */
	private readonly includesFiles: boolean;

	/** Stops the Workbench's own subscriptions; see {@link dispose}. */
	private disposers: (() => void)[] = [];

	/**
	 * Build the dock on the room's starting arrangement, and start watching
	 * its tabs and the room's connectors.
	 *
	 * @param deps - What the Workbench needs from its room.
	 * @param options - The starting arrangement, the blueprints, and whether
	 * the rail offers Files.
	 */
	constructor(
		deps: RoomWorkbenchControllerDependencies,
		options: {
			snapshot: WorkbenchSnapshot;
			panelComponents: Record<string, WorkbenchPanelConfigAny>;
			includeFiles: boolean;
		},
	) {
		this.deps = deps;
		this.includesFiles = options.includeFiles;
		this.workbench = createWorkbenchStore({
			components: options.panelComponents,
		});
		this.workbench.getState().layout.actions.loadSnapshot(options.snapshot);
		this.syncFileMode();
		this.watchClosedTools();
		this.watchConnectors();
	}

	/** The file scope every file panel in this Workbench is opened in. */
	get fileMode() {
		return getRoomFileMode(this.deps.getInsightId());
	}

	/**
	 * Return tools inline when their tabs close.
	 *
	 * This is one reason the room holds the dock: the watch has to fire
	 * whether the close came from the tab's × or from `closeTool`. Every tab
	 * closes, including Files and Settings, and an empty Workspace still shows
	 * its rail, which reopens any of them.
	 */
	private watchClosedTools = (): void => {
		let previous = this.workbench.getState().layout.panels;
		this.disposers.push(
			this.workbench.subscribe((state) => {
				const panels = state.layout.panels;
				if (panels === previous) {
					return;
				}
				const closed = Object.values(previous).filter(
					(record) => !(record.id in panels),
				);
				previous = panels;
				for (const record of closed) {
					if (record.type !== ROOM_PANEL_TYPES.TOOL) {
						continue;
					}
					const toolId = (record.config as { toolId?: string })
						?.toolId;
					const tool = toolId ? this.deps.getTool(toolId) : null;
					if (tool?.isOpen && tool.display === "sidebar") {
						tool.openTool("inline");
					}
				}
			}),
		);
	};

	/** Close a connector's viewer once the chat can no longer show it. */
	private watchConnectors = (): void => {
		const { connectors } = this.deps;
		const availableServices = () =>
			connectors.availableSources.map((source) => source.service).join();
		let shownServices = availableServices();
		this.closeHiddenConnectorPanels();
		this.disposers.push(
			connectors.subscribe(() => {
				const next = availableServices();
				if (next !== shownServices) {
					shownServices = next;
					this.closeHiddenConnectorPanels();
				}
			}),
		);
	};

	/**
	 * Close any connector viewer the chat can no longer show, the panels
	 * having been opened on demand from the Workspace's rail.
	 */
	private closeHiddenConnectorPanels = (): void => {
		const { actions } = this.workbench.getState().layout;
		const availableTypes = new Set(
			this.deps.connectors.availableSources.map(
				(source) => source.panelType,
			),
		);
		for (const record of actions.findPanels(
			(candidate) =>
				!availableTypes.has(candidate.type) &&
				CONNECTOR_SOURCES.some(
					(source) => source.panelType === candidate.type,
				),
		)) {
			actions.updatePanel(record.id, { canClose: true });
			actions.closePanel(record.id);
		}
	};

	/** Stop watching the dock and the connectors. A disposed Workbench reacts to neither. */
	dispose = (): void => {
		for (const stop of this.disposers) {
			stop();
		}
		this.disposers = [];
	};

	/**
	 * Reveal a Workbench panel, opening the Workbench itself and creating the panel
	 * if it is not already there.
	 *
	 * Identity is the blueprint's `matches` over `config`, so callers mint no
	 * node ids to dedupe by: a tool panel is "the same panel" when its `toolId`
	 * matches, whatever its instance id happens to be.
	 *
	 * @param type - Which blueprint to open.
	 * @param config - The instance's parameters, and what it dedupes on.
	 * @param name - Tab label for a newly created instance.
	 * @returns The revealed or created panel id.
	 */
	openPanel = (
		type: WorkbenchPanelType,
		config: WorkbenchPanelParams = {},
		name?: string,
	): WorkbenchPanelId => {
		this.deps.setOpen(true);
		return this.workbench
			.getState()
			.layout.actions.selectPanel(type, config, name ? { name } : {});
	};

	/**
	 * Adopt a draft's arrangement before mounting this room's first Workbench.
	 *
	 * A draft is built without Files, having no insight for it to read, so the
	 * room it prepares gains it here, behind whatever tab the draft was on.
	 *
	 * @param snapshot - The draft's arrangement.
	 */
	restoreLayout = (snapshot: WorkbenchSnapshot): void => {
		this.deps.setSnapshot(snapshot);
		const { actions } = this.workbench.getState().layout;
		actions.loadSnapshot(snapshot);
		this.syncFileMode();
		const hasFiles = actions.findPanels(
			(record) =>
				record.type === FILE_PANEL_TYPES.FILE_EXPLORER &&
				// a connector's work folder is another explorer, not Files
				getPanelFileMode(record)?.type === "INSIGHT",
		).length;
		if (!this.includesFiles || hasFiles) {
			return;
		}
		const selected = this.workbench.getState().layout.selection.panel;
		actions.spawnPanel(FILE_PANEL_TYPES.FILE_EXPLORER, {
			config: { mode: this.fileMode },
			name: getDefaultPanelName(
				"files",
				this.workbench.getState().layout.components,
			),
		});
		if (selected) {
			actions.navigatePanel(selected);
		}
	};

	/**
	 * Reveal the Workbench's editor for a file, opening it if it is not there.
	 * `getFilePanelType` picks the editor from the extension.
	 *
	 * @param path - The file's insight-relative path.
	 * @param name - Tab label; defaults to the file's own name.
	 * @param options - `refresh`: reload an editor already open on the file,
	 * after its file was overwritten.
	 * @returns The revealed or created panel id.
	 */
	openFilePanel = (
		path: string,
		name?: string,
		options?: { refresh?: boolean },
	): WorkbenchPanelId => {
		const fileName = name ?? path.split("/").filter(Boolean).pop() ?? path;
		const pid = this.openPanel(
			getFilePanelType(path),
			{ mode: this.fileMode, name: fileName, path: path },
			fileName,
		);
		if (options?.refresh) {
			// A panel this call just created reads on mount; one that was
			// already open is holding the copy that was just overwritten.
			(
				this.workbench.getState().layout.values[pid] as
					| FilePanelValue
					| undefined
			)?.refresh();
		}
		return pid;
	};

	/**
	 * Re-point the Workbench's restored file panels at the room's current insight.
	 *
	 * A room binds to a fresh insight every time it loads. Panels opened before
	 * that binding completes need their mode updated before they mount so reads,
	 * saves, and dedupe all use the room's live insight.
	 */
	syncFileMode = (): void => {
		const { actions } = this.workbench.getState().layout;
		const mode = this.fileMode;
		for (const record of actions.findPanels((candidate) => {
			const panelMode = getPanelFileMode(candidate);
			return (
				isFilePanelType(candidate.type) &&
				panelMode?.type === "INSIGHT" &&
				panelMode.insightId !== mode.insightId
			);
		})) {
			actions.updatePanel(record.id, {
				config: { ...record.config, mode: mode },
			});
		}
	};

	/**
	 * Reveal the Workbench's file explorer, opening it if it is not there. There
	 * is one explorer per room (the blueprint dedupes on scope alone), so a
	 * link into a folder navigates the one already open.
	 *
	 * @param initialPath - Directory to show. Defaults to wherever it was.
	 * @param name - Tab label for a newly created instance. Defaults to the
	 * chat files label, which keeps the room's own files apart from a
	 * connector work folder.
	 * @returns The revealed or created panel id.
	 */
	openFileExplorer = (
		initialPath?: string,
		name?: string,
	): WorkbenchPanelId => {
		const pid = this.openPanel(
			FILE_PANEL_TYPES.FILE_EXPLORER,
			{ mode: this.fileMode },
			// no translations outside the app, as in tests; the blueprint names it
			name ?? getI18n()?.t("room:workspacePlaces.files"),
		);
		if (initialPath) {
			const { actions, values } = this.workbench.getState().layout;
			// `initialPath` is read once, on mount, so it covers the panel this
			// call just created; an explorer already on screen has to be told.
			actions.updatePanel(pid, {
				config: { mode: this.fileMode, initialPath: initialPath },
			});
			(values[pid] as FileExplorerApi | undefined)?.commands.navigateTo(
				initialPath,
			);
		}
		return pid;
	};

	/**
	 * Reload the chat files explorer, if it is open, after a file was saved
	 * into the room's folder from outside it.
	 */
	refreshFileExplorer = (): void => {
		const { actions, values } = this.workbench.getState().layout;
		for (const record of actions.matchPanels(
			FILE_PANEL_TYPES.FILE_EXPLORER,
			{ mode: this.fileMode },
		)) {
			(
				values[record.id] as FileExplorerApi | undefined
			)?.commands.refresh();
		}
	};

	/**
	 * Close a Workbench panel matching `config`, if one is open.
	 *
	 * @param type - Which blueprint to close.
	 * @param config - The instance's parameters, matched as `selectPanel` does.
	 */
	closePanel = (
		type: WorkbenchPanelType,
		config: WorkbenchPanelParams = {},
	): void => {
		const { actions } = this.workbench.getState().layout;
		for (const record of actions.matchPanels(type, config)) {
			actions.closePanel(record.id);
		}
	};

	/**
	 * Close the Workbench and return its open tools inline. Other panels keep
	 * their arrangement for the next time the Workspace opens.
	 */
	close = (): void => {
		this.deps.setOpen(false);
		for (const tool of Object.values(this.deps.getTools())) {
			if (tool.isOpen && tool.display === "sidebar") {
				this.deps.getTool(tool.id)?.openTool("inline");
			}
		}
	};
}
