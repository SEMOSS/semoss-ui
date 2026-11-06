import type { StoreApi } from "zustand";
import { getI18n } from "@semoss/i18n";
import {
	batchChanges,
	ObservableStore,
	RoomEngine,
	type RoomEngineInit,
	type RoomEngineOptions,
	type ToolCallStore,
} from "@semoss/sdk";
import type { FileExplorerApi, MCPConfig, Prompt } from "@semoss/shared";
import {
	createWorkbenchStore,
	type WorkbenchPanelId,
	type WorkbenchPanelParams,
	type WorkbenchPanelRecord,
	type WorkbenchPanelType,
	type WorkbenchSnapshot,
	type WorkbenchState,
} from "@semoss/workbench";
import type {
	ChatFilePanels,
	ChatHostConfig,
} from "../../host/chat-host-config";
import type {
	RoomIntegration,
	RoomRailPanel,
} from "../../host/room-integration";
import {
	createRoomSidebarLayout,
	getPanelFileMode,
	getRoomFileMode,
	hasMainAreaTabs,
	ROOM_PANEL_TYPES,
	ROOM_SIDEBAR_RAIL_SIZE,
} from "./room-sidebar";

/** A room's options as the chat UI keeps them, with the shared types. */
export interface RoomUiOptions extends RoomEngineOptions {
	/** Toolboxes and knowledge, including the agent's and the room's own. */
	mcp: MCPConfig[];
	/** Prompts the composer offers. */
	predefinedPrompts: Prompt[];
}

/** What a room's UI store is made from. */
export interface RoomUiStoreInit extends RoomEngineInit<RoomUiOptions> {
	/**
	 * The host's config. Its `panelComponents` are the Workbench's
	 * blueprints, handed in rather than imported (the blueprints import this
	 * store); they must be in place before the first `openSidebarPanel`.
	 */
	host: ChatHostConfig;
	/**
	 * Whether the Workspace's rail offers Files. A new chat's draft has no
	 * insight for Files to read, so it leaves Files out until it prepares the
	 * room that takes its arrangement.
	 */
	includeFiles?: boolean;
}

/**
 * A room as the chat UI shows it: the SDK's room engine plus what only the
 * UI needs — the Workbench dock its tool views and files open
 * in, its rail of panels, and the host's integrations (such as connectors).
 *
 * - **The dock store belongs to this store, not to `<Workbench>`.** Tools open
 *   panels from outside React and while the Workspace is closed, and the
 *   arrangement has to survive closing it — which unmounts the shell. The
 *   store builds the dock and restores its arrangement in its constructor;
 *   `<WorkbenchProvider store={room.workbench}>` only hands it down.
 * - **`RoomWorkbench` uses the room's stable `sidebarSnapshot`**; each room
 *   builds its own from `createRoomSidebarLayout`, and it is not persisted
 *   between room sessions.
 * - **A restored file panel is re-pointed at the room's live insight** on
 *   every load ({@link RoomUiStore.onInsightBound}).
 */
export class RoomUiStore extends RoomEngine<RoomUiOptions> {
	/** The host's config. */
	readonly host: ChatHostConfig;

	/** The dock backing the Workspace. */
	readonly workbench: StoreApi<WorkbenchState>;

	/** Stable initialization reference shared by the store and every Workspace mount. */
	sidebarSnapshot: WorkbenchSnapshot;

	/** Whether the Workspace is on screen; what is in it lives in `workbench`. */
	sidebar: { isOpen: boolean } = { isOpen: false };

	/**
	 * Whether the Workspace's rail offers Files: not on a new chat's draft,
	 * nor for a host without file panels.
	 */
	private readonly includesFiles: boolean;

	/** The host's file panels, when it has any. */
	private readonly filePanels: ChatFilePanels | undefined;

	/** The room's UI integrations, made by the host's factories. */
	readonly integrations: readonly RoomIntegration[];

