import { RefreshCwIcon } from "lucide-react";
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
import type { FilePdfViewerParams } from "./file-pdf-viewer-panel";

export interface FilePdfViewerControlValue {
	refresh: () => void;
}

/** Refresh control for a scoped PDF viewer. */
export const FilePdfViewerControl: FC<
	WorkbenchChromeProps<FilePdfViewerParams, FilePdfViewerControlValue>
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
					aria-label="Refresh PDF"
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
