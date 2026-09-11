import { RefreshCwIcon, SaveIcon } from "lucide-react";
import type { FC } from "react";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { WorkbenchChromeProps } from "@semoss/workbench";
import { WORKBENCH_STYLES } from "@semoss/workbench";
import { MetadataHelpDialog } from "../mcp";
import type { FileCodeEditorParams } from "./file-code-editor-panel";
import { MCP } from "./file-panel.constants";

export interface FileCodeEditorControlValue {
	canSave: boolean;
	isBusy: boolean;
	refresh: () => void;
	save: () => void;
}

/** Render scoped file actions in the active panel's workbench chrome. */
export const FileCodeEditorControl: FC<
	WorkbenchChromeProps<FileCodeEditorParams, FileCodeEditorControlValue>
> = ({ config, value }) => {
	if (!value) return null;

	const showMetadataHelp =
		config.mode?.type !== "INSIGHT" &&
		MCP.DRIVER_PATHS.some((path) => config.path.endsWith(path));

	return (
		<>
			{showMetadataHelp && <MetadataHelpDialog compact />}
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						size="icon-sm"
						className={cn(
							"flex-none text-muted-foreground",
							WORKBENCH_STYLES.chromeButton,
						)}
						disabled={value.isBusy}
						aria-label="Refresh file"
						onClick={value.refresh}
					>
						<RefreshCwIcon
							aria-hidden
							className={WORKBENCH_STYLES.chromeIcon}
						/>
					</Button>
				</TooltipTrigger>
				<TooltipContent>Refresh</TooltipContent>
			</Tooltip>
			{value.canSave && (
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon-sm"
							className={cn(
								"flex-none text-muted-foreground",
								WORKBENCH_STYLES.chromeButton,
							)}
							disabled={value.isBusy}
							aria-label="Save file"
							onClick={value.save}
						>
							<SaveIcon
								aria-hidden
								className={WORKBENCH_STYLES.chromeIcon}
							/>
						</Button>
					</TooltipTrigger>
					<TooltipContent>Save</TooltipContent>
				</Tooltip>
			)}
		</>
	);
};
