import { RefreshCwIcon, SaveIcon } from "lucide-react";
import type { FC } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import type { WorkbenchPanelProps } from "@semoss/workbench";
import {
	useWorkbenchPanel,
	WORKBENCH_STYLES,
	WorkbenchChromeButton,
} from "@semoss/workbench";
import { MCP } from "../constants/file-panel.constants";
import type { FilePanelParams } from "../hooks/use-file-panel";
import type { FileViewControls } from "../types/file-view.types";
import { MetadataHelpDialog } from "./mcp";

/**
 * Refresh, save, and an optional view switch, for every file panel.
 *
 * One control for all of them: a view publishes what it can do and this draws
 * exactly that, so the image viewer gets a refresh, the code editor gets a
 * refresh and a save, and the notebook gets both plus its view switch, with
 * no per-panel control file to keep in step.
 *
 * It also carries the MCP metadata help dialog, which gates itself on the file
 * being a toolbox driver, a path only the code editor ever opens.
 */
export const FileViewControl: FC<WorkbenchPanelProps> = ({ id }) => {
	const { config, value } = useWorkbenchPanel<
		FilePanelParams,
		FileViewControls
	>(id);

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
			{value.canRefresh === false ? null : (
				<WorkbenchChromeButton
					icon={RefreshCwIcon}
					label="Refresh file"
					tooltip="Refresh"
					disabled={value.isBusy}
					onClick={value.refresh}
				/>
			)}
			{value.canSave && value.save ? (
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
