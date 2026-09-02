import { RefreshCwIcon, SaveIcon } from "lucide-react";
import type { FC } from "react";
import {
	Button,
	cn,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type {
	WorkbenchChromeProps,
	WorkbenchPanelParams,
} from "@/stores/workbench";
import { WORKBENCH_STYLES } from "../core/workbench.chrome";

export interface EngineFileNotebookEditorControlValue {
	canSave: boolean;
	refresh: () => void;
	save: () => void;
	setViewMode: (mode: "notebook" | "raw") => void;
	viewMode: "notebook" | "raw";
}

export const EngineFileNotebookEditorControl: FC<
	WorkbenchChromeProps<
		WorkbenchPanelParams,
		EngineFileNotebookEditorControlValue
	>
> = ({ value }) => {
	if (!value) return null;

	return (
		<>
			<Select
				value={value.viewMode}
				onValueChange={(mode) =>
					value.setViewMode(mode as "notebook" | "raw")
				}
			>
				<SelectTrigger
					className={WORKBENCH_STYLES.chromeSelect}
					aria-label="Notebook view"
				>
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="notebook">Notebook</SelectItem>
					<SelectItem value="raw">Raw</SelectItem>
				</SelectContent>
			</Select>
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