	/** Bumped when an integration changes, so readers of it render again. */
	integrationsVersion = 0;

	/**
	 * @param init - The room, the host's config and the engine config.
	 */
	constructor(init: RoomUiStoreInit) {
		super(init);
		const { host, includeFiles = true } = init;
		const panelComponents = host.panelComponents ?? {};
		this.host = host;
		this.filePanels = host.filePanels;
		this.includesFiles = includeFiles && Boolean(host.filePanels);

		this.sidebarSnapshot = createRoomSidebarLayout({
			fileMode: this.includesFiles ? this.fileMode : null,
			explorerType: this.filePanels?.explorerType ?? "",
			filesName: this.getRailPanelName("files", panelComponents),
			settingsName: this.getRailPanelName("settings", panelComponents),
		});
		this.workbench = createWorkbenchStore({ components: panelComponents });
		this.workbench
			.getState()
			.layout.actions.loadSnapshot(this.sidebarSnapshot);
		this.syncSidebarFileMode();

		this.integrations = (host.integrations ?? []).map((create) =>
			create(this),
		);

		ObservableStore.observeFields<RoomUiStore>(this, [
			"sidebarSnapshot",
			"sidebar",
			"integrationsVersion",
		]);

		this.watchSidebar();
		this.watchIntegrations();
	}

	/**
	 * A rail panel's tab label. There are no translations outside the app, as
	 * in tests, so it falls back to the blueprint's own name.
	 */
	private getRailPanelName = (
		panel: "files" | "settings",
		panelComponents: Record<string, { name?: string }>,
	): string => {
		const type =
			panel === "files"
				? (this.filePanels?.explorerType ?? "")
				: ROOM_PANEL_TYPES.CONFIGURATION;
		return (
			getI18n()?.t(`room:workspacePlaces.${panel}`) ??
			panelComponents[type]?.name ??
			panel
		);
	};

	/**
	 * Return tools inline when their tabs close, and close the Workspace when a
	 * close leaves nothing in front: no tab in the main area and no rail panel
	 * open. Fires whether the close came from a tab's × or from `closeTool`.
	 */
	private watchSidebar = (): void => {
		let previous = this.workbench.getState().layout.panels;

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
				const toolId = (record.config as { toolId?: string })?.toolId;
				const tool = toolId ? this.getTool(toolId) : null;
				if (tool?.isOpen && tool.display === "sidebar") {
					tool.openTool("inline");
				}
			}

