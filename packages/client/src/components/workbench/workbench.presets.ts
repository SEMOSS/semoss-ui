import type { FileExplorerApi } from "@semoss/shared";
import type {
	WorkbenchCommand,
	WorkbenchPanelParams,
	WorkbenchPanelType,
} from "@semoss/workbench";
import { WORKBENCH_COMPONENTS } from "@/stores/workbench";

/**
 * The shared pieces a domain workbench composes: its palette commands, and the
 * helper its settings tab list uses.
 *
 * Eleven workbenches were each writing these out. The four File commands alone
 * were forty-six byte-identical lines in nine files, and `Reconnect Server` was
 * verbatim in ten. What actually varies between workbenches is which explorer
 * the File commands drive, and which panels the View commands open — so those
 * are the arguments, and everything else lives here once.
 *
 * Ids and labels stay at the call site rather than being derived, so the
 * palette is still greppable from a workbench file.
 */

/** Read a file explorer panel's published api out of the live layout. */
const getExplorer = (
	get: () => { layout: { values: Record<string, unknown> } },
	explorerId: WorkbenchPanelType,
): FileExplorerApi | undefined =>
	get().layout.values[explorerId] as FileExplorerApi | undefined;

interface FileCommandOptions {
	/**
	 * Which explorer panel the commands drive. The storage workbench points
	 * them at its bucket explorer instead of the file one.
	 */
	explorerId?: WorkbenchPanelType;
	/** Hides the three mutating commands. Refresh stays available. */
	readOnly: boolean;
	/**
	 * Whether this explorer can create. Buckets cannot, so the storage
	 * workbench registers upload and refresh only.
	 */
	canCreate?: boolean;
}

/**
 * The File category: create, create folder, upload, refresh.
 *
 * @param options - Which explorer to drive and what it supports.
 * @return Commands to spread into `useWorkbenchCommands`.
 */
export const createFileCommands = ({
	explorerId = WORKBENCH_COMPONENTS.FILE_EXPLORER,
	readOnly,
	canCreate = true,
}: FileCommandOptions): WorkbenchCommand[] => [
	...(canCreate
		? [
				{
					id: "workbench.file.create",
					category: "File",
					label: "Create File",
					visible: !readOnly,
					handler: (get) =>
						getExplorer(get, explorerId)?.commands.openNewFile(
							undefined,
							"add_file",
						),
				} satisfies WorkbenchCommand,
				{
					id: "workbench.file.create-folder",
					category: "File",
					label: "Create Folder",
					visible: !readOnly,
					handler: (get) =>
						getExplorer(get, explorerId)?.commands.openNewFile(
							undefined,
							"add_directory",
						),
				} satisfies WorkbenchCommand,
			]
		: []),
	{
		id: "workbench.file.upload",
		category: "File",
		label: "Upload Files",
		visible: !readOnly,
		handler: (get) =>
			getExplorer(get, explorerId)?.commands.openNewFile(
				undefined,
				"upload",
			),
	},
	{
		// no `visible` guard: refreshing is a read, and a read-only workbench
		// still wants it
		id: "workbench.file.refresh",
		category: "File",
		label: "Refresh Files",
		handler: (get) => getExplorer(get, explorerId)?.commands.refresh(),
	},
];

/**
 * Reconnect the Pixel server. Verbatim in every domain workbench.
 *
 * @param insight - The workbench's insight, for running the pixel.
 * @return One command.
 */
export const createReconnectCommand = (insight: {
	actions: { run: (pixel: string) => Promise<unknown> };
}): WorkbenchCommand => ({
	id: "workbench.server.reconnect",
	label: "Reconnect Server",
	handler: () => {
		void insight.actions.run("ReconnectServer();").catch(console.error);
	},
});

interface OpenPanelCommandOptions {
	id: string;
	label: string;
	/** Which blueprint to reveal. */
	type: WorkbenchPanelType;
	/** The instance's parameters; also what `selectPanel` dedupes on. */
	config?: WorkbenchPanelParams;
	/** Defaults to "View". */
	category?: string;
	visible?: boolean;
}

/**
 * A View command that reveals (or opens) one panel.
 *
 * @param options - The command's identity and what it opens.
 * @return One command.
 */
export const createOpenPanelCommand = ({
	id,
	label,
	type,
	config,
	category = "View",
	visible,
}: OpenPanelCommandOptions): WorkbenchCommand => ({
	id: id,
	category: category,
	label: label,
	visible: visible,
	handler: (get) => {
		get().layout.actions.selectPanel(type, config);
	},
});

/**
 * A copy of `tabs` with one more inserted at `index`.
 *
 * Domains differ from the shared list by an entry or two, and where the entry
 * lands is part of the design — Metadata sits before Access Control, not at the
 * end. Splicing keeps that visible at the call site.
 *
 * @param tabs - The base list.
 * @param tab - The tab to insert.
 * @param index - Where it goes.
 * @return A new list.
 */
export const withTab = <T>(tabs: T[], tab: T, index: number): T[] => [
	...tabs.slice(0, index),
	tab,
	...tabs.slice(index),
];
