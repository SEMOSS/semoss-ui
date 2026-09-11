import { RefreshCwIcon, SaveIcon } from "lucide-react";
import type { FC } from "react";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { MetadataHelpDialog } from "@/components/shared";
import { MCP } from "@/constants";
import type { WorkbenchChromeProps } from "@/stores/workbench";
import { WORKBENCH_STYLES } from "../core/workbench.chrome";
import type { FileCodeEditorParams } from "./file-code-editor-panel";
import { FileWordWrapButton } from "./file-word-wrap-button";

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
		config.type !== "INSIGHT" &&
		MCP.DRIVER_PATHS.some((path) => config.path.endsWith(path));

	return (
		<>
			{showMetadataHelp && <MetadataHelpDialog compact />}
			<FileWordWrapButton />
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
