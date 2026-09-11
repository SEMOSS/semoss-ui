import { RefreshCwIcon, SaveIcon } from "lucide-react";
import type { FC } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import type { WorkbenchChromeProps } from "@semoss/workbench";
import { WORKBENCH_STYLES, WorkbenchChromeButton } from "@semoss/workbench";
import { MetadataHelpDialog } from "../mcp";
import { MCP } from "./file-panel.constants";
import type { FilePanelParams, FilePanelValue } from "./use-file-panel";

/** One entry in an editor's view switch. */
export interface FileViewMode {
	value: string;
	label: string;
}

/**
 * What an editor panel publishes for its chrome.
 *
 * `viewModes` is what decides whether the switch is drawn, so a panel that has
 * one lists its modes and a panel that doesn't simply omits them. That is why
 * the markdown, notebook and code editors share one control instead of three
 * files that differed by a string union and two `<SelectItem>` labels.
 */
export interface FileEditorControlValue extends FilePanelValue {
	canSave: boolean;
	isBusy: boolean;
	save: () => void;
	/** The view switch's options. Omit for an editor with a single view. */
	viewModes?: FileViewMode[];
	viewMode?: string;
	setViewMode?: (mode: string) => void;
}

/**
 * Refresh, save, and an optional view switch, for the editor panels.
 *
 * Also carries the MCP metadata help dialog, which gates itself on the file
 * being a toolbox driver — a path only the code editor ever opens, so the other
 * two never draw it.
 */
export const FileEditorControl: FC<
	WorkbenchChromeProps<FilePanelParams, FileEditorControlValue>
> = ({ config, value }) => {
	if (!value) return null;

	const showMetadataHelp =
		config.mode?.type !== "INSIGHT" &&
		MCP.DRIVER_PATHS.some((path) => config.path.endsWith(path));

	return (
		<>
			{showMetadataHelp && <MetadataHelpDialog compact />}
			{value.viewModes && value.setViewMode ? (
				<Select
					value={value.viewMode}
					onValueChange={value.setViewMode}
				>
					<SelectTrigger
						className={WORKBENCH_STYLES.chromeSelect}
						aria-label="File view"
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{value.viewModes.map((mode) => (
							<SelectItem key={mode.value} value={mode.value}>
								{mode.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			) : null}
			<WorkbenchChromeButton
				icon={RefreshCwIcon}
				label="Refresh file"
				tooltip="Refresh"
				disabled={value.isBusy}
				onClick={value.refresh}
			/>
			{value.canSave ? (
				<WorkbenchChromeButton
					icon={SaveIcon}
					label="Save file"
					tooltip="Save"
					disabled={value.isBusy}
					onClick={value.save}
				/>
			) : null}
		</>
	);
};

/**
 * Refresh alone, for the read-only viewers.
 *
 * The image, PDF and PowerPoint viewers had a 46-line control file each,
 * identical apart from the type names and one `aria-label`.
 */
export const FileRefreshControl: FC<
	WorkbenchChromeProps<FilePanelParams, FilePanelValue>
> = ({ value }) => {
	if (!value) return null;

	return (
		<WorkbenchChromeButton
			icon={RefreshCwIcon}
			label="Refresh file"
			tooltip="Refresh"
			onClick={value.refresh}
		/>
	);
};
