import { RefreshCwIcon } from "lucide-react";
import type { FC } from "react";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type {
	WorkbenchChromeProps,
	WorkbenchPanelParams,
} from "@/stores/workbench";
import { WORKBENCH_STYLES } from "../core/workbench.chrome";

export interface EngineFileImageEditorControlValue {
	refresh: () => void;
}

export const EngineFileImageEditorControl: FC<
	WorkbenchChromeProps<
		WorkbenchPanelParams,
		EngineFileImageEditorControlValue
	>
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
