import { RefreshCwIcon, SaveIcon } from "lucide-react";
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

export interface EngineFileCodeEditorControlValue {
	canSave: boolean;
	refresh: () => void;
	save: () => void;
}

export const EngineFileCodeEditorControl: FC<
	WorkbenchChromeProps<WorkbenchPanelParams, EngineFileCodeEditorControlValue>
> = ({ value }) => {
	if (!value) return null;

	return (
		<>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						size="icon-sm"
						className={cn(
							"flex-none text-muted-foreground",
							WORKBENCH_STYLES.chromeButton,
						)}
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
