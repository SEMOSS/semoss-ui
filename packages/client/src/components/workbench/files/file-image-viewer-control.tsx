import { RefreshCwIcon } from "lucide-react";
import type { FC } from "react";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { WorkbenchChromeProps } from "@/stores/workbench";
import { WORKBENCH_STYLES } from "../core/workbench.chrome";
import type { FileImageViewerParams } from "./file-image-viewer-panel";

export interface FileImageViewerControlValue {
	refresh: () => void;
}

/** Refresh control for a scoped image viewer. */
export const FileImageViewerControl: FC<
	WorkbenchChromeProps<FileImageViewerParams, FileImageViewerControlValue>
> = ({ value }) => {
	if (!value) return null;

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon-sm"
					className={cn(
						"flex-none text-muted-foreground",
						WORKBENCH_STYLES.chromeButton,
					)}
					aria-label="Refresh image"
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
	);
};
