import {
	FILE_PANEL_TYPES,
	type FilePanelMode,
	type FilePanelParams,
	type FileViewControls,
	isFilePanelType,
} from "@semoss/panels";
import { type FileExplorerApi, getParentPath } from "@semoss/shared";
import { useWorkbench, useWorkbenchPanel } from "@semoss/workbench";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";
import { useWorkThread } from "./work-thread-context";

/** File views publish editor controls; explorers and MCP editors have other contracts. */
export function isWorkFileView(type: string): boolean {
	return (
		isFilePanelType(type) &&
		type !== FILE_PANEL_TYPES.FILE_EXPLORER &&
		type !== FILE_PANEL_TYPES.FILE_MCP_EDITOR
	);
}

interface WorkFileActions {
	selectedId: string;
	name: string;
	path?: string;
	mode: FilePanelMode;
	destination: string;
	isReady: boolean;
	isDirty: boolean;
	canSave: boolean;
	canDownload: boolean;
	canRefresh: boolean;
	refreshLabel: string;
	description: string;
	save: () => void;
	download: () => void;
	refresh: () => void;
}

/** Read the selected panel's published controls without mounting a second editor or explorer. */
export function useWorkFileActions(): WorkFileActions {
	const workbench = useToolWorkbench();
	const { snapshot } = useWorkThread();
	const selectedId = useWorkbench(
		(state) =>
			(state.layout.isMobileLayout
				? state.layout.mobileActivePanelId
				: state.layout.selection.panel) ?? "",
	);
	const { type, config, value, name } = useWorkbenchPanel<
		Partial<FilePanelParams>,
		FileViewControls | FileExplorerApi
	>(selectedId);
	const controls =
		isWorkFileView(type) && value && "canSave" in value ? value : undefined;
	const explorer =
		type === FILE_PANEL_TYPES.FILE_EXPLORER && value && "commands" in value
			? value
			: undefined;
	const isBusy =
		controls?.isBusy ||
		Boolean(
			explorer &&
				(explorer.tree.status === "INITIAL" ||
					explorer.tree.status === "LOADING" ||
					explorer.tree.isUploading),
		);
	const mode: FilePanelMode = {
		type: "INSIGHT",
		insightId: workbench.insightId,
	};
	const isThreadFile =
		config.mode?.type === "INSIGHT" &&
		config.mode.insightId === workbench.insightId;
	const destination = isThreadFile
		? (explorer?.header.path ??
			(config.path ? getParentPath(config.path) : "/"))
		: "/";
	const isReady = snapshot.isReady && Boolean(workbench.insightId);
	const canSave =
		isReady && Boolean(controls?.canSave && controls.save && !isBusy);
	const canDownload =
		isReady &&
		Boolean(controls?.canDownload && controls.download && !isBusy);
	const canRefresh =
		isReady &&
		!isBusy &&
		Boolean(explorer || (controls && controls.canRefresh !== false));
	return {
		selectedId,
		name: name ?? "file",
		path: config.path,
		mode,
		destination,
		isReady,
		isDirty: Boolean(
			controls?.isDirty || (controls && name?.endsWith("*")),
		),
		canSave,
		canDownload,
		canRefresh,
		refreshLabel: explorer ? "Refresh files" : "Refresh file",
		description: !isReady
			? "Thread files are still connecting."
			: isBusy
				? "Wait for the current file operation to finish."
				: explorer
					? "Open a file to save or download it."
					: !controls
						? "Select an open file to use these actions."
						: !controls.canSave
							? "This file cannot be saved in its current state."
							: "Actions apply to the selected file.",
		save: () => {
			if (canSave) controls?.save?.();
		},
		download: () => {
			if (canDownload) void controls?.download?.();
		},
		refresh: () => {
			if (!canRefresh) return;
			if (explorer) {
				// The explorer API has live getters. Check again before acting on a menu opened earlier.
				if (
					explorer.tree.status !== "LOADING" &&
					!explorer.tree.isUploading
				)
					explorer.commands.refresh();
			} else controls?.refresh();
		},
	};
}