			const isEmpty =
				!hasMainAreaTabs(state.layout) &&
				Object.values(state.layout.borders).every(
					(border) => border.activeId === null,
				);
			if (closed.length > 0 && this.sidebar.isOpen && isEmpty) {
				void this.closeSidebar();
			}
		});
	};

	/**
	 * Keep the rail offering each integration's panels, and tell the room's
	 * readers when an integration changes.
	 */
	private watchIntegrations = (): void => {
		const readPanels = () =>
			this.getIntegrationRailPanels()
				.map((panel) => panel.type)
				.join();
		let previous = readPanels();
		this.syncSidebarRail();
		for (const integration of this.integrations) {
			integration.subscribe?.(() => {
				this.integrationsVersion += 1;
				const next = readPanels();
				if (next !== previous) {
					previous = next;
					this.syncSidebarRail();
				}
			});
		}
	};

	/**
	 * An integration of the room, by its id.
	 *
	 * @param id - The integration's id.
	 * @returns The integration, or undefined when the host has none by that id.
	 */
	getIntegration = <T extends RoomIntegration = RoomIntegration>(
		id: string,
	): T | undefined =>
		this.integrations.find((integration) => integration.id === id) as
			| T
			| undefined;

	/** The panels the room's integrations offer on its rail and menu, now. */
	getIntegrationRailPanels = (): RoomRailPanel[] =>
		this.integrations.flatMap(
			(integration) => integration.getRailPanels?.() ?? [],
		);

	/**
	 * Read what a new chat's draft offers before it has a room, such as the
	 * user's connectors. Never rejects.
	 */
	prepareDraftIntegrations = async (): Promise<void> => {
		await Promise.all(
			this.integrations.map(async (integration) => {
				try {
					await integration.prepareDraft?.();
				} catch (error) {
					console.warn(
						`Could not prepare the ${integration.id} integration`,
						error,
					);
				}
			}),
		);
	};

	/**
	 * Take over a new chat's draft integrations before its first message.
	 * Rejects when one cannot, as when the draft's connectors cannot be
	 * copied into the room.
	 *
	 * @param draft - The draft room.
	 */
	adoptIntegrations = async (draft: RoomUiStore): Promise<void> => {
		for (const integration of this.integrations) {
			const drafted = draft.getIntegration(integration.id);
			if (drafted) {
				await integration.adopt?.(drafted);
			}
		}
	};

	/** Whether an integration is writing to the room, such as connectors. */
	get isIntegrationBusy(): boolean {
		return this.integrations.some((integration) => integration.isBusy?.());
	}

	/**
	 * The room was bound to its insight: re-point the restored file panels at
	 * it, and bring its integrations up to date with it.
	 */
	protected override onInsightBound({ isNew }: { isNew: boolean }): void {
		this.syncSidebarFileMode();
		for (const integration of this.integrations) {
			void integration.restore?.({ isNew: isNew }).catch((error) => {
				console.warn(
					`Could not restore the ${integration.id} integration`,
					error,
				);
			});
		}
	}

	/** Show a tool call's view as a Workspace tab. */
	override showToolPanel(tool: ToolCallStore): void {
		this.openSidebarPanel(
			ROOM_PANEL_TYPES.TOOL,
			tool.panelConfig,
			tool.displayName,
		);
	}

	/** Close a tool call's Workspace tab. */
	override hideToolPanel(tool: ToolCallStore): void {
		this.closeSidebarPanel(ROOM_PANEL_TYPES.TOOL, tool.panelConfig);
	}

	/** The file scope every file panel in this Workspace is opened in. */
	get fileMode() {
		return getRoomFileMode(this.insightId);
	}

	/**
	 * Reveal a Workspace panel, opening the Workspace itself and creating the
	 * panel if it is not already there. Identity is the blueprint's `matches`
	 * over `config`.
	 *
	 * @param type - Which blueprint to open.
	 * @param config - The instance's parameters, and what it dedupes on.
	 * @param name - Tab label for a newly created instance.
	 * @returns The revealed or created panel id.
	 */
	openSidebarPanel = (
		type: WorkbenchPanelType,
		config: WorkbenchPanelParams = {},
		name?: string,
	): WorkbenchPanelId => {
		this.sidebar = { isOpen: true };
		return this.workbench
			.getState()
			.layout.actions.selectPanel(type, config, name ? { name } : {});
	};

	/**
	 * Adopt a draft's arrangement before mounting this room's first Workspace.
	 *
	 * @param snapshot - The draft's arrangement.
	 */
	restoreSidebarLayout = (snapshot: WorkbenchSnapshot): void => {
		this.sidebarSnapshot = snapshot;
		this.workbench.getState().layout.actions.loadSnapshot(snapshot);
		this.syncSidebarFileMode();
		// a draft's arrangement has no Files; this room has one to read
		this.syncSidebarRail();
	};

	/** Open the Workspace as it was left, its rail always beside it. */
	openSidebar = (): void => {
		this.sidebar = { isOpen: true };
	};

	/**
	 * Keep the Workspace's left rail offering the room's panels: Files (unless
	 * this is a draft), Settings, and each integration's panels, such as the
	 * connector viewers the chat can show. A panel already open anywhere in
	 * the dock is left where it is, and an integration's panel it no longer
	 * offers leaves the rail. Additions stay collapsed and do not take the
	 * selection.
	 */
	private syncSidebarRail = (): void => {
		const { actions } = this.workbench.getState().layout;
		const panelComponents = this.workbench.getState().layout.components;
		const railPanels: {
			type: WorkbenchPanelType;
			config: WorkbenchPanelParams;
			name: string;
			/** Whether an open panel of this type already offers it. */
			isOffered?: (record: WorkbenchPanelRecord) => boolean;
		}[] = [];
		if (this.includesFiles && this.filePanels) {
			railPanels.push({
				type: this.filePanels.explorerType,
				config: { mode: this.fileMode },
				name: this.getRailPanelName("files", panelComponents),
				// a connector's work folder is another explorer, not Files
				isOffered: (record) =>
					getPanelFileMode(record)?.type === "INSIGHT",
			});
		}
		railPanels.push({
			type: ROOM_PANEL_TYPES.CONFIGURATION,
			config: {},
			name: this.getRailPanelName("settings", panelComponents),
		});
		const offered = this.getIntegrationRailPanels();
		for (const panel of offered) {
			railPanels.push({ type: panel.type, config: {}, name: panel.name });
		}

		for (const panel of railPanels) {
			// one of each panel, wherever it was moved to
			const isOffered = panel.isOffered ?? (() => true);
			if (
				actions.findPanels(
					(record) => record.type === panel.type && isOffered(record),
				).length > 0
			) {
				continue;
			}
			const before = this.workbench.getState().layout;
			const activeId = before.borders.left.activeId;
			const selected = before.selection.panel;
			actions.spawnPanel(panel.type, {
				config: panel.config,
				name: panel.name,
				canClose: false,
				minWidth: ROOM_SIDEBAR_RAIL_SIZE,
				target: { kind: "border", side: "left" },
			});
			// spawning into a border opens it; the rail stays as it was
			if (activeId) {
				actions.activatePanel({ kind: "border", id: "left" }, activeId);
			} else {
				actions.collapseBorder("left");
			}
			actions.setSelectedPanel(selected);
		}

		const availableTypes = new Set(offered.map((panel) => panel.type));
		const { borders, panels } = this.workbench.getState().layout;
		for (const pid of borders.left.panelIds) {
			const record = panels[pid];
			if (
				!record ||
				availableTypes.has(record.type) ||
				!this.integrations.some((integration) =>
					integration.ownsPanelType?.(record.type),
				)
			) {
				continue;
			}
			actions.updatePanel(pid, { canClose: true });
			actions.closePanel(pid);
		}
	};

	/**
	 * Reveal the Workspace's editor for a file, opening it if it is not there.
	 * Which editor depends on the extension (the host's `getPanelType`).
	 *
	 * @param path - The file's insight-relative path.
	 * @param name - Tab label; defaults to the file's own name.
	 * @param options.refresh - Re-read a panel that was already open.
	 * @returns The revealed or created panel id, or null for a host without
	 * file panels.
	 */
	openFileSidebarPanel = (
		path: string,
		name?: string,
		options?: { refresh?: boolean },
	): WorkbenchPanelId | null => {
		if (!this.filePanels) {
			return null;
		}
		const fileName = name ?? path.split("/").filter(Boolean).pop() ?? path;
		const pid = this.openSidebarPanel(
			this.filePanels.getPanelType(path),
			{ mode: this.fileMode, name: fileName, path: path },
			fileName,
		);

		if (options?.refresh) {
			// a panel this call just created reads on mount; one already open
			// holds the copy that was just overwritten
			(
				this.workbench.getState().layout.values[pid] as
					| { refresh: () => void }
					| undefined
			)?.refresh();
		}

		return pid;
	};

	/**
	 * Re-point the Workspace's restored file panels at the room's current
	 * insight. A room binds a fresh insight every time it loads; panels opened
	 * before that binding completes need their mode updated before they mount.
	 */
	private syncSidebarFileMode = (): void => {
		const { actions } = this.workbench.getState().layout;
		const mode = this.fileMode;
		const filePanels = this.filePanels;
		if (!filePanels) {
			return;
		}

		for (const record of actions.findPanels((candidate) => {
			const panelMode = getPanelFileMode(candidate);
			return (
				filePanels.isFilePanelType(candidate.type) &&
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
	 * Reveal the Workspace's file explorer, opening it if it is not there.
	 * There is one explorer per room, so a link into a folder navigates the
	 * open one.
	 *
	 * @param initialPath - Directory to show. Defaults to wherever it was.
	 * @param name - Tab label for a newly created instance.
	 * @returns The revealed or created panel id, or null for a host without
	 * file panels.
	 */
	openSidebarFileExplorer = (
		initialPath?: string,
		name?: string,
	): WorkbenchPanelId | null => {
		if (!this.filePanels) {
			return null;
		}
		const pid = this.openSidebarPanel(
			this.filePanels.explorerType,
			{ mode: this.fileMode },
			// no translations outside the app, as in tests; the blueprint names it
			name ?? getI18n()?.t("room:workspacePlaces.files"),
		);

		if (initialPath) {
			const { actions, values } = this.workbench.getState().layout;
			// `initialPath` is read once, on mount; an explorer already on
			// screen has to be told
			actions.updatePanel(pid, {
				config: { mode: this.fileMode, initialPath: initialPath },
			});
			(values[pid] as FileExplorerApi | undefined)?.commands.navigateTo(
				initialPath,
			);
		}

		return pid;
	};

	/** Reload the room's files explorer, if open, after a save from outside it. */
	override refreshFiles(): void {
		this.refreshSidebarFileExplorer();
	}

	/**
	 * Reload the room's files explorer, if it is open, after a file was saved
	 * into the room's folder from outside it.
	 */
	refreshSidebarFileExplorer = (): void => {
		if (!this.filePanels) {
			return;
		}
		const { actions, values } = this.workbench.getState().layout;
		for (const record of actions.matchPanels(this.filePanels.explorerType, {
			mode: this.fileMode,
		})) {
			(
				values[record.id] as FileExplorerApi | undefined
			)?.commands.refresh();
		}
	};

	/**
	 * Close a Workspace panel matching `config`, if one is open.
	 *
	 * @param type - Which blueprint to close.
	 * @param config - The instance's parameters, matched as `selectPanel` does.
	 */
	closeSidebarPanel = (
		type: WorkbenchPanelType,
		config: WorkbenchPanelParams = {},
	): void => {
		const { actions } = this.workbench.getState().layout;
		for (const record of actions.matchPanels(type, config)) {
			actions.closePanel(record.id);
		}
	};

	/**
	 * Close the Workspace and return its open tools inline. Other panels keep
	 * their arrangement for the next time the Workspace opens.
	 */
	closeSidebar = async (): Promise<void> => {
		batchChanges(() => {
			this.sidebar = { isOpen: false };
			for (const tool of Object.values(this.tools)) {
				if (tool.isOpen && tool.display === "sidebar") {
					tool.openTool("inline");
				}
			}
		});
	};

	/** Show the room's settings in its Workspace, where its tools are set. */
	openRoomSettings = (): void => {
		this.openSidebarPanel(
			ROOM_PANEL_TYPES.CONFIGURATION,
			{},
			getI18n().t("room:workspacePlaces.settings"),
		);
	};
}

/**
 * The chat UI's own store for a room the SDK hands back, such as a
 * message's or a tool call's room. Every room the chat UI makes is a
 * `RoomUiStore` (`createChatRoomsClient` and the new-chat draft build
 * them), so this only restores the type the SDK's message and tool stores
 * cannot name.
 *
 * @param room - The room.
 * @returns The same room, as the chat UI's store.
 */
export const toRoomUiStore = (room: RoomEngine): RoomUiStore =>
	room as RoomUiStore;
