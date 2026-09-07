import { FilePlus2Icon, RefreshCwIcon } from "lucide-react";
import type { FC } from "react";
import type { FileExplorerApi } from "@semoss/shared";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { WorkbenchChromeProps } from "@/stores/workbench";
import { WORKBENCH_STYLES } from "../core/workbench.chrome";
import type { FileExplorerParams } from "./file-explorer-panel";

/** File explorer refresh and create actions for the active panel. */
export const FileExplorerControl: FC<
	WorkbenchChromeProps<FileExplorerParams, FileExplorerApi>
> = ({ value }) => {
	if (!value) return null;

	return (
		<>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						data-testid="file-explorer-new-button"
						variant="ghost"
						size="icon-sm"
						className={cn(
							"flex-none text-muted-foreground",
							WORKBENCH_STYLES.chromeButton,
						)}
						aria-label="New"
						onClick={() => value.commands.openNewFile()}
					>
						<FilePlus2Icon
							aria-hidden
							className={WORKBENCH_STYLES.chromeIcon}
						/>
					</Button>
				</TooltipTrigger>
				<TooltipContent>New</TooltipContent>
			</Tooltip>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						data-testid="file-explorer-refresh-button"
						variant="ghost"
						size="icon-sm"
						className={cn(
							"flex-none text-muted-foreground",
							WORKBENCH_STYLES.chromeButton,
						)}
						aria-label="Refresh"
						onClick={() => value.commands.refresh()}
					>
						<RefreshCwIcon
							aria-hidden
							className={WORKBENCH_STYLES.chromeIcon}
						/>
					</Button>
				</TooltipTrigger>
				<TooltipContent>Refresh {value.header.path}</TooltipContent>
			</Tooltip>
		</>
	);
};
